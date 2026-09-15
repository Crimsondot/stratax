import {
  Sensor,
  SensorNode,
  MineZone,
  Alert,
  RiskAssessment,
  StatusLevel,
  SensorReading,
  RemoteSensorPayload,
  WsConnectionStatus,
  WsConnectionState,
} from '../types';

export type WsMessageCallback = (data: any) => void;
export type WsStatusCallback = (state: WsConnectionState) => void;

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private socket: WebSocket | null = null;
  private url: string = '';
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 10000;
  private manualDisconnect: boolean = false;

  private messageCallbacks: Set<WsMessageCallback> = new Set();
  private statusCallbacks: Set<WsStatusCallback> = new Set();

  private currentState: WsConnectionState = {
    status: 'DISCONNECTED',
    lastMessageTime: null,
    errorMessage: null,
    url: '',
  };

  private constructor() {
    this.url = this.resolveDefaultUrl();
    this.currentState.url = this.url;
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private resolveDefaultUrl(): string {
    const envUrl = import.meta.env.VITE_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
    if (typeof window !== 'undefined' && window.location) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.hostname}:8000/ws`;
    }
    return 'ws://127.0.0.1:8000/ws';
  }

  public getState(): WsConnectionState {
    return { ...this.currentState };
  }

  public subscribeStatus(cb: WsStatusCallback): () => void {
    this.statusCallbacks.add(cb);
    cb(this.getState());
    return () => this.statusCallbacks.delete(cb);
  }

  public subscribeMessage(cb: WsMessageCallback): () => void {
    this.messageCallbacks.add(cb);
    return () => this.messageCallbacks.delete(cb);
  }

  private notifyStatus(status: WsConnectionStatus, error: string | null = null) {
    this.currentState = {
      ...this.currentState,
      status,
      errorMessage: error,
      url: this.url,
    };
    this.statusCallbacks.forEach(cb => {
      try { cb(this.getState()); } catch (e) { console.error('Status callback error:', e); }
    });
  }

  public connect(targetUrl?: string) {
    if (targetUrl && targetUrl.trim()) {
      this.url = targetUrl.trim();
      this.currentState.url = this.url;
    }

    this.manualDisconnect = false;

    if (this.socket) {
      try {
        this.socket.onclose = null;
        this.socket.onerror = null;
        this.socket.onmessage = null;
        this.socket.onopen = null;
        this.socket.close();
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.notifyStatus('CONNECTING');

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.notifyStatus('CONNECTED');
      };

      this.socket.onmessage = (event: MessageEvent) => {
        this.currentState.lastMessageTime = Date.now();
        this.notifyStatus('CONNECTED');

        try {
          const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          this.messageCallbacks.forEach(cb => {
            try { cb(parsed); } catch (e) { console.error('Message callback error:', e); }
          });
        } catch (parseErr: any) {
          console.warn('Received non-JSON or invalid WebSocket payload:', event.data);
        }
      };

      this.socket.onerror = () => {
        this.notifyStatus('ERROR', `WebSocket connection error on ${this.url}`);
      };

      this.socket.onclose = (event: CloseEvent) => {
        const reason = event.reason ? ` (${event.reason})` : '';
        this.notifyStatus('DISCONNECTED', `Socket closed: code ${event.code}${reason}`);
        this.socket = null;

        if (!this.manualDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err: any) {
      this.notifyStatus('ERROR', err?.message || 'Failed to initialize WebSocket');
      if (!this.manualDisconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manualDisconnect) {
        this.connect();
      }
    }, delay);
  }

  public send(payload: any): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send data: WebSocket is not in OPEN state');
      return false;
    }

    try {
      const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.socket.send(message);
      return true;
    } catch (err) {
      console.error('Failed to send data over WebSocket:', err);
      return false;
    }
  }

  public disconnect() {
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client disconnected');
      } catch (e) {
        // ignore
      }
      this.socket = null;
    }
    this.notifyStatus('DISCONNECTED', 'Manual disconnect');
  }

  public static normalizePayload(
    payload: any,
    currentSensors: Sensor[],
    currentNodes: SensorNode[],
    currentZones: MineZone[],
    currentAlerts: Alert[]
  ): {
    sensors: Sensor[];
    nodes: SensorNode[];
    alerts: Alert[];
    riskAssessment: RiskAssessment;
  } {
    let devices: RemoteSensorPayload[] = [];

    if (Array.isArray(payload)) {
      devices = payload;
    } else if (payload && Array.isArray(payload.devices)) {
      devices = payload.devices;
    } else if (payload && typeof payload === 'object') {
      if (payload.device_id || payload.sensors) {
        devices = [payload as RemoteSensorPayload];
      }
    }

    if (devices.length === 0) {
      return {
        sensors: currentSensors,
        nodes: currentNodes,
        alerts: currentAlerts,
        riskAssessment: {
          overallRiskScore: 20,
          riskLevel: 'NORMAL',
          predictionHorizon: 'Live WebSocket Stream',
          modelConfidence: 85,
          stateOfTrend: 'STABLE',
          primaryFactors: [],
          predictionCurve: [],
          summaryRationale: 'Awaiting remote telemetry stream...',
          lastInferenceTimestamp: Date.now(),
        },
      };
    }

    let updatedSensors = [...currentSensors];
    let updatedNodes = [...currentNodes];
    let updatedAlerts = [...currentAlerts];

    let highestRiskScore = 15;
    let highestRiskLevel: StatusLevel = 'NORMAL';
    let latestLlmMessage = '';
    let timestampEpoch = Date.now();

    for (const dev of devices) {
      const deviceId = dev.device_id || 'ESP32_01';
      const rawTimestamp = dev.timestamp;
      timestampEpoch = rawTimestamp
        ? typeof rawTimestamp === 'number'
          ? rawTimestamp
          : new Date(rawTimestamp).getTime() || Date.now()
        : Date.now();

      const sensorKeys = Object.keys(dev.sensors || {});
      const existingNode = updatedNodes.find(n => n.id === deviceId);

      if (!existingNode) {
        updatedNodes.push({
          id: deviceId,
          name: `Sensor Node (${deviceId})`,
          zoneId: (dev as any).zone_id || currentZones[0]?.id || 'ZONE-P4B',
          zoneName: currentZones.find(z => z.id === (dev as any).zone_id)?.name || currentZones[0]?.name || 'Tailgate Roadway',
          status: 'ONLINE',
          signalStrength: -65,
          batteryVoltage: 3.95,
          batteryPercent: 92,
          health: 98,
          lastCommunication: timestampEpoch,
          sensorsCount: sensorKeys.length,
          sensorIds: [],
          dataRate: 'WebSocket Live',
          gatewayId: 'REMOTE-SERVER',
          ipAddress: 'Remote WebSocket',
          firmwareVersion: 'v3.0-esp32',
          model: 'ESP32-Remote',
        });
      } else {
        updatedNodes = updatedNodes.map(n =>
          n.id === deviceId
            ? {
                ...n, status: 'ONLINE', lastCommunication: timestampEpoch, sensorsCount: sensorKeys.length,
                batteryVoltage: typeof (dev as any).battery_v === 'number' ? (dev as any).battery_v : n.batteryVoltage,
                signalStrength: typeof (dev as any).rssi_dbm === 'number' ? (dev as any).rssi_dbm : n.signalStrength,
                firmwareVersion: (dev as any).firmware || n.firmwareVersion,
              }
            : n
        );
      }

      for (const [key, val] of Object.entries(dev.sensors || {})) {
        if (val === null || val === undefined || typeof val !== 'number' || isNaN(val)) {
          continue;
        }

        const sensorId = `${deviceId}-${key.toUpperCase()}`;
        const metadata = this.getSensorMetadata(key);
        const existingSensor = updatedSensors.find(s => s.id === sensorId || (s.nodeId === deviceId && s.type === key));

        if (existingSensor) {
          const prevVal = existingSensor.currentValue;
          const timeDeltaHours = Math.max(0.0001, (timestampEpoch - existingSensor.lastUpdate) / (3600 * 1000));
          const rate = Number(((val - prevVal) / timeDeltaHours).toFixed(3));

          const newReading: SensorReading = {
            timestamp: timestampEpoch,
            value: val,
            unit: metadata.unit,
            rateOfChange: rate,
          };

          const newHistory = [...existingSensor.history.slice(-23), newReading];
          const sensorStatus = this.computeSensorStatus(val, metadata.warn, metadata.crit);

          updatedSensors = updatedSensors.map(s =>
            s.id === existingSensor.id
              ? {
                  ...s,
                  currentValue: val,
                  rateOfChange: rate,
                  lastUpdate: timestampEpoch,
                  status: sensorStatus,
                  history: newHistory,
                }
              : s
          );
        } else {
          const sensorStatus = this.computeSensorStatus(val, metadata.warn, metadata.crit);
          const newSensor: Sensor = {
            id: sensorId,
            nodeId: deviceId,
            zoneId: currentZones[0]?.id || 'ZONE-P4B',
            type: key as any,
            name: metadata.label,
            unit: metadata.unit,
            currentValue: val,
            rateOfChange: 0,
            status: sensorStatus,
            warningThreshold: metadata.warn,
            highRiskThreshold: metadata.crit * 0.75,
            criticalThreshold: metadata.crit,
            lastUpdate: timestampEpoch,
            history: [{ timestamp: timestampEpoch, value: val, unit: metadata.unit }],
            aiContribution: metadata.weight,
            anomalyFlag: sensorStatus !== 'NORMAL',
            minRange: 0,
            maxRange: metadata.crit * 1.5,
          };
          updatedSensors.push(newSensor);
        }
      }

      if (dev.analysis) {
        if (dev.analysis.message) {
          latestLlmMessage = dev.analysis.message;
        }
        const statusMap = this.mapStatus(dev.analysis.status, dev.analysis.risk_level, dev.analysis.score);
        if (this.statusSeverity(statusMap.level) > this.statusSeverity(highestRiskLevel)) {
          highestRiskLevel = statusMap.level;
          highestRiskScore = statusMap.score;
        }

        if (statusMap.level !== 'NORMAL') {
          const alertId = `ALT-WS-${deviceId}-${Math.floor(timestampEpoch / 15000)}`;
          const alreadyExists = updatedAlerts.some(a => a.id === alertId);
          if (!alreadyExists) {
            const newAlert: Alert = {
              id: alertId,
              severity: statusMap.level,
              status: 'ACTIVE',
              sensorId: `${deviceId}-ANALYSIS`,
              sensorName: `Remote Analysis (${deviceId})`,
              nodeId: deviceId,
              zoneId: currentZones[0]?.id || 'ZONE-P4B',
              zoneName: currentZones[0]?.name || 'Monitored Zone',
              parameter: 'Remote LLM Anomaly Assessment',
              currentValue: highestRiskScore,
              unit: '% Risk',
              threshold: 50,
              rateOfChange: 0,
              aiRiskScore: highestRiskScore,
              timestamp: timestampEpoch,
              notes: dev.analysis.message || 'Anomaly detected by remote LLM processing',
            };
            updatedAlerts = [newAlert, ...updatedAlerts.slice(0, 19)];
          }
        }
      }
    }

    const riskAssessment: RiskAssessment = {
      overallRiskScore: highestRiskScore,
      riskLevel: highestRiskLevel,
      predictionHorizon: 'Live WebSocket Stream',
      modelConfidence: devices[0]?.analysis?.confidence ?? 94,
      stateOfTrend: devices[0]?.analysis?.trend || (
        highestRiskLevel === 'CRITICAL'
          ? 'CRITICAL_RISK'
          : highestRiskLevel === 'HIGH_RISK'
          ? 'DETERIORATING'
          : highestRiskLevel === 'WARNING'
          ? 'DETERIORATING'
          : 'STABLE'),
      primaryFactors: [
        {
          id: 'factor-ws-ai',
          label: 'Remote LLM Sensor Fusion',
          contributionPercent: 50,
          description: latestLlmMessage || 'Real-time telemetry stream from remote edge server',
          trend: highestRiskLevel === 'NORMAL' ? 'stable' : 'increasing',
          currentMetric: `${highestRiskScore}% Risk`,
        },
      ],
      predictionCurve: [],
      summaryRationale:
        latestLlmMessage ||
        `Remote server reported status: ${highestRiskLevel}. Live WebSocket telemetry active.`,
      lastInferenceTimestamp: timestampEpoch,
    };

    return {
      sensors: updatedSensors,
      nodes: updatedNodes,
      alerts: updatedAlerts,
      riskAssessment,
    };
  }

  private static mapStatus(status?: string, riskLevel?: string, explicitScore?: number): { level: StatusLevel; score: number } {
    const raw = (riskLevel || status || '').toLowerCase();
    const score = typeof explicitScore === 'number' && Number.isFinite(explicitScore) ? Math.max(0, Math.min(100, Math.round(explicitScore))) : undefined;
    if (raw.includes('crit') || raw === 'danger' || raw === 'severe') {
      return { level: 'CRITICAL', score: score ?? 88 };
    }
    if (raw.includes('high') || raw === 'elevated') {
      return { level: 'HIGH_RISK', score: score ?? 68 };
    }
    if (raw.includes('warn') || raw === 'medium' || raw === 'moderate') {
      return { level: 'WARNING', score: score ?? 48 };
    }
    return { level: 'NORMAL', score: score ?? 18 };
  }

  private static statusSeverity(level: StatusLevel): number {
    switch (level) {
      case 'CRITICAL': return 4;
      case 'HIGH_RISK': return 3;
      case 'WARNING': return 2;
      default: return 1;
    }
  }

  private static computeSensorStatus(val: number, warn: number, crit: number): StatusLevel {
    if (val >= crit) return 'CRITICAL';
    if (val >= crit * 0.75) return 'HIGH_RISK';
    if (val >= warn) return 'WARNING';
    return 'NORMAL';
  }

  private static getSensorMetadata(key: string): { label: string; unit: string; warn: number; crit: number; weight: number } {
    const k = key.toLowerCase();
    if (k.includes('temp')) {
      return { label: 'Temperature', unit: '°C', warn: 32.0, crit: 42.0, weight: 15 };
    }
    if (k.includes('humid')) {
      return { label: 'Humidity', unit: '%', warn: 70.0, crit: 85.0, weight: 10 };
    }
    if (k.includes('object') || k.includes('count')) {
      return { label: 'Object Count', unit: 'units', warn: 15, crit: 30, weight: 10 };
    }
    if (k.includes('disp_rate') || k.includes('rate') || k.includes('velo')) {
      return { label: 'Displacement Rate', unit: 'mm/hr', warn: 1.2, crit: 4.5, weight: 30 };
    }
    if (k.includes('disp')) {
      return { label: 'Displacement', unit: 'mm', warn: 12.0, crit: 28.0, weight: 35 };
    }
    if (k.includes('vib')) {
      return { label: 'Vibration', unit: 'mm/s', warn: 4.0, crit: 14.0, weight: 20 };
    }
    if (k.includes('meth') || k.includes('ch4')) {
      return { label: 'Methane (CH4)', unit: '% Vol', warn: 0.8, crit: 1.75, weight: 15 };
    }
    if (k.includes('co') || k.includes('carbon')) {
      return { label: 'Carbon Monoxide', unit: 'ppm', warn: 25.0, crit: 70.0, weight: 10 };
    }

    return {
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      unit: '',
      warn: 50.0,
      crit: 80.0,
      weight: 10,
    };
  }
}
