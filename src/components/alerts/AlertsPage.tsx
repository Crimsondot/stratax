import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  MapPin,
  Activity,
  Cpu,
  Clock,
  Shield,
  Eye,
  Sliders,
} from 'lucide-react';
import { Alert } from '../../types';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    setSelectedSensorId,
    setSelectedNodeId,
    setActiveTab,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'ALL' | 'CRITICAL' | 'HIGH_RISK' | 'WARNING' | 'ACKNOWLEDGED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (filterTab === 'ACKNOWLEDGED') {
      if (a.status !== 'ACKNOWLEDGED') return false;
    } else if (filterTab !== 'ALL') {
      if (a.severity !== filterTab) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <AlertTriangle size={22} color="var(--color-critical)" />
            <span>Underground Hazard & Alert Management Center</span>
          </h1>
          <p>
            Automated Early-Warning Trigger Feed • Real-Time Strata Subsidence, Geophone Velocity & Gas Breaches
          </p>
        </div>

        <div className="header-actions">
          <span className="demo-tag">CONFIGURABLE PROTOTYPE LOGIC</span>
        </div>
      </div>

      {/* Tabs & Search Strip */}
      <div
        className="control-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'CRITICAL', 'HIGH_RISK', 'WARNING', 'ACKNOWLEDGED'] as const).map(tab => (
            <button
              key={tab}
              className={`btn btn-sm ${filterTab === tab ? 'btn-primary' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {tab.replace('_', ' ')} (
              {
                tab === 'ALL'
                  ? alerts.length
                  : tab === 'ACKNOWLEDGED'
                  ? alerts.filter(a => a.status === 'ACKNOWLEDGED').length
                  : alerts.filter(a => a.severity === tab).length
              }
              )
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-app)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            minWidth: '240px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search alerts, parameters, zones..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Alert Feed Table */}
      <div className="control-panel">
        <div style={{ overflowX: 'auto' }}>
          <table className="industrial-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Severity</th>
                <th>Trigger Parameter & Sensor</th>
                <th>Monitored Zone</th>
                <th>Measured Value</th>
                <th>Threshold Limit</th>
                <th>Rate of Change</th>
                <th>AI Risk Score</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No alerts found for current criteria. Strata conditions nominal.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr key={alert.id} style={{ background: alert.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
                    <td className="font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                      {alert.id}
                    </td>
                    <td>
                      <StatusBadge status={alert.severity} size="sm" />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{alert.parameter}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {alert.sensorName} ({alert.sensorId})
                      </div>
                    </td>
                    <td>
                      <div>{alert.zoneName}</div>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Node: {alert.nodeId}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold" style={{ fontSize: '14px', color: 'var(--text-bright)' }}>
                        {alert.currentValue}
                      </span>{' '}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alert.unit}</span>
                    </td>
                    <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {alert.threshold} {alert.unit}
                    </td>
                    <td className="font-mono">
                      {alert.rateOfChange} {alert.unit}/hr
                    </td>
                    <td>
                      <span className="font-mono font-bold" style={{ color: 'var(--color-purple)' }}>
                        {alert.aiRiskScore}%
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {alert.status === 'ACTIVE' ? (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => acknowledgeAlert(alert.id)}
                            title="Acknowledge alert as shift operator"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--color-normal)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Ack'd
                          </span>
                        )}

                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setSelectedSensorId(alert.sensorId);
                            setActiveTab('sensors');
                          }}
                          title="View Sensor Telemetry"
                        >
                          <Activity size={12} />
                        </button>

                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setSelectedNodeId(alert.nodeId);
                            setActiveTab('mine-map');
                          }}
                          title="Locate on Live Mine GIS Map"
                        >
                          <MapPin size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
