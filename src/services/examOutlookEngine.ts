import { useUserStore } from '../store/userStore';
import { usePerformanceStore } from '../store/performanceStore';
import { useBKTStore } from '../store/bktStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useMCQStore } from '../store/mcqStore';
import { getCompositeExamWeight } from '../data/examBlueprints';
import { getAllScorableSubtopics } from './knowledgeEngine';
import type { SessionOutcome } from '../store/performanceStore';

function safeReduce<T, U>(arr: T[] | null | undefined, fn: (acc: U, item: T) => U, initial: U): U {
  return Array.isArray(arr) ? arr.reduce(fn, initial) : initial;
}

export type ConfidenceLevel = 'Low Confidence' | 'Medium Confidence' | 'High Confidence';

export type OutlookStatus = 'Getting Started' | 'Building Foundation' | 'Making Progress' | 'Competitive' | 'Exam Ready';

export interface ExamOutlook {
  expectedScoreRange: { min: number; max: number };
  confidenceLevel: ConfidenceLevel;
  strongestSubjects: { name: string; score: number }[];
  weakestSubjects: { name: string; score: number }[];
  blockingTopics: { subject: string; topic: string; reason: string }[];
  revisionRiskTopics: { subject: string; topic: string; daysOverdue: number }[];
  nextBestAction: string;
  outlookStatus: OutlookStatus;
  totalMockTests: number;
  totalMockQuestions: number;
  averageMockAccuracy: number;
}

interface SubjectSummary {
  name: string;
  mastery: number;
  retention: number;
  accuracy: number;
  coverage: number;
  consistency: number;
}

function getExamTargets(): string[] {
  const { targetExams, primaryExam } = useUserStore.getState();
  return targetExams.length > 0 ? targetExams : primaryExam ? [primaryExam] : ['LDC'];
}

function computeScoreRange(
  subjectSummaries: SubjectSummary[],
  sessionOutcomes: SessionOutcome[],
): { min: number; max: number } {
  const exams = getExamTargets();
  const avgMastery = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.mastery, 0) / subjectSummaries.length
    : 0;
  const avgAccuracy = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.accuracy, 0) / subjectSummaries.length
    : 0;
  const avgCoverage = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.coverage, 0) / subjectSummaries.length
    : 0;
  const bestRecentAccuracy = sessionOutcomes.length > 0
    ? Math.max(...sessionOutcomes.slice(-5).map((o) => o.accuracy))
    : 0;
  const mockAccuracy = exams.length > 0
    ? exams.reduce((best, e) => {
        const r = useUserStore.getState().getReadinessForExam(e);
        return r ? Math.max(best, r.accuracyPercent) : best;
      }, 0)
    : 0;
  const base = avgMastery * 55 + avgAccuracy * 25 + avgCoverage * 20;
  const boost = (bestRecentAccuracy * 0.6 + mockAccuracy * 0.4) * 15;
  const center = Math.min(Math.max(base + boost, 15), 95);
  const spread = Math.max(10 - subjectSummaries.length * 0.5, 4);
  return {
    min: Math.max(Math.round(center - spread), 10),
    max: Math.min(Math.round(center + spread), 100),
  };
}

function computeConfidenceLevel(sessionOutcomes: SessionOutcome[], subjectSummaries: SubjectSummary[]): ConfidenceLevel {
  const totalSessions = sessionOutcomes.length;
  const totalQuestions = sessionOutcomes.reduce((s, o) => s + o.totalQuestions, 0);
  const consistency = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.consistency, 0) / subjectSummaries.length
    : 0;
  if (totalSessions >= 20 && totalQuestions >= 500 && consistency >= 0.6) return 'High Confidence';
  if (totalSessions >= 8 && totalQuestions >= 150 && consistency >= 0.35) return 'Medium Confidence';
  return 'Low Confidence';
}

function computeOutlookStatus(
  subjectSummaries: SubjectSummary[],
  sessionOutcomes: SessionOutcome[],
): OutlookStatus {
  const { streak } = useUserStore.getState();
  const avgMastery = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.mastery, 0) / subjectSummaries.length
    : 0;
  const avgCoverage = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.coverage, 0) / subjectSummaries.length
    : 0;
  const avgConsistency = subjectSummaries.length > 0
    ? subjectSummaries.reduce((s, sub) => s + sub.consistency, 0) / subjectSummaries.length
    : 0;
  const totalSessions = sessionOutcomes.length;
  const recentAccuracy = sessionOutcomes.slice(-5).length > 0
    ? sessionOutcomes.slice(-5).reduce((s, o) => s + o.accuracy, 0) / sessionOutcomes.slice(-5).length
    : 0;

  if (totalSessions === 0) return 'Getting Started';
  if (avgCoverage < 0.2) return 'Building Foundation';
  if (avgMastery >= 0.75 && avgCoverage >= 0.7 && avgConsistency >= 0.7 && recentAccuracy >= 70 && streak.current >= 14) return 'Exam Ready';
  if (avgMastery >= 0.55 && avgCoverage >= 0.5 && avgConsistency >= 0.5 && recentAccuracy >= 60) return 'Competitive';
  if (avgMastery >= 0.25 && totalSessions >= 5) return 'Making Progress';
  return 'Building Foundation';
}

function computeSubjectSummaries(): SubjectSummary[] {
  const bktStore = useBKTStore.getState();
  const cognitiveStore = useCognitiveTwinStore.getState();
  const mcqStore = useMCQStore.getState();
  const { profile } = usePerformanceStore.getState();
  const exams = getExamTargets();
  const allTopics = getAllScorableSubtopics();
  const topicMap = bktStore.getAllTopicKnowledge();
  const subjectGroups = new Map<string, { masteryTotal: number; count: number; accuracyTotal: number; accuracyCount: number }>();
  const nameToKey: Record<string, string> = {};
  const keyToSubject: Record<string, string> = {};

  for (const s of allTopics) {
    const key = `${s.subject}::${s.topic}${s.subtopic ? `::${s.subtopic}` : ''}`;
    nameToKey[s.subject] = s.subject;
    keyToSubject[key] = s.subject;
    if (!subjectGroups.has(s.subject)) {
      subjectGroups.set(s.subject, { masteryTotal: 0, count: 0, accuracyTotal: 0, accuracyCount: 0 });
    }
    const g = subjectGroups.get(s.subject)!;
    const tk = topicMap[key];
    if (tk) {
      g.masteryTotal += tk.pMastered;
      g.count++;
      if (tk.totalAttempts > 0) {
        g.accuracyTotal += tk.lastCorrect ? 100 : 0;
        g.accuracyCount++;
      }
    }
  }

  const uniqueSubjects = new Set(allTopics.map((s) => s.subject));
  const summaries: SubjectSummary[] = [];

  for (const name of uniqueSubjects) {
    const g = subjectGroups.get(name);
    if (!g || g.count === 0) continue;

    const mastery = g.count > 0 ? g.masteryTotal / g.count : 0;
    const accuracy = g.accuracyCount > 0 ? g.accuracyTotal / g.accuracyCount : 0;
    const weight = exams.reduce((w, e) => w + getCompositeExamWeight(e, name), 0);
    const coverage = g.count / (g.count + 1);
    const daysSinceLastPractice = profile?.forgettingRates?.[name]
      ? Math.min(1, 1 / (1 + profile.forgettingRates[name]))
      : 0.5;

    const rawOutcomes = usePerformanceStore.getState().sessionOutcomes;
    const sessionOutcomes = Array.isArray(rawOutcomes) ? rawOutcomes : [];
    const subjectSessions = sessionOutcomes.filter((o) => o.subjectScores && name in o.subjectScores);
    const consistency = subjectSessions.length > 0
      ? subjectSessions.filter((s) => s.accuracy >= 40).length / subjectSessions.length
      : 0;

    const retentionMetrics = cognitiveStore.getRetentionMetrics();
    const subjectRetentionRecords = cognitiveStore.retentionRecords.filter((r) => r.subject === name);
    const retention = subjectRetentionRecords.length > 0
      ? subjectRetentionRecords.reduce((s, r) => s + (r.retentionRate || 0), 0) / subjectRetentionRecords.length
      : 0.5;

    summaries.push({
      name,
      mastery: mastery,
      retention: retention,
      accuracy: accuracy / 100,
      coverage,
      consistency,
    });
  }

  summaries.sort((a, b) => {
    const aScore = a.mastery * 0.4 + a.accuracy * 0.3 + a.coverage * 0.2 + a.retention * 0.1;
    const bScore = b.mastery * 0.4 + b.accuracy * 0.3 + b.coverage * 0.2 + b.retention * 0.1;
    return bScore - aScore;
  });

  return summaries;
}

function computeStrongestSubjects(summaries: SubjectSummary[]): { name: string; score: number }[] {
  return summaries.slice(0, 3).map((s) => ({
    name: s.name,
    score: Math.round((s.mastery * 0.4 + s.accuracy * 0.3 + s.retention * 0.3) * 100),
  }));
}

function computeWeakestSubjects(summaries: SubjectSummary[]): { name: string; score: number }[] {
  return summaries.slice(-3).reverse().map((s) => ({
    name: s.name,
    score: Math.round((s.mastery * 0.4 + s.accuracy * 0.3 + s.retention * 0.3) * 100),
  }));
}

function computeBlockingTopics(): { subject: string; topic: string; reason: string }[] {
  const bktStore = useBKTStore.getState();
  const cognitiveStore = useCognitiveTwinStore.getState();
  const exams = getExamTargets();
  const topicMap = bktStore.getAllTopicKnowledge();
  const gaps = cognitiveStore.getOpenGaps();
  const allTopics = getAllScorableSubtopics();

  const topicWeights: Record<string, number> = {};
  for (const s of allTopics) {
    const key = `${s.subject}::${s.topic}${s.subtopic ? `::${s.subtopic}` : ''}`;
    const weight = exams.reduce((w, e) => w + getCompositeExamWeight(e, s.subject, s.topic), 0);
    topicWeights[key] = weight || 0.1;
  }

  const scored = allTopics
    .map((s) => {
      const key = `${s.subject}::${s.topic}${s.subtopic ? `::${s.subtopic}` : ''}`;
      const tk = topicMap[key];
      const pMastered = tk ? tk.pMastered : 0;
      const isGap = gaps.some((g) => g.nodeId === key || g.topic === s.topic);
      const lowMastery = pMastered < 0.5;
      const weight = topicWeights[key] || 0.1;
      const blockScore = lowMastery && isGap ? weight * (1 - pMastered) : 0;
      return { subject: s.subject, topic: s.topic, key, pMastered, blockScore, weight, isGap };
    })
    .sort((a, b) => b.blockScore - a.blockScore)
    .slice(0, 5);

  return scored
    .filter((s) => s.blockScore > 0)
    .map((s) => ({
      subject: s.subject,
      topic: s.topic,
      reason: s.pMastered < 0.3
        ? 'Low mastery — needs focused practice'
        : s.pMastered < 0.5
          ? 'Improving but below target'
          : 'Frequently missed in practice',
    }));
}

function computeRevisionRiskTopics(): { subject: string; topic: string; daysOverdue: number }[] {
  const bktStore = useBKTStore.getState();
  const cognitiveStore = useCognitiveTwinStore.getState();
  const topicMap = bktStore.getAllTopicKnowledge();
  const now = Date.now();

  const risks: { subject: string; topic: string; daysOverdue: number }[] = [];
  for (const [key, tk] of Object.entries(topicMap)) {
    if (!tk.pMastered || tk.pMastered < 0.92) continue;
    const parts = key.split('::');
    const subject = parts[0];
    const topic = parts[1];
    const daysSinceLast = tk.lastAttempted ? (now - tk.lastAttempted) / 86400000 : 999;
    const masteries = Object.values(cognitiveStore.masteryMap).filter(
      (m) => m.nodeId === key || m.nodeId.includes(topic),
    );
    const forgettingScore = masteries.length > 0
      ? masteries.reduce((s, m) => s + (m.forgettingScore || 0), 0) / masteries.length
      : daysSinceLast / 30;

    if (forgettingScore > 0.3 || daysSinceLast > 14) {
      risks.push({
        subject,
        topic,
        daysOverdue: Math.round(Math.max(0, daysSinceLast - 7)),
      });
    }
  }

  return risks.sort((a, b) => b.daysOverdue - a.daysOverdue).slice(0, 5);
}

function computeNextBestAction(
  summaries: SubjectSummary[],
  blockingTopics: { subject: string; topic: string; reason: string }[],
  revisionRiskTopics: { subject: string; topic: string; daysOverdue: number }[],
  outlookStatus: OutlookStatus,
): string {
  if (blockingTopics.length > 0) {
    const t = blockingTopics[0];
    return `Complete a 20-question ${t.topic} revision session in ${t.subject}.`;
  }
  if (revisionRiskTopics.length > 0) {
    const t = revisionRiskTopics[0];
    return `Review ${t.topic} flashcards in ${t.subject} — ${t.daysOverdue > 0 ? `${t.daysOverdue} day(s) overdue` : 'due today'}.`;
  }
  if (summaries.length > 0) {
    const weakest = summaries[summaries.length - 1];
    return `Take a ${weakest.name} mock test to assess your current level.`;
  }
  return 'Start with a daily MCQ practice session.';
}

export function computeExamOutlook(): ExamOutlook {
  const { sessionOutcomes } = usePerformanceStore.getState();
  const outcomes = Array.isArray(sessionOutcomes) ? sessionOutcomes : [];
  const summaries = computeSubjectSummaries();
  const scoreRange = computeScoreRange(summaries, outcomes);
  const blockingTopics = computeBlockingTopics();
  const revisionRisk = computeRevisionRiskTopics();

  const mockOutcomes = outcomes.filter((o) => o.sessionType === 'exam_simulation');
  const totalMockTests = mockOutcomes.length;
  const totalMockQuestions = safeReduce(mockOutcomes, (s, o) => s + o.totalQuestions, 0);
  const averageMockAccuracy = totalMockTests > 0
    ? Math.round(safeReduce(mockOutcomes, (s, o) => s + o.accuracy, 0) / totalMockTests * 100)
    : 0;

  return {
    expectedScoreRange: scoreRange,
    confidenceLevel: computeConfidenceLevel(outcomes, summaries),
    strongestSubjects: computeStrongestSubjects(summaries),
    weakestSubjects: computeWeakestSubjects(summaries),
    blockingTopics,
    revisionRiskTopics: revisionRisk,
    nextBestAction: computeNextBestAction(summaries, blockingTopics, revisionRisk, computeOutlookStatus(summaries, outcomes)),
    outlookStatus: computeOutlookStatus(summaries, outcomes),
    totalMockTests,
    totalMockQuestions,
    averageMockAccuracy,
  };
}
