import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ZoomIn,
  ZoomOut,
  Compass,
  Sliders,
} from 'lucide-react';

// Custom sensor nodes distributed across the Jharia open-cast pit panel
export interface MapNode {
  id: string;
  name: string;
  sector: string;
  x: number; // percentage 0-100 or svg coordinate
  y: number;
  rate: number; // mm/yr deformation rate
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  parameters: string;
  depth: number;
}

const DEFAULT_MAP_NODES: MapNode[] = [
  // Center high-subsidence zone (Sector B / Center Pit)
  { id: 'A47', name: 'Node A47', sector: 'Sector B', x: 485, y: 195, rate: 8.8, status: 'CRITICAL', parameters: 'Vibration, Tilt', depth: 42 },
  { id: 'A48', name: 'Node A48', sector: 'Sector B', x: 515, y: 215, rate: 7.4, status: 'CRITICAL', parameters: 'Vibration, Strain', depth: 38 },
  { id: 'B03', name: 'Node B03', sector: 'Sector C', x: 430, y: 235, rate: 3.8, status: 'WARNING',  parameters: 'Vibration, Tilt', depth: 35 },
  { id: 'B04', name: 'Node B04', sector: 'Sector B', x: 540, y: 180, rate: 3.5, status: 'WARNING',  parameters: 'Displacement', depth: 40 },
  
  // Outer mid benches (Sectors A, C, D)
  { id: 'A12', name: 'Node A12', sector: 'Sector A', x: 380, y: 160, rate: 0.4, status: 'ONLINE',   parameters: 'Vibration, Tilt', depth: 25 },
  { id: 'A15', name: 'Node A15', sector: 'Sector A', x: 430, y: 135, rate: 0.3, status: 'ONLINE',   parameters: 'InSAR Target', depth: 20 },
  { id: 'A18', name: 'Node A18', sector: 'Sector A', x: 500, y: 120, rate: 0.4, status: 'ONLINE',   parameters: 'Borehole Tilt', depth: 22 },
  { id: 'C12', name: 'Node C12', sector: 'Sector C', x: 370, y: 250, rate: 0.7, status: 'ONLINE',   parameters: 'Gas, Vibration', depth: 30 },
  { id: 'C14', name: 'Node C14', sector: 'Sector C', x: 460, y: 280, rate: 1.1, status: 'ONLINE',   parameters: 'Pore Pressure', depth: 32 },
  { id: 'D08', name: 'Node D08', sector: 'Sector D', x: 575, y: 230, rate: 1.4, status: 'ONLINE',   parameters: 'Tilt, Strain', depth: 36 },
  { id: 'D21', name: 'Node D21', sector: 'Sector D', x: 620, y: 190, rate: 0.6, status: 'ONLINE',   parameters: 'Vibration', depth: 28 },
  
  // Perimeter boundaries (Sector E & Outer rim)
  { id: 'E05', name: 'Node E05', sector: 'Sector E', x: 320, y: 200, rate: 0.0, status: 'OFFLINE',  parameters: 'Gas, Vibration', depth: 15 },
  { id: 'E18', name: 'Node E18', sector: 'Sector E', x: 390, y: 310, rate: 0.2, status: 'ONLINE',   parameters: 'Tilt', depth: 18 },
  { id: 'E22', name: 'Node E22', sector: 'Sector E', x: 530, y: 320, rate: 0.5, status: 'ONLINE',   parameters: 'Acoustic', depth: 20 },
  { id: 'F02', name: 'Node F02', sector: 'North Rim', x: 580, y: 130, rate: 0.3, status: 'ONLINE',  parameters: 'GPS Monument', depth: 10 },
  { id: 'F09', name: 'Node F09', sector: 'East Rim',  x: 640, y: 260, rate: 0.4, status: 'ONLINE',  parameters: 'Extensometer', depth: 14 },
];

// Triangulation wireframe grid mesh pairs
const GRID_CONNECTIONS: [string, string][] = [
  ['A12', 'A15'], ['A15', 'A18'], ['A18', 'F02'],
  ['A12', 'B03'], ['A15', 'A47'], ['A18', 'B04'], ['F02', 'D21'],
  ['E05', 'A12'], ['E05', 'C12'], ['B03', 'A47'], ['A47', 'A48'], ['A48', 'B04'], ['B04', 'D08'], ['D08', 'D21'],
  ['C12', 'E18'], ['C12', 'B03'], ['B03', 'C14'], ['A48', 'C14'], ['A48', 'D08'], ['D08', 'F09'],
  ['E18', 'C14'], ['C14', 'E22'], ['E22', 'D08'], ['E22', 'F09'],
];

const STATUS_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  ONLINE: '#10b981',
  OFFLINE: '#64748b',
};

interface MapCanvasProps {
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onNodeSelect, selectedNodeId: externalSelectedId }) => {
  const { setSelectedNodeId, selectedNodeId: contextSelectedId, setActiveTab } = useApp();
  const selectedNodeId = externalSelectedId ?? contextSelectedId;

  // View mode
  const [view3D, setView3D] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);

  // Layer Controls (3D and 2D)
  const [layerSatellite, setLayerSatellite]     = useState(true);
  const [layer3DTerrain, setLayer3DTerrain]     = useState(true);
  const [layerHeatmap, setLayerHeatmap]         = useState(true);
  const [layerSensors, setLayerSensors]         = useState(true);
  const [layerBoundaries, setLayerBoundaries]   = useState(true);
  const [layerRiskZones, setLayerRiskZones]     = useState(true);
  const [heatmapOpacity, setHeatmapOpacity]     = useState(70);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');

  // Custom node positions
  const [nodesList] = useState<MapNode[]>(DEFAULT_MAP_NODES);

  const activeNode = nodesList.find(n => n.id === selectedNodeId) || hoveredNode;

  const handleNodeClick = (node: MapNode) => {
    setSelectedNodeId(node.id);
    onNodeSelect?.(node.id);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#070f1e',
      userSelect: 'none',
    }}>
      {/* ══════════════════════════════════════════
          TOP BANNER OVER MAP (Jharia Coalfield Area D)
          ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 14,
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-map-overlay)',
        backdropFilter: 'blur(10px)',
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
          }}>
            {view3D ? '3D TERRAIN VIEW — JHARIA COALFIELD' : "JHARIA COALFIELD — AREA 'D' PANEL"}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            SURFACE SUBSIDENCE RADAR &amp; SENSOR ARRAY · 23.753° N, 86.417° E
          </div>
        </div>

        {/* 2D / 3D Toggle Pill */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-chip)',
          borderRadius: 6,
          padding: 2,
          border: '1px solid var(--border-subtle)',
          marginLeft: 8,
        }}>
          <button
            onClick={() => setView3D(false)}
            style={{
              padding: '4px 10px',
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: !view3D ? 'var(--color-primary)' : 'transparent',
              color: !view3D ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            2D
          </button>
          <button
            onClick={() => setView3D(true)}
            style={{
              padding: '4px 10px',
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: view3D ? 'var(--color-primary)' : 'transparent',
              color: view3D ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
          >
            3D
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          TOP RIGHT CONTROLS
          ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 14,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <button
          onClick={() => setZoom(1)}
          title="Reset View"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--bg-map-overlay)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Compass size={15} style={{ color: 'var(--color-primary)' }} />
        </button>

        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
          title="Zoom In"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--bg-map-overlay)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomIn size={15} />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.7))}
          title="Zoom Out"
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'var(--bg-map-overlay)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZoomOut size={15} />
        </button>
      </div>

      {/* ══════════════════════════════════════════
          MIDDLE SATELLITE CANVAS CONTAINER
          ══════════════════════════════════════════ */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transform: `scale(${zoom})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Real Satellite Background Layer */}
        {layerSatellite && (
          <img
            src={view3D ? '/satellite-3d.jpg' : '/satellite-map.jpg'}
            alt="Google Earth Satellite Orthoimagery of Jharia Open-pit Coalfield"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              inset: 0,
              filter: view3D ? 'brightness(0.95) contrast(1.05)' : 'brightness(0.9) contrast(1.1)',
            }}
          />
        )}

        {/* 2D / 3D SVG Overlay (Coordinates: 800 x 480) */}
        <svg
          viewBox="0 0 800 480"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'auto',
          }}
        >
          <defs>
            {/* Multi-contour subsidence deformation radial gradients */}
            <radialGradient id="subsidenceHeatmapCore" cx="490" cy="205" r="220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={(heatmapOpacity / 100) * 0.95} />
              <stop offset="25%" stopColor="#f97316" stopOpacity={(heatmapOpacity / 100) * 0.88} />
              <stop offset="48%" stopColor="#eab308" stopOpacity={(heatmapOpacity / 100) * 0.75} />
              <stop offset="72%" stopColor="#84cc16" stopOpacity={(heatmapOpacity / 100) * 0.55} />
              <stop offset="88%" stopColor="#10b981" stopOpacity={(heatmapOpacity / 100) * 0.35} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            <filter id="glowSubsidence" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* ① Mine Boundary Polygon Layer */}
          {layerBoundaries && (
            <g>
              {/* Outer boundary perimeter */}
              <polygon
                points="240,90 610,65 720,180 680,360 480,410 280,370 200,240"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="6 3"
                opacity="0.85"
                filter="url(#glowSubsidence)"
              />
              {/* Boundary vertex corners */}
              {[
                [240, 90], [610, 65], [720, 180], [680, 360], [480, 410], [280, 370], [200, 240]
              ].map(([bx, by], idx) => (
                <rect
                  key={idx}
                  x={bx - 4}
                  y={by - 4}
                  width="8"
                  height="8"
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}

          {/* ② Subsidence Heatmap Draped Contours */}
          {layerHeatmap && (
            <g filter="url(#glowSubsidence)">
              {/* Radial gradient main body */}
              <ellipse
                cx="490"
                cy="205"
                rx={view3D ? 190 : 160}
                ry={view3D ? 110 : 130}
                transform={view3D ? 'rotate(-8 490 205)' : undefined}
                fill="url(#subsidenceHeatmapCore)"
              />
              {/* High risk core contour lines */}
              <ellipse
                cx="490"
                cy="205"
                rx={view3D ? 90 : 75}
                ry={view3D ? 50 : 60}
                fill="none"
                stroke="#ff4444"
                strokeWidth="1.5"
                opacity={(heatmapOpacity / 100) * 0.9}
              />
              <ellipse
                cx="490"
                cy="205"
                rx={view3D ? 130 : 110}
                ry={view3D ? 75 : 90}
                fill="none"
                stroke="#f97316"
                strokeWidth="1"
                opacity={(heatmapOpacity / 100) * 0.7}
              />
            </g>
          )}

          {/* ③ Triangulation Wireframe Grid Mesh */}
          {layerSensors && (
            <g opacity="0.65">
              {GRID_CONNECTIONS.map(([idA, idB], idx) => {
                const nodeA = nodesList.find(n => n.id === idA);
                const nodeB = nodesList.find(n => n.id === idB);
                if (!nodeA || !nodeB) return null;
                return (
                  <line
                    key={idx}
                    x1={nodeA.x}
                    y1={nodeA.y}
                    x2={nodeB.x}
                    y2={nodeB.y}
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                );
              })}
            </g>
          )}

          {/* ④ Sensor Nodes Overlay */}
          {layerSensors && (
            <g>
              {nodesList.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const statusCol = STATUS_COLORS[node.status] || '#10b981';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* If in 3D mode: render an elevation pin stem */}
                    {view3D && (
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="-16"
                        stroke={statusCol}
                        strokeWidth="1.8"
                        opacity="0.9"
                      />
                    )}

                    {/* Outer pulse wave for critical & warning */}
                    {(node.status === 'CRITICAL' || node.status === 'WARNING') && (
                      <circle
                        cx="0"
                        cy={view3D ? -16 : 0}
                        r="14"
                        fill="none"
                        stroke={statusCol}
                        strokeWidth="1.5"
                        opacity="0.5"
                      >
                        <animate
                          attributeName="r"
                          values="6;16;6"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.8;0.1;0.8"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Selection halo */}
                    {(isSelected || isHovered) && (
                      <circle
                        cx="0"
                        cy={view3D ? -16 : 0}
                        r="12"
                        fill="rgba(38, 101, 253, 0.3)"
                        stroke="#2665fd"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Node marker ring */}
                    <circle
                      cx="0"
                      cy={view3D ? -16 : 0}
                      r="6.5"
                      fill="#ffffff"
                      stroke={statusCol}
                      strokeWidth="2.5"
                    />

                    {/* Inner core dot */}
                    <circle
                      cx="0"
                      cy={view3D ? -16 : 0}
                      r="2.5"
                      fill={statusCol}
                    />

                    {/* Node ID label tag */}
                    <text
                      x="9"
                      y={view3D ? -12 : 3}
                      fill="#ffffff"
                      fontSize="9.5"
                      fontFamily="'JetBrains Mono', monospace"
                      fontWeight="700"
                      style={{
                        paintOrder: 'stroke',
                        stroke: '#000000',
                        strokeWidth: '2.5px',
                        strokeLinejoin: 'round',
                      }}
                    >
                      {node.id}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          FLOATING TOOLTIP FOR SELECTED/HOVERED NODE
          ══════════════════════════════════════════ */}
      {activeNode && (
        <div style={{
          position: 'absolute',
          top: 70,
          left: 14,
          zIndex: 30,
          background: 'var(--bg-map-overlay)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 8,
          padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          minWidth: 210,
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>
              {activeNode.id}
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: activeNode.status === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : activeNode.status === 'WARNING' ? 'rgba(245,166,35,0.2)' : 'rgba(16,185,129,0.2)',
              color: STATUS_COLORS[activeNode.status],
              fontFamily: 'var(--font-mono)',
            }}>
              {activeNode.status}
            </span>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {activeNode.sector} · Bench #{Math.round(activeNode.depth / 10)} · {activeNode.parameters}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>DEFORMATION</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: STATUS_COLORS[activeNode.status], fontFamily: 'var(--font-mono)' }}>
                {activeNode.rate} <span style={{ fontSize: 8.5 }}>mm/yr</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)' }}>DEPTH</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>
                -{activeNode.depth}m
              </div>
            </div>
          </div>

          {/* Direct Navigation Buttons to Nodes and Sensors Pages */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => {
                setSelectedNodeId(activeNode.id);
                setActiveTab('nodes');
              }}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: 9.5,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-chip)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              title="View this node in Nodes section"
            >
              Node Details ➔
            </button>
            <button
              onClick={() => {
                setSelectedNodeId(activeNode.id);
                setActiveTab('sensors');
              }}
              style={{
                flex: 1,
                padding: '4px 6px',
                fontSize: 9.5,
                fontWeight: 700,
                borderRadius: 4,
                border: '1px solid var(--border-medium)',
                background: 'var(--color-primary)',
                color: '#fff',
                cursor: 'pointer',
              }}
              title="View live sensor telemetry"
            >
              Telemetry ➔
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          BOTTOM LEFT: DEFORMATION RATE LEGEND & SCALE BAR
          (Matches exact layout in reference image)
          ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Deformation Rate Legend Card */}
        <div style={{
          background: 'var(--bg-map-overlay)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            DEFORMATION RATE (mm/yr)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 10, borderRadius: 2, background: '#10b981' }} />
              <span style={{ color: 'var(--text-secondary)' }}>&lt; 0.5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 10, borderRadius: 2, background: '#eab308' }} />
              <span style={{ color: 'var(--text-secondary)' }}>0.5 – 2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 10, borderRadius: 2, background: '#f97316' }} />
              <span style={{ color: 'var(--text-secondary)' }}>2 – 5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 10, borderRadius: 2, background: '#ef4444' }} />
              <span style={{ color: 'var(--text-secondary)' }}>5 – 10</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 12, height: 10, borderRadius: 2, background: '#991b1b' }} />
              <span style={{ color: 'var(--text-secondary)' }}>&gt; 10</span>
            </div>
          </div>
        </div>

        {/* Scale Bar */}
        <div style={{
          background: 'var(--bg-map-overlay)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4,
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          width: 'fit-content',
        }}>
          <span>0</span>
          <div style={{ width: 50, height: 3, background: 'var(--text-muted)', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 7, background: 'var(--text-muted)' }} />
          </div>
          <span>500</span>
          <div style={{ width: 50, height: 3, background: 'var(--text-muted)' }} />
          <span>1,000 m</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          3D VIEW RIGHT DRAWER: LAYER CONTROLS & ELEVATION PROFILE
          (Matches top-right screen in reference)
          ══════════════════════════════════════════ */}
      {view3D && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 54,
          width: 230,
          maxHeight: 'calc(100% - 20px)',
          overflowY: 'auto',
          zIndex: 25,
          background: 'var(--bg-map-overlay)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-medium)',
          borderRadius: 8,
          padding: '12px 14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Layer Controls Section */}
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.6,
              color: 'var(--text-bright)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>LAYER CONTROLS</span>
              <Sliders size={12} style={{ color: 'var(--color-primary)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10.5 }}>
              {[
                { label: 'Satellite Imagery', checked: layerSatellite, set: setLayerSatellite },
                { label: '3D Terrain Model', checked: layer3DTerrain, set: setLayer3DTerrain },
                { label: 'Subsidence Heatmap', checked: layerHeatmap, set: setLayerHeatmap },
                { label: 'Sensor Nodes', checked: layerSensors, set: setLayerSensors },
                { label: 'Mine Boundaries', checked: layerBoundaries, set: setLayerBoundaries },
                { label: 'Risk Zones', checked: layerRiskZones, set: setLayerRiskZones },
              ].map(layer => (
                <label
                  key={layer.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>{layer.label}</span>
                  <input
                    type="checkbox"
                    checked={layer.checked}
                    onChange={e => layer.set(e.target.checked)}
                    style={{ accentColor: '#2665fd', cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>

            {/* Transparency Slider */}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Transparency</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{heatmapOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={heatmapOpacity}
                onChange={e => setHeatmapOpacity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2665fd', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Select Time Range Buttons */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              SELECT TIME RANGE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {(['7D', '30D', '90D', '1Y'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  style={{
                    padding: '4px 0',
                    fontSize: 9.5,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 4,
                    background: selectedTimeRange === range ? 'var(--color-primary)' : 'var(--bg-chip)',
                    color: selectedTimeRange === range ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Elevation Profile Chart */}
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              ELEVATION PROFILE
            </div>
            <div style={{
              background: 'var(--bg-chip)',
              borderRadius: 6,
              padding: '6px 8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <svg viewBox="0 0 180 60" style={{ width: '100%', height: 48 }}>
                {/* Grid lines */}
                <line x1="20" y1="10" x2="175" y2="10" stroke="var(--border-subtle)" strokeWidth="0.8" />
                <line x1="20" y1="30" x2="175" y2="30" stroke="var(--border-subtle)" strokeWidth="0.8" />
                <line x1="20" y1="50" x2="175" y2="50" stroke="var(--border-subtle)" strokeWidth="0.8" />
                
                {/* Elevation labels */}
                <text x="5" y="13" fontSize="7" fill="var(--text-muted)" fontFamily="monospace">300</text>
                <text x="5" y="33" fontSize="7" fill="var(--text-muted)" fontFamily="monospace">260</text>
                <text x="5" y="53" fontSize="7" fill="var(--text-muted)" fontFamily="monospace">200</text>

                {/* Profile line with pit dip */}
                <path
                  d="M 25 24 Q 55 12 75 22 T 115 48 T 145 32 T 175 40"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                {/* Area fill */}
                <path
                  d="M 25 24 Q 55 12 75 22 T 115 48 T 145 32 T 175 40 L 175 55 L 25 55 Z"
                  fill="rgba(56, 189, 248, 0.15)"
                />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7.5, color: 'var(--text-muted)', fontFamily: 'monospace', padding: '0 4px' }}>
                <span>0</span>
                <span>500</span>
                <span>1,000</span>
                <span>1,500 m</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
