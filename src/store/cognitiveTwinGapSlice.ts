import type { StateCreator } from 'zustand';
import {
  getNode, getNodePath, getAllNodes,
} from '../data/knowledgeTree';
import { useUserStore } from './userStore';
import { getCompositeExamWeight } from '../data/examBlueprints';
import { getLearnerProfile, getStageConfig } from '../services/learnerStage';
import type { KnowledgeMastery, GapRecord, GapLifecycle, GapScore } from './cognitiveTwinTypes';
import { generateGapId, computeGapStatus } from './cognitiveTwinHelpers';
import type { CognitiveTwinState } from './cognitiveTwinStore';

function getStageConfigForLearner(): ReturnType<typeof getStageConfig> {
  try {
    const profile = getLearnerProfile();
    return getStageConfig(profile.stage);
  } catch {
    return getStageConfig('discovering');
  }
}

function getGapAccuracyThreshold(): number {
  return getStageConfigForLearner().gapAccuracyThreshold;
}

function getForgettingThreshold(): number {
  return getStageConfigForLearner().forgettingThreshold;
}

function getHesitationThreshold(): number {
  return getStageConfigForLearner().hesitationThreshold;
}

function getMasteryOpenThreshold(): number {
  return getStageConfigForLearner().openThreshold;
}

export interface GapSlice {
  gapRecords: GapRecord[];
  gapLifecycles: GapLifecycle[];
  detectKnowledgeGaps: () => GapRecord[];
  getOpenGaps: () => GapRecord[];
  getGapsByLevel: (level: string) => GapRecord[];
  prioritizeGaps: () => GapScore[];
  getSmallestMeaningfulGap: () => { gap: GapRecord; node: any } | null;
  recordRecommendation: (gapId: string) => void;
  recordSession: (gapId: string) => void;
  recordQuestionAnswered: (gapId: string, correct: boolean) => void;
  closeGap: (gapId: string) => void;
  getGapLifecycle: (gapId: string) => GapLifecycle | undefined;
}

export const createGapSlice: StateCreator<CognitiveTwinState, [], [], GapSlice> = (set, get) => ({
  gapRecords: [],
  gapLifecycles: [],

  detectKnowledgeGaps: () => {
    const state = get();
    const gaps: GapRecord[] = [];

    for (const [nodeId, m] of Object.entries(state.masteryMap)) {
      const node = getNode(nodeId);
      if (!node) continue;
      if (m.attempts < 2) continue;

      const nodePath = getNodePath(nodeId);

      const isGap = m.accuracy < getGapAccuracyThreshold()
        || m.forgettingScore > getForgettingThreshold()
        || m.hesitationScore > getHesitationThreshold();

      if (!isGap) {
        const existingGap = state.gapRecords.find((g) => g.nodeId === nodeId && g.status !== 'closed');
        if (existingGap && m.masteryScore >= 80) {
          const now = new Date().toISOString();
          const daysToClose = Math.round((Date.now() - new Date(existingGap.detectedAt).getTime()) / 86400000);
          gaps.push({
            ...existingGap,
            status: 'closed' as any,
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
        const newStatus = computeGapStatus(m.masteryScore);
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

  getGapsByLevel: (level) => get().gapRecords.filter((g: any) => g.level === level && g.status !== 'closed'),

  prioritizeGaps: () => {
    const gaps = get().gapRecords.filter((g) => g.status !== 'closed');
    const now = Date.now();
    const stageConfig = getStageConfigForLearner();
    const mMap = get().masteryMap;

    return gaps.map((gap) => {
      const node = getNode(gap.nodeId);
      const mastery = mMap[gap.nodeId];
      if (!node) return null;

      const recencyScore = mastery?.lastPracticed
        ? Math.min(1, (now - new Date(mastery.lastPracticed).getTime()) / (7 * 86400000))
        : 1;

      const weaknessScore = gap.currentMastery < 30 ? 40 : gap.currentMastery < 50 ? 25 : 10;
      const forgettingFactor = (mastery?.forgettingScore ?? 0) * (stageConfig.forgettingWeight);
      const hesitationFactor = (mastery?.hesitationScore ?? 0) * 15;

      let importanceScore = node.level === 'subtopic' ? 30 : node.level === 'topic' ? 20 : 10;

      const allNodes = getAllNodes();
      const dependents = allNodes.filter((n) => n.prerequisites?.includes(gap.nodeId));
      const unmasteredDependents = dependents.some((d) => {
        const dMastery = mMap[d.id];
        return !dMastery || dMastery.masteryScore < 60;
      });
      if (unmasteredDependents) {
        importanceScore += 15;
      }

      const targetExams = useUserStore.getState().targetExams;
      const subjectName = gap.subject;
      const topicName = gap.topic;
      const examWeight = targetExams.length > 0
        ? getCompositeExamWeight(targetExams, subjectName, topicName)
        : 5;

      const coverageBoost = gap.currentMastery < 50 ? (stageConfig.coverageWeight / 10) : 0;

      const totalScore = weaknessScore + forgettingFactor + hesitationFactor + importanceScore + examWeight + recencyScore * 10 + coverageBoost;

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

    const subtopicGap = prioritized.find((p) => p.node?.level === 'subtopic');
    if (subtopicGap) return { gap: subtopicGap.gap, node: subtopicGap.node };

    const topicGap = prioritized.find((p) => p.node?.level === 'topic');
    if (topicGap) return { gap: topicGap.gap, node: topicGap.node };

    return { gap: prioritized[0].gap, node: prioritized[0].node };
  },

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
    const newStatus = computeGapStatus(score);

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

      const retentionRecord = {
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
            ? { ...g, status: 'closed' as any, currentMastery: masteryAtClosure, closedAt: now, daysToClose }
            : g,
        ),
        gapLifecycles: state.gapLifecycles.map((l) =>
          l.gapId === gapId
            ? { ...l, closedAt: now, daysToClose, sessionsToClose: l.sessionsApplied }
            : l,
        ),
        retentionRecords: state.retentionRecords.some((r: any) => r.gapId === gapId)
          ? state.retentionRecords.map((r: any) =>
              r.gapId === gapId ? { ...r, masteryAtClosure, closedAt: now, retentionRate: 100, daysSinceClosure: 0, lastChecked: now } : r,
            )
          : [...state.retentionRecords, retentionRecord],
      };
    });
  },

  getGapLifecycle: (gapId) => get().gapLifecycles.find((l) => l.gapId === gapId),
});
