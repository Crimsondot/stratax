import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sensor,
  SensorNode,
  MineZone,
  Alert,
  RiskAssessment,
  SystemConfig,
  SimulationState,
  SimulationStage,
  StatusLevel,
  WsConnectionState,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_NODES,
  INITIAL_SENSORS,
  INITIAL_ZONES,
  INITIAL_ALERTS,
  generateInitialPrediction,
} from '../data/initialData';
import { PredictionService } from '../services/predictionService';
import { SimulationService } from '../services/simulationService';
import { AlertService } from '../services/alertService';
import { GatewayService, Esp32GatewayTelemetryPacket } from '../services/gatewayService';
import { WebSocketService } from '../services/websocketService';
import { PrometheusService } from '../services/prometheusService';
import { OllamaService } from '../services/ollamaService';

export type NavigationTab =
  | 'command-center'
  | 'mine-map'
  | 'nodes'
  | 'sensors'
  | 'prediction'
  | 'alerts'
  | 'analytics'
  | 'reports'
  | 'settings'
  | 'profile';

export interface OperatorProfileData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  employeeId: string;
  department: string;
  colliery: string;
  shift: string;
  experience: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoURL?: string;
  role: 'admin' | 'operator' | 'viewer';
  status: 'active' | 'on-leave' | 'offline';
  skills: string[];
  certifications: string[];
}

export interface OllamaState {
  model: string;
  modelAvailable: boolean;
  isAssessing: boolean;
}

const defaultOperatorProfile: OperatorProfileData = {
  name: "",
  email: "",
  phone: "",
  designation: "Mine Safety Operator",
  employeeId: "",
  department: "Safety & Monitoring",
  colliery: "CMPDI Seam-3 Underground Mine (Colliery No. 7)",
  shift: "Shift A (Morning)",
  experience: 0,
  emergencyContactName: "",
  emergencyContactPhone: "",
  role: "operator",
  status: "active",
  skills: [],
  certifications: [],
};

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  config: SystemConfig;
  updateConfig: (newConfig: Partial<SystemConfig>) => void;
  nodes: SensorNode[];
  sensors: Sensor[];
  zones: MineZone[];
  alerts: Alert[];
  riskAssessment: RiskAssessment;
  simulationState: SimulationState;
  userProfile: OperatorProfileData;
  updateProfile: (partial: Partial<OperatorProfileData>) => void;
  
  // Selection
  selectedSensorId: string | null;
  setSelectedSensorId: (id: string | null) => void;
  selectedSensor: Sensor | null;
  
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: SensorNode | null;

  // WebSocket Connection
  wsState: WsConnectionState;
  sendWsData: (data: any) => boolean;
  reconnectWs: (url?: string) => void;

  // Ollama Assessment
  ollamaState: OllamaState;
  triggerOllamaAssessment: () => Promise<void>;

  // Actions
  acknowledgeAlert: (alertId: string) => void;
  startSafetySimulation: () => void;
  advanceSimulationStage: (stage: SimulationStage) => void;
  resetSimulation: () => void;
  toggleSimulationAutoStep: () => void;
  ingestHardwarePacket: (packet: Esp32GatewayTelemetryPacket) => void;
  triggerHardwareIngestDemo: () => void;

  // Derived
  overallStatus: StatusLevel;
  activeAlertsCount: number;
  criticalZonesCount: number;
  onlineNodesCount: number;
  onlineSensorsCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('command-center');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.removeItem('strata_theme');
  }, []);

  const [userProfile, setUserProfile] = useState<OperatorProfileData>(() => {
    try {
      const saved = localStorage.getItem('operator_profile');
      return saved ? { ...defaultOperatorProfile, ...JSON.parse(saved) } : defaultOperatorProfile;
    } catch {
      return defaultOperatorProfile;
    }
  });

  const updateProfile = useCallback((partial: Partial<OperatorProfileData>) => {
    setUserProfile(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('operator_profile', JSON.stringify(next));
      return next;
    });
  }, []);

  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [nodes, setNodes] = useState<SensorNode[]>(INITIAL_NODES);
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [zones, setZones] = useState<MineZone[]>(INITIAL_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>(generateInitialPrediction());

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [simulationState, setSimulationState] = useState<SimulationState>({
    isActive: false,
    stage: 'NORMAL',
    targetZoneId: 'ZONE-P4B',
    targetNodeId: 'NODE-01',
    progressPercent: 0,
    stepIndex: 0,
    elapsedSeconds: 0,
    autoStep: false,
  });

  const [ollamaState, setOllamaState] = useState<OllamaState>({
    model: 'gemma3:4b',
    modelAvailable: true,
    isAssessing: false,
  });

  // Recompute risk whenever sensors change
  const recomputeRisk = useCallback((currentSensors: Sensor[], currentZones: MineZone[]) => {
    const newRisk = PredictionService.calculateRisk(currentSensors, currentZones);
    setRiskAssessment(newRisk);
  }, []);

  // Trigger Ollama gemma3:4b assessment
  const triggerOllamaAssessment = useCallback(async () => {
    setOllamaState(prev => ({ ...prev, isAssessing: true }));
    try {
      const telemetryPacket = {
        gateway_id: 'JETSON-ORIN-NANO-01',
        node_id: 'NODE-01',
        zone_id: 'ZONE-P4B',
        timestamp: Date.now(),
        battery_v: 3.96,
        rssi_dbm: -62,
        firmware: 'v2.4.1-mineguard-esp32',
        readings: sensors.map(s => ({
          sensor_id: s.id,
          type: s.type,
          value: s.currentValue,
          unit: s.unit,
        })),
      };
      const result = await OllamaService.assessTelemetry(telemetryPacket as any);
      setOllamaState({ model: result.model, modelAvailable: result.model_available, isAssessing: false });
      if (result.message) {
        setRiskAssessment(prev => ({
          ...prev,
          summaryRationale: result.message,
          modelConfidence: result.confidence,
          overallRiskScore: result.score,
          riskLevel: result.risk_level as StatusLevel,
          stateOfTrend: result.trend as any,
          lastInferenceTimestamp: Date.now(),
        }));
      }
    } catch {
      setOllamaState(prev => ({ ...prev, isAssessing: false, modelAvailable: false }));
    }
  }, [sensors]);

  // Update config
  const updateConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => AlertService.acknowledgeAlert(prev, alertId));
  };

  // Execute stage
  const advanceSimulationStage = useCallback((stage: SimulationStage) => {
    const result = SimulationService.executeStage(stage, sensors, nodes, zones, alerts);
    setSensors(result.sensors);
    setNodes(result.nodes);
    setZones(result.zones);
    setAlerts(result.alerts);

    let progress = 25;
    let step = 1;
    if (stage === 'WARNING') { progress = 50; step = 2; }
    else if (stage === 'HIGH_RISK') { progress = 75; step = 3; }
    else if (stage === 'CRITICAL') { progress = 100; step = 4; }

    setSimulationState(prev => ({
      ...prev,
      isActive: stage !== 'NORMAL',
      stage,
      progressPercent: progress,
      stepIndex: step,
    }));

    recomputeRisk(result.sensors, result.zones);
  }, [sensors, nodes, zones, alerts, recomputeRisk]);

  // Start Safety Simulation
  const startSafetySimulation = useCallback(() => {
    setSimulationState(prev => ({
      ...prev,
      isActive: true,
      stage: 'WARNING',
      progressPercent: 50,
      stepIndex: 2,
      autoStep: true,
    }));
    advanceSimulationStage('WARNING');
  }, [advanceSimulationStage]);

  // Reset Simulation
  const resetSimulation = useCallback(() => {
    const result = SimulationService.resetSimulation();
    setSensors(result.sensors);
    setNodes(result.nodes);
    setZones(result.zones);
    setAlerts(result.alerts);
    setSimulationState({
      isActive: false,
      stage: 'NORMAL',
      targetZoneId: 'ZONE-P4B',
      targetNodeId: 'NODE-01',
      progressPercent: 0,
      stepIndex: 0,
      elapsedSeconds: 0,
      autoStep: false,
    });
    recomputeRisk(result.sensors, result.zones);
  }, [recomputeRisk]);

  const toggleSimulationAutoStep = () => {
    setSimulationState(prev => ({ ...prev, autoStep: !prev.autoStep }));
  };

  // Ingest hardware packet from ESP32 / Jetson Orin Nano
  const ingestHardwarePacket = (packet: Esp32GatewayTelemetryPacket) => {
    const { updatedSensors, updatedNodes } = GatewayService.ingestPacket(packet, sensors, nodes);
    setSensors(updatedSensors);
    setNodes(updatedNodes);
    recomputeRisk(updatedSensors, zones);
  };

  // Demo hardware packet trigger
  const triggerHardwareIngestDemo = () => {
    const packet = GatewayService.getSampleHardwarePacket();
    ingestHardwarePacket(packet);
  };

  // State synchronization refs for WebSocket messages
  const sensorsRef = useRef(sensors);
  const nodesRef = useRef(nodes);
  const zonesRef = useRef(zones);
  const alertsRef = useRef(alerts);

  useEffect(() => {
    sensorsRef.current = sensors;
    nodesRef.current = nodes;
    zonesRef.current = zones;
    alertsRef.current = alerts;
  }, [sensors, nodes, zones, alerts]);

  const [wsState, setWsState] = useState<WsConnectionState>(() =>
    WebSocketService.getInstance().getState()
  );

  // WebSocket connection effect
  useEffect(() => {
    if (config.dataSource !== 'REMOTE_WEBSOCKET') {
      WebSocketService.getInstance().disconnect();
      return;
    }

    const ws = WebSocketService.getInstance();
    ws.connect(config.gatewayUrl);

    const unsubStatus = ws.subscribeStatus(setWsState);
    const unsubMsg = ws.subscribeMessage((data) => {
      const normalized = WebSocketService.normalizePayload(
        data,
        sensorsRef.current,
        nodesRef.current,
        zonesRef.current,
        alertsRef.current
      );
      setSensors(normalized.sensors);
      setNodes(normalized.nodes);
      setAlerts(normalized.alerts);
      setRiskAssessment(normalized.riskAssessment);
    });

    return () => {
      unsubStatus();
      unsubMsg();
    };
  }, [config.dataSource, config.gatewayUrl]);

  // Prometheus is polled through our backend proxy so a browser never receives
  // PromQL credentials. Each response uses the same packet normalization path
  // as an ESP32/MQTT reading, keeping dashboard and Android data consistent.
  useEffect(() => {
    if (config.dataSource !== 'PROMETHEUS') return;
    let cancelled = false;
    const sync = async () => {
      try {
        const packets = await PrometheusService.getTelemetry(config.prometheusApiUrl);
        if (!cancelled && packets.length) {
          let nextSensors = sensorsRef.current;
          let nextNodes = nodesRef.current;
          packets.forEach(packet => {
            const updated = GatewayService.ingestPacket(packet, nextSensors, nextNodes);
            nextSensors = updated.updatedSensors;
            nextNodes = updated.updatedNodes;
          });
          setSensors(nextSensors);
          setNodes(nextNodes);
          recomputeRisk(nextSensors, zonesRef.current);
        }
      } catch (error) {
        console.warn('Prometheus telemetry sync failed', error);
      }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), config.pollIntervalMs);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [config.dataSource, config.prometheusApiUrl, config.pollIntervalMs, recomputeRisk]);

  const sendWsData = useCallback((data: any): boolean => {
    return WebSocketService.getInstance().send(data);
  }, []);

  const reconnectWs = useCallback((targetUrl?: string) => {
    if (targetUrl) {
      updateConfig({ gatewayUrl: targetUrl });
    }
    WebSocketService.getInstance().connect(targetUrl || config.gatewayUrl);
  }, [config.gatewayUrl]);

  // Background natural telemetry jitter when not in critical simulation
  useEffect(() => {
    if (config.dataSource !== 'SIMULATION') return;

    const interval = setInterval(() => {
      // Small jitter for realism
      setSensors(prev =>
        prev.map(s => {
          // If simulation is active on NODE-01, don't jitter it away from its drill state
          if (simulationState.isActive && s.nodeId === simulationState.targetNodeId) {
            return s;
          }
          const jitter = (Math.random() - 0.5) * 0.04;
          const newVal = Number(Math.max(s.minRange, Math.min(s.maxRange, s.currentValue + jitter)).toFixed(2));
          return {
            ...s,
            currentValue: newVal,
            lastUpdate: Date.now(),
          };
        })
      );
    }, config.pollIntervalMs);

    return () => clearInterval(interval);
  }, [config.dataSource, config.pollIntervalMs, simulationState.isActive, simulationState.targetNodeId]);

  // Selected sensor/node computed
  const selectedSensor = useMemo(() => {
    return sensors.find(s => s.id === selectedSensorId) || null;
  }, [sensors, selectedSensorId]);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Derived metrics
  const activeAlertsCount = useMemo(() => AlertService.getActiveCount(alerts), [alerts]);
  const criticalZonesCount = useMemo(() => zones.filter(z => z.riskLevel === 'CRITICAL' || z.riskLevel === 'HIGH_RISK').length, [zones]);
  const onlineNodesCount = useMemo(() => nodes.filter(n => n.status === 'ONLINE').length, [nodes]);
  const onlineSensorsCount = useMemo(() => sensors.filter(s => s.status !== 'OFFLINE').length, [sensors]);

  const overallStatus = useMemo((): StatusLevel => {
    if (riskAssessment.riskLevel === 'CRITICAL' || criticalZonesCount > 0) return 'CRITICAL';
    if (riskAssessment.riskLevel === 'HIGH_RISK') return 'HIGH_RISK';
    if (riskAssessment.riskLevel === 'WARNING' || activeAlertsCount > 0) return 'WARNING';
    return 'NORMAL';
  }, [riskAssessment.riskLevel, criticalZonesCount, activeAlertsCount]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        config,
        updateConfig,
        nodes,
        sensors,
        zones,
        alerts,
        riskAssessment,
        simulationState,
        userProfile,
        updateProfile,
        selectedSensorId,
        setSelectedSensorId,
        selectedSensor,
        selectedNodeId,
        setSelectedNodeId,
        selectedNode,
        acknowledgeAlert,
        startSafetySimulation,
        advanceSimulationStage,
        resetSimulation,
        toggleSimulationAutoStep,
        ingestHardwarePacket,
        triggerHardwareIngestDemo,
        wsState,
        sendWsData,
        reconnectWs,
        overallStatus,
        activeAlertsCount,
        criticalZonesCount,
        onlineNodesCount,
        onlineSensorsCount,
        ollamaState,
        triggerOllamaAssessment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
