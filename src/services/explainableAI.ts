import { usePerformanceStore } from '../store/performanceStore';
import { useBKTStore } from '../store/bktStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { getUserExamTargets } from '../store/userStore';
import { getCompositeExamWeight } from '../data/examBlueprints';

export interface FeatureAttribution {
  feature: string;
  label: string;
  contribution: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface Explanation {
  score: number;
  features: FeatureAttribution[];
  topReason: string;
}

const FEATURES_CONFIG = [
  { key: 'gapClosure', label: 'Knowledge Gap', weight: 30 },
  { key: 'forgettingRisk', label: 'Forgetting Risk', weight: 25 },
  { key: 'examWeight', label: 'Exam Weight', weight: 20 },
  { key: 'momentum', label: 'Recent Improvement', weight: 10 },
  { key: 'cooccurrence', label: 'Study Pattern', weight: 10 },
  { key: 'sequential', label: 'Learning Path', weight: 5 },
];

function getBaselineScore(): number {
  const perf = usePerformanceStore.getState();
  const bkt = useBKTStore.getState();
  const sessions = perf.sessionOutcomes;
  if (sessions.length === 0) return 25;
  const scores: number[] = [];
  for (const session of sessions) {
    for (const sub of Object.keys(session.subjectScores)) {
      const fm = bkt.getTopicPMastered(sub, '');
      scores.push(fm * 100);
    }
  }
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 25;
}

function computeGapAttribution(subject: string, topic: string): number {
  const twin = useCognitiveTwinStore.getState();
  const gaps = twin.getOpenGaps?.() || [];
  const match = gaps.find(g => g.subject === subject && (!topic || g.topic === topic));
  return match ? (100 - match.currentMastery) : 0;
}

function computeForgettingAttribution(subject: string, topic: string): number {
  const bkt = useBKTStore.getState();
  const fm = bkt.getTopicPMastered(subject, topic);
  return Math.max(0, (0.5 - fm) * 100);
}

function computeExamWeightAttribution(subject: string, _topic: string): number {
  const targets = getUserExamTargets();
  const weight = getCompositeExamWeight(targets, subject, _topic);
  return weight;
}

function computeMomentumAttribution(subject: string): number {
  const perf = usePerformanceStore.getState();
  const sessions = perf.sessionOutcomes.filter(s => s.subjectScores[subject]?.total >= 2);
  if (sessions.length < 3) return 0;
  const history = sessions.map(s => s.subjectScores[subject].correct / s.subjectScores[subject].total);
  const half = Math.ceil(history.length / 2);
  const firstAvg = history.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const lastAvg = history.slice(-half).reduce((a, b) => a + b, 0) / half;
  return Math.max(0, (lastAvg - firstAvg) * 100);
}

function computeCooccurrenceAttribution(subject: string): number {
  const perf = usePerformanceStore.getState();
  const sessions = perf.sessionOutcomes;
  let count = 0;
  for (const session of sessions) {
    const subs = Object.keys(session.subjectScores);
    if (subs.includes(subject)) count++;
  }
  return Math.min(30, count * 5);
}

function computeSequentialAttribution(subject: string): number {
  const perf = usePerformanceStore.getState();
  const sorted = [...perf.sessionOutcomes].sort((a, b) => a.startTime - b.startTime);
  let incCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = Object.keys(sorted[i - 1].subjectScores);
    const curr = Object.keys(sorted[i].subjectScores);
    if (!curr.includes(subject)) continue;
    if (prev.some(p => p !== subject && curr.includes(p))) incCount++;
  }
  return Math.min(20, incCount * 3);
}

export function explainRecommendation(subject: string, topic: string): Explanation {
  const baseline = getBaselineScore();
  const features: FeatureAttribution[] = [];

  const rawGap = computeGapAttribution(subject, topic);
  const rawForget = computeForgettingAttribution(subject, topic);
  const rawExam = computeExamWeightAttribution(subject, topic);
  const rawMomentum = computeMomentumAttribution(subject);
  const rawCooc = computeCooccurrenceAttribution(subject);
  const rawSeq = computeSequentialAttribution(subject);

  const featureValues: Record<string, number> = {
    gapClosure: rawGap,
    forgettingRisk: rawForget,
    examWeight: rawExam,
    momentum: rawMomentum,
    cooccurrence: rawCooc,
    sequential: rawSeq,
  };

  for (const cfg of FEATURES_CONFIG) {
    const raw = featureValues[cfg.key] || 0;
    const contribution = (raw / 100) * cfg.weight;
    features.push({
      feature: cfg.key,
      label: cfg.label,
      contribution: Math.round(contribution * 10) / 10,
      direction: contribution > 1 ? 'positive' : contribution < -1 ? 'negative' : 'neutral',
    });
  }

  const totalContribution = features.reduce((s, f) => s + f.contribution, 0);
  const score = Math.round(Math.min(100, baseline + totalContribution));

  const sorted = [...features].sort((a, b) => b.contribution - a.contribution);
  const top = sorted[0];
  const topReason = top.contribution > 0
    ? `${top.label} (${Math.round((top.contribution / (totalContribution || 1)) * 100)}% of reason)`
    : 'General recommendation';

  return { score, features, topReason };
}
