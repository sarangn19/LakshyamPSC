import type { KnowledgeNode, NodeLevel } from '../data/knowledgeTree';
import type { RetentionAssessment, AssessmentDashboard } from '../services/retentionAssessmentService';

export interface KnowledgeMastery {
  nodeId: string;
  attempts: number;
  correct: number;
  accuracy: number;
  hesitationScore: number;
  forgettingScore: number;
  masteryScore: number;
  lastPracticed: string;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
}

export type GapStatus = 'open' | 'improving' | 'closing' | 'closed' | 'retained';

export interface GapRecord {
  gapId: string;
  nodeId: string;
  subject: string;
  topic: string;
  subtopic: string;
  level: NodeLevel;
  detectedAt: string;
  initialMastery: number;
  currentMastery: number;
  bestMastery: number;
  status: GapStatus;
  recommendationCount: number;
  sessionsApplied: number;
  questionsAnswered: number;
  closedAt: string | null;
  daysToClose: number | null;
}

export interface RetentionRecord {
  gapId: string;
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  subject: string;
  topic: string;
  subtopic: string;
  masteryAtClosure: number;
  closedAt: string;
  mastery7Day: number | null;
  mastery30Day: number | null;
  mastery90Day: number | null;
  retentionRate: number;
  daysSinceClosure: number;
  lastChecked: string;
}

export interface GapLifecycle {
  gapId: string;
  nodeId: string;
  nodeName: string;
  nodePath: string[];
  level: NodeLevel;
  detectedAt: string;
  firstRecommendation: string | null;
  closedAt: string | null;
  sessionsApplied: number;
  questionsAnswered: number;
  masteryTimeline: { timestamp: string; score: number }[];
  daysToClose: number | null;
  sessionsToClose: number | null;
  reopenedCount: number;
  reopenedAt: string[];
}

export interface KnowledgeTwinMetrics {
  openGaps: number;
  closingGaps: number;
  closedGaps: number;
  gapClosureRate: number;
  averageAccuracyGain: number;
  averageDaysToClose: number;
  averageSessionsToClose: number;
  recommendationSuccessRate: number;
  recommendationFailureRate: number;
}

export interface GapScore {
  gap: GapRecord;
  node: KnowledgeNode;
  score: number;
  weaknessFactor: number;
  forgettingFactor: number;
  hesitationFactor: number;
  importanceFactor: number;
  examWeightFactor: number;
  recencyFactor: number;
}

export interface CognitiveTwinState {
  masteryMap: Record<string, KnowledgeMastery>;
  gapRecords: GapRecord[];
  gapLifecycles: GapLifecycle[];
  retentionRecords: RetentionRecord[];
  retentionAssessments: RetentionAssessment[];
  pendingNodeUpdates: { nodeId: string; correct: boolean; timestamp: string }[];
  updateMastery: (nodeId: string, correct: boolean, hesitation?: number) => void;
  updateMasteryForQuestion: (subject: string, topic: string, subtopic?: string, correct?: boolean, hesitation?: number) => void;
  getMastery: (nodeId: string) => KnowledgeMastery;
  getNodeMastery: (nodeId: string) => KnowledgeMastery | undefined;
  detectKnowledgeGaps: () => GapRecord[];
  getOpenGaps: () => GapRecord[];
  getGapsByLevel: (level: NodeLevel) => GapRecord[];
  prioritizeGaps: () => GapScore[];
  getSmallestMeaningfulGap: () => { gap: GapRecord; node: KnowledgeNode } | null;
  recordRecommendation: (gapId: string) => void;
  recordSession: (gapId: string) => void;
  recordQuestionAnswered: (gapId: string, correct: boolean) => void;
  closeGap: (gapId: string) => void;
  getGapLifecycle: (gapId: string) => GapLifecycle | undefined;
  getMetrics: () => KnowledgeTwinMetrics;
  getTopImprovingTopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getTopImprovingSubtopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getMostForgottenSubtopics: (limit?: number) => { nodeId: string; name: string; forgettingScore: number }[];
  getMostPersistentGaps: (limit?: number) => GapRecord[];
  getKnowledgeTreeData: (rootId: string) => { node: KnowledgeNode; mastery: KnowledgeMastery; children: any[] } | null;
  validateAdaptiveLearning: () => { nodeName: string; initialMastery: number; currentMastery: number; gain: number; status: string; daysToClose: number | null; sessionsToClose: number | null }[];
  getAdaptiveHealthScore: () => { score: number; level: 'Poor' | 'Fair' | 'Good' | 'Excellent'; gapClosureRate: number; recommendationSuccessRate: number; averageImprovement: number };
  runRetentionCheck: () => RetentionRecord[];
  getRetentionMetrics: () => { retainedGaps: number; lostGaps: number; reopenedGaps: number; averageRetentionRate: number; retention7Day: number; retention30Day: number; retention90Day: number; gapsAtRisk: number };
  getMostDurableLearning: (limit?: number) => { nodeName: string; subject: string; retentionRate: number; daysSinceClosure: number }[];
  scheduleRetentionAssessments: () => RetentionAssessment[];
  getDueAssessments: () => RetentionAssessment[];
  getAssessmentDashboard: () => AssessmentDashboard;
  completeAssessment: (assessmentId: string, correctCount: number, totalCount: number) => void;
  migrateFromLegacy: () => void;
  isMigrated: () => boolean;
}
