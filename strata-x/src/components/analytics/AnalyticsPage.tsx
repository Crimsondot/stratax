import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkline } from '../common/Sparkline';
import {
  LineChart,
  Filter,
  Layers,
  Activity,
  GitCommit,
  Clock,
  Download,
  Share2,
  TrendingUp,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { sensors, nodes, zones } = useApp();

  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [selectedZone, setSelectedZone] = useState('ZONE-P4B');
  const [selectedParameter, setSelectedParameter] = useState<'displacement' | 'vibration' | 'methane'>('displacement');

  // Key correlation series
  const dispSensor = sensors.find(s => s.type === 'displacement' && s.zoneId === selectedZone) || sensors[0];
  const vibSensor = sensors.find(s => s.type === 'vibration' && s.zoneId === selectedZone) || sensors[2];
  const rateSensor = sensors.find(s => s.type === 'displacement_rate' && s.zoneId === selectedZone) || sensors[1];
  const gasSensor = sensors.find(s => s.type === 'methane' && s.zoneId === selectedZone) || sensors[3];

  const dispValues = dispSensor.history.map(h => h.value);
  const vibValues = vibSensor.history.map(h => h.value);
  const gasValues = gasSensor.history.map(h => h.value);

  // SVG Chart Dimensions for Dual-Axis Multi-Parameter Correlation
  const chartW = 740;
  const chartH = 260;
  const pad = { top: 25, right: 60, bottom: 40, left: 60 };

  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  // Primary Series: Displacement (Left Axis: 0 to 35 mm)
  const maxDisp = Math.max(30, Math.ceil(Math.max(...dispValues) + 4));
  const getYDisp = (v: number) => pad.top + plotH - (v / maxDisp) * plotH;

  // Secondary Series: Vibration (Right Axis: 0 to 18 mm/s)
  const maxVib = Math.max(16, Math.ceil(Math.max(...vibValues) + 2));
  const getYVib = (v: number) => pad.top + plotH - (v / maxVib) * plotH;

  const dispPoints = dispValues.map((v, i) => `${pad.left + (i / (dispValues.length - 1)) * plotW},${getYDisp(v)}`);
  const vibPoints = vibValues.map((v, i) => `${pad.left + (i / (vibValues.length - 1)) * plotW},${getYVib(v)}`);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <LineChart size={22} color="var(--color-telemetry)" />
            <span>Multi-Sensor Strata Telemetry Analytics</span>
          </h1>
          <p>
            Cross-Parameter Correlation • Borehole Displacement ↔ Triaxial Micro-seismicity ↔ Gas Desorption Dynamics
          </p>
        </div>

        <div className="header-actions">
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-panel)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            {(['1h', '6h', '24h', '7d', '30d'] as const).map(t => (
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
      </div>

      {/* Filter Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Monitoring Zone:
            </span>
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: '4px',
              }}
            >
              <option value="ZONE-P4B">Panel 4B Tailgate Roadway</option>
              <option value="ZONE-P4A">Panel 4A Main Gate Conveyor</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Primary Telemetry:
            </span>
            <select
              value={selectedParameter}
              onChange={e => setSelectedParameter(e.target.value as any)}
              style={{
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: '4px',
              }}
            >
              <option value="displacement">Roof Displacement (mm)</option>
              <option value="vibration">Vibration Velocity (mm/s)</option>
              <option value="methane">Methane Concentration (% Vol)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Sample Resolution: <strong className="font-mono">1 sec rolling avg</strong>
        </div>
      </div>

      {/* Main Chart: Multi-Parameter Correlation (Displacement vs Vibration) */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title">
            <Activity size={16} color="var(--color-telemetry)" />
            <span>Dual-Axis Strata Correlation: Roof Displacement (Left) ↔ Micro-seismic Vibration (Right)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--color-telemetry)' }} />
              <span>Extensometer Displacement (mm)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--color-purple)' }} />
              <span>Triaxial Geophone Velocity (mm/s)</span>
            </span>
          </div>
        </div>

        <div className="control-panel-body" style={{ background: 'var(--bg-panel-elevated)', padding: '24px 20px' }}>
          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <svg width={chartW} height={chartH} style={{ overflow: 'visible' }}>
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const yPos = pad.top + frac * plotH;
                const leftVal = Math.round((1 - frac) * maxDisp);
                const rightVal = Number(((1 - frac) * maxVib).toFixed(1));

                return (
                  <g key={idx}>
                    <line
                      x1={pad.left}
                      y1={yPos}
                      x2={chartW - pad.right}
                      y2={yPos}
                      stroke="var(--border-subtle)"
                      strokeWidth="1"
                    />
                    {/* Left Axis Label (Displacement) */}
                    <text
                      x={pad.left - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fill="var(--color-telemetry)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {leftVal} mm
                    </text>
                    {/* Right Axis Label (Vibration) */}
                    <text
                      x={chartW - pad.right + 8}
                      y={yPos + 4}
                      textAnchor="start"
                      fill="var(--color-purple)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {rightVal} mm/s
                    </text>
                  </g>
                );
              })}

              {/* Displacement Path (Cyan) */}
              <path
                d={`M ${dispPoints.join(' L ')}`}
                fill="none"
                stroke="var(--color-telemetry)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Vibration Path (Purple) */}
              <path
                d={`M ${vibPoints.join(' L ')}`}
                fill="none"
                stroke="var(--color-purple)"
                strokeWidth="2"
                strokeDasharray="4,2"
                strokeLinecap="round"
              />

              {/* Data points on Displacement curve */}
              {dispPoints.map((pt, i) => {
                const [cx, cy] = pt.split(',');
                return <circle key={i} cx={cx} cy={cy} r="2.5" fill="var(--color-telemetry)" />;
              })}

              {/* X Axis Time Marks */}
              {dispValues.map((_, i) => {
                if (i % 4 !== 0) return null;
                const xPos = pad.left + (i / (dispValues.length - 1)) * plotW;
                const hoursAgo = (dispValues.length - 1 - i);
                return (
                  <text
                    key={i}
                    x={xPos}
                    y={chartH - pad.bottom + 18}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    T-{hoursAgo}h
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 3 Cross-Sensor Correlation Cards */}
      <div className="grid-3">
        {/* Correlation 1: Displacement ↔ Vibration */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Displacement ↔ Vibration
            </span>
            <GitCommit size={15} color="var(--color-telemetry)" />
          </div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '6px' }}>
            r = 0.84 <span style={{ fontSize: '11px', color: 'var(--color-normal)' }}>(Strong Positive)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Strata bed separation directly triggers high-frequency acoustic emission pulses in rock layers prior to caving.
          </p>
        </div>

        {/* Correlation 2: Displacement Rate ↔ AI Risk */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Displacement Rate ↔ AI Risk
            </span>
            <TrendingUp size={15} color="var(--color-purple)" />
          </div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '6px' }}>
            r = 0.91 <span style={{ fontSize: '11px', color: 'var(--color-high-risk)' }}>(Very Strong)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Velocity of deformation is the single largest leading indicator for sudden roof sag and impending subsidence events.
          </p>
        </div>

        {/* Correlation 3: Gas Concentration ↔ Ground Stress */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Environmental CH4 ↔ Stress
            </span>
            <Activity size={15} color="var(--color-warning)" />
          </div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '6px' }}>
            r = 0.62 <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>(Moderate)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Micro-fissuring in coal seams permits trapped methane gas release into tailgates during active strata relaxation.
          </p>
        </div>
      </div>
    </div>
  );
};
