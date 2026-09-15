import { ShiftSafetyReport, Sensor, SensorNode, Alert, RiskAssessment, SystemConfig } from '../types';

export class ReportService {
  public static generateShiftReport(
    config: SystemConfig,
    nodes: SensorNode[],
    sensors: Sensor[],
    alerts: Alert[],
    riskAssessment: RiskAssessment
  ): ShiftSafetyReport {
    const dispSensors = sensors.filter(s => s.type === 'displacement');
    const rateSensors = sensors.filter(s => s.type === 'displacement_rate');
    const vibSensors = sensors.filter(s => s.type === 'vibration');
    const gasSensors = sensors.filter(s => s.type === 'methane');

    const maxDisp = Math.max(...dispSensors.map(s => s.currentValue), 0);
    const maxRate = Math.max(...rateSensors.map(s => s.currentValue), 0);
    const maxVib = Math.max(...vibSensors.map(s => s.currentValue), 0);
    const peakMethane = Math.max(...gasSensors.map(s => s.currentValue), 0);

    const onlineNodes = nodes.filter(n => n.status === 'ONLINE').length;
    const uptimeNodePercent = nodes.length > 0 ? Math.round((onlineNodes / nodes.length) * 100) : 100;

    const onlineSensors = sensors.filter(s => s.status !== 'OFFLINE').length;
    const uptimeSensorPercent = sensors.length > 0 ? Math.round((onlineSensors / sensors.length) * 100) : 100;

    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const highRiskCount = alerts.filter(a => a.severity === 'HIGH_RISK').length;
    const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

    const affectedZonesSet = new Set<string>();
    alerts.forEach(a => affectedZonesSet.add(a.zoneName));

    const eventsSummary = alerts.map(a => ({
      timestamp: a.timestamp,
      type: `${a.parameter.toUpperCase()} BREACH`,
      description: `${a.sensorName} (${a.sensorId}) in ${a.zoneName} reached ${a.currentValue} ${a.unit} (Threshold: ${a.threshold} ${a.unit})`,
      severity: a.severity,
    }));

    return {
      id: `REP-${Date.now().toString().slice(-6)}`,
      reportDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      mineName: config.mineName,
      siteId: config.siteId,
      shift: config.activeShift,
      safetyOfficer: 'A. K. Sengupta (Cert. First Class Manager / Safety)',
      generatedAt: Date.now(),
      uptimeNodePercent,
      uptimeSensorPercent,
      totalAlerts: alerts.length,
      criticalAlerts: criticalCount,
      highRiskAlerts: highRiskCount,
      warningAlerts: warningCount,
      maxDisplacementObserved: Number(maxDisp.toFixed(2)),
      maxDisplacementRate: Number(maxRate.toFixed(2)),
      maxVibrationRecorded: Number(maxVib.toFixed(2)),
      peakMethanePpm: Number(peakMethane.toFixed(2)),
      affectedZones: Array.from(affectedZonesSet),
      aiRiskTrend: riskAssessment.riskLevel === 'CRITICAL' ? 'HAZARDOUS' : riskAssessment.riskLevel === 'HIGH_RISK' ? 'ELEVATED' : 'STABLE',
      eventsSummary,
    };
  }

  public static exportCSV(report: ShiftSafetyReport, sensors: Sensor[]): void {
    const rows = [
      ['MineGuard AI - Shift Safety Telemetry & Compliance Report'],
      ['Mine Name', report.mineName],
      ['Site ID', report.siteId],
      ['Date', report.reportDate],
      ['Shift', report.shift],
      ['Safety Officer', report.safetyOfficer],
      ['Node Uptime (%)', report.uptimeNodePercent.toString()],
      ['Sensor Uptime (%)', report.uptimeSensorPercent.toString()],
      ['AI Subsidence Risk Trend', report.aiRiskTrend],
      ['Max Displacement (mm)', report.maxDisplacementObserved.toString()],
      ['Max Rate (mm/hr)', report.maxDisplacementRate.toString()],
      ['Max Vibration (mm/s)', report.maxVibrationRecorded.toString()],
      [],
      ['--- Master Sensor Telemetry Snapshot ---'],
      ['Sensor ID', 'Node ID', 'Zone', 'Type', 'Current Value', 'Unit', 'Rate of Change', 'Status', 'Warning Thresh', 'Critical Thresh'],
    ];

    sensors.forEach(s => {
      rows.push([
        s.id,
        s.nodeId,
        s.zoneId,
        s.type,
        s.currentValue.toString(),
        s.unit,
        s.rateOfChange.toString(),
        s.status,
        s.warningThreshold.toString(),
        s.criticalThreshold.toString(),
      ]);
    });

    rows.push([]);
    rows.push(['--- Incident & Alert Log ---']);
    rows.push(['Timestamp', 'Type', 'Severity', 'Description']);

    report.eventsSummary.forEach(e => {
      rows.push([
        new Date(e.timestamp).toISOString(),
        e.type,
        e.severity,
        `"${e.description.replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MineGuard_Report_${report.siteId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
