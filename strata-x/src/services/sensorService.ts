import { Sensor, SensorReading, SensorStatus } from '../types';

export class SensorService {
  /**
   * Determine sensor status based on configurable thresholds
   */
  public static evaluateStatus(sensor: Sensor, val: number): SensorStatus {
    if (val >= sensor.criticalThreshold) return 'CRITICAL';
    if (val >= sensor.highRiskThreshold) return 'HIGH_RISK';
    if (val >= sensor.warningThreshold) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Filter sensors by zone, type, search term and status
   */
  public static filterSensors(
    sensors: Sensor[],
    options: {
      zoneId?: string;
      nodeId?: string;
      type?: string;
      status?: string;
      searchTerm?: string;
    }
  ): Sensor[] {
    return sensors.filter(sensor => {
      if (options.zoneId && options.zoneId !== 'ALL' && sensor.zoneId !== options.zoneId) {
        return false;
      }
      if (options.nodeId && options.nodeId !== 'ALL' && sensor.nodeId !== options.nodeId) {
        return false;
      }
      if (options.type && options.type !== 'ALL' && sensor.type !== options.type) {
        return false;
      }
      if (options.status && options.status !== 'ALL' && sensor.status !== options.status) {
        return false;
      }
      if (options.searchTerm) {
        const q = options.searchTerm.toLowerCase();
        return (
          sensor.name.toLowerCase().includes(q) ||
          sensor.id.toLowerCase().includes(q) ||
          sensor.zoneId.toLowerCase().includes(q) ||
          sensor.nodeId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  /**
   * Calculate rate of change between the last two readings
   */
  public static calculateRate(history: SensorReading[]): number {
    if (history.length < 2) return 0;
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const timeDeltaHours = (last.timestamp - prev.timestamp) / (3600 * 1000);
    if (timeDeltaHours <= 0) return 0;
    return Number(((last.value - prev.value) / timeDeltaHours).toFixed(3));
  }
}
