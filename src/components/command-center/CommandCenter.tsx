/**
 * CommandCenter.tsx — Mission Control Workspace
 *
 * Layout: [Map Area ~70%] [Intelligence Panel ~30%]
 *
 * Map Area:
 *   - MapCanvas (fills remaining height)
 *   - TimelineBar (bottom, 50px)
 *
 * Intelligence Panel (right, stacked):
 *   - AlertFeed (fixed height ~280px)
 *   - AIInsightsPanel (fixed height ~340px)
 *   - NodeTelemetry (flex: 1, remaining)
 *
 * Emergency drill banner overlaid on map when active.
 * No KPI cards. No page-container wrapper.
 * All data from real AppContext — no mock values.
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapCanvas }        from './MapCanvas';
import { AlertFeed }        from './AlertFeed';
import { AIInsightsPanel }  from './AIInsightsPanel';
import { NodeTelemetry }    from './NodeTelemetry';
import { TimelineBar }      from './TimelineBar';
import { AlertOctagon, Play, SkipForward, RotateCcw } from 'lucide-react';

export const CommandCenter: React.FC = () => {
  const {
    simulationState,
    advanceSimulationStage,
    resetSimulation,
    riskAssessment,
    activeAlertsCount,
  } = useApp();

  return (
    <div className="cc-workspace" role="main" aria-label="MineGuard AI Command Center">

      {/* ══════════════════════════════════════════
          LEFT: GIS MAP WORKSPACE
          ══════════════════════════════════════════ */}
      <div className="cc-map-area">

        {/* Emergency drill overlay banner */}
        {simulationState.isActive && (
          <div className="cc-emergency-overlay" role="alert" aria-live="assertive">
            <AlertOctagon
              size={16}
              style={{ color: '#fff', flexShrink: 0, animation: 'pulse-slow 1s infinite' }}
            />
            <span className="cc-emergency-text">
              ⚠ SAFETY DRILL ACTIVE &nbsp;—&nbsp;
              STAGE: {simulationState.stage} &nbsp;·&nbsp;
              ELAPSED: {simulationState.elapsedSeconds}s &nbsp;·&nbsp;
              {riskAssessment.riskLevel} RISK
            </span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                className="btn btn-sm"
                style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
                onClick={() => advanceSimulationStage(
                  simulationState.stage === 'NORMAL'   ? 'WARNING'
                  : simulationState.stage === 'WARNING'   ? 'HIGH_RISK'
                  : 'CRITICAL'
                )}
                aria-label="Advance drill to next stage"
              >
                <SkipForward size={11} /> ADVANCE
              </button>
              <button
                className="btn btn-sm"
                style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
                onClick={resetSimulation}
                aria-label="End safety drill"
              >
                <RotateCcw size={11} /> END DRILL
              </button>
            </div>
          </div>
        )}

        {/* Map canvas fills remaining area */}
        <div className="cc-map-canvas-wrapper">
          <MapCanvas />
        </div>

        {/* Timeline prediction control at the bottom */}
        <TimelineBar />
      </div>

      {/* ══════════════════════════════════════════
          RIGHT: INTELLIGENCE PANEL
          ══════════════════════════════════════════ */}
      <div className="cc-intel-panel" role="complementary" aria-label="Mine Intelligence Panel">

        {/* ① Active Alert Feed */}
        <AlertFeed />

        {/* ② AI Insights & Prediction */}
        <AIInsightsPanel />

        {/* ③ Selected Node Telemetry (flex: 1, takes remaining) */}
        <NodeTelemetry />

      </div>
    </div>
  );
};
