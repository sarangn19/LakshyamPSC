import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KnowledgeNode, NodeLevel, getNode, getNodeByName,
  getChildren, getAncestors, getNodePath, getAllNodes,
} from '../data/knowledgeTree';

// ─── PART 3: KnowledgeMastery — tracked per node (subject, topic, subtopic) ───

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

// ─── PART 4: GapRecord ───

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

// ─── RetentionRecord ───

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

// ─── PART 7: GapLifecycle ───

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

// ─── PART 8: KnowledgeTwinMetrics ───

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

// ─── PART 5: GapScore ───

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

// ─── CONSTANTS ───

const GAP_ACCURACY_THRESHOLD = 40;
const FORGETTING_THRESHOLD = 0.6;
const HESITATION_THRESHOLD = 0.5;

// ─── Gap closure thresholds (Part 4 rules) ───
const MASTERY_OPEN_THRESHOLD = 40;
const MASTERY_IMPROVING_THRESHOLD = 60;
const MASTERY_CLOSING_THRESHOLD = 80;
const MASTERY_CLOSED_THRESHOLD = 80;
const TREND_LOOKBACK_SESSIONS = 5;

// ─── Retention constants ───
const RETENTION_EXCELLENT_THRESHOLD = 90;
const RETENTION_GOOD_THRESHOLD = 75;
const RETENTION_AT_RISK_THRESHOLD = 50;
const RETENTION_REOPEN_MASTERY_THRESHOLD = 60;
const RETENTION_CHECK_7_DAYS = 7;
const RETENTION_CHECK_30_DAYS = 30;
const RETENTION_CHECK_90_DAYS = 90;

// ─── HELPERS ───

function computeMasteryScore(accuracy: number, hesitation: number, forgetting: number): number {
  return Math.max(0, Math.min(100, accuracy * 0.6 + (1 - hesitation) * 0.2 + (1 - forgetting) * 0.2));
}

function computeTrend(m: KnowledgeMastery): 'improving' | 'declining' | 'stable' | 'unknown' {
  if (m.attempts < 3) return 'unknown';
  if (m.accuracy >= 70) return 'improving';
  if (m.accuracy <= 30) return 'declining';
  return 'stable';
}

function generateGapId(): string {
  return `gap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

function computeForgettingScore(accuracy: number, attempts: number, daysSinceLastPractice: number): number {
  if (attempts === 0) return 0.5;
  const accuracyFactor = 1 - (accuracy / 100);
  const recencyFactor = Math.min(1, daysSinceLastPractice / 30);
  return Math.round((accuracyFactor * 0.6 + recencyFactor * 0.4) * 100) / 100;
}

// ─── PART 2: Question metadata validation ───

export function hasValidQuestionMetadata(subject?: string, topic?: string, subtopic?: string): boolean {
  if (!subject || !topic) return false;
  const subjNode = getNodeByName(subject, 'subject');
  const topNode = getNodeByName(topic, 'topic');
  if (!subjNode || !topNode) return false;
  if (subtopic) {
    const subtNode = getNodeByName(subtopic, 'subtopic');
    if (!subtNode) return false;
    const ancestors = getAncestors(subtNode.id);
    if (!ancestors.some((a) => a.id === topNode.id)) return false;
  }
  return true;
}

// ─── STORE ───

import {
  scheduleAssessments,
  scoreAssessment,
  shouldReopenFromAssessment,
  getDueAssessments as getDueServiceAssessments,
  getAssessmentDashboard as getServiceAssessmentDashboard,
} from '../services/retentionAssessmentService';
import type { RetentionAssessment, AssessmentDashboard } from '../services/retentionAssessmentService';

export interface CognitiveTwinState {
  masteryMap: Record<string, KnowledgeMastery>;
  gapRecords: GapRecord[];
  gapLifecycles: GapLifecycle[];
  retentionRecords: RetentionRecord[];
  retentionAssessments: RetentionAssessment[];
  pendingNodeUpdates: { nodeId: string; correct: boolean; timestamp: string }[];

  // Part 3: Mastery updates
  updateMastery: (nodeId: string, correct: boolean, hesitation?: number) => void;
  updateMasteryForQuestion: (subject: string, topic: string, subtopic?: string, correct?: boolean, hesitation?: number) => void;
  getMastery: (nodeId: string) => KnowledgeMastery;
  getNodeMastery: (nodeId: string) => KnowledgeMastery | undefined;

  // Part 4: Gap detection
  detectKnowledgeGaps: () => GapRecord[];
  getOpenGaps: () => GapRecord[];
  getGapsByLevel: (level: NodeLevel) => GapRecord[];

  // Part 5: Priority engine
  prioritizeGaps: () => GapScore[];
  getSmallestMeaningfulGap: () => { gap: GapRecord; node: KnowledgeNode } | null;

  // Part 7: Lifecycle tracking
  recordRecommendation: (gapId: string) => void;
  recordSession: (gapId: string) => void;
  recordQuestionAnswered: (gapId: string, correct: boolean) => void;
  closeGap: (gapId: string) => void;
  getGapLifecycle: (gapId: string) => GapLifecycle | undefined;

  // Part 8: Metrics
  getMetrics: () => KnowledgeTwinMetrics;

  // Part 9: Statistics helpers
  getTopImprovingTopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getTopImprovingSubtopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getMostForgottenSubtopics: (limit?: number) => { nodeId: string; name: string; forgettingScore: number }[];
  getMostPersistentGaps: (limit?: number) => GapRecord[];

  // Part 10: Knowledge tree data
  getKnowledgeTreeData: (rootId: string) => { node: KnowledgeNode; mastery: KnowledgeMastery; children: any[] } | null;

  // Part 8: Adaptive Learning Validation
  validateAdaptiveLearning: () => { nodeName: string; initialMastery: number; currentMastery: number; gain: number; status: string; daysToClose: number | null; sessionsToClose: number | null }[];

  // Part 9: Adaptive Learning Health Score
  getAdaptiveHealthScore: () => { score: number; level: 'Poor' | 'Fair' | 'Good' | 'Excellent'; gapClosureRate: number; recommendationSuccessRate: number; averageImprovement: number };

  // Retention Layer
  runRetentionCheck: () => RetentionRecord[];
  getRetentionMetrics: () => { retainedGaps: number; lostGaps: number; reopenedGaps: number; averageRetentionRate: number; retention7Day: number; retention30Day: number; retention90Day: number; gapsAtRisk: number };
  getMostDurableLearning: (limit?: number) => { nodeName: string; subject: string; retentionRate: number; daysSinceClosure: number }[];

  // Active Retention Assessments
  scheduleRetentionAssessments: () => RetentionAssessment[];
  getDueAssessments: () => RetentionAssessment[];
  getAssessmentDashboard: () => AssessmentDashboard;
  completeAssessment: (assessmentId: string, correctCount: number, totalCount: number) => void;

  // Part 11: Migration
  migrateFromLegacy: () => void;
  isMigrated: () => boolean;
}

export const useCognitiveTwinStore = create<CognitiveTwinState>()(
  persist(
    (set, get) => ({
      masteryMap: {},
      gapRecords: [],
      gapLifecycles: [],
      retentionRecords: [],
      retentionAssessments: [],
      pendingNodeUpdates: [],

      // ─── PART 3: Mastery Updates ───

      updateMastery: (nodeId, correct, hesitation = 0) => {
        set((state) => {
          const existing: KnowledgeMastery = state.masteryMap[nodeId] || {
            nodeId, attempts: 0, correct: 0, accuracy: 0,
            hesitationScore: 0, forgettingScore: 0,
            masteryScore: 0, lastPracticed: '', trend: 'unknown',
          };
          const newAttempts = existing.attempts + 1;
          const newCorrect = existing.correct + (correct ? 1 : 0);
          const accuracy = Math.round((newCorrect / newAttempts) * 100);
          const newHesitation = existing.attempts === 0
            ? hesitation
            : (existing.hesitationScore * existing.attempts + hesitation) / newAttempts;
          const daysSinceLast = existing.lastPracticed ? daysSince(existing.lastPracticed) : 30;
          const forgetting = computeForgettingScore(accuracy, newAttempts, daysSinceLast);
          const masteryScore = computeMasteryScore(accuracy, newHesitation, forgetting);
          const updated: KnowledgeMastery = {
            nodeId, attempts: newAttempts, correct: newCorrect, accuracy,
            hesitationScore: Math.round(newHesitation * 100) / 100,
            forgettingScore: forgetting,
            masteryScore: Math.round(masteryScore),
            lastPracticed: new Date().toISOString(),
            trend: 'unknown',
          };
          updated.trend = computeTrend(updated);
          return { masteryMap: { ...state.masteryMap, [nodeId]: updated } };
        });
      },

      updateMasteryForQuestion: (subject, topic, subtopic, correct = true, hesitation = 0) => {
        // Part 2: Skip questions without valid metadata
        if (!hasValidQuestionMetadata(subject, topic, subtopic)) return;

        const subjNode = getNodeByName(subject, 'subject');
        const topNode = getNodeByName(topic, 'topic');
        const subtNode = subtopic ? getNodeByName(subtopic, 'subtopic') : null;

        // Update all levels simultaneously (Part 3 - simultaneous update)
        if (subjNode) get().updateMastery(subjNode.id, correct, hesitation);
        if (topNode) get().updateMastery(topNode.id, correct, hesitation);
        if (subtNode) get().updateMastery(subtNode.id, correct, hesitation);
      },

      getMastery: (nodeId) => {
        const m = get().masteryMap[nodeId];
        if (m) return m;
        const fallback: KnowledgeMastery = {
          nodeId, attempts: 0, correct: 0, accuracy: 0,
          hesitationScore: 0, forgettingScore: 0,
          masteryScore: 0, lastPracticed: '', trend: 'unknown',
        };
        return fallback;
      },

      getNodeMastery: (nodeId) => get().masteryMap[nodeId],

      // ─── PART 4: Gap Detection ───

      detectKnowledgeGaps: () => {
        const state = get();
        const gaps: GapRecord[] = [];

        for (const [nodeId, m] of Object.entries(state.masteryMap)) {
          const node = getNode(nodeId);
          if (!node) continue;
          if (m.attempts < 2) continue;

          const nodePath = getNodePath(nodeId);

          // Gap rules: accuracy < 40% OR forgetting > threshold OR hesitation > threshold
          const isGap = m.accuracy < GAP_ACCURACY_THRESHOLD
            || m.forgettingScore > FORGETTING_THRESHOLD
            || m.hesitationScore > HESITATION_THRESHOLD;

          // Determine status from mastery score (Part 4 rules)
          function computeStatus(score: number): GapStatus {
            if (score >= MASTERY_CLOSED_THRESHOLD) return 'closed';
            if (score >= MASTERY_CLOSING_THRESHOLD) return 'closing';
            if (score >= MASTERY_IMPROVING_THRESHOLD) return 'improving';
            return 'open';
          }

          if (!isGap) {
            const existingGap = state.gapRecords.find((g) => g.nodeId === nodeId && g.status !== 'closed');
            if (existingGap && m.masteryScore >= MASTERY_CLOSED_THRESHOLD) {
              const now = new Date().toISOString();
              const daysToClose = Math.round((Date.now() - new Date(existingGap.detectedAt).getTime()) / 86400000);
              gaps.push({
                ...existingGap,
                status: 'closed' as GapStatus,
                currentMastery: m.masteryScore,
                bestMastery: Math.max(existingGap.bestMastery, m.masteryScore),
                closedAt: now,
                daysToClose: existingGap.daysToClose ?? daysToClose,
              });
              get().closeGap(existingGap.gapId);
            }
            continue;
          }

          const existing = state.gapRecords.find((g) => g.nodeId === nodeId);
          if (existing) {
            const bestMastery = Math.max(existing.bestMastery, m.masteryScore);
            const newStatus = computeStatus(m.masteryScore);
            const now = new Date().toISOString();
            const daysToClose = newStatus === 'closed'
              ? Math.round((Date.now() - new Date(existing.detectedAt).getTime()) / 86400000)
              : null;

            gaps.push({
              ...existing,
              currentMastery: m.masteryScore,
              bestMastery,
              status: newStatus,
              closedAt: newStatus === 'closed' ? now : existing.closedAt,
              daysToClose: newStatus === 'closed' ? daysToClose : existing.daysToClose,
            });
          } else {
            const gapRecord: GapRecord = {
              gapId: generateGapId(),
              nodeId,
              subject: nodePath[0] ?? '',
              topic: nodePath[1] ?? '',
              subtopic: nodePath[2] ?? '',
              level: node.level,
              detectedAt: new Date().toISOString(),
              initialMastery: m.masteryScore,
              currentMastery: m.masteryScore,
              bestMastery: m.masteryScore,
              status: 'open',
              recommendationCount: 0,
              sessionsApplied: 0,
              questionsAnswered: 0,
              closedAt: null,
              daysToClose: null,
            };
            gaps.push(gapRecord);

            // Create lifecycle entry for new gaps
            const lifecycle: GapLifecycle = {
              gapId: gapRecord.gapId,
              nodeId,
              nodeName: node.name,
              nodePath,
              level: node.level,
              detectedAt: gapRecord.detectedAt,
              firstRecommendation: null,
              closedAt: null,
              sessionsApplied: 0,
              questionsAnswered: 0,
              masteryTimeline: [{ timestamp: gapRecord.detectedAt, score: m.masteryScore }],
              daysToClose: null,
              sessionsToClose: null,
              reopenedCount: 0,
              reopenedAt: [],
            };
            set((s) => ({ gapLifecycles: [...s.gapLifecycles, lifecycle] }));
          }
        }

        set({ gapRecords: gaps });
        return gaps;
      },

      getOpenGaps: () => get().gapRecords.filter((g) => g.status !== 'closed'),

      getGapsByLevel: (level) => get().gapRecords.filter((g) => g.level === level && g.status !== 'closed'),

      // ─── PART 5: Priority Engine ───

      prioritizeGaps: () => {
        const gaps = get().gapRecords.filter((g) => g.status !== 'closed');
        const now = Date.now();

        return gaps.map((gap) => {
          const node = getNode(gap.nodeId);
          const mastery = get().masteryMap[gap.nodeId];
          if (!node) return null;

          // Recency: how long since last practice (0-1)
          const recencyScore = mastery?.lastPracticed
            ? Math.min(1, (now - new Date(mastery.lastPracticed).getTime()) / (7 * 86400000))
            : 1;

          // Weakness: lower mastery = higher weakness score
          const weaknessScore = gap.currentMastery < 30 ? 40 : gap.currentMastery < 50 ? 25 : 10;

          // Forgetting factor
          const forgettingFactor = (mastery?.forgettingScore ?? 0) * 20;

          // Hesitation factor
          const hesitationFactor = (mastery?.hesitationScore ?? 0) * 15;

          // Importance: subtopic first, then topic, then subject
          const importanceScore = node.level === 'subtopic' ? 30 : node.level === 'topic' ? 20 : 10;

          // Exam weight (placeholder - can be enhanced with exam blueprint weights)
          const examWeight = 10;

          // Total score
          const totalScore = weaknessScore + forgettingFactor + hesitationFactor + importanceScore + examWeight + recencyScore * 10;

          return {
            gap,
            node,
            score: Math.round(totalScore),
            weaknessFactor: weaknessScore,
            forgettingFactor: Math.round(forgettingFactor),
            hesitationFactor: Math.round(hesitationFactor),
            importanceFactor: importanceScore,
            examWeightFactor: examWeight,
            recencyFactor: Math.round(recencyScore * 10),
          } as GapScore;
        }).filter(Boolean) as GapScore[];
      },

      getSmallestMeaningfulGap: () => {
        const prioritized = get().prioritizeGaps();
        if (prioritized.length === 0) return null;

        // Always target the smallest meaningful gap first: subtopic > topic > subject
        const subtopicGap = prioritized.find((p) => p.node?.level === 'subtopic');
        if (subtopicGap) return { gap: subtopicGap.gap, node: subtopicGap.node };

        const topicGap = prioritized.find((p) => p.node?.level === 'topic');
        if (topicGap) return { gap: topicGap.gap, node: topicGap.node };

        return { gap: prioritized[0].gap, node: prioritized[0].node };
      },

      // ─── PART 7: Lifecycle Tracking ───

      recordRecommendation: (gapId) => {
        set((state) => ({
          gapRecords: state.gapRecords.map((g) =>
            g.gapId === gapId ? { ...g, recommendationCount: g.recommendationCount + 1 } : g,
          ),
          gapLifecycles: state.gapLifecycles.map((l) =>
            l.gapId === gapId && !l.firstRecommendation
              ? { ...l, firstRecommendation: new Date().toISOString() }
              : l,
          ),
        }));
      },

      recordSession: (gapId) => {
        set((state) => ({
          gapRecords: state.gapRecords.map((g) =>
            g.gapId === gapId ? { ...g, sessionsApplied: g.sessionsApplied + 1 } : g,
          ),
          gapLifecycles: state.gapLifecycles.map((l) =>
            l.gapId === gapId ? { ...l, sessionsApplied: l.sessionsApplied + 1 } : l,
          ),
        }));
      },

      recordQuestionAnswered: (gapId, correct) => {
        const state = get();
        const gap = state.gapRecords.find((g) => g.gapId === gapId);
        const mastery = gap ? state.masteryMap[gap.nodeId] : undefined;
        const score = mastery?.masteryScore ?? 0;

        function gapStatusFromScore(s: number): GapStatus {
          if (s >= MASTERY_CLOSED_THRESHOLD) return 'closed';
          if (s >= MASTERY_CLOSING_THRESHOLD) return 'closing';
          if (s >= MASTERY_IMPROVING_THRESHOLD) return 'improving';
          return 'open';
        }

        const newStatus = gapStatusFromScore(score);

        set((s) => ({
          gapRecords: s.gapRecords.map((g) =>
            g.gapId === gapId
              ? {
                  ...g,
                  questionsAnswered: g.questionsAnswered + 1,
                  currentMastery: score,
                  bestMastery: Math.max(g.bestMastery, score),
                  status: newStatus,
                  closedAt: newStatus === 'closed' ? new Date().toISOString() : g.closedAt,
                  daysToClose: newStatus === 'closed' && !g.closedAt
                    ? Math.round((Date.now() - new Date(g.detectedAt).getTime()) / 86400000)
                    : g.daysToClose,
                }
              : g,
          ),
          gapLifecycles: s.gapLifecycles.map((l) =>
            l.gapId === gapId
              ? {
                  ...l,
                  questionsAnswered: l.questionsAnswered + 1,
                  masteryTimeline: [...l.masteryTimeline, { timestamp: new Date().toISOString(), score }],
                  closedAt: newStatus === 'closed' ? new Date().toISOString() : l.closedAt,
                  daysToClose: newStatus === 'closed' && !l.closedAt
                    ? Math.round((Date.now() - new Date(l.detectedAt).getTime()) / 86400000)
                    : l.daysToClose,
                  sessionsToClose: newStatus === 'closed' && !l.closedAt
                    ? l.sessionsApplied + 1
                    : l.sessionsToClose,
                }
              : l,
          ),
        }));
      },

      closeGap: (gapId) => {
        set((state) => {
          const now = new Date().toISOString();
          const gap = state.gapRecords.find((g) => g.gapId === gapId);
          const lifecycle = state.gapLifecycles.find((l) => l.gapId === gapId);
          const mastery = gap ? state.masteryMap[gap.nodeId] : undefined;
          const daysToClose = gap ? Math.round((Date.now() - new Date(gap.detectedAt).getTime()) / 86400000) : null;
          const masteryAtClosure = mastery?.masteryScore ?? gap?.bestMastery ?? 0;

          // Create retention record for newly closed gap
          const retentionRecord: RetentionRecord = {
            gapId,
            nodeId: gap?.nodeId ?? '',
            nodeName: lifecycle?.nodeName ?? '',
            nodePath: lifecycle?.nodePath ?? [],
            subject: gap?.subject ?? '',
            topic: gap?.topic ?? '',
            subtopic: gap?.subtopic ?? '',
            masteryAtClosure,
            closedAt: now,
            mastery7Day: null,
            mastery30Day: null,
            mastery90Day: null,
            retentionRate: 100,
            daysSinceClosure: 0,
            lastChecked: now,
          };

          return {
            gapRecords: state.gapRecords.map((g) =>
              g.gapId === gapId
                ? { ...g, status: 'closed' as GapStatus, currentMastery: masteryAtClosure, closedAt: now, daysToClose }
                : g,
            ),
            gapLifecycles: state.gapLifecycles.map((l) =>
              l.gapId === gapId
                ? { ...l, closedAt: now, daysToClose, sessionsToClose: l.sessionsApplied }
                : l,
            ),
            retentionRecords: state.retentionRecords.some((r) => r.gapId === gapId)
              ? state.retentionRecords.map((r) =>
                  r.gapId === gapId ? { ...r, masteryAtClosure, closedAt: now, retentionRate: 100, daysSinceClosure: 0, lastChecked: now } : r,
                )
              : [...state.retentionRecords, retentionRecord],
          };
        });
      },

      getGapLifecycle: (gapId) => get().gapLifecycles.find((l) => l.gapId === gapId),

      // ─── PART 8: Metrics ───

      getMetrics: () => {
        const gaps = get().gapRecords;
        const lifecycles = get().gapLifecycles;
        const total = gaps.length;
        const closed = gaps.filter((g) => g.status === 'closed' || g.status === 'retained').length;
        const retained = gaps.filter((g) => g.status === 'retained').length;
        const open = gaps.filter((g) => g.status === 'open').length;
        const closing = gaps.filter((g) => g.status === 'closing' || g.status === 'improving').length;

        const closedLifecycles = lifecycles.filter((l) => l.closedAt);
        const avgGain = closedLifecycles.length > 0
          ? closedLifecycles.reduce((sum, l) => {
              const first = l.masteryTimeline[0]?.score ?? 0;
              const last = l.masteryTimeline[l.masteryTimeline.length - 1]?.score ?? 0;
              return sum + (last - first);
            }, 0) / closedLifecycles.length
          : 0;

        const avgDays = closedLifecycles.length > 0
          ? closedLifecycles.reduce((sum, l) => sum + (l.daysToClose ?? 0), 0) / closedLifecycles.length
          : 0;

        const avgSessions = closedLifecycles.length > 0
          ? closedLifecycles.reduce((sum, l) => sum + (l.sessionsToClose ?? 0), 0) / closedLifecycles.length
          : 0;

        const improvedGaps = lifecycles.filter((l) => {
          const first = l.masteryTimeline[0]?.score ?? 0;
          const last = l.masteryTimeline[l.masteryTimeline.length - 1]?.score ?? 0;
          return last > first;
        }).length;

        const failedGaps = lifecycles.filter((l) => {
          if (!l.firstRecommendation) return false;
          const first = l.masteryTimeline[0]?.score ?? 0;
          const last = l.masteryTimeline[l.masteryTimeline.length - 1]?.score ?? 0;
          return last <= first && l.sessionsApplied >= 3;
        }).length;

        return {
          openGaps: open,
          closingGaps: closing,
          closedGaps: closed,
          gapClosureRate: total > 0 ? Math.round((closed / total) * 100) : 0,
          averageAccuracyGain: Math.round(avgGain),
          averageDaysToClose: Math.round(avgDays * 10) / 10,
          averageSessionsToClose: Math.round(avgSessions * 10) / 10,
          recommendationSuccessRate: lifecycles.length > 0 ? Math.round((improvedGaps / lifecycles.length) * 100) : 0,
          recommendationFailureRate: lifecycles.length > 0 ? Math.round((failedGaps / lifecycles.length) * 100) : 0,
        };
      },

      // ─── PART 9: Statistics Helpers ───

      getTopImprovingTopics: (limit = 5) => {
        const state = get();
        return Object.entries(state.masteryMap)
          .filter(([id, m]) => {
            const node = getNode(id);
            return node && node.level === 'topic' && m.attempts >= 3 && m.trend === 'improving';
          })
          .map(([nodeId, m]) => {
            const node = getNode(nodeId)!;
            const originalGap = state.gapRecords.find((g) => g.nodeId === nodeId);
            const gain = originalGap ? m.masteryScore - originalGap.initialMastery : 0;
            return { nodeId, name: node.name, gain };
          })
          .sort((a, b) => b.gain - a.gain)
          .slice(0, limit);
      },

      getTopImprovingSubtopics: (limit = 5) => {
        const state = get();
        return Object.entries(state.masteryMap)
          .filter(([id, m]) => {
            const node = getNode(id);
            return node && node.level === 'subtopic' && m.attempts >= 3 && m.trend === 'improving';
          })
          .map(([nodeId, m]) => {
            const node = getNode(nodeId)!;
            const originalGap = state.gapRecords.find((g) => g.nodeId === nodeId);
            const gain = originalGap ? m.masteryScore - originalGap.initialMastery : 0;
            return { nodeId, name: node.name, gain };
          })
          .sort((a, b) => b.gain - a.gain)
          .slice(0, limit);
      },

      getMostForgottenSubtopics: (limit = 5) => {
        return Object.entries(get().masteryMap)
          .filter(([id]) => {
            const node = getNode(id);
            return node?.level === 'subtopic';
          })
          .map(([nodeId, m]) => ({ nodeId, name: getNode(nodeId)?.name ?? nodeId, forgettingScore: m.forgettingScore }))
          .sort((a, b) => b.forgettingScore - a.forgettingScore)
          .slice(0, limit);
      },

      getMostPersistentGaps: (limit = 5) => {
        return get().gapRecords
          .filter((g) => g.status !== 'closed')
          .sort((a, b) => (b.questionsAnswered - a.questionsAnswered) || (a.currentMastery - b.currentMastery))
          .slice(0, limit);
      },

      // ─── PART 10: Knowledge Tree Data ───

      getKnowledgeTreeData: (rootId) => {
        const node = getNode(rootId);
        if (!node) return null;
        const mastery = get().masteryMap[rootId] || {
          nodeId: rootId, attempts: 0, correct: 0, accuracy: 0,
          hesitationScore: 0, forgettingScore: 0,
          masteryScore: 0, lastPracticed: '', trend: 'unknown',
        };
        const children = getChildren(rootId).map((child) => get().getKnowledgeTreeData(child.id)).filter(Boolean);
        return { node, mastery, children };
      },

      // ─── PART 8: Adaptive Learning Validation ───

      validateAdaptiveLearning: () => {
        const state = get();
        const subtopicGaps = state.gapRecords.filter((g) => g.level === 'subtopic');
        return subtopicGaps.map((gap) => {
          const node = getNode(gap.nodeId);
          const mastery = state.masteryMap[gap.nodeId];
          return {
            nodeName: node?.name ?? gap.nodeId,
            initialMastery: gap.initialMastery,
            currentMastery: gap.currentMastery,
            gain: gap.currentMastery - gap.initialMastery,
            status: gap.status,
            daysToClose: gap.daysToClose,
            sessionsToClose: gap.sessionsApplied,
          };
        });
      },

      // ─── PART 9: Adaptive Learning Health Score ───

      getAdaptiveHealthScore: () => {
        const metrics = get().getMetrics();
        const total = metrics.openGaps + metrics.closingGaps + metrics.closedGaps;
        const averageImprovement = total > 0
          ? Math.round(get().gapLifecycles.reduce((sum, l) => {
              const first = l.masteryTimeline[0]?.score ?? 0;
              const last = l.masteryTimeline[l.masteryTimeline.length - 1]?.score ?? 0;
              return sum + (last - first);
            }, 0) / total)
          : 0;

        const closure = metrics.gapClosureRate;
        const success = metrics.recommendationSuccessRate;
        const improvement = Math.min(100, Math.max(0, averageImprovement));

        const score = Math.round(
          closure * 0.35 + success * 0.35 + improvement * 0.30
        );

        let level: 'Poor' | 'Fair' | 'Good' | 'Excellent';
        if (score >= 75) level = 'Excellent';
        else if (score >= 50) level = 'Good';
        else if (score >= 25) level = 'Fair';
        else level = 'Poor';

        return {
          score,
          level,
          gapClosureRate: closure,
          recommendationSuccessRate: success,
          averageImprovement,
        };
      },

      // ─── Retention Layer ───

      runRetentionCheck: () => {
        const state = get();
        const now = Date.now();
        const updatedRecords: RetentionRecord[] = [];

        for (const record of state.retentionRecords) {
          const mastery = state.masteryMap[record.nodeId];
          const currentMastery = mastery?.masteryScore ?? 0;
          const daysSince = record.closedAt
            ? Math.round((now - new Date(record.closedAt).getTime()) / 86400000)
            : 0;

          const updated = { ...record, daysSinceClosure: daysSince, lastChecked: new Date().toISOString() };

          // Update checkpoint data based on days elapsed
          if (daysSince >= RETENTION_CHECK_7_DAYS && updated.mastery7Day === null) {
            updated.mastery7Day = currentMastery;
          }
          if (daysSince >= RETENTION_CHECK_30_DAYS && updated.mastery30Day === null) {
            updated.mastery30Day = currentMastery;
          }
          if (daysSince >= RETENTION_CHECK_90_DAYS && updated.mastery90Day === null) {
            updated.mastery90Day = currentMastery;
          }

          // Recompute retention rate using latest mastery
          const retentionBase = record.masteryAtClosure > 0 ? record.masteryAtClosure : 1;
          const retentionRate = Math.round((currentMastery / retentionBase) * 1000) / 10;
          updated.retentionRate = retentionRate;
          updatedRecords.push(updated);

          // Reopen logic: if retention is lost or mastery dropped too low
          if (
            (record.mastery7Day !== null || daysSince >= RETENTION_CHECK_7_DAYS)
            && (retentionRate < RETENTION_AT_RISK_THRESHOLD || currentMastery < RETENTION_REOPEN_MASTERY_THRESHOLD)
          ) {
            const gap = state.gapRecords.find((g) => g.gapId === record.gapId);
            if (gap && (gap.status === 'closed' || gap.status === 'retained')) {
              const reopenTimestamp = new Date().toISOString();
              set((s) => ({
                gapRecords: s.gapRecords.map((g) =>
                  g.gapId === record.gapId
                    ? { ...g, status: 'open' as GapStatus }
                    : g,
                ),
                gapLifecycles: s.gapLifecycles.map((l) =>
                  l.gapId === record.gapId
                    ? { ...l, reopenedCount: l.reopenedCount + 1, reopenedAt: [...l.reopenedAt, reopenTimestamp] }
                    : l,
                ),
              }));
            }
          } else if (
            retentionRate >= RETENTION_GOOD_THRESHOLD
            && currentMastery >= RETENTION_REOPEN_MASTERY_THRESHOLD
            && daysSince >= RETENTION_CHECK_7_DAYS
          ) {
            // Mark as retained if retention is good and enough time has passed
            const gap = state.gapRecords.find((g) => g.gapId === record.gapId);
            if (gap && gap.status === 'closed') {
              set((s) => ({
                gapRecords: s.gapRecords.map((g) =>
                  g.gapId === record.gapId ? { ...g, status: 'retained' as GapStatus } : g,
                ),
              }));
            }
          }
        }

        // Schedule active retention assessments for closed gaps
        const newAssessments = scheduleAssessments(updatedRecords, state.retentionAssessments);
        if (newAssessments.length > 0) {
          set((s) => ({ retentionAssessments: [...s.retentionAssessments, ...newAssessments] }));
        }

        set({ retentionRecords: updatedRecords });
        return updatedRecords;
      },

      getRetentionMetrics: () => {
        const state = get();
        const total = state.retentionRecords.length;
        if (total === 0) {
          return {
            retainedGaps: 0, lostGaps: 0, reopenedGaps: 0,
            averageRetentionRate: 0, retention7Day: 0,
            retention30Day: 0, retention90Day: 0, gapsAtRisk: 0,
          };
        }

        const with7Day = state.retentionRecords.filter((r) => r.mastery7Day !== null);
        const with30Day = state.retentionRecords.filter((r) => r.mastery30Day !== null);
        const with90Day = state.retentionRecords.filter((r) => r.mastery90Day !== null);

        const avgRetention = state.retentionRecords.reduce((s, r) => s + r.retentionRate, 0) / total;
        const avg7 = with7Day.length > 0 ? with7Day.reduce((s, r) => s + r.mastery7Day!, 0) / with7Day.length : 0;
        const avg30 = with30Day.length > 0 ? with30Day.reduce((s, r) => s + r.mastery30Day!, 0) / with30Day.length : 0;
        const avg90 = with90Day.length > 0 ? with90Day.reduce((s, r) => s + r.mastery90Day!, 0) / with90Day.length : 0;

        const retained = state.retentionRecords.filter((r) => r.retentionRate >= RETENTION_GOOD_THRESHOLD).length;
        const atRisk = state.retentionRecords.filter(
          (r) => r.retentionRate >= RETENTION_AT_RISK_THRESHOLD && r.retentionRate < RETENTION_GOOD_THRESHOLD,
        ).length;
        const lost = state.retentionRecords.filter((r) => r.retentionRate < RETENTION_AT_RISK_THRESHOLD).length;
        const totalReopened = state.gapLifecycles.reduce((s, l) => s + l.reopenedCount, 0);

        return {
          retainedGaps: retained,
          lostGaps: lost,
          reopenedGaps: totalReopened,
          averageRetentionRate: Math.round(avgRetention * 10) / 10,
          retention7Day: Math.round(avg7 * 10) / 10,
          retention30Day: Math.round(avg30 * 10) / 10,
          retention90Day: Math.round(avg90 * 10) / 10,
          gapsAtRisk: atRisk,
        };
      },

      getMostDurableLearning: (limit = 5) => {
        const state = get();
        return state.retentionRecords
          .filter((r) => r.daysSinceClosure >= 7)
          .sort((a, b) => b.retentionRate - a.retentionRate)
          .slice(0, limit)
          .map((r) => ({
            nodeName: r.nodeName,
            subject: r.subject,
            retentionRate: r.retentionRate,
            daysSinceClosure: r.daysSinceClosure,
          }));
      },

      // ─── Active Retention Assessments ───

      scheduleRetentionAssessments: () => {
        const state = get();
        const newAssessments = scheduleAssessments(state.retentionRecords, state.retentionAssessments);
        if (newAssessments.length > 0) {
          set((s) => ({ retentionAssessments: [...s.retentionAssessments, ...newAssessments] }));
        }
        return [...state.retentionAssessments, ...newAssessments];
      },

      getDueAssessments: () => {
        return getDueServiceAssessments(get().retentionAssessments);
      },

      getAssessmentDashboard: () => {
        return getServiceAssessmentDashboard(get().retentionAssessments);
      },

      completeAssessment: (assessmentId, correctCount, totalCount) => {
        const state = get();
        const assessment = state.retentionAssessments.find((a) => a.id === assessmentId);
        if (!assessment || assessment.status === 'completed') return;

        const record = state.retentionRecords.find((r) => r.gapId === assessment.gapId);
        const masteryAtClosure = record?.masteryAtClosure ?? 100;

        const { score, retentionRate, passed } = scoreAssessment(
          masteryAtClosure, correctCount, totalCount,
        );

        const now = new Date().toISOString();

        // Update the assessment record
        set((s) => ({
          retentionAssessments: s.retentionAssessments.map((a) =>
            a.id === assessmentId
              ? {
                  ...a,
                  assessmentDate: now,
                  score,
                  retentionRate,
                  passed,
                  status: 'completed' as const,
                }
              : a,
          ),
        }));

        // Check if gap should be reopened based on assessment
        const { reopen, reason } = shouldReopenFromAssessment(score, retentionRate);
        if (reopen) {
          set((s) => ({
            gapRecords: s.gapRecords.map((g) =>
              g.gapId === assessment.gapId
                ? { ...g, status: 'open' as GapStatus }
                : g,
            ),
            gapLifecycles: s.gapLifecycles.map((l) =>
              l.gapId === assessment.gapId
                ? { ...l, reopenedCount: l.reopenedCount + 1, reopenedAt: [...l.reopenedAt, now] }
                : l,
            ),
          }));
          console.log('[RETENTION] gap reopened:', assessment.gapId, reason);
        }

        // Update retention record with assessment-based retention rate
        if (record) {
          set((s) => ({
            retentionRecords: s.retentionRecords.map((r) =>
              r.gapId === assessment.gapId
                ? {
                    ...r,
                    retentionRate,
                    lastChecked: now,
                    [`mastery${assessment.checkpoint.replace('day', 'Day')}`]: score,
                  }
                : r,
            ),
          }));
        }
      },

      // ─── PART 11: Migration ───

      migrateFromLegacy: () => {
        const state = get();
        // If already has data, skip
        if (Object.keys(state.masteryMap).length > 0) return;

        // Subject and topic nodes are already in the tree
        // Subtopic mastery starts accumulating from new sessions
        // We initialize the tree structure without data
        const initialMastery: Record<string, KnowledgeMastery> = {};

        // Initialize all nodes with empty mastery
            const allNodes = [
          ...getAllNodes().filter((n) => n.level === 'subject'),
          ...getAllNodes().filter((n) => n.level === 'topic'),
        ].filter(Boolean);

        for (const node of allNodes) {
          initialMastery[node.id] = {
            nodeId: node.id,
            attempts: 0,
            correct: 0,
            accuracy: 0,
            hesitationScore: 0,
            forgettingScore: 0,
            masteryScore: 0,
            lastPracticed: '',
            trend: 'unknown',
          };
        }

        set({ masteryMap: initialMastery });
      },

      isMigrated: () => {
        return Object.keys(get().masteryMap).length > 0;
      },
    }),
    {
      name: 'lakshyam-cognitive-twin-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        masteryMap: state.masteryMap,
        gapRecords: state.gapRecords,
        gapLifecycles: state.gapLifecycles,
        retentionRecords: state.retentionRecords,
        retentionAssessments: state.retentionAssessments,
      }),
    }
  )
);


