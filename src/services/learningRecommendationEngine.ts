// learningRecommendationEngine.ts — Consolidated recommendation engine
// Replaces: cognitiveTwinRecommender, revisionEngine, infinityScorer, sessionOrchestrator

// ─── Topic & Gap Recommendation ───
export {
  getGapRecommendations,
  getUnifiedPriorities,
  getTopGapTopics,
  getSubjectGapReport,
  getCognitiveTwinSummary,
  getRetentionPriorityTopics,
  getRecommendedSubjectAndTopic,
  getNextCognitiveGapTopic,
  getRandomSubjectAndTopic,
} from './cognitiveTwinRecommender';
export type { GapRecommendation, UnifiedTopicPriority } from './cognitiveTwinRecommender';

// ─── Revision / BKT Priority ───
export { computePriorities, getTopicKnowledge, checkPrerequisites } from './revisionEngine';
export type { TopicPriority } from './revisionEngine';

// ─── Infinity Scorer (multi-factor topic scoring) ───
export {
  setScorerWeights,
  resetScorerWeights,
  getScorerWeights,
  getScorableTopics,
  computeTopicScores,
  pickBestTopic,
} from './infinityScorer';
export type { TopicScore, ScorerWeights } from './infinityScorer';

// ─── Session Orchestration ───
export { orchestrateSession, logOrchestratedSessionStart } from './sessionOrchestrator';
export type { SessionType, ActivityItem, ScoredSession, StudySessionPlan, OrchestratorInput } from './sessionOrchestrator';
