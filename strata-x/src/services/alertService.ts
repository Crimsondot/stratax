import { Alert, AlertSeverity, AlertStatus } from '../types';

export class AlertService {
  public static filterAlerts(
    alerts: Alert[],
    options: {
      severity?: string;
      status?: string;
      zoneId?: string;
      searchTerm?: string;
    }
  ): Alert[] {
    return alerts.filter(a => {
      if (options.severity && options.severity !== 'ALL' && a.severity !== options.severity) {
        return false;
      }
      if (options.status && options.status !== 'ALL' && a.status !== options.status) {
        return false;
      }
      if (options.zoneId && options.zoneId !== 'ALL' && a.zoneId !== options.zoneId) {
        return false;
      }
      if (options.searchTerm) {
        const q = options.searchTerm.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.parameter.toLowerCase().includes(q) ||
          a.sensorName.toLowerCase().includes(q) ||
          a.zoneName.toLowerCase().includes(q) ||
          a.nodeId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }

  public static acknowledgeAlert(
    alerts: Alert[],
    alertId: string,
    operatorName = 'Control Room Engineer'
  ): Alert[] {
    return alerts.map(a => {
      if (a.id === alertId) {
        return {
          ...a,
          status: 'ACKNOWLEDGED' as AlertStatus,
          acknowledgedAt: Date.now(),
          acknowledgedBy: operatorName,
        };
      }
      return a;
    });
  }

  public static getActiveCount(alerts: Alert[]): number {
    return alerts.filter(a => a.status === 'ACTIVE').length;
  }

  public static getCountsBySeverity(alerts: Alert[]): Record<AlertSeverity, number> {
    const counts: Record<AlertSeverity, number> = {
      NORMAL: 0,
      WARNING: 0,
      HIGH_RISK: 0,
      CRITICAL: 0,
    };
    for (const a of alerts) {
      if (a.status === 'ACTIVE') {
        counts[a.severity] = (counts[a.severity] || 0) + 1;
      }
    }
    return counts;
  }
}
