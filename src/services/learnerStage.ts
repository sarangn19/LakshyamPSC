export type LearnerStage = 'discovering' | 'building' | 'mastering' | 'polishing';

export interface LearnerProfile {
  stage: LearnerStage;
  totalQuestions: number;
  streak: number;
  overallMastery: number;
  gapClosureRate: number;
  sessionCount: number;
}

export function getLearnerStage(totalQuestions: number, streak: number, overallMastery: number, gapClosureRate: number): LearnerStage {
  if (totalQuestions < 100 || streak < 3) return 'discovering';
  if (totalQuestions < 500 || streak < 14 || overallMastery < 40) return 'building';
  if (totalQuestions < 2000 || overallMastery < 75) return 'mastering';
  return 'polishing';
}

export function getLearnerProfile(): LearnerProfile {
  const stores = getLearnerStores();
  if (!stores) {
    return { stage: 'discovering', totalQuestions: 0, streak: 0, overallMastery: 0, gapClosureRate: 0, sessionCount: 0 };
  }
  const { perf, user, twin } = stores;
  const totalQuestions = perf.interactionSignals.length;
  const streak = user.streak.current;
  const metrics = twin.getMetrics();
  const overallMastery = (() => {
    const entries = Object.values(twin.masteryMap);
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((s, m) => s + m.masteryScore, 0) / entries.length);
  })();
  const sessionCount = perf.sessionOutcomes.length;
  const stage = getLearnerStage(totalQuestions, streak, overallMastery, metrics.gapClosureRate);
  return { stage, totalQuestions, streak, overallMastery, gapClosureRate: metrics.gapClosureRate, sessionCount };
}

function getLearnerStores(): { perf: any; user: any; twin: any } | null {
  try {
    const { usePerformanceStore } = require('../store/performanceStore');
    const { useUserStore } = require('../store/userStore');
    const { useCognitiveTwinStore } = require('../store/cognitiveTwinStore');
    return {
      perf: usePerformanceStore.getState(),
      user: useUserStore.getState(),
      twin: useCognitiveTwinStore.getState(),
    };
  } catch {
    return null;
  }
}

export interface StageConfig {
  gapAccuracyThreshold: number;
  forgettingThreshold: number;
  hesitationThreshold: number;
  openThreshold: number;
  weaknessWeight: number;
  forgettingWeight: number;
  coverageWeight: number;
  difficultyShift: number;
}

export function getStageConfig(stage: LearnerStage): StageConfig {
  switch (stage) {
    case 'discovering':
      return {
        gapAccuracyThreshold: 30,
        forgettingThreshold: 0.7,
        hesitationThreshold: 0.6,
        openThreshold: 30,
        weaknessWeight: 20,
        forgettingWeight: 10,
        coverageWeight: 40,
        difficultyShift: -1,
      };
    case 'building':
      return {
        gapAccuracyThreshold: 40,
        forgettingThreshold: 0.6,
        hesitationThreshold: 0.5,
        openThreshold: 40,
        weaknessWeight: 30,
        forgettingWeight: 20,
        coverageWeight: 30,
        difficultyShift: 0,
      };
    case 'mastering':
      return {
        gapAccuracyThreshold: 45,
        forgettingThreshold: 0.5,
        hesitationThreshold: 0.4,
        openThreshold: 45,
        weaknessWeight: 35,
        forgettingWeight: 30,
        coverageWeight: 20,
        difficultyShift: 1,
      };
    case 'polishing':
      return {
        gapAccuracyThreshold: 50,
        forgettingThreshold: 0.4,
        hesitationThreshold: 0.3,
        openThreshold: 50,
        weaknessWeight: 40,
        forgettingWeight: 35,
        coverageWeight: 10,
        difficultyShift: 2,
      };
  }
}
