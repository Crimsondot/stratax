import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Selection
  selectedSensorId: string | null;
  setSelectedSensorId: (id: string | null) => void;
  selectedSensor: Sensor | null;
  
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: SensorNode | null;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('strata_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('strata_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

  // Recompute risk whenever sensors change
  const recomputeRisk = useCallback((currentSensors: Sensor[], currentZones: MineZone[]) => {
    const newRisk = PredictionService.calculateRisk(currentSensors, currentZones);
    setRiskAssessment(newRisk);
  }, []);

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
        theme,
        toggleTheme,
        config,
        updateConfig,
        nodes,
        sensors,
        zones,
        alerts,
        riskAssessment,
        simulationState,
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
        overallStatus,
        activeAlertsCount,
        criticalZonesCount,
        onlineNodesCount,
        onlineSensorsCount,
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
