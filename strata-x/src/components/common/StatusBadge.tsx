import React from 'react';
import { StatusLevel, SensorStatus, NodeStatus } from '../../types';

interface StatusBadgeProps {
  status: StatusLevel | SensorStatus | NodeStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let cls = 'status-badge status-normal';
  let label = status as string;
  let dotColor = 'var(--color-normal)';

  switch (status) {
    case 'CRITICAL':
      cls = 'status-badge status-critical';
      label = 'CRITICAL';
      dotColor = 'var(--color-critical)';
      break;
    case 'HIGH_RISK':
      cls = 'status-badge status-high-risk';
      label = 'HIGH RISK';
      dotColor = 'var(--color-high-risk)';
      break;
    case 'WARNING':
    case 'DEGRADED':
      cls = 'status-badge status-warning';
      label = status === 'DEGRADED' ? 'DEGRADED' : 'WARNING';
      dotColor = 'var(--color-warning)';
      break;
    case 'OFFLINE':
      cls = 'status-badge status-offline';
      label = 'OFFLINE';
      dotColor = 'var(--color-offline)';
      break;
    default:
      cls = 'status-badge status-normal';
      label = status === 'ONLINE' ? 'ONLINE' : 'NORMAL';
      dotColor = 'var(--color-normal)';
      break;
  }

  const sizeStyle = size === 'sm' ? { fontSize: '10px', padding: '2px 8px' } : undefined;

  return (
    <span className={cls} style={sizeStyle}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
};
