import { Sensor, SensorNode, SensorReading } from '../types';

/**
 * Expected JSON payload format sent by ESP32 nodes to Jetson Orin Nano
 * and forwarded to the MineGuard Command Center.
 */
export interface Esp32GatewayTelemetryPacket {
  gateway_id: string;          // e.g. "JETSON-ORIN-NANO-01"
  node_id: string;             // e.g. "NODE-01"
  zone_id: string;             // e.g. "ZONE-P4B"
  timestamp: number;           // Unix epoch ms
  battery_v: number;           // e.g. 3.98
  rssi_dbm: number;            // e.g. -64
  firmware: string;            // e.g. "v2.4.1"
  readings: {
    sensor_id: string;         // e.g. "SN-01-DISP"
    type: string;              // "displacement" | "vibration" | ...
    value: number;             // calibrated floating point value
    unit: string;              // "mm", "mm/s", "% Vol", etc.
  }[];
}

export class GatewayService {
  /**
   * Example payload illustrating the exact contract for physical ESP32 -> Jetson Orin Nano -> MineGuard
   */
  public static getSampleHardwarePacket(): Esp32GatewayTelemetryPacket {
    return {
      gateway_id: 'JETSON-ORIN-NANO-01',
      node_id: 'NODE-01',
      zone_id: 'ZONE-P4B',
      timestamp: Date.now(),
      battery_v: 3.96,
      rssi_dbm: -62,
      firmware: 'v2.4.1-mineguard-esp32',
      readings: [
        { sensor_id: 'SN-01-DISP', type: 'displacement', value: 6.42, unit: 'mm' },
        { sensor_id: 'SN-01-DISP-RATE', type: 'displacement_rate', value: 0.14, unit: 'mm/hr' },
        { sensor_id: 'SN-01-VIB', type: 'vibration', value: 1.85, unit: 'mm/s' },
        { sensor_id: 'SN-01-CH4', type: 'methane', value: 0.28, unit: '% Vol' },
        { sensor_id: 'SN-01-CO', type: 'carbon_monoxide', value: 8.5, unit: 'ppm' },
        { sensor_id: 'SN-01-TEMP', type: 'temperature', value: 27.2, unit: '°C' },
      ],
    };
  }

  /**
   * Ingest real telemetry from Jetson Orin Nano gateway
   */
  public static ingestPacket(
    packet: Esp32GatewayTelemetryPacket,
    currentSensors: Sensor[],
    currentNodes: SensorNode[]
  ): { updatedSensors: Sensor[]; updatedNodes: SensorNode[] } {
    const updatedNodes = currentNodes.map(node => {
      if (node.id === packet.node_id) {
        return {
          ...node,
          signalStrength: packet.rssi_dbm,
          batteryVoltage: packet.battery_v,
          batteryPercent: Math.min(100, Math.round(((packet.battery_v - 3.2) / 1.0) * 100)),
          lastCommunication: packet.timestamp,
          status: 'ONLINE' as const,
        };
      }
      return node;
    });

    const updatedSensors = currentSensors.map(sensor => {
      // Prometheus exporters may not know the dashboard's display ID. Prefer a
      // precise ID match, then safely fall back to node + canonical sensor type.
      const match = packet.readings.find(r => r.sensor_id === sensor.id)
        || packet.readings.find(r => r.type === sensor.type && packet.node_id === sensor.nodeId);
      if (match) {
        const prevValue = sensor.currentValue;
        const timeDeltaHours = Math.max(0.0001, (packet.timestamp - sensor.lastUpdate) / (3600 * 1000));
        const computedRate = Number(((match.value - prevValue) / timeDeltaHours).toFixed(3));

        const newReading: SensorReading = {
          timestamp: packet.timestamp,
          value: match.value,
          unit: match.unit,
          rateOfChange: computedRate,
        };

        const updatedHistory = [...sensor.history.slice(1), newReading];

        return {
          ...sensor,
          currentValue: match.value,
          rateOfChange: computedRate,
          lastUpdate: packet.timestamp,
          history: updatedHistory,
        };
      }
      return sensor;
    });

    return { updatedSensors, updatedNodes };
  }
}
