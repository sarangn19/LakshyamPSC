export type StudyGroup = 'adaptive' | 'random';

export interface StudySession {
  sessionId: string;
  group: StudyGroup;
  startTime: string;
  endTime: string | null;
  subject: string;
  topic: string;
  questionsAsked: number;
  correctAnswers: number;
  accuracy: number;
}

export interface StudyQuestionResult {
  questionId: string;
  sessionId: string;
  group: StudyGroup;
  subject: string;
  topic: string;
  subtopic: string;
  correct: boolean;
  timestamp: string;
  beforeMastery: number | null;
  afterMastery: number | null;
}

export interface RecommendationValidation {
  id: string;
  gapId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  topic: string;
  subtopic: string;
  group: StudyGroup;
  recommendedAt: string;
  beforeMastery: number;
  afterMastery: number;
  gain: number;
  successful: boolean;
  failureReason: string | null;
  isFalsePositive: boolean;
  sessionsToImprove: number | null;
  daysToImprove: number | null;
  lastCheckedAt: string;
}

export interface StudyMetrics {
  totalSessions: number;
  totalQuestions: number;
  initialAccuracy: number;
  finalAccuracy: number;
  accuracyGain: number;
  retentionScore: number;
  gapClosureRate: number;
  meanTimeToCloseGap: number;
  medianTimeToCloseGap: number;
  meanSessionsToCloseGap: number;
  recommendationSuccessRate: number;
  falsePositiveRate: number;
  trueImprovementRate: number;
  recommendationAccuracy: number;
  adaptiveLearningEffectiveness: number;
}

export interface StudyComparison {
  adaptive: StudyMetrics;
  random: StudyMetrics;
  accuracyGainDiff: number;
  retentionScoreDiff: number;
  gapClosureRateDiff: number;
}

const SUCCESS_MIN_GAIN = 15;
const SUCCESS_MAX_SESSIONS = 3;
const SUCCESS_MAX_DAYS = 14;

export function computeStudyMetrics(
  sessions: StudySession[],
  questions: StudyQuestionResult[],
  validations: RecommendationValidation[],
): StudyMetrics {
  const totalSessions = sessions.length;
  const totalQuestions = questions.length;

  const initialAccuracy = totalQuestions > 0
    ? computeInitialAccuracy(questions)
    : 0;

  const finalAccuracy = totalQuestions > 0
    ? computeFinalAccuracy(questions)
    : 0;

  const accuracyGain = finalAccuracy - initialAccuracy;

  const retentionScore = computeRetentionScore(validations);

  const gapClosureRate = computeGapClosureRate(validations);

  const { mean: meanTimeToCloseGap, median: medianTimeToCloseGap } =
    computeTimeToCloseStats(validations);

  const meanSessionsToCloseGap = computeMeanSessionsToClose(validations);

  const successful = validations.filter((v) => v.successful);
  const recommendationSuccessRate = validations.length > 0
    ? (successful.length / validations.length) * 100
    : 0;

  const falsePositives = validations.filter((v) => v.isFalsePositive);
  const falsePositiveRate = validations.length > 0
    ? (falsePositives.length / validations.length) * 100
    : 0;

  const trueImprovements = validations.filter((v) => v.successful && !v.isFalsePositive);
  const trueImprovementRate = validations.length > 0
    ? (trueImprovements.length / validations.length) * 100
    : 0;

  const falseNegatives = validations.filter((v) => !v.successful && v.gain >= SUCCESS_MIN_GAIN);
  const recommendationAccuracy = validations.length > 0
    ? ((successful.length + falseNegatives.length) / validations.length) * 100
    : 0;

  const adaptiveLearningEffectiveness = computeEffectiveness(validations);

  return {
    totalSessions,
    totalQuestions,
    initialAccuracy,
    finalAccuracy,
    accuracyGain,
    retentionScore,
    gapClosureRate,
    meanTimeToCloseGap,
    medianTimeToCloseGap,
    meanSessionsToCloseGap,
    recommendationSuccessRate,
    falsePositiveRate,
    trueImprovementRate,
    recommendationAccuracy,
    adaptiveLearningEffectiveness,
  };
}

export function computeComparison(adaptive: StudyMetrics, random: StudyMetrics): StudyComparison {
  return {
    adaptive,
    random,
    accuracyGainDiff: adaptive.accuracyGain - random.accuracyGain,
    retentionScoreDiff: adaptive.retentionScore - random.retentionScore,
    gapClosureRateDiff: adaptive.gapClosureRate - random.gapClosureRate,
  };
}

function computeInitialAccuracy(questions: StudyQuestionResult[]): number {
  const firstPerGap = new Map<string, StudyQuestionResult>();
  for (const q of questions) {
    const key = `${q.subject}::${q.topic}::${q.subtopic}`;
    if (!firstPerGap.has(key)) {
      firstPerGap.set(key, q);
    }
  }
  const firstQuestions = Array.from(firstPerGap.values());
  if (firstQuestions.length === 0) return 0;
  const correct = firstQuestions.filter((q) => q.correct).length;
  return (correct / firstQuestions.length) * 100;
}

function computeFinalAccuracy(questions: StudyQuestionResult[]): number {
  const lastPerGap = new Map<string, StudyQuestionResult>();
  for (const q of questions) {
    const key = `${q.subject}::${q.topic}::${q.subtopic}`;
    lastPerGap.set(key, q);
  }
  const lastQuestions = Array.from(lastPerGap.values());
  if (lastQuestions.length === 0) return 0;
  const correct = lastQuestions.filter((q) => q.correct).length;
  return (correct / lastQuestions.length) * 100;
}

function computeRetentionScore(validations: RecommendationValidation[]): number {
  const withAfter = validations.filter((v) => v.afterMastery > 0);
  if (withAfter.length === 0) return 0;
  return withAfter.reduce((s, v) => s + v.afterMastery, 0) / withAfter.length;
}

function computeGapClosureRate(validations: RecommendationValidation[]): number {
  if (validations.length === 0) return 0;
  const closed = validations.filter((v) => v.gain >= SUCCESS_MIN_GAIN);
  return (closed.length / validations.length) * 100;
}

function computeTimeToCloseStats(validations: RecommendationValidation[]) {
  const times = validations
    .filter((v) => v.daysToImprove !== null && v.successful)
    .map((v) => v.daysToImprove as number);

  if (times.length === 0) return { mean: 0, median: 0 };

  const mean = times.reduce((s, t) => s + t, 0) / times.length;
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return { mean, median };
}

function computeMeanSessionsToClose(validations: RecommendationValidation[]): number {
  const sessions = validations
    .filter((v) => v.sessionsToImprove !== null && v.successful)
    .map((v) => v.sessionsToImprove as number);

  return sessions.length > 0
    ? sessions.reduce((s, t) => s + t, 0) / sessions.length
    : 0;
}

function computeEffectiveness(validations: RecommendationValidation[]): number {
  if (validations.length === 0) return 0;
  const gains = validations.map((v) => v.gain);
  const sum = gains.reduce((s, g) => s + g, 0);
  return sum / validations.length;
}

export function validateRecommendation(
  beforeMastery: number,
  afterMastery: number,
  sessionsApplied: number,
  daysElapsed: number,
): { successful: boolean; failureReason: string | null } {
  const gain = afterMastery - beforeMastery;
  if (gain >= SUCCESS_MIN_GAIN && sessionsApplied <= SUCCESS_MAX_SESSIONS) {
    return { successful: true, failureReason: null };
  }
  if (gain >= SUCCESS_MIN_GAIN && daysElapsed <= SUCCESS_MAX_DAYS) {
    return { successful: true, failureReason: null };
  }
  if (gain < 0) {
    return { successful: false, failureReason: 'Mastery declined' };
  }
  if (gain < SUCCESS_MIN_GAIN) {
    return { successful: false, failureReason: `Gain of ${Math.round(gain)}% below 15% threshold` };
  }
  if (sessionsApplied > SUCCESS_MAX_SESSIONS) {
    return { successful: false, failureReason: `Took ${sessionsApplied} sessions, exceeds 3 session limit` };
  }
  if (daysElapsed > SUCCESS_MAX_DAYS) {
    return { successful: false, failureReason: `Took ${daysElapsed} days, exceeds 14 day limit` };
  }
  return { successful: false, failureReason: 'Unknown' };
}

export function detectFalsePositive(validation: RecommendationValidation): boolean {
  return validation.successful && validation.gain < SUCCESS_MIN_GAIN;
}

export function generateValidationId(): string {
  return `val_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeQuestionAccuracy(questions: StudyQuestionResult[]): number {
  if (questions.length === 0) return 0;
  const correct = questions.filter((q) => q.correct).length;
  return (correct / questions.length) * 100;
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
