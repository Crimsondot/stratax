import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { OllamaService } from '../../services/ollamaService';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const PredictionPage: React.FC = () => {
  const { riskAssessment, simulationState, startSafetySimulation, resetSimulation, triggerOllamaAssessment, ollamaState } = useApp();
  const [isRunning, setIsRunning] = useState(false);

  const runOllama = async () => {
    setIsRunning(true);
    await triggerOllamaAssessment();
    setIsRunning(false);
  };

  // SVG Chart Dimensions for Observed vs Predicted Curve
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const points = riskAssessment.predictionCurve;

  // Extract all values to determine scale
  const allValues: number[] = [];
  points.forEach(p => {
    if (p.observedValue !== undefined) allValues.push(p.observedValue);
    if (p.predictedValue !== undefined) allValues.push(p.predictedValue);
    if (p.upperConfidence !== undefined) allValues.push(p.upperConfidence);
    if (p.lowerConfidence !== undefined) allValues.push(p.lowerConfidence);
  });

  const minVal = Math.max(0, Math.floor(Math.min(...allValues) - 2));
  const maxVal = Math.ceil(Math.max(...allValues) + 5);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // Observed points (past)
  const observedPts = points.filter(p => p.isObserved);
  // Predicted points (future, starting with the last observed point for continuity)
  const predictedPts = points.filter(p => !p.isObserved);
  const lastObserved = observedPts[observedPts.length - 1];

  // Map point to coordinates
  const getX = (idx: number) => padding.left + (idx / (points.length - 1)) * plotWidth;
  const getY = (val: number) => padding.top + plotHeight - ((val - minVal) / range) * plotHeight;

  // Build observed path
  const observedPathPoints = observedPts.map((p, i) => `${getX(i)},${getY(p.observedValue || 0)}`);
  const observedPathD = `M ${observedPathPoints.join(' L ')}`;

  // Build predicted path (starts at last observed point)
  const predictedPathPoints = [
    `${getX(observedPts.length - 1)},${getY(lastObserved?.observedValue || 0)}`,
    ...predictedPts.map((p, i) => `${getX(observedPts.length + i)},${getY(p.predictedValue || 0)}`),
  ];
  const predictedPathD = `M ${predictedPathPoints.join(' L ')}`;

  // Build Confidence Area Polygon
  const upperConfidencePoints = [
    `${getX(observedPts.length - 1)},${getY(lastObserved?.observedValue || 0)}`,
    ...predictedPts.map((p, i) => `${getX(observedPts.length + i)},${getY(p.upperConfidence || 0)}`),
  ];
  const lowerConfidencePoints = [
    ...predictedPts.map((p, i) => `${getX(observedPts.length + i)},${getY(p.lowerConfidence || 0)}`).reverse(),
    `${getX(observedPts.length - 1)},${getY(lastObserved?.observedValue || 0)}`,
  ];
  const confidencePolygonD = `M ${upperConfidencePoints.join(' L ')} L ${lowerConfidencePoints.join(' L ')} Z`;

  const transitionX = getX(observedPts.length - 1);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>
            <Brain size={22} color="var(--color-purple)" />
            <span>AI Subsidence Prediction & Explainability Engine</span>
          </h1>
          <p>
            Ollama gemma3:4b • Local Edge Inference • 24-Hour Predictive Strata Horizon
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={runOllama}
            disabled={isRunning || ollamaState.isAssessing}
            title="Run Ollama gemma3:4b assessment"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(38,101,253,0.15)',
              border: '1px solid rgba(38,101,253,0.3)',
              borderRadius: 6,
              padding: '6px 14px',
              color: 'var(--color-primary)',
              fontSize: 11,
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.5 : 1,
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => { if (!isRunning) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(38,101,253,0.3)'}
          >
            <Zap size={12} />
            {isRunning ? 'Running...' : 'Run Ollama gemma3:4b'}
          </button>
          <span className="demo-tag">OLLAMA GEMMA3:4B</span>
          <span className="demo-tag">LOCAL EDGE INFERENCE</span>
        </div>
      </div>

      {/* Model Transparency Disclaimer Banner */}
      <div
        style={{
          background: 'rgba(14, 165, 233, 0.08)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '6px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}
      >
        <Info size={20} color="var(--color-telemetry)" style={{ flexShrink: 0 }} />
        <div>
          <strong>Ollama gemma3:4b Transparency Notice:</strong> Inference scores, confidence bands, and driver weights are generated by the Ollama gemma3:4b model running locally on the backend server. Values continuously calibrate against physical borehole ground truth from live ESP32 telemetry.
        </div>
      </div>

      {/* 4 Core AI Metrics Cards */}
      <div className="grid-4">
        {/* Risk Score */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Current AI Risk Score
            </span>
            <StatusBadge status={riskAssessment.riskLevel} size="sm" />
          </div>
          <div
            className="font-mono"
            style={{
              fontSize: '32px',
              fontWeight: 900,
              color:
                riskAssessment.overallRiskScore >= 80
                  ? 'var(--color-critical)'
                  : riskAssessment.overallRiskScore >= 60
                  ? 'var(--color-high-risk)'
                  : riskAssessment.overallRiskScore >= 40
                  ? 'var(--color-warning)'
                  : 'var(--color-normal)',
              marginTop: '4px',
            }}
          >
            {riskAssessment.overallRiskScore}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Multi-factor composite risk
          </div>
        </div>

        {/* Prediction Horizon */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Prediction Horizon
            </span>
            <Clock size={16} color="var(--color-telemetry)" />
          </div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)', marginTop: '8px' }}>
            Next 24 Hours
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Continuous rolling window
          </div>
        </div>

        {/* Model Confidence */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Model Confidence
            </span>
            <ShieldCheck size={16} color="var(--color-normal)" />
          </div>
          <div className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-normal)', marginTop: '8px' }}>
            {riskAssessment.modelConfidence}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Based on sensor SNR & mesh uptime
          </div>
        </div>

        {/* Trend State */}
        <div className="control-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Ground Condition Outlook
            </span>
            <TrendingUp size={16} color="var(--color-telemetry)" />
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color:
                riskAssessment.stateOfTrend === 'CRITICAL_RISK'
                  ? 'var(--color-critical)'
                  : riskAssessment.stateOfTrend === 'DETERIORATING'
                  ? 'var(--color-high-risk)'
                  : 'var(--color-normal)',
              marginTop: '10px',
            }}
          >
            {riskAssessment.stateOfTrend.replace('_', ' ')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {riskAssessment.stateOfTrend === 'STABLE' ? 'Equilibrium maintained' : 'Active deformation phase'}
          </div>
        </div>
      </div>

      {/* Main Prediction Visualizer: Historical Observed vs Future Predicted */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title">
            <TrendingUp size={16} color="var(--color-telemetry)" />
            <span>Observed Roof Displacement & 24h Predicted Trajectory</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: 'var(--color-telemetry)' }} />
              <span>Historical Observed (Past 24h)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', background: 'var(--color-purple)', borderTop: '2px dashed var(--color-purple)' }} />
              <span>AI Predicted Trajectory (Next 24h)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '8px', background: 'rgba(168, 85, 247, 0.2)' }} />
              <span>Confidence Band (±2σ)</span>
            </span>
          </div>
        </div>

        <div className="control-panel-body" style={{ background: 'var(--bg-panel-elevated)', padding: '24px 20px' }}>
          <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
              {/* Y Axis Grid Lines and Labels */}
              {[minVal, Math.round((minVal + maxVal) / 2), maxVal].map((yVal, idx) => {
                const yPos = getY(yVal);
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={chartWidth - padding.right}
                      y2={yPos}
                      stroke="var(--border-subtle)"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={yPos + 4}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {yVal} mm
                    </text>
                  </g>
                );
              })}

              {/* Critical Threshold Line */}
              <line
                x1={padding.left}
                y1={getY(28)}
                x2={chartWidth - padding.right}
                y2={getY(28)}
                stroke="var(--color-critical)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <text
                x={chartWidth - padding.right}
                y={getY(28) - 4}
                textAnchor="end"
                fill="var(--color-critical)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                CRITICAL THRESHOLD (28 mm)
              </text>

              {/* Warning Threshold Line */}
              <line
                x1={padding.left}
                y1={getY(12)}
                x2={chartWidth - padding.right}
                y2={getY(12)}
                stroke="var(--color-warning)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <text
                x={chartWidth - padding.right}
                y={getY(12) - 4}
                textAnchor="end"
                fill="var(--color-warning)"
                fontSize="9"
                fontFamily="var(--font-mono)"
              >
                WARNING THRESHOLD (12 mm)
              </text>

              {/* Transition Divider (T-0: Present Moment) */}
              <line
                x1={transitionX}
                y1={padding.top}
                x2={transitionX}
                y2={chartHeight - padding.bottom}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              <rect
                x={transitionX - 35}
                y={padding.top}
                width="70"
                height="18"
                fill="rgba(14, 165, 233, 0.2)"
                stroke="#38bdf8"
                rx="3"
              />
              <text
                x={transitionX}
                y={padding.top + 12}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                T-0 PRESENT
              </text>

              {/* Confidence Band Polygon */}
              <path d={confidencePolygonD} fill="rgba(168, 85, 247, 0.18)" />

              {/* Historical Observed Curve */}
              <path
                d={observedPathD}
                fill="none"
                stroke="var(--color-telemetry)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Future Predicted Curve */}
              <path
                d={predictedPathD}
                fill="none"
                stroke="var(--color-purple)"
                strokeWidth="2.5"
                strokeDasharray="5,4"
                strokeLinecap="round"
              />

              {/* T-0 Marker Dot */}
              <circle
                cx={transitionX}
                cy={getY(lastObserved?.observedValue || 6.4)}
                r="4.5"
                fill="#38bdf8"
                stroke="#090d16"
                strokeWidth="2"
              />

              {/* X Axis Time Labels */}
              {points.filter((_, idx) => idx % 4 === 0).map((pt, idx) => {
                const xPos = padding.left + (points.indexOf(pt) / (points.length - 1)) * plotWidth;
                return (
                  <text
                    key={idx}
                    x={xPos}
                    y={chartHeight - padding.bottom + 18}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                  >
                    {pt.timeLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Explainable AI: Multi-Sensor Factor Attribution (WHY is risk changing?) */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title">
            <Sparkles size={16} color="var(--color-telemetry)" />
            <span>AI Risk Attribution & Explainable Multi-Sensor Factor Analysis</span>
          </div>
          <span className="demo-tag">SHAP / INTEGRATED GRADIENTS ANALOG</span>
        </div>

        <div className="control-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--bg-app)',
              borderRadius: '6px',
              borderLeft: '4px solid var(--color-purple)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          >
            <strong>Edge AI Inference Summary:</strong> {riskAssessment.summaryRationale}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {riskAssessment.primaryFactors.map(factor => (
              <div
                key={factor.id}
                style={{
                  background: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--text-bright)' }}>{factor.label}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{factor.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-bright)' }}>
                      {factor.contributionPercent}% Influence
                    </div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--color-telemetry)' }}>
                      {factor.currentMetric}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', background: 'var(--bg-panel)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${factor.contributionPercent}%`,
                      height: '100%',
                      background:
                        factor.contributionPercent > 40
                          ? 'var(--color-critical)'
                          : factor.contributionPercent > 25
                          ? 'var(--color-high-risk)'
                          : factor.contributionPercent > 15
                          ? 'var(--color-telemetry)'
                          : 'var(--color-purple)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
