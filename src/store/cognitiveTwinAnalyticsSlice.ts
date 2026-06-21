import type { StateCreator } from 'zustand';
import { getNode, getChildren } from '../data/knowledgeTree';
import type { GapRecord, KnowledgeTwinMetrics } from './cognitiveTwinTypes';
import type { CognitiveTwinState } from './cognitiveTwinStore';

export interface AnalyticsSlice {
  getMetrics: () => KnowledgeTwinMetrics;
  getTopImprovingTopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getTopImprovingSubtopics: (limit?: number) => { nodeId: string; name: string; gain: number }[];
  getMostForgottenSubtopics: (limit?: number) => { nodeId: string; name: string; forgettingScore: number }[];
  getMostPersistentGaps: (limit?: number) => GapRecord[];
  getKnowledgeTreeData: (rootId: string) => { node: any; mastery: any; children: any[] } | null;
  validateAdaptiveLearning: () => { nodeName: string; initialMastery: number; currentMastery: number; gain: number; status: string; daysToClose: number | null; sessionsToClose: number | null }[];
  getAdaptiveHealthScore: () => { score: number; level: 'Poor' | 'Fair' | 'Good' | 'Excellent'; gapClosureRate: number; recommendationSuccessRate: number; averageImprovement: number };
}

export const createAnalyticsSlice: StateCreator<CognitiveTwinState, [], [], AnalyticsSlice> = (set, get) => ({
  getMetrics: () => {
    const gaps = get().gapRecords;
    const lifecycles = get().gapLifecycles;
    const total = gaps.length;
    const closed = gaps.filter((g) => g.status === 'closed' || g.status === 'retained').length;
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

    const score = Math.round(closure * 0.35 + success * 0.35 + improvement * 0.30);

    let level: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    if (score >= 75) level = 'Excellent';
    else if (score >= 50) level = 'Good';
    else if (score >= 25) level = 'Fair';
    else level = 'Poor';

    return {
      score, level,
      gapClosureRate: closure,
      recommendationSuccessRate: success,
      averageImprovement,
    };
  },
});
