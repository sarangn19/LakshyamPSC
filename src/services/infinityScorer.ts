import { InteractionSignal, UserProfile, ConfusionPair } from '../store/performanceStore';
import { getSubjectWeight, getTopicWeight, getCategoryBoost } from '../data/examBlueprint';

export interface TopicScore {
  subject: string;
  topic: string;
  weaknessScore: number;
  forgettingScore: number;
  importanceScore: number;
  confusionScore: number;
  hesitationScore: number;
  recencyPenalty: number;
  coverageBalance: number;
  finalScore: number;
}

export interface ScorerWeights {
  weakness: number;
  forgetting: number;
  importance: number;
  confusion: number;
  hesitation: number;
  recency: number;
  coverage: number;
}

const DEFAULT_WEIGHTS: ScorerWeights = {
  weakness: 3.0,
  forgetting: 2.5,
  importance: 2.0,
  confusion: 2.0,
  hesitation: 1.0,
  recency: 1.5,
  coverage: 1.0,
};

let weights: ScorerWeights = { ...DEFAULT_WEIGHTS };

export function setScorerWeights(overrides: Partial<ScorerWeights>): void {
  weights = { ...weights, ...overrides };
}

export function resetScorerWeights(): void {
  weights = { ...DEFAULT_WEIGHTS };
}

export function getScorerWeights(): ScorerWeights {
  return { ...weights };
}

const SCORABLE_TOPICS: { subject: string; topic: string }[] = [
  { subject: 'Kerala History', topic: 'Ancient Kerala' },
  { subject: 'Kerala History', topic: 'Medieval Kerala' },
  { subject: 'Kerala History', topic: 'Modern Kerala' },
  { subject: 'Renaissance', topic: 'Social Reform Movements' },
  { subject: 'Renaissance', topic: 'Temple Entry Movement' },
  { subject: 'Constitution', topic: 'Fundamental Rights' },
  { subject: 'Constitution', topic: 'Directive Principles' },
  { subject: 'Constitution', topic: 'Union Executive' },
  { subject: 'Geography', topic: 'Physical Geography' },
  { subject: 'Geography', topic: 'Kerala Geography' },
  { subject: 'Science', topic: 'Physics' },
  { subject: 'Science', topic: 'Chemistry' },
  { subject: 'Science', topic: 'Biology' },
  { subject: 'Current Affairs', topic: 'Kerala News' },
  { subject: 'Current Affairs', topic: 'National News' },
  { subject: 'Quantitative Aptitude', topic: 'Arithmetic' },
  { subject: 'Quantitative Aptitude', topic: 'Data Interpretation' },
  { subject: 'Mental Ability', topic: 'Logical Reasoning' },
  { subject: 'Malayalam', topic: 'Grammar' },
  { subject: 'Malayalam', topic: 'Literature' },
];

export function getScorableTopics(): { subject: string; topic: string }[] {
  return SCORABLE_TOPICS;
}

function now(): number {
  return Date.now();
}

function hoursSince(timestamp: number): number {
  return (now() - timestamp) / 3600000;
}

function daysSince(timestamp: number): number {
  return hoursSince(timestamp) / 24;
}

interface ScorerInput {
  profile: UserProfile | null;
  signals: InteractionSignal[];
  subjectQuestionCounts: Record<string, number>;
  totalQuestions: number;
}

export function computeTopicScores(input: ScorerInput): TopicScore[] {
  const { profile, signals, subjectQuestionCounts, totalQuestions } = input;

  const recentPracticeByTopic: Record<string, number> = {};
  const accuracyByTopic: Record<string, { correct: number; total: number }> = {};
  const slowCorrectByTopic: Record<string, number> = {};
  const topicLastPractice: Record<string, number> = {};

  for (const sig of signals) {
    const key = `${sig.subject}::${sig.topic}`;
    if (!accuracyByTopic[key]) accuracyByTopic[key] = { correct: 0, total: 0 };
    accuracyByTopic[key].total++;
    if (sig.answeredCorrect) accuracyByTopic[key].correct++;

    if (sig.answeredCorrect && sig.timeToAnswer > 15000) {
      slowCorrectByTopic[key] = (slowCorrectByTopic[key] || 0) + 1;
    }

    const sigTime = new Date(sig.sessionTime).getTime();
    if (!topicLastPractice[key] || sigTime > topicLastPractice[key]) {
      topicLastPractice[key] = sigTime;
    }
  }

  const confusionMap: Record<string, number> = {};
  if (profile) {
    for (const cp of profile.confusionPairs) {
      for (const topic of [cp.topicA, cp.topicB]) {
        confusionMap[topic] = (confusionMap[topic] || 0) + cp.frequency;
      }
    }
  }

  const maxConfusionFreq = Math.max(1, ...Object.values(confusionMap));
  const recentSignals = signals.slice(-100);
  recentSignals.forEach((sig) => {
    const key = `${sig.subject}::${sig.topic}`;
    recentPracticeByTopic[key] = (recentPracticeByTopic[key] || 0) + 1;
  });
  const maxRecentPractice = Math.max(1, ...Object.values(recentPracticeByTopic));
  const maxSubjectQ = Math.max(1, ...Object.values(subjectQuestionCounts));

  const scores: TopicScore[] = SCORABLE_TOPICS.map((st) => {
    const key = `${st.subject}::${st.topic}`;
    const acc = accuracyByTopic[key];
    const accuracy = acc ? acc.correct / acc.total : 0.5;
    const totalAttempts = acc?.total ?? 0;

    const weaknessScore = totalAttempts > 0 ? 1 - accuracy : 0.5;

    const lastPracticeTime = topicLastPractice[key];
    const forgettingRate = profile?.forgettingRates[st.subject] ?? 7;
    const daysSinceLastPractice = lastPracticeTime ? daysSince(lastPracticeTime) : 30;
    const forgettingScore = Math.min(1, daysSinceLastPractice / forgettingRate);

    const subjectWeight = getSubjectWeight(st.subject);
    const topicWeight = getTopicWeight(st.subject, st.topic);
    const catBoost = getCategoryBoost(st.subject);
    const importanceScore = (subjectWeight * topicWeight * catBoost) / 100;

    const confusionFreq = confusionMap[st.topic] ?? 0;
    const confusionScore = confusionFreq / maxConfusionFreq;

    const slowCorrectTotal = slowCorrectByTopic[key] ?? 0;
    const hesTotal = acc?.total ?? 0;
    const hesitationScore = hesTotal > 0 ? slowCorrectTotal / hesTotal : 0;

    const hoursSincePractice = lastPracticeTime ? hoursSince(lastPracticeTime) : 999;
    const recencyPenalty = Math.min(1, Math.max(0, 1 - hoursSincePractice / 24));

    const subjectQ = subjectQuestionCounts[st.subject] ?? 0;
    const coverageBalance = 1 - (subjectQ / maxSubjectQ);

    const finalScore =
      weights.weakness * weaknessScore +
      weights.forgetting * forgettingScore +
      weights.importance * importanceScore +
      weights.confusion * confusionScore +
      weights.hesitation * hesitationScore -
      weights.recency * recencyPenalty +
      weights.coverage * coverageBalance;

    return {
      subject: st.subject,
      topic: st.topic,
      weaknessScore,
      forgettingScore,
      importanceScore,
      confusionScore,
      hesitationScore,
      recencyPenalty,
      coverageBalance,
      finalScore: Math.max(0, finalScore),
    };
  });

  return scores.sort((a, b) => b.finalScore - a.finalScore);
}

export function pickBestTopic(scores: TopicScore[], excludeTopics: string[] = []): TopicScore | null {
  const filtered = excludeTopics.length > 0
    ? scores.filter((s) => !excludeTopics.includes(`${s.subject}::${s.topic}`))
    : scores;
  return filtered[0] ?? null;
}
