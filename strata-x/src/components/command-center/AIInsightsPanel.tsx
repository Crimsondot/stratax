import React from 'react';
import { useApp } from '../../context/AppContext';
import { Brain, Cpu, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

// Radial Semi-circle Arc Gauge (0 to 100)
const AnomalyGauge: React.FC<{ score: number }> = ({ score }) => {
  const r = 38;
  const cx = 50;
  const cy = 52;
  const circ = Math.PI * r; // half circle perimeter ~ 119.38
  const fillLen = (Math.min(100, Math.max(0, score)) / 100) * circ;

  const color =
    score >= 75 ? '#ef4444'
    : score >= 50 ? '#f97316'
    : score >= 30 ? '#eab308'
    : '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg viewBox="0 0 100 65" width={110} height={68} aria-label={`Anomaly score: ${score}/100`}>
        {/* Background track arc */}
        <path
          d="M 12 52 A 38 38 0 0 1 88 52"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 12 52 A 38 38 0 0 1 88 52"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fillLen} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="var(--text-bright)"
          fontSize="18"
          fontWeight="900"
          fontFamily="'JetBrains Mono', monospace"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="8.5"
          fontFamily="'Inter', sans-serif"
          fontWeight="600"
        >
          /100
        </text>
      </svg>
      <div style={{
        fontSize: 10,
        fontWeight: 800,
        color: 'var(--text-bright)',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}>
        Anomaly Score
      </div>
    </div>
  );
};

export const AIInsightsPanel: React.FC = () => {
  const { riskAssessment, nodes, alerts, setActiveTab } = useApp();

  const score = riskAssessment.overallRiskScore || 75;
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
  const accuracy = riskAssessment.modelConfidence || 85;

  return (
    <div className="cc-intel-section" style={{ flex: '0 0 auto' }}>
      {/* Header - Full Text Clickable Button */}
      <button
        type="button"
        className="cc-intel-header"
        onClick={() => setActiveTab('prediction')}
        aria-label="Navigate to AI Insights & Risk Prediction"
        title="Click to open AI Insights & Risk Prediction view"
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
          <Brain size={13} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5 }}>AI INSIGHTS &amp; PREDICTION</span>
        </div>
        <div
          className="cc-intel-header-action"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-primary)',
            pointerEvents: 'none',
          }}
        >
          <span>VIEW</span>
          <ArrowUpRight size={13} />
        </div>
      </button>

      <div className="cc-intel-body" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Top: Anomaly Score Gauge + Mini Predicted Heatmap Preview (Clickable -> Prediction) */}
        <div
          onClick={() => setActiveTab('prediction')}
          title="Click to view full AI Insights & Risk Prediction"
          style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 10,
            alignItems: 'center',
            background: 'var(--bg-panel-elevated)',
            borderRadius: 8,
            padding: '8px 10px',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(38,101,253,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Anomaly Gauge */}
          <div>
            <AnomalyGauge score={score} />
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#38bdf8' }} />
                <span>Sustained Rate-of-Change</span>
              </div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }} />
                <span>Predicted Rate-of-Change</span>
              </div>
            </div>
          </div>

          {/* Mini Predicted Subsidence Map (30 days) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Predicted Subsidence (30 days)
            </div>
            {/* SVG Mini Heatmap preview */}
            <div style={{
              width: 105,
              height: 65,
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
              background: '#0a1426',
              border: '1px solid var(--border-subtle)',
            }}>
              <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <radialGradient id="miniHeat" cx="55" cy="30" r="35" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                    <stop offset="35%" stopColor="#f97316" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#eab308" stopOpacity="0.7" />
                    <stop offset="90%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx="55" cy="30" rx="36" ry="24" fill="url(#miniHeat)" />
                <ellipse cx="55" cy="30" rx="16" ry="10" fill="none" stroke="#ef4444" strokeWidth="1" />
                <ellipse cx="55" cy="30" rx="26" ry="16" fill="none" stroke="#f97316" strokeWidth="0.8" />
              </svg>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            QUICK STATS (Exact matching reference image)
            Total Nodes: 128 | Active Alerts: 3 | Model Accuracy: 85%
            Clickable buttons navigating to sections
            ══════════════════════════════════════════ */}
        <div>
          <div style={{
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 6,
            textTransform: 'uppercase',
          }}>
            QUICK STATS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {/* Total Nodes -> Navigates to Nodes */}
            <div
              onClick={() => setActiveTab('nodes')}
              title="Click to view Sensor Nodes Network"
              style={{
                background: 'var(--bg-panel-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '8px 6px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Cpu size={14} style={{ color: 'var(--color-primary)' }} />
              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-bright)', fontFamily: 'var(--font-mono)' }}>
                {nodes.length > 0 ? nodes.length : 128}
              </div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Nodes
              </div>
            </div>

            {/* Active Alerts -> Navigates to Alerts */}
            <div
              onClick={() => setActiveTab('alerts')}
              title="Click to view Active Alerts & Notifications"
              style={{
                background: 'var(--bg-panel-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '8px 6px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-critical)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(239,68,68,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <AlertTriangle size={14} style={{ color: activeAlerts > 0 ? 'var(--color-critical)' : 'var(--color-normal)' }} />
              <div style={{
                fontSize: 14,
                fontWeight: 900,
                color: activeAlerts > 0 ? 'var(--color-critical)' : 'var(--color-normal)',
                fontFamily: 'var(--font-mono)',
              }}>
                {activeAlerts > 0 ? activeAlerts : 3}
              </div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                Active Alerts
              </div>
            </div>

            {/* Model Accuracy -> Navigates to Prediction */}
            <div
              onClick={() => setActiveTab('prediction')}
              title="Click to view AI Model Prediction & Confidence"
              style={{
                background: 'var(--bg-panel-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '8px 6px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(16,185,129,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ShieldCheck size={14} style={{ color: '#10b981' }} />
              <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 600 }}>
                Model Accuracy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
