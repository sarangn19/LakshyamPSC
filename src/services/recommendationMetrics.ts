import { usePerformanceStore } from '../store/performanceStore';

export interface RecommendationMetrics {
  totalGenerated: number;
  accepted: number;
  skipped: number;
  pending: number;
  acceptanceRate: number;
  completedSessions: number;
  completionRate: number;
  avgAccuracyImprovement: number;
  topTypes: { type: string; count: number }[];
}

export function computeRecommendationMetrics(): RecommendationMetrics {
  const perf = usePerformanceStore.getState();
  const recs = perf.recommendations;
  const total = recs.length;

  const accepted = recs.filter((r) => r.status === 'accepted').length;
  const skipped = recs.filter((r) => r.status === 'skipped').length;
  const pending = recs.filter((r) => r.status === 'pending').length;

  const acceptedRecIds = new Set(
    recs.filter((r) => r.status === 'accepted').map((r) => r.id),
  );

  const outcomes = perf.sessionOutcomes;
  const recOutcomes = outcomes.filter(
    (o) => o.recommendationId && acceptedRecIds.has(o.recommendationId),
  );
  const completedSessions = recOutcomes.filter((o) => o.totalQuestions > 0).length;

  const typeCounts: Record<string, number> = {};
  for (const r of recs) {
    typeCounts[r.sessionType] = (typeCounts[r.sessionType] || 0) + 1;
  }
  const topTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const recAccuracies = recOutcomes.filter((o) => o.totalQuestions > 0).map((o) => o.accuracy);
  const allAccuracies = outcomes.filter((o) => o.totalQuestions > 0).map((o) => o.accuracy);

  const avgRecAccuracy =
    recAccuracies.length > 0
      ? recAccuracies.reduce((s, a) => s + a, 0) / recAccuracies.length
      : 0;
  const avgAllAccuracy =
    allAccuracies.length > 0
      ? allAccuracies.reduce((s, a) => s + a, 0) / allAccuracies.length
      : 0;

  const completedRecs = recs.filter((r) => r.sessionCompleted && r.accuracyBefore != null && r.accuracyAfter != null);
  const subjectImpact: Record<string, { count: number; totalLift: number }> = {};
  let totalLift = 0;
  for (const r of completedRecs) {
    if (r.targetSubject) {
      const lift = r.accuracyAfter - r.accuracyBefore;
      totalLift += lift;
      if (!subjectImpact[r.targetSubject]) {
        subjectImpact[r.targetSubject] = { count: 0, totalLift: 0 };
      }
      subjectImpact[r.targetSubject].count++;
      subjectImpact[r.targetSubject].totalLift += lift;
    }
  }
  const avgAccuracyImprovement = completedRecs.length > 0
    ? Number((totalLift / completedRecs.length).toFixed(1))
    : Number(((avgRecAccuracy - avgAllAccuracy) * 100).toFixed(1));

  return {
    totalGenerated: total,
    accepted,
    skipped,
    pending,
    acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    completedSessions,
    completionRate: accepted > 0 ? Math.round((completedSessions / accepted) * 100) : 0,
    avgAccuracyImprovement,
    topTypes,
  };
}

export interface PerSubjectImpact {
  subject: string;
  totalRecommendations: number;
  averageLift: number;
  improvementDirection: 'up' | 'down' | 'flat';
}

export function computeRecommendationImpact(): PerSubjectImpact[] {
  const perf = usePerformanceStore.getState();
  const completedRecs = perf.recommendations.filter(
    (r) => r.sessionCompleted && r.accuracyBefore != null && r.accuracyAfter != null && r.targetSubject,
  );
  const grouped: Record<string, { lifts: number[] }> = {};
  for (const r of completedRecs) {
    if (!r.targetSubject) continue;
    if (!grouped[r.targetSubject]) grouped[r.targetSubject] = { lifts: [] };
    grouped[r.targetSubject].lifts.push(r.accuracyAfter - r.accuracyBefore);
  }
  return Object.entries(grouped)
    .map(([subject, data]) => {
      const avgLift = data.lifts.reduce((s, l) => s + l, 0) / data.lifts.length;
      return {
        subject,
        totalRecommendations: data.lifts.length,
        averageLift: Number(avgLift.toFixed(1)),
        improvementDirection: avgLift > 3 ? 'up' : avgLift < -3 ? 'down' : 'flat',
      };
    })
    .sort((a, b) => b.averageLift - a.averageLift);
}
