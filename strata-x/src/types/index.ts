// MineGuard AI Domain Models & Interfaces

export type SensorType = 
  | 'displacement' 
  | 'displacement_rate' 
  | 'vibration' 
  | 'methane' 
  | 'carbon_monoxide' 
  | 'temperature';

export type StatusLevel = 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';
export type AlertSeverity = StatusLevel;
export type SensorStatus = StatusLevel | 'OFFLINE';
export type NodeStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SensorReading {
  timestamp: number;
  value: number;
  unit: string;
  rateOfChange?: number;
}

export interface Sensor {
  id: string;
  nodeId: string;
  zoneId: string;
  type: SensorType;
  name: string;
  unit: string;
  currentValue: number;
  rateOfChange: number; // e.g. mm/hr, mm/s^2, ppm/min
  status: SensorStatus;
  warningThreshold: number;
  highRiskThreshold: number;
  criticalThreshold: number;
  lastUpdate: number;
  history: SensorReading[];
  aiContribution: number; // 0-100% influence on risk
  anomalyFlag: boolean;
  minRange: number;
  maxRange: number;
}

export interface SensorNode {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  status: NodeStatus;
  signalStrength: number; // dBm (-30 to -110)
  batteryVoltage: number; // Volts (3.2V to 4.2V)
  batteryPercent: number; // 0-100%
  health: number; // 0-100%
  lastCommunication: number;
  sensorsCount: number;
  sensorIds: string[];
  dataRate: string; // e.g. "1.2 kbps"
  gatewayId: string;
  ipAddress: string;
  firmwareVersion: string;
  model: string; // ESP32-WROOM-32U
}

export interface MineZone {
  id: string;
  name: string;
  type: 'longwall_panel' | 'bord_and_pillar' | 'intake_roadway' | 'return_airway' | 'shaft_bottom';
  depthMeters: number;
  seam: string;
  riskLevel: StatusLevel;
  activeNodeIds: string[];
  description: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Alert {
  id: string;
  severity: StatusLevel;
  status: AlertStatus;
  sensorId: string;
  sensorName: string;
  nodeId: string;
  zoneId: string;
  zoneName: string;
  parameter: string;
  currentValue: number;
  unit: string;
  threshold: number;
  rateOfChange: number;
  aiRiskScore: number;
  timestamp: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  notes?: string;
}

export interface RiskFactor {
  id: string;
  label: string;
  contributionPercent: number; // 0-100
  description: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  currentMetric: string;
}

export interface PredictionDataPoint {
  timestamp: number;
  timeLabel: string;
  observedValue?: number;
  predictedValue?: number;
  upperConfidence?: number;
  lowerConfidence?: number;
  isObserved: boolean;
}

export interface RiskAssessment {
  overallRiskScore: number; // 0-100%
  riskLevel: StatusLevel;
  predictionHorizon: string;
  modelConfidence: number; // 0-100%
  stateOfTrend: 'STABLE' | 'IMPROVING' | 'DETERIORATING' | 'CRITICAL_RISK';
  primaryFactors: RiskFactor[];
  predictionCurve: PredictionDataPoint[];
  summaryRationale: string;
  lastInferenceTimestamp: number;
}

export type SimulationStage = 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL';

export interface SimulationState {
  isActive: boolean;
  stage: SimulationStage;
  targetZoneId: string;
  targetNodeId: string;
  progressPercent: number;
  stepIndex: number;
  elapsedSeconds: number;
  autoStep: boolean;
}

export interface SystemConfig {
  mineName: string;
  siteId: string;
  dgmsRegion: string;
  activeShift: 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';
  dataSource: 'SIMULATION' | 'JETSON_GATEWAY';
  gatewayUrl: string;
  gatewayConnected: boolean;
  pollIntervalMs: number;
  audioAlertsEnabled: boolean;
  highRiskBannerEnabled: boolean;
}

export interface ShiftSafetyReport {
  id: string;
  reportDate: string;
  mineName: string;
  siteId: string;
  shift: string;
  safetyOfficer: string;
  generatedAt: number;
  uptimeNodePercent: number;
  uptimeSensorPercent: number;
  totalAlerts: number;
  criticalAlerts: number;
  highRiskAlerts: number;
  warningAlerts: number;
  maxDisplacementObserved: number;
  maxDisplacementRate: number;
  maxVibrationRecorded: number;
  peakMethanePpm: number;
  affectedZones: string[];
  aiRiskTrend: 'STABLE' | 'ELEVATED' | 'HAZARDOUS';
  eventsSummary: {
    timestamp: number;
    type: string;
    description: string;
    severity: StatusLevel;
  }[];
}
