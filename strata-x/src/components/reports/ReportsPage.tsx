import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportService } from '../../services/reportService';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  CheckCircle,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  Activity,
  Cpu,
} from 'lucide-react';
import { ShiftSafetyReport } from '../../types';

export const ReportsPage: React.FC = () => {
  const { config, nodes, sensors, alerts, riskAssessment } = useApp();

  const [report, setReport] = useState<ShiftSafetyReport>(() =>
    ReportService.generateShiftReport(config, nodes, sensors, alerts, riskAssessment)
  );

  const handleRegenerate = () => {
    const updated = ReportService.generateShiftReport(config, nodes, sensors, alerts, riskAssessment);
    setReport(updated);
  };

  const handleExportCSV = () => {
    ReportService.exportCSV(report, sensors);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <FileText size={22} color="var(--color-telemetry)" />
            <span>Statutory Mine Safety & Subsidence Shift Reports</span>
          </h1>
          <p>
            DGMS Compliance Standard • Automated Telemetry Aggregation • Shift Handover & Anomaly Documentation
          </p>
        </div>

        <div className="header-actions">
          <button className="btn" onClick={handleRegenerate}>
            <RefreshCw size={14} />
            <span>Refresh Report</span>
          </button>
          <button className="btn" onClick={handleExportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={14} />
            <span>Print / PDF Export</span>
          </button>
        </div>
      </div>

      {/* Main Formatted Report Document */}
      <div
        className="control-panel"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-medium)',
          borderRadius: '8px',
          padding: '28px',
        }}
      >
        {/* Document Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-medium)', paddingBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-telemetry)' }}>
              MINEGROUND EARLY WARNING TELEMETRY REPORT
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-bright)', marginTop: '4px' }}>
              {report.mineName}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              DGMS Site ID: <strong className="font-mono">{report.siteId}</strong> • Region: Eastern Coalfields
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
              Report Reference: {report.id}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Shift: <strong style={{ color: 'var(--text-bright)' }}>{report.shift}</strong>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* 4 Compliance KPI Metric Tiles */}
        <div className="grid-4" style={{ margin: '20px 0', gap: '14px' }}>
          {/* Node Uptime */}
          <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Hardware Mesh Uptime</span>
              <Cpu size={14} color="var(--color-telemetry)" />
            </div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-normal)', marginTop: '4px' }}>
              {report.uptimeNodePercent}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ESP32 nodes active: 2/2
            </div>
          </div>

          {/* Sensor Uptime */}
          <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Sensor Channels Uptime</span>
              <Activity size={14} color="var(--color-telemetry)" />
            </div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-normal)', marginTop: '4px' }}>
              {report.uptimeSensorPercent}%
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              12 of 12 channels logging
            </div>
          </div>

          {/* Max Displacement */}
          <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Peak Strata Displacement</span>
              <Activity size={14} color="var(--color-telemetry)" />
            </div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '4px' }}>
              {report.maxDisplacementObserved} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>mm</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Peak Rate: {report.maxDisplacementRate} mm/hr
            </div>
          </div>

          {/* Max Micro-seismic Vibration */}
          <div style={{ background: 'var(--bg-app)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Peak Micro-seismic Vib.</span>
              <Activity size={14} color="var(--color-purple)" />
            </div>
            <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-bright)', marginTop: '4px' }}>
              {report.maxVibrationRecorded} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>mm/s</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Peak CH4: {report.peakMethanePpm}% Vol
            </div>
          </div>
        </div>

        {/* Shift Findings & Strata Rationale */}
        <div style={{ margin: '20px 0', padding: '16px', background: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Shift Strata Stability & Risk Synthesis
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            During {report.shift}, the MineGuard AI edge engine monitored real-time subsidence telemetry across <strong>{report.affectedZones.length > 0 ? report.affectedZones.join(', ') : 'Panel 4A and Panel 4B'}</strong>. 
            Overall composite AI risk trend is rated <strong style={{ color: report.aiRiskTrend === 'HAZARDOUS' ? 'var(--color-critical)' : 'var(--color-normal)' }}>{report.aiRiskTrend}</strong>. 
            Recorded alerts: <strong>{report.totalAlerts} total</strong> ({report.criticalAlerts} critical, {report.highRiskAlerts} high risk, {report.warningAlerts} warnings).
          </p>
        </div>

        {/* Chronological Incident Timeline Table */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Chronological Shift Incident & Anomaly Log
          </h4>
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Incident Type</th>
                <th>Severity</th>
                <th>Event Description</th>
              </tr>
            </thead>
            <tbody>
              {report.eventsSummary.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No safety threshold breaches recorded during this shift.
                  </td>
                </tr>
              ) : (
                report.eventsSummary.map((event, idx) => (
                  <tr key={idx}>
                    <td className="font-mono">{new Date(event.timestamp).toLocaleTimeString()}</td>
                    <td className="font-mono font-bold" style={{ color: 'var(--text-bright)' }}>{event.type}</td>
                    <td><StatusBadge status={event.severity} size="sm" /></td>
                    <td>{event.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Officer Signature and Statutory Handover */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Shift Reporting Officer:</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)', marginTop: '2px' }}>
              {report.safetyOfficer}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Certified First Class Manager • Coal Mines Regulations 2017
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ borderBottom: '1px dashed var(--border-medium)', width: '180px', marginBottom: '4px' }} />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Digital Compliance Stamp & Verification</div>
          </div>
        </div>
      </div>
    </div>
  );
};
