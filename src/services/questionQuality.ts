import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lakshyam-question-quality-v1';
const MIN_SAMPLES_PER_GROUP = 3;

export interface QuestionQualityRecord {
  questionKey: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalAttempts: number;
  correctCount: number;
  pValue: number;
  highPerfCorrect: number;
  highPerfTotal: number;
  lowPerfCorrect: number;
  lowPerfTotal: number;
  discriminationIndex: number;
  avgTimeToAnswer: number;
  confidenceScore: number;
  biasScore: number;
  qualityScore: number;
  lastUpdated: string;
}

interface PersistedState {
  records: Record<string, QuestionQualityRecord>;
}

let cache: PersistedState | null = null;

async function load(): Promise<PersistedState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
      if (cache && cache.records) return cache;
    }
  } catch {}
  cache = { records: {} };
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

function computeDiscrimination(
  highCorrect: number, highTotal: number,
  lowCorrect: number, lowTotal: number,
): number {
  if (highTotal < MIN_SAMPLES_PER_GROUP || lowTotal < MIN_SAMPLES_PER_GROUP) return 50;
  const highRate = highCorrect / highTotal;
  const lowRate = lowCorrect / lowTotal;
  const diff = (highRate - lowRate) * 100;
  return Math.max(0, Math.min(100, Math.round(50 + diff)));
}

function computeConfidence(avgTimeToAnswer: number, pValue: number): number {
  let score = 50;
  if (avgTimeToAnswer > 0 && avgTimeToAnswer < 5000) score += 20;
  else if (avgTimeToAnswer > 20000) score -= 20;
  if (pValue > 0.85) score -= 15;
  if (pValue < 0.2) score -= 15;
  if (pValue >= 0.4 && pValue <= 0.8) score += 10;
  return Math.max(0, Math.min(100, score));
}

function computeBias(
  totalAttempts: number, pValue: number,
  subjectAccuracyMap: Record<string, { correct: number; total: number }>,
  questionSubject: string,
): number {
  if (totalAttempts < MIN_SAMPLES_PER_GROUP * 2) return 50;
  const otherSubjects = Object.entries(subjectAccuracyMap)
    .filter(([s]) => s !== questionSubject && s !== '')
    .filter(([, d]) => d.total >= MIN_SAMPLES_PER_GROUP);
  if (otherSubjects.length === 0) return 50;
  const questionRate = subjectAccuracyMap[questionSubject]
    ? subjectAccuracyMap[questionSubject].correct / subjectAccuracyMap[questionSubject].total
    : pValue;
  const otherRates = otherSubjects.map(([, d]) => d.correct / d.total);
  const avgOther = otherRates.reduce((s, r) => s + r, 0) / otherRates.length;
  const gap = Math.abs(questionRate - avgOther) * 100;
  return Math.max(0, Math.min(100, Math.round(100 - gap)));
}

export async function recordQuestionQualityAnswer(
  questionKey: string,
  subject: string,
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  correct: boolean,
  timeToAnswer: number,
  learnerOverallAccuracy: number,
  subjectAccuracyMap: Record<string, { correct: number; total: number }>,
): Promise<QuestionQualityRecord> {
  const state = await load();
  const existing = state.records[questionKey];

  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const pValue = correctCount / totalAttempts;

  const isHighPerf = learnerOverallAccuracy >= 0.6;
  const isLowPerf = learnerOverallAccuracy <= 0.4;
  const highPerfTotal = (existing?.highPerfTotal ?? 0) + (isHighPerf ? 1 : 0);
  const highPerfCorrect = (existing?.highPerfCorrect ?? 0) + (isHighPerf && correct ? 1 : 0);
  const lowPerfTotal = (existing?.lowPerfTotal ?? 0) + (isLowPerf ? 1 : 0);
  const lowPerfCorrect = (existing?.lowPerfCorrect ?? 0) + (isLowPerf && correct ? 1 : 0);

  const prevTta = existing?.avgTimeToAnswer ?? 0;
  const prevCount = existing?.totalAttempts ?? 0;
  const avgTimeToAnswer = prevCount > 0
    ? (prevTta * prevCount + timeToAnswer) / totalAttempts
    : timeToAnswer;

  const discriminationIndex = computeDiscrimination(
    highPerfCorrect, highPerfTotal,
    lowPerfCorrect, lowPerfTotal,
  );
  const confidenceScore = computeConfidence(avgTimeToAnswer, pValue);
  const biasScore = computeBias(totalAttempts, pValue, subjectAccuracyMap, subject);

  const qualityScore = Math.round(
    discriminationIndex * 0.35 + confidenceScore * 0.25 + biasScore * 0.25
    + (100 - Math.abs(0.5 - pValue) * 200) * 0.15
  );

  const record: QuestionQualityRecord = {
    questionKey, subject, topic, difficulty,
    totalAttempts, correctCount, pValue,
    highPerfCorrect, highPerfTotal,
    lowPerfCorrect, lowPerfTotal,
    discriminationIndex, avgTimeToAnswer,
    confidenceScore, biasScore,
    qualityScore,
    lastUpdated: new Date().toISOString(),
  };

  state.records[questionKey] = record;
  await persist();
  return record;
}

export function getQuestionQuality(questionKey: string): QuestionQualityRecord | null {
  if (!cache) return null;
  return cache.records[questionKey] ?? null;
}

export function getTopicQuality(subject: string, topic: string): { avgQuality: number; count: number } {
  if (!cache) return { avgQuality: 0, count: 0 };
  const relevant = Object.values(cache.records)
    .filter((r) => r.subject === subject && r.topic === topic && r.totalAttempts >= MIN_SAMPLES_PER_GROUP);
  if (relevant.length === 0) return { avgQuality: 0, count: 0 };
  return {
    avgQuality: Math.round(relevant.reduce((s, r) => s + r.qualityScore, 0) / relevant.length),
    count: relevant.length,
  };
}

export function getQualityDashboard(): {
  totalQuestionsTracked: number;
  avgQuality: number;
  lowQualityCount: number;
  highDiscriminationCount: number;
  biasedCount: number;
  topicBreakdown: { topic: string; avgQuality: number; count: number }[];
} {
  if (!cache || !cache.records) {
    return { totalQuestionsTracked: 0, avgQuality: 0, lowQualityCount: 0, highDiscriminationCount: 0, biasedCount: 0, topicBreakdown: [] };
  }
  const all = Object.values(cache.records).filter((r) => r.totalAttempts >= MIN_SAMPLES_PER_GROUP);
  if (all.length === 0) {
    return { totalQuestionsTracked: Object.keys(cache.records).length, avgQuality: 0, lowQualityCount: 0, highDiscriminationCount: 0, biasedCount: 0, topicBreakdown: [] };
  }
  const topicMap: Record<string, { totalQual: number; count: number }> = {};
  for (const r of all) {
    const key = `${r.subject}::${r.topic}`;
    if (!topicMap[key]) topicMap[key] = { totalQual: 0, count: 0 };
    topicMap[key].totalQual += r.qualityScore;
    topicMap[key].count += 1;
  }
  return {
    totalQuestionsTracked: Object.keys(cache.records).length,
    avgQuality: Math.round(all.reduce((s, r) => s + r.qualityScore, 0) / all.length),
    lowQualityCount: all.filter((r) => r.qualityScore < 40).length,
    highDiscriminationCount: all.filter((r) => r.discriminationIndex >= 70).length,
    biasedCount: all.filter((r) => r.biasScore < 40).length,
    topicBreakdown: Object.entries(topicMap).map(([k, v]) => ({
      topic: k, avgQuality: Math.round(v.totalQual / v.count), count: v.count,
    })).sort((a, b) => a.avgQuality - b.avgQuality),
  };
}

export function seedColdStart(): void {
  if (cache) return;
  cache = { records: {} };
}
