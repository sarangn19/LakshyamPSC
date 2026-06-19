import { GapRecord, GapLifecycle, KnowledgeMastery, RetentionRecord } from '../store/cognitiveTwinStore';
import { getNode, getNodeByName, getNodePath, getNodesByLevel } from '../data/knowledgeTree';

// ─── MasterySnapshot ───

export interface MasterySnapshot {
  timestamp: string;
  mastery: number;
  accuracy: number;
  attempts: number;
}

// ─── Recommendation Attribution ───

export interface RecommendationAttribution {
  gapId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  topic: string;
  subtopic: string;
  recommendedAt: string;
  beforeMastery: number;
  afterMastery: number;
  gain: number;
  daysElapsed: number;
  sessionsApplied: number;
  questionsAnswered: number;
  status: string;
}

// ─── Gap Closure Validation (Part 8 per-topic output) ───

export interface GapClosureValidation {
  nodeName: string;
  subject: string;
  topic: string;
  subtopic: string;
  detectedAt: string;
  initialMastery: number;
  currentMastery: number;
  gain: number;
  status: string;
  daysToClose: number | null;
  sessionsToClose: number | null;
  timeline: MasterySnapshot[];
}

// ─── Adaptive Health Score (Part 9) ───

export type HealthLevel = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export interface AdaptiveHealthScore {
  score: number;
  level: HealthLevel;
  gapClosureRate: number;
  recommendationSuccessRate: number;
  averageImprovement: number;
  factors: {
    gapClosureRate: number;
    recommendationSuccessRate: number;
    averageImprovement: number;
  };
}

// ─── Build MasterySnapshot from GapLifecycle timeline ───

export function buildSnapshotFromLifecycle(lifecycle: GapLifecycle, masteryMap: Record<string, KnowledgeMastery>): MasterySnapshot[] {
  return lifecycle.masteryTimeline.map((entry) => {
    const m = masteryMap[lifecycle.nodeId];
    return {
      timestamp: entry.timestamp,
      mastery: entry.score,
      accuracy: m?.accuracy ?? 0,
      attempts: m?.attempts ?? 0,
    };
  });
}

// ─── Recommendation Attribution Builder ───

export function buildRecommendationAttribution(
  gap: GapRecord,
  lifecycle: GapLifecycle | undefined,
  mastery: KnowledgeMastery | undefined,
  nodeName: string,
  subject: string,
  topic: string,
  subtopic: string,
): RecommendationAttribution {
  const beforeMastery = gap.initialMastery;
  const afterMastery = mastery?.masteryScore ?? gap.currentMastery;
  return {
    gapId: gap.gapId,
    nodeId: gap.nodeId,
    nodeName,
    subject,
    topic,
    subtopic,
    recommendedAt: lifecycle?.firstRecommendation ?? gap.detectedAt,
    beforeMastery,
    afterMastery,
    gain: afterMastery - beforeMastery,
    daysElapsed: lifecycle?.daysToClose ?? Math.round((Date.now() - new Date(gap.detectedAt).getTime()) / 86400000),
    sessionsApplied: lifecycle?.sessionsApplied ?? gap.sessionsApplied,
    questionsAnswered: lifecycle?.questionsAnswered ?? gap.questionsAnswered,
    status: gap.status,
  };
}

// ─── Build all attribution records for a set of gaps ───

export function buildAllAttributions(
  gapRecords: GapRecord[],
  gapLifecycles: GapLifecycle[],
  masteryMap: Record<string, KnowledgeMastery>,
): RecommendationAttribution[] {
  return gapRecords
    .filter((g) => g.recommendationCount > 0 || g.sessionsApplied > 0)
    .map((gap) => {
      const node = getNode(gap.nodeId);
      const lifecycle = gapLifecycles.find((l) => l.gapId === gap.gapId);
      const mastery = masteryMap[gap.nodeId];
      const nodeName = node?.name ?? gap.nodeId;
      const path = lifecycle?.nodePath ?? getNodePath(gap.nodeId);
      const nodeLevel = node?.level ?? gap.level;
      return buildRecommendationAttribution(
        gap,
        lifecycle,
        mastery,
        nodeName,
        path[0] ?? '',
        nodeLevel === 'topic' ? nodeName : path[1] ?? '',
        nodeLevel === 'subtopic' ? nodeName : path[2] ?? '',
      );
    })
    .filter((a) => a.sessionsApplied > 0 || a.questionsAnswered > 0);
}

// ─── Part 8: Cognitive Twin Validation ───

export function buildSubtopicValidations(
  gapRecords: GapRecord[],
  gapLifecycles: GapLifecycle[],
  masteryMap: Record<string, KnowledgeMastery>,
): GapClosureValidation[] {
  const subtopicGaps = gapRecords.filter((g) => g.level === 'subtopic');
  return subtopicGaps.map((gap) => {
    const node = getNode(gap.nodeId);
    const lifecycle = gapLifecycles.find((l) => l.gapId === gap.gapId);
    const mastery = masteryMap[gap.nodeId];
    const path = lifecycle?.nodePath ?? getNodePath(gap.nodeId);
    const rawTimeline = lifecycle?.masteryTimeline ?? [];
    const timeline = rawTimeline.map((entry) => {
      const m = masteryMap[gap.nodeId];
      return {
        timestamp: entry.timestamp,
        mastery: entry.score,
        accuracy: m?.accuracy ?? 0,
        attempts: m?.attempts ?? 0,
      };
    });
    return {
      nodeName: node?.name ?? gap.nodeId,
      subject: path[0] ?? '',
      topic: path[1] ?? '',
      subtopic: path[2] ?? '',
      detectedAt: gap.detectedAt,
      initialMastery: gap.initialMastery,
      currentMastery: gap.currentMastery,
      gain: gap.currentMastery - gap.initialMastery,
      status: gap.status,
      daysToClose: lifecycle?.daysToClose ?? null,
      sessionsToClose: lifecycle?.sessionsToClose ?? null,
      timeline,
    };
  });
}

// ─── Part 9: Adaptive Learning Health Score ───

const HEALTH_WEIGHTS = {
  gapClosureRate: 0.35,
  recommendationSuccessRate: 0.35,
  averageImprovement: 0.30,
};

export function computeAdaptiveHealthScore(
  gapClosureRate: number,
  recommendationSuccessRate: number,
  averageImprovement: number,
): AdaptiveHealthScore {
  const normalizedClosure = Math.min(100, Math.max(0, gapClosureRate));
  const normalizedSuccess = Math.min(100, Math.max(0, recommendationSuccessRate));
  const normalizedImprovement = Math.min(100, Math.max(0, Math.round((averageImprovement / 100) * 100)));

  const score = Math.round(
    normalizedClosure * HEALTH_WEIGHTS.gapClosureRate
    + normalizedSuccess * HEALTH_WEIGHTS.recommendationSuccessRate
    + normalizedImprovement * HEALTH_WEIGHTS.averageImprovement
  );

  let level: HealthLevel;
  if (score >= 75) {
    level = 'Excellent';
  } else if (score >= 50) {
    level = 'Good';
  } else if (score >= 25) {
    level = 'Fair';
  } else {
    level = 'Poor';
  }

  return {
    score,
    level,
    gapClosureRate: normalizedClosure,
    recommendationSuccessRate: normalizedSuccess,
    averageImprovement,
    factors: HEALTH_WEIGHTS,
  };
}

// ─── Retention Layer ───

export type RetentionStatus = 'excellent' | 'good' | 'at_risk' | 'lost';

export const RETENTION_THRESHOLDS = {
  excellent: 0.90,
  good: 0.75,
  atRisk: 0.50,
  lost: 0,
};

export function computeRetentionRate(masteryNow: number, masteryAtClosure: number): number {
  if (masteryAtClosure <= 0) return 0;
  return Math.round((masteryNow / masteryAtClosure) * 1000) / 10;
}

export function getRetentionStatus(rate: number): RetentionStatus {
  if (rate >= RETENTION_THRESHOLDS.excellent * 100) return 'excellent';
  if (rate >= RETENTION_THRESHOLDS.good * 100) return 'good';
  if (rate >= RETENTION_THRESHOLDS.atRisk * 100) return 'at_risk';
  return 'lost';
}

export function shouldReopen(retentionRate: number, currentMastery: number): boolean {
  return retentionRate < RETENTION_THRESHOLDS.atRisk * 100 || currentMastery < 60;
}

// ─── Retention Metrics ───

export interface RetentionMetrics {
  retainedGaps: number;
  lostGaps: number;
  reopenedGaps: number;
  averageRetentionRate: number;
  retention7Day: number;
  retention30Day: number;
  retention90Day: number;
  gapsAtRisk: number;
}

export function computeRetentionMetrics(retentionRecords: RetentionRecord[], reopenedCount: number): RetentionMetrics {
  const total = retentionRecords.length;
  if (total === 0) {
    return {
      retainedGaps: 0, lostGaps: 0, reopenedGaps: 0,
      averageRetentionRate: 0, retention7Day: 0,
      retention30Day: 0, retention90Day: 0, gapsAtRisk: 0,
    };
  }

  const with7Day = retentionRecords.filter((r) => r.mastery7Day !== null);
  const with30Day = retentionRecords.filter((r) => r.mastery30Day !== null);
  const with90Day = retentionRecords.filter((r) => r.mastery90Day !== null);

  const avgRetention = retentionRecords.reduce((s, r) => s + r.retentionRate, 0) / total;
  const avg7 = with7Day.length > 0 ? with7Day.reduce((s, r) => s + r.mastery7Day!, 0) / with7Day.length : 0;
  const avg30 = with30Day.length > 0 ? with30Day.reduce((s, r) => s + r.mastery30Day!, 0) / with30Day.length : 0;
  const avg90 = with90Day.length > 0 ? with90Day.reduce((s, r) => s + r.mastery90Day!, 0) / with90Day.length : 0;

  const retained = retentionRecords.filter((r) => {
    const status = getRetentionStatus(r.retentionRate);
    return status === 'excellent' || status === 'good';
  }).length;

  const atRisk = retentionRecords.filter((r) => {
    const status = getRetentionStatus(r.retentionRate);
    return status === 'at_risk';
  }).length;

  const lost = retentionRecords.filter((r) => {
    const status = getRetentionStatus(r.retentionRate);
    return status === 'lost';
  }).length;

  return {
    retainedGaps: retained,
    lostGaps: lost,
    reopenedGaps: reopenedCount,
    averageRetentionRate: Math.round(avgRetention * 10) / 10,
    retention7Day: Math.round(avg7 * 10) / 10,
    retention30Day: Math.round(avg30 * 10) / 10,
    retention90Day: Math.round(avg90 * 10) / 10,
    gapsAtRisk: atRisk,
  };
}

// ─── Most Durable Learning ───

export function getMostDurableLearning(
  retentionRecords: RetentionRecord[],
  limit = 5,
): { nodeName: string; subject: string; retentionRate: number; daysSinceClosure: number }[] {
  return retentionRecords
    .filter((r) => r.daysSinceClosure >= 7)
    .sort((a, b) => b.retentionRate - a.retentionRate)
    .slice(0, limit)
    .map((r) => ({
      nodeName: r.nodeName,
      subject: r.subject,
      retentionRate: r.retentionRate,
      daysSinceClosure: r.daysSinceClosure,
    }));
}
