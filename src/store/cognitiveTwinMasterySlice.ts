import type { StateCreator } from 'zustand';
import {
  getNodeByName,
} from '../data/knowledgeTree';
import type { KnowledgeMastery } from './cognitiveTwinTypes';
import { computeMasteryScore, computeTrend, computeForgettingScore, daysSince, hasValidQuestionMetadata } from './cognitiveTwinHelpers';
import type { CognitiveTwinState } from './cognitiveTwinStore';

export interface MasterySlice {
  masteryMap: Record<string, KnowledgeMastery>;
  updateMastery: (nodeId: string, correct: boolean, hesitation?: number) => void;
  updateMasteryForQuestion: (subject: string, topic: string, subtopic?: string, correct?: boolean, hesitation?: number) => void;
  getMastery: (nodeId: string) => KnowledgeMastery;
  getNodeMastery: (nodeId: string) => KnowledgeMastery | undefined;
}

export const createMasterySlice: StateCreator<CognitiveTwinState, [], [], MasterySlice> = (set, get) => ({
  masteryMap: {},

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
    if (!hasValidQuestionMetadata(subject, topic, subtopic)) return;

    const subjNode = getNodeByName(subject, 'subject');
    const topNode = getNodeByName(topic, 'topic');
    const subtNode = subtopic ? getNodeByName(subtopic, 'subtopic') : null;

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
});
