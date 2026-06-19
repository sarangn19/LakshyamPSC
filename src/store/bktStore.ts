import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TopicKnowledge, BKTFittedParams, makeInitialKnowledge, updateKnowledge, isMastered, applyDecay, getAllScorableSubtopics, getSubtopicsForTopic, DEFAULT_BKT_PARAMS } from '../services/knowledgeEngine';
import { fitParameters } from '../services/bktFitter';

interface BKTState {
  topicMap: Record<string, TopicKnowledge>;
  fittedParams: Record<string, BKTFittedParams>;
  signalCountAtLastFit: number;
  getTopic: (subject: string, topic: string, subtopic?: string) => TopicKnowledge;
  updateTopic: (subject: string, topic: string, correct: boolean, subtopic?: string) => void;
  applyDecayToAll: () => void;
  getTopicPMastered: (subject: string, topic: string) => number;
  getLearningGaps: () => { subject: string; topic: string; subtopic: string; gap: number }[];
  getWeakestSubtopicInTopic: (subject: string, topic: string) => { subtopic: string; pMastered: number } | null;
  getAllTopicKnowledge: () => Record<string, TopicKnowledge>;
  setAllTopicKnowledge: (map: Record<string, TopicKnowledge>) => void;
  getFittedParamsForTopic: (topic: string) => BKTFittedParams;
  setFittedParams: (params: Record<string, BKTFittedParams>) => void;
  runParameterFitting: () => void;
}

export function getKey(subject: string, topic: string, subtopic?: string): string {
  return `${subject}::${topic}${subtopic ? `::${subtopic}` : ''}`;
}

export const useBKTStore = create<BKTState>()(
  persist(
    (set, get) => ({
      topicMap: {},
      fittedParams: {},
      signalCountAtLastFit: 0,

      getTopic: (subject, topic, subtopic) => {
        const key = getKey(subject, topic, subtopic);
        const existing = get().topicMap[key];
        if (existing) {
          const decayed = applyDecay(existing);
          if (decayed.pMastered !== existing.pMastered) {
            set((s) => ({ topicMap: { ...s.topicMap, [key]: decayed } }));
          }
          return decayed;
        }
        const initial = makeInitialKnowledge(subject, topic, subtopic);
        const createParams = get().fittedParams[topic];
        if (createParams) {
          initial.pMastered = createParams.pL0;
        }
        set((s) => ({ topicMap: { ...s.topicMap, [key]: initial } }));
        return initial;
      },

      updateTopic: (subject, topic, correct, subtopic) => {
        const key = getKey(subject, topic, subtopic);
        const current = get().topicMap[key] || makeInitialKnowledge(subject, topic, subtopic);
        const decayed = applyDecay(current);
        const params = get().getFittedParamsForTopic(topic);
        const updated = updateKnowledge(decayed, correct, Date.now(), params);
        set((s) => ({ topicMap: { ...s.topicMap, [key]: updated } }));
      },

      applyDecayToAll: () => {
        const now = Date.now();
        set((s) => {
          const updated: Record<string, TopicKnowledge> = {};
          for (const [key, state] of Object.entries(s.topicMap)) {
            updated[key] = applyDecay(state, now);
          }
          return { topicMap: updated };
        });
      },

      getTopicPMastered: (subject, topic) => {
        const subtopics = getSubtopicsForTopic(topic);
        if (subtopics.length === 0) {
          const k = getKey(subject, topic);
          const state = get().topicMap[k] || makeInitialKnowledge(subject, topic);
          return applyDecay(state).pMastered;
        }
        let total = 0;
        let count = 0;
        for (const st of subtopics) {
          const k = getKey(subject, topic, st);
          const state = get().topicMap[k];
          if (state) {
            total += applyDecay(state).pMastered;
            count++;
          }
        }
        if (count === 0) return DEFAULT_BKT_PARAMS.pL0;
        return total / count;
      },

      getLearningGaps: () => {
        const scorable = getAllScorableSubtopics();
        return scorable
          .map((sst) => {
            const k = getKey(sst.subject, sst.topic, sst.subtopic);
            const state = get().topicMap[k] || makeInitialKnowledge(sst.subject, sst.topic, sst.subtopic);
            const decayed = applyDecay(state);
            return {
              subject: sst.subject,
              topic: sst.topic,
              subtopic: sst.subtopic,
              gap: 1 - decayed.pMastered,
            };
          })
          .filter((g) => g.gap > 0.08)
          .sort((a, b) => b.gap - a.gap);
      },

      getWeakestSubtopicInTopic: (subject, topic) => {
        const subtopics = getSubtopicsForTopic(topic);
        let weakest = null;
        let lowestPMastered = 1;
        for (const st of subtopics) {
          const k = getKey(subject, topic, st);
          const state = get().topicMap[k] || makeInitialKnowledge(subject, topic, st);
          const decayed = applyDecay(state);
          if (decayed.pMastered < lowestPMastered) {
            lowestPMastered = decayed.pMastered;
            weakest = { subtopic: st, pMastered: decayed.pMastered };
          }
        }
        return weakest;
      },

      getAllTopicKnowledge: () => ({ ...get().topicMap }),

      setAllTopicKnowledge: (map) => set({ topicMap: map }),

      getFittedParamsForTopic: (topic) => {
        const params = get().fittedParams[topic];
        return params || DEFAULT_BKT_PARAMS;
      },

      setFittedParams: (params) => set({ fittedParams: params }),

      runParameterFitting: () => {
        const perf = require('../store/performanceStore').usePerformanceStore;
        const signals = perf.getState().interactionSignals;
        const signalCount = signals.length;
        if (signalCount - get().signalCountAtLastFit < 50) return;
        const fitted = fitParameters(signals);
        if (Object.keys(fitted).length > 0) {
          set({ fittedParams: { ...get().fittedParams, ...fitted }, signalCountAtLastFit: signalCount });
        }
      },
    }),
    {
      name: 'lakshyam-bkt',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ topicMap: state.topicMap, fittedParams: state.fittedParams, signalCountAtLastFit: state.signalCountAtLastFit }),
    }
  )
);
