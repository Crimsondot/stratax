import { SensorNode } from '../types';

export class NodeService {
  public static getSignalQuality(dBm: number): { label: string; color: string; bars: number } {
    if (dBm >= -65) return { label: 'Excellent', color: 'var(--color-normal)', bars: 4 };
    if (dBm >= -75) return { label: 'Good', color: 'var(--color-normal)', bars: 3 };
    if (dBm >= -85) return { label: 'Fair', color: 'var(--color-warning)', bars: 2 };
    return { label: 'Weak', color: 'var(--color-critical)', bars: 1 };
  }

  public static getBatteryStatus(volts: number, percent: number): { label: string; color: string } {
    if (percent > 60) return { label: 'Optimal', color: 'var(--color-normal)' };
    if (percent > 25) return { label: 'Normal', color: 'var(--color-warning)' };
    return { label: 'Low', color: 'var(--color-critical)' };
  }

  public static getAverageHealth(nodes: SensorNode[]): number {
    if (nodes.length === 0) return 0;
    const total = nodes.reduce((acc, n) => acc + n.health, 0);
    return Math.round(total / nodes.length);
  }
}
