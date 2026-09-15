import React, { useEffect, useRef, useState } from 'react';

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
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [data]);

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
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: pathLength || 1000,
          strokeDashoffset: pathLength || 1000,
          animation: pathLength ? 'sparkline-draw 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
        }}
      />
      {/* Latest point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r={2.5}
          fill={color}
          style={{
            opacity: 0,
            animation: pathLength ? 'value-pop 0.3s ease 1s forwards' : 'none',
          }}
        />
      )}
    </svg>
  );
};
