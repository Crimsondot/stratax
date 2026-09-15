import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { playSoundEffect } from '../../services/interactionSound';

const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH_RISK: 1, WARNING: 2 };

const formatRelTime = (ts: number): string => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export const AlertFeed: React.FC = () => {
  const { alerts, acknowledgeAlert, setActiveTab, setSelectedNodeId } = useApp();
  const prevCountRef = useRef(0);

  const active = alerts
    .filter(a => a.status === 'ACTIVE')
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3))
    .slice(0, 4);

  useEffect(() => {
    if (active.length > prevCountRef.current) {
      playSoundEffect('alert-new');
    }
    prevCountRef.current = active.length;
  }, [active.length]);

  const sevColor = (sev: string) => {
    if (sev === 'CRITICAL') return '#ef4444';
    if (sev === 'HIGH_RISK') return '#f97316';
    if (sev === 'WARNING') return '#eab308';
    return '#3b82f6';
  };

  return (
    <div className="cc-intel-section" style={{ flex: '0 0 auto' }}>
      {/* Header - Full Text Clickable Button */}
      <button
        type="button"
        className="cc-intel-header"
        onClick={() => setActiveTab('alerts')}
        aria-label="Navigate to Alerts page"
        title="Click to view all Alerts"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-chip)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <div className="cc-intel-header-title" style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          <AlertTriangle size={12} style={{ color: active.some(a => a.severity === 'CRITICAL') ? 'var(--color-critical)' : 'var(--color-warning)' }} />
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>ACTIVE ALERT FEED</span>
          {active.length > 0 && (
            <span style={{
              background: active.some(a => a.severity === 'CRITICAL') ? 'rgba(239,68,68,0.2)' : 'rgba(245,166,35,0.2)',
              color: active.some(a => a.severity === 'CRITICAL') ? 'var(--color-critical)' : 'var(--color-warning)',
              fontSize: 9,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
            }}>
              {active.length}
            </span>
          )}
        </div>
        <div
          className="cc-intel-header-action"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-primary)',
            pointerEvents: 'none',
          }}
        >
          <span>SEE ALL ➔</span>
        </div>
      </button>

      <div className="cc-intel-body" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {active.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '14px 0',
            gap: 4,
          }}>
            <CheckCircle size={18} style={{ color: 'var(--color-normal)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>All nodes operating normally</span>
          </div>
        ) : (
          active.map(alert => {
            const col = sevColor(alert.severity);
            return (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.nodeId) setSelectedNodeId(alert.nodeId);
                  setActiveTab('alerts');
                }}
                title="Click to view alert in Alerts section"
                style={{
                  background: 'var(--bg-panel-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${col}`,
                  borderRadius: 6,
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = col;
                  e.currentTarget.style.boxShadow = `0 2px 8px ${col}20`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header: Severity Pill + Node ID + Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: col,
                      background: `${col}18`,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {alert.severity}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>
                      {alert.nodeId}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {formatRelTime(alert.timestamp)}
                  </span>
                </div>

                {/* Message Body */}
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{alert.message || `${alert.sensorName}: ${alert.currentValue} ${alert.unit}`}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acknowledgeAlert(alert.id);
                    }}
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 3,
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-chip)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                    title="Acknowledge alert"
                  >
                    ACK
                  </button>
                </div>

                {/* Location Footer */}
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {alert.zoneName || 'Sector B · Panel 4'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
