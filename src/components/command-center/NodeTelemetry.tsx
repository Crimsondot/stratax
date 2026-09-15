import React from 'react';
import { useApp } from '../../context/AppContext';
import { Cpu } from 'lucide-react';
import { Sparkline } from '../common/Sparkline';

const statusDotColor = (status: string): string => {
  switch (status) {
    case 'CRITICAL':  return 'var(--color-critical)';
    case 'HIGH_RISK': return 'var(--color-high-risk)';
    case 'WARNING':   return 'var(--color-warning)';
    case 'OFFLINE':   return 'var(--color-offline)';
    default:          return 'var(--color-normal)';
  }
};

const fmtValue = (v: number, digits = 2) =>
  Number.isInteger(v) ? v.toString() : v.toFixed(digits);

export const NodeTelemetry: React.FC = () => {
  const { selectedNodeId, selectedNode, nodes, sensors, setSelectedNodeId, setSelectedSensorId, setActiveTab } = useApp();

  // Sensors belonging to the selected node
  const nodeSensors = sensors.filter(
    s => s.nodeId === (selectedNodeId ?? nodes[0]?.id),
  );

  const displayNode = selectedNode ?? nodes[0] ?? null;

  const nodeStatusColor = (n: typeof displayNode) => {
    if (!n) return 'var(--color-normal)';
    if (n.status === 'OFFLINE')  return 'var(--color-offline)';
    if (n.status === 'DEGRADED') return 'var(--color-warning)';
    return 'var(--color-normal)';
  };

  return (
    <div className="cc-intel-section grow">
      {/* Header - Full Text Clickable Button */}
      <button
        type="button"
        className="cc-intel-header"
        onClick={() => setActiveTab('sensors')}
        aria-label="Full sensor telemetry view"
        title="Click to open Full Sensor Telemetry view"
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
          <Cpu size={11} style={{ color: 'var(--color-telemetry)' }} />
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>{displayNode ? `NODE TELEMETRY: ${displayNode.id}` : 'SELECT A NODE'}</span>
        </div>
        <div
          className="cc-intel-header-action"
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-telemetry)',
            pointerEvents: 'none',
          }}
        >
          <span>DETAIL ➔</span>
        </div>
      </button>

      {/* Node selector tabs (click to switch) */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        flexShrink: 0,
      }}>
        {nodes.map(n => (
          <button
            key={n.id}
            onClick={() => setSelectedNodeId(n.id)}
            style={{
              flex: 1,
              padding: '5px 0',
              fontSize: 9.5,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.5px',
              background: selectedNodeId === n.id || (!selectedNodeId && n.id === nodes[0]?.id)
                ? 'rgba(38,101,253,0.12)'
                : 'transparent',
              color: selectedNodeId === n.id || (!selectedNodeId && n.id === nodes[0]?.id)
                ? 'var(--color-primary-light)'
                : 'var(--text-muted)',
              border: 'none',
              borderBottom: selectedNodeId === n.id || (!selectedNodeId && n.id === nodes[0]?.id)
                ? '2px solid var(--color-primary)'
                : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.13s ease',
            }}
          >
            {n.id}
          </button>
        ))}
      </div>

      {/* Node metadata strip */}
      {displayNode && (
        <div style={{
          padding: '6px 10px',
          background: 'var(--bg-panel-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {[
            { k: 'STATUS', v: displayNode.status, color: nodeStatusColor(displayNode) },
            { k: 'SIGNAL', v: `${displayNode.signalStrength} dBm` },
            { k: 'BATT',   v: `${displayNode.batteryPercent}%` },
            { k: 'HEALTH', v: `${displayNode.health}%`, color: displayNode.health > 80 ? 'var(--color-normal)' : 'var(--color-warning)' },
          ].map(item => (
            <div key={item.k}>
              <div style={{ fontSize: 7.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.5px' }}>
                {item.k}
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color ?? 'var(--text-primary)' }}>
                {item.v}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sensor rows */}
      <div className="cc-intel-body" style={{ padding: '4px 6px' }}>
        {/* Column header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 44px 50px 38px',
          gap: 4,
          padding: '3px 6px 5px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 3,
        }}>
          {['SENSOR', 'HIST', 'VALUE', 'ST'].map(h => (
            <div key={h} style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.5px' }}>
              {h}
            </div>
          ))}
        </div>

        {nodeSensors.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10.5 }}>
            No sensors found for this node
          </div>
        ) : (
          nodeSensors.map(sensor => {
            const sparkData = sensor.history.slice(-18).map(h => h.value);
            const dot = statusDotColor(sensor.status);
            return (
              <div
                key={sensor.id}
                className="cc-sensor-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 44px 50px 38px',
                  gap: 4,
                  padding: '5px 6px',
                  borderBottom: '1px solid rgba(218,226,253,0.04)',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: 3,
                }}
                onClick={() => {
                  setSelectedSensorId(sensor.id);
                  setActiveTab('sensors');
                }}
                role="button"
                tabIndex={0}
                aria-label={`${sensor.name}: ${sensor.currentValue} ${sensor.unit}`}
              >
                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sensor.name}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {sensor.type}
                  </div>
                </div>

                {/* Sparkline */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {sparkData.length > 1 ? (
                    <Sparkline
                      data={sparkData}
                      width={42}
                      height={22}
                      color={dot}
                    />
                  ) : (
                    <div style={{ width: 42, height: 22, background: 'rgba(218,226,253,0.03)', borderRadius: 2 }} />
                  )}
                </div>

                {/* Value */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {fmtValue(sensor.currentValue)}&nbsp;
                    <span style={{ fontSize: 8, fontWeight: 400, color: 'var(--text-muted)' }}>{sensor.unit}</span>
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    Δ {sensor.rateOfChange >= 0 ? '+' : ''}{sensor.rateOfChange.toFixed(2)}/hr
                  </div>
                </div>

                {/* Status dot */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div
                    className="cc-sensor-dot"
                    style={{ background: dot, boxShadow: `0 0 4px ${dot}80` }}
                    aria-label={`Sensor status: ${sensor.status}`}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
