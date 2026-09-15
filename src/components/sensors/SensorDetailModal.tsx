import React, { useState, useEffect } from 'react';
import { Sensor } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Sparkline } from '../common/Sparkline';
import { X, Activity, TrendingUp, Sliders } from 'lucide-react';
import { playSoundEffect } from '../../services/interactionSound';

interface SensorDetailModalProps {
  sensor: Sensor | null;
  onClose: () => void;
}

export const SensorDetailModal: React.FC<SensorDetailModalProps> = ({ sensor, onClose }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sensor) {
      requestAnimationFrame(() => setIsVisible(true));
      playSoundEffect('modal-open');
    } else {
      setIsVisible(false);
    }
  }, [sensor]);

  const handleClose = () => {
    playSoundEffect('modal-close');
    setIsVisible(false);
    setTimeout(onClose, 150);
  };

  if (!sensor) return null;

  // Slice history according to selected timeframe
  const historyPoints = sensor.history.slice(
    timeRange === '1h' ? -4 : timeRange === '6h' ? -12 : 0
  );
  const historyValues = historyPoints.map(p => p.value);

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        animation: isVisible ? 'modal-backdrop-in 0.2s ease both' : 'modal-backdrop-out 0.15s ease both',
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          animation: isVisible ? 'modal-content-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both' : 'modal-content-out 0.2s ease both',
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} color="var(--color-telemetry)" />
            <h3 style={{ margin: 0 }}>
              {sensor.name} <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>({sensor.id})</span>
            </h3>
            <StatusBadge status={sensor.status} size="sm" />
          </div>
          <button className="btn btn-sm" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Header Stats Strip */}
          <div className="grid-4" style={{ gap: '12px' }}>
            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Value</div>
              <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '2px' }}>
                {sensor.currentValue} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{sensor.unit}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Scale: {sensor.minRange} to {sensor.maxRange} {sensor.unit}
              </div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rate of Change</div>
              <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: sensor.rateOfChange > 1.0 ? 'var(--color-high-risk)' : 'var(--text-bright)', marginTop: '2px' }}>
                {sensor.rateOfChange} <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{sensor.unit}/hr</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Velocity trend
              </div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Risk Contribution</div>
              <div className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-purple)', marginTop: '2px' }}>
                {sensor.aiContribution}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Multi-sensor model weight
              </div>
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '5px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Node & Location</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)', marginTop: '4px' }}>
                {sensor.nodeId}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {sensor.zoneId}
              </div>
            </div>
          </div>

          {/* Configurable Threshold Reference Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--bg-app)',
              borderRadius: '5px',
              border: '1px solid var(--border-medium)',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={14} color="var(--color-telemetry)" />
              <strong style={{ color: 'var(--text-secondary)' }}>Configurable Safety Limits:</strong>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Warning: <strong className="font-mono" style={{ color: 'var(--color-warning)' }}>{sensor.warningThreshold} {sensor.unit}</strong></span>
              <span>High Risk: <strong className="font-mono" style={{ color: 'var(--color-high-risk)' }}>{sensor.highRiskThreshold} {sensor.unit}</strong></span>
              <span>Critical: <strong className="font-mono" style={{ color: 'var(--color-critical)' }}>{sensor.criticalThreshold} {sensor.unit}</strong></span>
            </div>
          </div>

          {/* Historical Trend Chart Viewport */}
          <div className="control-panel">
            <div className="control-panel-header">
              <div className="control-panel-title">
                <TrendingUp size={15} color="var(--color-telemetry)" />
                <span>Historical Telemetry Curve</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['1h', '6h', '24h'] as const).map(t => (
                  <button
                    key={t}
                    className={`btn btn-sm ${timeRange === t ? 'btn-primary' : ''}`}
                    onClick={() => setTimeRange(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-panel-body" style={{ background: 'var(--bg-panel-elevated)', padding: '20px' }}>
              <Sparkline
                data={historyValues}
                color="var(--color-telemetry)"
                width={740}
                height={160}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{timeRange === '1h' ? '1 Hour Ago' : timeRange === '6h' ? '6 Hours Ago' : '24 Hours Ago'}</span>
                <span>Current Reading: <strong className="font-mono" style={{ color: 'var(--text-bright)' }}>{sensor.currentValue} {sensor.unit}</strong></span>
                <span>Latest (Now)</span>
              </div>
            </div>
          </div>

          {/* Recent Values Log Table */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Recent Telemetry Sample Log (Last {historyPoints.length} Points)
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
              <table className="industrial-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Measured Value</th>
                    <th>Computed Velocity</th>
                    <th>Anomaly Flag</th>
                    <th>Safety Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPoints.slice(-6).reverse().map((pt, idx) => (
                    <tr key={idx}>
                      <td className="font-mono">{new Date(pt.timestamp).toLocaleTimeString()}</td>
                      <td className="font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                        {pt.value} {pt.unit}
                      </td>
                      <td className="font-mono">{pt.rateOfChange || 0} {pt.unit}/hr</td>
                      <td>
                        {sensor.anomalyFlag ? (
                          <span style={{ color: 'var(--color-critical)', fontWeight: 700 }}>⚠ DETECTED</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Nominal</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={sensor.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={handleClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
