import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showFill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'var(--color-telemetry)',
  width = 120,
  height = 32,
  showFill = true,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height, background: 'rgba(255,255,255,0.02)' }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      {showFill && (
        <path
          d={fillD}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={2.5}
          fill={color}
        />
      )}
    </svg>
  );
};
