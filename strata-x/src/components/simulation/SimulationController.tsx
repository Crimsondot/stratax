import React from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Play,
  RotateCcw,
  FastForward,
  AlertTriangle,
  Flame,
  CheckCircle,
  X,
  Radio,
  Brain,
  Layers,
} from 'lucide-react';
import { SimulationStage } from '../../types';

interface SimulationControllerProps {
  onClose?: () => void;
}

export const SimulationController: React.FC<SimulationControllerProps> = ({ onClose }) => {
  const {
    simulationState,
    advanceSimulationStage,
    resetSimulation,
    startSafetySimulation,
    riskAssessment,
    setActiveTab,
    acknowledgeAlert,
    alerts,
  } = useApp();

  const stages: { stage: SimulationStage; label: string; desc: string }[] = [
    { stage: 'NORMAL', label: '1. Baseline Normal', desc: 'Displacement 6.4mm • Velocity 0.12 mm/hr • Risk 28%' },
    { stage: 'WARNING', label: '2. Incipient Movement', desc: 'Displacement 13.5mm • Rate 1.42 mm/hr • Warning Alert' },
    { stage: 'HIGH_RISK', label: '3. Acceleration Phase', desc: 'Displacement 21.8mm • Vibration 9.4 mm/s • High Risk' },
    { stage: 'CRITICAL', label: '4. Critical Subsidence', desc: 'Displacement 29.6mm • Velocity 5.2 mm/hr • Immediate Warning' },
  ];

  const activeSimAlert = alerts.find(a => a.id.startsWith('ALT-SIM') && a.status === 'ACTIVE');

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-medium)',
        borderRadius: '8px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
        zIndex: 900,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: simulationState.isActive ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-panel-header)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle
            size={16}
            color={simulationState.isActive ? 'var(--color-critical)' : 'var(--color-telemetry)'}
          />
          <strong style={{ fontSize: '13px', color: 'var(--text-bright)' }}>
            Safety Event Drill Orchestrator
          </strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusBadge status={simulationState.stage} size="sm" />
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Demonstrate the complete <strong>Sense ➔ Analyze ➔ Predict ➔ Warn</strong> pipeline across Panel 4B Tailgate (Node 01).
        </p>

        {/* 4 Stage Step Progression Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {stages.map((s, idx) => {
            const isCurrent = simulationState.stage === s.stage;
            return (
              <div
                key={s.stage}
                onClick={() => advanceSimulationStage(s.stage)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '4px',
                  background: isCurrent ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-app)',
                  border: isCurrent ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? '#38bdf8' : 'var(--text-bright)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {s.desc}
                  </div>
                </div>
                {isCurrent && <StatusBadge status={s.stage} size="sm" />}
              </div>
            );
          })}
        </div>

        {/* Live Active Drill Alert Box */}
        {activeSimAlert && (
          <div
            style={{
              padding: '10px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--border-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-critical)' }}>
                DRILL ALERT: {activeSimAlert.parameter}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                {activeSimAlert.currentValue} {activeSimAlert.unit} (Thresh: {activeSimAlert.threshold})
              </div>
            </div>
            <button
              className="btn btn-sm btn-warning"
              onClick={() => acknowledgeAlert(activeSimAlert.id)}
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', paddingTop: '6px' }}>
          <button className="btn btn-sm" onClick={() => setActiveTab('prediction')}>
            <Brain size={13} />
            <span>View AI Prediction</span>
          </button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {simulationState.isActive ? (
              <button className="btn btn-sm btn-danger" onClick={resetSimulation}>
                <RotateCcw size={13} />
                <span>Reset Drill</span>
              </button>
            ) : (
              <button className="btn btn-sm btn-warning" onClick={startSafetySimulation}>
                <Play size={13} />
                <span>Start Drill</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
