import { Sensor, SensorNode, Alert, SimulationStage, MineZone } from '../types';
import { INITIAL_SENSORS, INITIAL_NODES, INITIAL_ZONES } from '../data/initialData';

export interface SimulationStepResult {
  sensors: Sensor[];
  nodes: SensorNode[];
  zones: MineZone[];
  alerts: Alert[];
  stage: SimulationStage;
}

export class SimulationService {
  /**
   * Generates step data for the safety event simulation
   */
  public static executeStage(
    targetStage: SimulationStage,
    currentSensors: Sensor[],
    currentNodes: SensorNode[],
    currentZones: MineZone[],
    currentAlerts: Alert[]
  ): SimulationStepResult {
    const now = Date.now();
    const targetZoneId = 'ZONE-P4B';
    const targetNodeId = 'NODE-01';

    let dispVal = 6.4;
    let rateVal = 0.12;
    let vibVal = 1.8;
    let ch4Val = 0.28;
    let coVal = 8.5;
    let tempVal = 27.2;

    if (targetStage === 'WARNING') {
      dispVal = 13.5;
      rateVal = 1.42;
      vibVal = 4.35;
      ch4Val = 0.45;
      coVal = 12.0;
      tempVal = 28.1;
    } else if (targetStage === 'HIGH_RISK') {
      dispVal = 21.8;
      rateVal = 2.85;
      vibVal = 9.40;
      ch4Val = 0.95;
      coVal = 22.5;
      tempVal = 29.8;
    } else if (targetStage === 'CRITICAL') {
      dispVal = 29.6;
      rateVal = 5.20;
      vibVal = 15.80;
      ch4Val = 1.45;
      coVal = 38.0;
      tempVal = 32.4;
    }

    // Update target sensors
    const updatedSensors = currentSensors.map(sensor => {
      if (sensor.nodeId !== targetNodeId) return sensor;

      let newVal = sensor.currentValue;
      let newRate = sensor.rateOfChange;
      let anomaly = false;

      if (sensor.type === 'displacement') {
        newVal = dispVal;
        newRate = Number((rateVal * 0.1).toFixed(2));
        anomaly = targetStage === 'HIGH_RISK' || targetStage === 'CRITICAL';
      } else if (sensor.type === 'displacement_rate') {
        newVal = rateVal;
        newRate = Number(((rateVal - 0.15) / 2).toFixed(2));
        anomaly = targetStage !== 'NORMAL';
      } else if (sensor.type === 'vibration') {
        newVal = vibVal;
        newRate = 0.25;
        anomaly = targetStage === 'HIGH_RISK' || targetStage === 'CRITICAL';
      } else if (sensor.type === 'methane') {
        newVal = ch4Val;
        newRate = 0.04;
      } else if (sensor.type === 'carbon_monoxide') {
        newVal = coVal;
      } else if (sensor.type === 'temperature') {
        newVal = tempVal;
      }

      // Status classification
      let status: any = 'NORMAL';
      if (newVal >= sensor.criticalThreshold) status = 'CRITICAL';
      else if (newVal >= sensor.highRiskThreshold) status = 'HIGH_RISK';
      else if (newVal >= sensor.warningThreshold) status = 'WARNING';

      const newReading = {
        timestamp: now,
        value: newVal,
        unit: sensor.unit,
        rateOfChange: newRate,
      };

      return {
        ...sensor,
        currentValue: newVal,
        rateOfChange: newRate,
        status,
        anomalyFlag: anomaly,
        lastUpdate: now,
        history: [...sensor.history.slice(1), newReading],
      };
    });

    // Update target zone risk
    const updatedZones = currentZones.map(zone => {
      if (zone.id === targetZoneId) {
        return {
          ...zone,
          riskLevel: targetStage,
        };
      }
      return zone;
    });

    // Generate alerts if elevated stage
    let updatedAlerts = [...currentAlerts];
    if (targetStage === 'WARNING') {
      const exists = updatedAlerts.some(a => a.sensorId === 'SN-01-DISP-RATE' && a.severity === 'WARNING' && a.status === 'ACTIVE');
      if (!exists) {
        updatedAlerts.unshift({
          id: `ALT-SIM-${Date.now().toString().slice(-4)}`,
          severity: 'WARNING',
          status: 'ACTIVE',
          sensorId: 'SN-01-DISP-RATE',
          sensorName: 'Displacement Velocity',
          nodeId: targetNodeId,
          zoneId: targetZoneId,
          zoneName: 'Panel 4B Tailgate Roadway',
          parameter: 'Displacement rate',
          currentValue: rateVal,
          unit: 'mm/hr',
          threshold: 1.2,
          rateOfChange: 0.25,
          aiRiskScore: 48,
          timestamp: now,
          notes: '[SIMULATION] Rate of strata movement accelerated beyond warning threshold.',
        });
      }
    } else if (targetStage === 'HIGH_RISK') {
      const exists = updatedAlerts.some(a => a.severity === 'HIGH_RISK' && a.status === 'ACTIVE');
      if (!exists) {
        updatedAlerts.unshift({
          id: `ALT-SIM-${Date.now().toString().slice(-4)}`,
          severity: 'HIGH_RISK',
          status: 'ACTIVE',
          sensorId: 'SN-01-VIB',
          sensorName: 'Triaxial Micro-seismic Geophone',
          nodeId: targetNodeId,
          zoneId: targetZoneId,
          zoneName: 'Panel 4B Tailgate Roadway',
          parameter: 'Vibration peak & rate acceleration',
          currentValue: vibVal,
          unit: 'mm/s',
          threshold: 8.5,
          rateOfChange: 1.8,
          aiRiskScore: 76,
          timestamp: now,
          notes: '[SIMULATION] Correlated micro-seismic activity indicates tensile roof rock fracture.',
        });
      }
    } else if (targetStage === 'CRITICAL') {
      const exists = updatedAlerts.some(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
      if (!exists) {
        updatedAlerts.unshift({
          id: `ALT-SIM-${Date.now().toString().slice(-4)}`,
          severity: 'CRITICAL',
          status: 'ACTIVE',
          sensorId: 'SN-01-DISP',
          sensorName: 'Borehole Strata Extensometer',
          nodeId: targetNodeId,
          zoneId: targetZoneId,
          zoneName: 'Panel 4B Tailgate Roadway',
          parameter: 'Critical Strata Subsidence',
          currentValue: dispVal,
          unit: 'mm',
          threshold: 28.0,
          rateOfChange: 5.2,
          aiRiskScore: 92,
          timestamp: now,
          notes: '[SIMULATION] IMMINENT SUBSIDENCE HAZARD: Major bed separation detected. Trigger withdrawal.',
        });
      }
    }

    return {
      sensors: updatedSensors,
      nodes: currentNodes,
      zones: updatedZones,
      alerts: updatedAlerts,
      stage: targetStage,
    };
  }

  /**
   * Reset simulation back to clean baseline
   */
  public static resetSimulation(): SimulationStepResult {
    return {
      sensors: JSON.parse(JSON.stringify(INITIAL_SENSORS)),
      nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
      zones: JSON.parse(JSON.stringify(INITIAL_ZONES)),
      alerts: [
        {
          id: 'ALT-1082',
          severity: 'WARNING',
          status: 'ACTIVE',
          sensorId: 'SN-01-DISP',
          sensorName: 'Borehole Strata Extensometer',
          nodeId: 'NODE-01',
          zoneId: 'ZONE-P4B',
          zoneName: 'Panel 4B Tailgate Roadway',
          parameter: 'Displacement rate',
          currentValue: 1.28,
          unit: 'mm/hr',
          threshold: 1.20,
          rateOfChange: 0.18,
          aiRiskScore: 38,
          timestamp: Date.now() - 18 * 60 * 1000,
          notes: 'Configurable warning threshold approached during shift advance.',
        },
      ],
      stage: 'NORMAL',
    };
  }
}
