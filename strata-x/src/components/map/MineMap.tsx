import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cpu,
  Compass,
} from 'lucide-react';

export const MineMap: React.FC = () => {
  const {
    zones,
    nodes,
    sensors,
    alerts,
    riskAssessment,
    simulationState,
    setSelectedNodeId,
    setSelectedSensorId,
    setActiveTab,
  } = useApp();

  const [activeLayerRoadways, setActiveLayerRoadways] = useState(true);
  const [activeLayerPanels, setActiveLayerPanels] = useState(true);
  const [activeLayerSensors, setActiveLayerSensors] = useState(true);
  const [activeLayerVentilation, setActiveLayerVentilation] = useState(true);
  const [activeLayerRiskHeatmap, setActiveLayerRiskHeatmap] = useState(true);

  const [inspectNodeId, setInspectNodeId] = useState<string | null>('NODE-01');
  const [zoomLevel, setZoomLevel] = useState(1);

  const inspectedNode = nodes.find(n => n.id === inspectNodeId) || nodes[0];
  const inspectedNodeSensors = sensors.filter(s => s.nodeId === inspectedNode.id);
  const inspectedNodeAlerts = alerts.filter(a => a.nodeId === inspectedNode.id);

  // Position mapping for schematic nodes on the canvas
  const nodePositions: Record<string, { x: number; y: number }> = {
    'NODE-01': { x: 490, y: 205 }, // In Panel 4B Tailgate
    'NODE-02': { x: 230, y: 205 }, // In Panel 4A Main Gate Conveyor
  };

  const getNodeStatusColor = (nodeId: string) => {
    const nodeSensors = sensors.filter(s => s.nodeId === nodeId);
    if (nodeSensors.some(s => s.status === 'CRITICAL')) return 'var(--color-critical)';
    if (nodeSensors.some(s => s.status === 'HIGH_RISK')) return 'var(--color-high-risk)';
    if (nodeSensors.some(s => s.status === 'WARNING')) return 'var(--color-warning)';
    return 'var(--color-normal)';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Compass size={22} color="var(--color-telemetry)" aria-hidden="true" />
            <span>Underground Mine GIS & Strata Layout</span>
          </h1>
          <p>
            Schematic Geological & Extraction Plan • Seam III Dishergarh Horizon (-340&nbsp;m RL) • Real-Time Mesh Node Positioning
          </p>
        </div>

        <div className="header-actions">
          <span className="demo-tag">SCHEMATIC CAD / GIS PROJECTION</span>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-panel)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
              aria-label="Zoom in map"
            >
              <ZoomIn size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.75))}
              aria-label="Zoom out map"
            >
              <ZoomOut size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setZoomLevel(1)}
              aria-label="Reset map zoom"
            >
              <Maximize2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Control Bar */}
      <div
        className="control-panel"
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
        role="toolbar"
        aria-label="GIS Layer Visibility Controls"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            GIS Overlays:
          </span>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeLayerRoadways}
              onChange={e => setActiveLayerRoadways(e.target.checked)}
            />
            <span>Tunnels & Roadways</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeLayerPanels}
              onChange={e => setActiveLayerPanels(e.target.checked)}
            />
            <span>Extraction Panels</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeLayerSensors}
              onChange={e => setActiveLayerSensors(e.target.checked)}
            />
            <span>Sensor Nodes (ESP32)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeLayerRiskHeatmap}
              onChange={e => setActiveLayerRiskHeatmap(e.target.checked)}
            />
            <span>Subsidence Risk Hazard Zone</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={activeLayerVentilation}
              onChange={e => setActiveLayerVentilation(e.target.checked)}
            />
            <span>Ventilation Vectors</span>
          </label>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Node Status:</span>
          <span style={{ color: 'var(--color-normal)' }}>🟢 Normal</span>
          <span style={{ color: 'var(--color-warning)' }}>🟡 Warning</span>
          <span style={{ color: 'var(--color-high-risk)' }}>🟠 High Risk</span>
          <span style={{ color: 'var(--color-critical)' }}>🔴 Critical</span>
        </div>
      </div>

      {/* Main Map Viewport & Inspection Drawer */}
      <div className="grid-2-1" style={{ alignItems: 'stretch' }}>
        {/* Left: Interactive SVG Mine Schematic */}
        <div
          className="control-panel"
          style={{
            position: 'relative',
            minHeight: '520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'var(--bg-app)',
          }}
        >
          {/* Background Grid Lines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          />

          <svg
            viewBox="0 0 760 420"
            role="img"
            aria-label="Underground coal mine schematic CAD plan with sensor node markers"
            style={{
              width: '100%',
              height: '100%',
              maxHeight: '560px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
            }}
          >
            <defs>
              <radialGradient id="hazardGlowP4B" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={simulationState.stage === 'CRITICAL' ? '#ef4444' : '#f97316'} stopOpacity="0.45" />
                <stop offset="70%" stopColor={simulationState.stage === 'CRITICAL' ? '#ef4444' : '#f97316'} stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <pattern id="pillarHatch" width="12" height="12" patternUnits="userSpaceOnUse">
                <path d="M 0,12 L 12,0 M 6,18 L 18,6" stroke="#1f2d42" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Mine Outer Boundary */}
            <rect
              x="40"
              y="20"
              width="680"
              height="380"
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            <text x="50" y="38" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
              MINE CONCESSION LEASE BOUNDARY: CMPDI COLLIERY NO. 7
            </text>

            {/* Geological Fault Line */}
            <path
              d="M 60,60 Q 300,120 420,40 T 700,90"
              fill="none"
              stroke="#b45309"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <text x="610" y="75" fill="#f59e0b" fontSize="8" fontFamily="var(--font-mono)">
              GEOLOGICAL FAULT F-04
            </text>

            {/* Roadways Layer */}
            {activeLayerRoadways && (
              <g id="roadways">
                <rect x="50" y="270" width="60" height="70" fill="#131e30" stroke="#25354e" strokeWidth="1.5" />
                <circle cx="80" cy="305" r="14" fill="#0b111c" stroke="#38bdf8" strokeWidth="2" />
                <text x="80" y="309" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="700" fontFamily="var(--font-mono)">
                  SHAFT
                </text>

                <rect x="110" y="285" width="530" height="40" fill="#0e1726" stroke="#2a3d58" strokeWidth="1.5" />
                <text x="350" y="310" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
                  MAIN INTAKE TRUNK ROADWAY (3.5m x 4.8m)
                </text>

                <rect x="110" y="65" width="530" height="36" fill="#0e1726" stroke="#2a3d58" strokeWidth="1.5" />
                <text x="350" y="88" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
                  SOUTH RETURN AIRWAY & BLEEDER TRUNK
                </text>

                <rect x="180" y="101" width="30" height="184" fill="#0a1220" stroke="#1f2d42" strokeWidth="1.2" />
                <rect x="350" y="101" width="30" height="184" fill="#0a1220" stroke="#1f2d42" strokeWidth="1.2" />
                <rect x="520" y="101" width="30" height="184" fill="#0a1220" stroke="#1f2d42" strokeWidth="1.2" />
              </g>
            )}

            {/* Extraction Panels Layer */}
            {activeLayerPanels && (
              <g id="panels">
                <rect
                  x="120"
                  y="135"
                  width="210"
                  height="130"
                  fill="url(#pillarHatch)"
                  stroke="#334b6e"
                  strokeWidth="1.5"
                />
                <rect x="130" y="145" width="190" height="30" fill="rgba(15, 23, 42, 0.85)" rx="4" />
                <text x="140" y="164" fill="var(--text-bright)" fontSize="11" fontWeight="700">
                  PANEL 4A — MAIN GATE
                </text>
                <text x="140" y="186" fill="var(--text-muted)" fontSize="9">
                  Longwall Face Ch. 180m • Status: Operational
                </text>

                <rect
                  x="380"
                  y="135"
                  width="250"
                  height="130"
                  fill="url(#pillarHatch)"
                  stroke={zones[0].riskLevel === 'CRITICAL' ? 'var(--color-critical)' : '#334b6e'}
                  strokeWidth={zones[0].riskLevel === 'CRITICAL' ? '2.5' : '1.5'}
                />
                <rect x="390" y="145" width="230" height="30" fill="rgba(15, 23, 42, 0.85)" rx="4" />
                <text x="400" y="164" fill="var(--text-bright)" fontSize="11" fontWeight="700">
                  PANEL 4B — TAILGATE ROADWAY
                </text>
                <text x="400" y="186" fill="var(--text-muted)" fontSize="9">
                  Dishergarh Seam (-340m) • Active Subsidence Monitoring
                </text>
              </g>
            )}

            {/* Subsidence Risk Hazard Zone Heatmap Overlay */}
            {activeLayerRiskHeatmap && (zones[0].riskLevel === 'CRITICAL' || zones[0].riskLevel === 'HIGH_RISK' || zones[0].riskLevel === 'WARNING') && (
              <g id="hazard-overlay">
                <circle
                  cx="490"
                  cy="205"
                  r={zones[0].riskLevel === 'CRITICAL' ? '95' : '65'}
                  fill="url(#hazardGlowP4B)"
                />
                <circle
                  cx="490"
                  cy="205"
                  r={zones[0].riskLevel === 'CRITICAL' ? '85' : '55'}
                  fill="none"
                  stroke={zones[0].riskLevel === 'CRITICAL' ? '#ef4444' : '#f97316'}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x="490"
                  y="125"
                  textAnchor="middle"
                  fill={zones[0].riskLevel === 'CRITICAL' ? '#ef4444' : '#f97316'}
                  fontSize="10"
                  fontWeight="800"
                  fontFamily="var(--font-mono)"
                >
                  ⚠ SUBSIDENCE RISK ENVELOPE ({riskAssessment.overallRiskScore}%)
                </text>
              </g>
            )}

            {/* Ventilation Direction Vectors */}
            {activeLayerVentilation && (
              <g id="ventilation" opacity="0.65">
                <path d="M 120,305 L 150,305 M 144,300 L 150,305 L 144,310" stroke="#38bdf8" strokeWidth="2" fill="none" />
                <path d="M 300,305 L 330,305 M 324,300 L 330,305 L 324,310" stroke="#38bdf8" strokeWidth="2" fill="none" />
                <path d="M 480,305 L 510,305 M 504,300 L 510,305 L 504,310" stroke="#38bdf8" strokeWidth="2" fill="none" />
                <text x="210" y="325" fill="#38bdf8" fontSize="8" fontFamily="var(--font-mono)">
                  FRESH AIR INTAKE (4.2 m/s)
                </text>

                <path d="M 510,83 L 480,83 M 486,78 L 480,83 L 486,88" stroke="#94a3b8" strokeWidth="2" fill="none" />
                <path d="M 330,83 L 300,83 M 306,78 L 300,83 L 306,88" stroke="#94a3b8" strokeWidth="2" fill="none" />
              </g>
            )}

            {/* Sensor Nodes Markers (ESP32) */}
            {activeLayerSensors && (
              <g id="nodes-markers">
                {nodes.map(node => {
                  const pos = nodePositions[node.id] || { x: 300, y: 200 };
                  const statusColor = getNodeStatusColor(node.id);
                  const isSelected = inspectNodeId === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Inspect sensor node ${node.id} located in ${node.zoneName}`}
                      onClick={() => setInspectNodeId(node.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setInspectNodeId(node.id);
                        }
                      }}
                    >
                      {/* Selection Ring */}
                      {isSelected && (
                        <circle cx="0" cy="0" r="26" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                      )}

                      {/* Pulsing ring if critical/high risk */}
                      {(zones[0].riskLevel === 'CRITICAL' && node.id === 'NODE-01') && (
                        <circle cx="0" cy="0" r="32" fill="none" stroke="var(--color-critical)" strokeWidth="2" opacity="0.7" />
                      )}

                      {/* Node Base Badge */}
                      <circle cx="0" cy="0" r="18" fill="#0f172a" stroke={statusColor} strokeWidth="2.5" />
                      <circle cx="0" cy="0" r="8" fill={statusColor} />

                      {/* Node Label Card */}
                      <g transform="translate(24, -14)">
                        <rect x="0" y="0" width="84" height="28" fill="rgba(15, 23, 42, 0.92)" stroke="var(--border-medium)" rx="3" />
                        <text x="6" y="12" fill="var(--text-bright)" fontSize="9" fontWeight="800" fontFamily="var(--font-mono)">
                          {node.id}
                        </text>
                        <text x="6" y="22" fill={statusColor} fontSize="8" fontWeight="700">
                          {node.status} • 6 SENSORS
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>

        {/* Right: Node Telemetry & Zone Inspection Drawer */}
        <div className="control-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="control-panel-header">
            <div className="control-panel-title">
              <Cpu size={16} color="var(--color-telemetry)" aria-hidden="true" />
              <span>Inspecting: {inspectedNode.name}</span>
            </div>
            <StatusBadge status={inspectedNode.status} size="sm" />
          </div>

          <div className="control-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Node Metadata Strip */}
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--bg-app)',
                borderRadius: '5px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Location Zone:</span>
                <strong style={{ color: 'var(--text-bright)' }}>{inspectedNode.zoneName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Edge Gateway Host:</span>
                <span className="font-mono">{inspectedNode.gatewayId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>RF Signal Strength:</span>
                <span className="font-mono">{inspectedNode.signalStrength}&nbsp;dBm (Optimal)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hardware Health:</span>
                <span className="font-mono" style={{ color: 'var(--color-normal)' }}>{inspectedNode.health}%</span>
              </div>
            </div>

            {/* Connected Sensors Telemetry Table */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Connected Sensors ({inspectedNodeSensors.length})
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedNodeId(inspectedNode.id);
                    setActiveTab('sensors');
                  }}
                  aria-label="Manage connected sensors"
                >
                  Manage Sensors
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inspectedNodeSensors.map(sensor => (
                  <div
                    key={sensor.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open telemetry detail for ${sensor.name}, current value ${sensor.currentValue} ${sensor.unit}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: 'var(--bg-app)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedSensorId(sensor.id);
                      setActiveTab('sensors');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSensorId(sensor.id);
                        setActiveTab('sensors');
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {sensor.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {sensor.id} • Rate: <span className="font-mono">{sensor.rateOfChange}&nbsp;{sensor.unit}/hr</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-bright)' }}>
                        {sensor.currentValue}&nbsp;{sensor.unit}
                      </div>
                      <StatusBadge status={sensor.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Zone Incidents */}
            {inspectedNodeAlerts.length > 0 && (
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Active Alerts on this Node
                </span>
                {inspectedNodeAlerts.map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-app)',
                      borderRadius: '4px',
                      borderLeft: '3px solid var(--color-critical)',
                      fontSize: '11px',
                    }}
                  >
                    <strong>{alert.id}:</strong> {alert.parameter} ({alert.currentValue}&nbsp;{alert.unit})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
