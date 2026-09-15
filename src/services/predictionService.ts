import { Sensor, SensorNode, Alert, RiskAssessment, MineZone, StatusLevel, PredictionDataPoint } from '../types';

export class PredictionService {
  /**
   * Evaluates multi-sensor correlation and computes an explainable AI risk assessment.
   * Separated from UI components as per architecture guidelines.
   */
  public static calculateRisk(sensors: Sensor[], zones: MineZone[]): RiskAssessment {
    // Find target / most active sensors
    const dispSensor = sensors.find(s => s.type === 'displacement' && s.zoneId === 'ZONE-P4B') || sensors[0];
    const rateSensor = sensors.find(s => s.type === 'displacement_rate' && s.zoneId === 'ZONE-P4B') || sensors[1];
    const vibSensor = sensors.find(s => s.type === 'vibration' && s.zoneId === 'ZONE-P4B') || sensors[2];
    const ch4Sensor = sensors.find(s => s.type === 'methane' && s.zoneId === 'ZONE-P4B') || sensors[3];

    const dispVal = dispSensor?.currentValue || 6.4;
    const rateVal = rateSensor?.currentValue || 0.15;
    const vibVal = vibSensor?.currentValue || 1.8;
    const ch4Val = ch4Sensor?.currentValue || 0.28;

    // Multi-factor weighted score calculation (simulated ML multi-parameter regression)
    // Normalized weights:
    // Disp: 35%, Rate: 30%, Vib: 20%, Gas: 15%
    const dispScore = Math.min(100, (dispVal / 28.0) * 100);
    const rateScore = Math.min(100, (rateVal / 4.5) * 100);
    const vibScore = Math.min(100, (vibVal / 14.0) * 100);
    const gasScore = Math.min(100, (ch4Val / 1.75) * 100);

    const rawComposite = (dispScore * 0.35) + (rateScore * 0.30) + (vibScore * 0.20) + (gasScore * 0.15);
    const overallRiskScore = Math.min(98, Math.max(12, Math.round(rawComposite)));

    let riskLevel: StatusLevel = 'NORMAL';
    let stateOfTrend: 'STABLE' | 'IMPROVING' | 'DETERIORATING' | 'CRITICAL_RISK' = 'STABLE';

    if (overallRiskScore >= 80) {
      riskLevel = 'CRITICAL';
      stateOfTrend = 'CRITICAL_RISK';
    } else if (overallRiskScore >= 60) {
      riskLevel = 'HIGH_RISK';
      stateOfTrend = 'DETERIORATING';
    } else if (overallRiskScore >= 40) {
      riskLevel = 'WARNING';
      stateOfTrend = 'DETERIORATING';
    } else {
      riskLevel = 'NORMAL';
      stateOfTrend = 'STABLE';
    }

    // Explainable factor contributions
    const totalDriverPoints = dispScore + rateScore + vibScore + gasScore + 20; // 20 baseline historical
    const dispContrib = Math.round((dispScore / totalDriverPoints) * 100);
    const rateContrib = Math.round((rateScore / totalDriverPoints) * 100);
    const vibContrib = Math.round((vibScore / totalDriverPoints) * 100);
    const gasContrib = Math.round((gasScore / totalDriverPoints) * 100);
    const histContrib = Math.max(5, 100 - (dispContrib + rateContrib + vibContrib + gasContrib));

    const now = Date.now();
    const predictionCurve: PredictionDataPoint[] = [];

    // Past 12 hours observed
    for (let i = 12; i >= 0; i--) {
      const t = now - i * 2 * 3600 * 1000;
      const hoursAgo = i * 2;
      const histVal = Math.max(2, dispVal - (hoursAgo * (rateVal * 0.6)) + (Math.sin(i * 0.5) * 0.2));
      predictionCurve.push({
        timestamp: t,
        timeLabel: `T-${hoursAgo}h`,
        observedValue: Number(histVal.toFixed(2)),
        isObserved: true,
      });
    }

    // Next 24 hours predicted
    const slopeMultiplier = riskLevel === 'CRITICAL' ? 1.8 : riskLevel === 'HIGH_RISK' ? 1.2 : 0.4;
    for (let i = 1; i <= 12; i++) {
      const t = now + i * 2 * 3600 * 1000;
      const hoursAhead = i * 2;
      const growth = (hoursAhead * rateVal * slopeMultiplier);
      const predictedVal = Number((dispVal + growth).toFixed(2));
      const spread = Number((hoursAhead * 0.15 * (overallRiskScore / 50)).toFixed(2));

      predictionCurve.push({
        timestamp: t,
        timeLabel: `T+${hoursAhead}h`,
        predictedValue: predictedVal,
        upperConfidence: Number((predictedVal + spread).toFixed(2)),
        lowerConfidence: Number(Math.max(dispVal, predictedVal - spread).toFixed(2)),
        isObserved: false,
      });
    }

    let summaryRationale = '';
    if (riskLevel === 'CRITICAL') {
      summaryRationale = `CRITICAL ALERT: Multi-sensor fusion identifies rapid strata bed separation in ${dispSensor.zoneId}. Roof displacement (${dispVal} mm) and velocity (${rateVal} mm/hr) breach critical limits alongside severe micro-seismic bursts (${vibVal} mm/s). Immediate evacuation recommended.`;
    } else if (riskLevel === 'HIGH_RISK') {
      summaryRationale = `HIGH RISK WARNING: Correlated displacement rate acceleration (${rateVal} mm/hr) and elevated acoustic emission (${vibVal} mm/s) indicate developing tensile fracture. Recommend immediate support reinforcement and worker alert.`;
    } else if (riskLevel === 'WARNING') {
      summaryRationale = `ADVISORY: Displacement rate (${rateVal} mm/hr) approaching configured warning threshold. Micro-seismic activity slightly elevated. Shift engineer advised to monitor Panel 4B tailgate.`;
    } else {
      summaryRationale = `STABLE CONDITIONS: Multi-sensor readings within standard operational parameters. Ground displacement velocity (${rateVal} mm/hr) is stable.`;
    }

    return {
      overallRiskScore,
      riskLevel,
      predictionHorizon: 'Next 24 Hours',
      modelConfidence: riskLevel === 'CRITICAL' ? 92 : riskLevel === 'HIGH_RISK' ? 88 : 84,
      stateOfTrend,
      primaryFactors: [
        {
          id: 'F1',
          label: 'Displacement Velocity & Acceleration',
          contributionPercent: rateContrib,
          description: 'Rate of roof sagging / extensometer movement per hour',
          trend: rateVal > 1.2 ? 'increasing' : 'stable',
          currentMetric: `${rateVal} mm/hr (Ref: ${rateSensor?.warningThreshold} mm/hr)`,
        },
        {
          id: 'F2',
          label: 'Total Strata Displacement',
          contributionPercent: dispContrib,
          description: 'Cumulative borehole extensometer roof movement',
          trend: dispVal > 12 ? 'increasing' : 'stable',
          currentMetric: `${dispVal} mm (Max: 50 mm)`,
        },
        {
          id: 'F3',
          label: 'Micro-seismic / Vibration Activity',
          contributionPercent: vibContrib,
          description: 'Triaxial geophone energy rate and acoustic emission pulses',
          trend: vibVal > 4.0 ? 'increasing' : 'stable',
          currentMetric: `${vibVal} mm/s peak ground velocity`,
        },
        {
          id: 'F4',
          label: 'Gas Desorption & Roadway Environment',
          contributionPercent: gasContrib,
          description: 'CH4 release correlated with strata expansion',
          trend: ch4Val > 0.8 ? 'increasing' : 'stable',
          currentMetric: `${ch4Val}% Vol CH4`,
        },
        {
          id: 'F5',
          label: 'Historical Seam III Subsidence Model',
          contributionPercent: histContrib,
          description: 'Comparison with historical caving curve profiles in Raniganj coal measures',
          trend: 'stable',
          currentMetric: `${85 + Math.round(overallRiskScore * 0.1)}% profile match`,
        },
      ],
      predictionCurve,
      summaryRationale,
      lastInferenceTimestamp: now,
    };
  }
}
