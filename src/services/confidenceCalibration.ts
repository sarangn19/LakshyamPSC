export type ConfidenceLevel = 1 | 2 | 3 | 4;

export interface ConfidenceRecord {
  questionId: string;
  subject: string;
  topic: string;
  timestamp: string;
  confidenceLevel: ConfidenceLevel;
  wasCorrect: boolean;
}

export interface CalibrationMetrics {
  totalRecords: number;
  overconfidenceRate: number;
  underconfidenceRate: number;
  calibrationScore: number;
  meanConfidence: number;
  meanAccuracy: number;
  calibrationCurve: { bucket: string; confidence: number; accuracy: number; count: number }[];
}

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  1: '25%',
  2: '50%',
  3: '75%',
  4: '95%',
};

const CONFIDENCE_VALUES: Record<ConfidenceLevel, number> = {
  1: 0.25,
  2: 0.50,
  3: 0.75,
  4: 0.95,
};

export function getConfidenceLabel(level: ConfidenceLevel): string {
  return CONFIDENCE_LABELS[level];
}

export function getConfidenceValue(level: ConfidenceLevel): number {
  return CONFIDENCE_VALUES[level];
}

export function computeCalibrationMetrics(records: ConfidenceRecord[]): CalibrationMetrics {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      overconfidenceRate: 0,
      underconfidenceRate: 0,
      calibrationScore: 0,
      meanConfidence: 0,
      meanAccuracy: 0,
      calibrationCurve: [],
    };
  }

  let overcount = 0;
  let undercount = 0;
  let totalConfidence = 0;
  let totalCorrect = 0;
  let brierSum = 0;

  for (const r of records) {
    const confValue = CONFIDENCE_VALUES[r.confidenceLevel];
    totalConfidence += confValue;
    const correctVal = r.wasCorrect ? 1 : 0;
    totalCorrect += correctVal;
    brierSum += (confValue - correctVal) ** 2;

    if (r.wasCorrect && r.confidenceLevel <= 2) {
      undercount++;
    } else if (!r.wasCorrect && r.confidenceLevel >= 3) {
      overcount++;
    }
  }

  const total = records.length;
  const meanConfidence = totalConfidence / total;
  const meanAccuracy = totalCorrect / total;
  const calibrationScore = Math.round((1 - brierSum / total) * 100);
  const overconfidenceRate = total > 0 ? overcount / total : 0;
  const underconfidenceRate = total > 0 ? undercount / total : 0;

  const buckets: { bucket: string; confidence: number; accuracy: number; count: number }[] = [];
  const bucketMap: Record<number, { confSum: number; accSum: number; count: number }> = {};
  for (const r of records) {
    const b = r.confidenceLevel;
    if (!bucketMap[b]) bucketMap[b] = { confSum: 0, accSum: 0, count: 0 };
    bucketMap[b].confSum += CONFIDENCE_VALUES[b];
    bucketMap[b].accSum += r.wasCorrect ? 1 : 0;
    bucketMap[b].count++;
  }
  for (const [level, data] of Object.entries(bucketMap).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    buckets.push({
      bucket: CONFIDENCE_LABELS[Number(level) as ConfidenceLevel],
      confidence: data.confSum / data.count,
      accuracy: data.accSum / data.count,
      count: data.count,
    });
  }

  return {
    totalRecords: total,
    overconfidenceRate: Math.round(overconfidenceRate * 100),
    underconfidenceRate: Math.round(underconfidenceRate * 100),
    calibrationScore,
    meanConfidence: Math.round(meanConfidence * 100),
    meanAccuracy: Math.round(meanAccuracy * 100),
    calibrationCurve: buckets,
  };
}

export function getCalibrationInterpretation(metrics: CalibrationMetrics): string {
  if (metrics.totalRecords < 5) return 'Keep answering to see your confidence calibration.';
  if (metrics.calibrationScore >= 85) return 'You know what you know — excellent calibration.';
  if (metrics.calibrationScore >= 70) return 'Fairly well calibrated. Mild gaps between confidence and accuracy.';
  if (metrics.overconfidenceRate > 30) return 'You tend to overestimate your knowledge. Take a moment to double-check before answering.';
  if (metrics.underconfidenceRate > 30) return 'You tend to underestimate yourself. Trust your instincts more.';
  return 'Mixed calibration. Review topics where confidence doesn\'t match accuracy.';
}
