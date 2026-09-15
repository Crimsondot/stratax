import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause } from 'lucide-react';

const HORIZON_LABELS = ['NOW', '+24H', '+48H', '+72H'];
const HORIZON_PERCENTS = [0, 33, 66, 100];

export const TimelineBar: React.FC = () => {
  const { riskAssessment } = useApp();
  const [playing, setPlaying]     = useState(false);
  const [hoverPct, setHoverPct]   = useState<number | null>(null);

  // Determine active index from predictionCurve: find the last observed point
  const curve = riskAssessment.predictionCurve ?? [];
  const lastObservedIdx = curve.reduce((best, pt, i) => (pt.isObserved ? i : best), 0);
  const totalPts = curve.length || 1;
  const basePct = Math.round((lastObservedIdx / (totalPts - 1)) * 100);

  // Which horizon label is active?
  const activePct = hoverPct ?? basePct;
  const activeHorizonIdx = HORIZON_PERCENTS.reduce((best, p, i) =>
    Math.abs(p - activePct) < Math.abs(HORIZON_PERCENTS[best] - activePct) ? i : best, 0);

  // Is the active position in the future (prediction) or present (observed)?
  const isLive = activeHorizonIdx === 0 || activePct <= basePct;

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setHoverPct(Math.round(pct));
  };

  return (
    <div className="cc-timeline" role="region" aria-label="Prediction Timeline Control">
      {/* Play/Pause */}
      <button
        className="timeline-play-btn"
        onClick={() => setPlaying(p => !p)}
        aria-label={playing ? 'Pause timeline' : 'Play timeline'}
        title={playing ? 'Pause' : 'Play prediction timeline'}
      >
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </button>

      {/* Data mode label */}
      <div className="timeline-label" style={{ color: isLive ? 'var(--color-normal)' : 'var(--color-purple)' }}>
        {isLive ? '● LIVE DATA' : '◆ PREDICTION'}
      </div>

      {/* Track */}
      <div className="timeline-track-wrapper">
        <div
          className="timeline-track"
          onClick={handleTrackClick}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            setHoverPct(Math.round(pct));
          }}
          onMouseLeave={() => setHoverPct(null)}
          aria-label="Prediction timeline track"
          role="slider"
          aria-valuenow={activePct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Background fill */}
          <div className="timeline-fill" style={{ width: `${basePct}%` }} />

          {/* Prediction (future) fill */}
          {activePct > basePct && (
            <div style={{
              position: 'absolute',
              left: `${basePct}%`,
              width: `${activePct - basePct}%`,
              height: '100%',
              background: 'rgba(167,139,250,0.5)',
              borderRadius: '0 2px 2px 0',
            }} />
          )}

          {/* Vertical dashed split line at "NOW" */}
          <div style={{
            position: 'absolute',
            left: `${basePct}%`,
            top: -4,
            bottom: -4,
            width: 1,
            background: 'rgba(56,200,248,0.6)',
          }} />

          {/* Position marker */}
          <div
            className="timeline-marker"
            style={{ left: `${activePct}%` }}
          />

          {/* Horizon labels */}
          <div style={{ position: 'absolute', top: 12, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
            {HORIZON_LABELS.map((lbl, i) => (
              <span
                key={lbl}
                style={{
                  fontSize: 8.5,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: activeHorizonIdx === i ? 800 : 500,
                  color: activeHorizonIdx === i
                    ? (i === 0 ? 'var(--color-telemetry)' : 'var(--color-purple)')
                    : 'var(--text-muted)',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease',
                }}
              >
                {lbl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Active point info */}
      {curve.length > 0 && (() => {
        const ptIdx = Math.round((activePct / 100) * (curve.length - 1));
        const pt = curve[Math.min(ptIdx, curve.length - 1)];
        const val = pt?.isObserved ? pt.observedValue : pt?.predictedValue;
        return pt ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            minWidth: 68,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', color: isLive ? 'var(--color-telemetry)' : 'var(--color-purple)' }}>
              {val !== undefined ? `${val.toFixed(1)} mm` : '—'}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {pt.timeLabel}
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
};
