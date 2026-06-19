import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StudyGroup,
  StudySession,
  StudyQuestionResult,
  RecommendationValidation,
  StudyMetrics,
  StudyComparison,
  computeStudyMetrics,
  computeComparison,
  generateValidationId,
  detectFalsePositive,
} from '../services/studyValidationService';

export interface StudyValidationState {
  enabled: boolean;
  sessions: StudySession[];
  questionResults: StudyQuestionResult[];
  recommendationValidations: RecommendationValidation[];

  startStudy: () => void;
  stopStudy: () => void;
  recordSession: (session: StudySession) => void;
  recordQuestionResult: (result: StudyQuestionResult) => void;
  addValidation: (validation: Omit<RecommendationValidation, 'id' | 'lastCheckedAt'>) => void;
  checkFalsePositives: () => RecommendationValidation[];
  getGroupMetrics: (group: StudyGroup) => StudyMetrics;
  getComparison: () => StudyComparison;
  getGroupSessions: (group: StudyGroup) => StudySession[];
  getGroupQuestions: (group: StudyGroup) => StudyQuestionResult[];
  getGroupValidations: (group: StudyGroup) => RecommendationValidation[];
  resetStudy: () => void;
}

export const useStudyValidationStore = create<StudyValidationState>()(
  persist(
    (set, get) => ({
      enabled: false,
      sessions: [],
      questionResults: [],
      recommendationValidations: [],

      startStudy: () => set({ enabled: true }),

      stopStudy: () => set({ enabled: false }),

      recordSession: (session) =>
        set((s) => ({ sessions: [...s.sessions, session] })),

      recordQuestionResult: (result) =>
        set((s) => ({ questionResults: [...s.questionResults, result] })),

      addValidation: (validation) =>
        set((s) => ({
          recommendationValidations: [
            ...s.recommendationValidations,
            {
              ...validation,
              id: generateValidationId(),
              lastCheckedAt: new Date().toISOString(),
            },
          ],
        })),

      checkFalsePositives: () => {
        const state = get();
        const flagged = state.recommendationValidations.filter(
          (v) => v.successful && detectFalsePositive(v),
        );
        return flagged;
      },

      getGroupMetrics: (group) => {
        const state = get();
        return computeStudyMetrics(
          state.sessions.filter((s) => s.group === group),
          state.questionResults.filter((q) => q.group === group),
          state.recommendationValidations.filter((v) => v.group === group),
        );
      },

      getComparison: () => {
        const state = get();
        const adaptive = computeStudyMetrics(
          state.sessions.filter((s) => s.group === 'adaptive'),
          state.questionResults.filter((q) => q.group === 'adaptive'),
          state.recommendationValidations.filter((v) => v.group === 'adaptive'),
        );
        const random = computeStudyMetrics(
          state.sessions.filter((s) => s.group === 'random'),
          state.questionResults.filter((q) => q.group === 'random'),
          state.recommendationValidations.filter((v) => v.group === 'random'),
        );
        return computeComparison(adaptive, random);
      },

      getGroupSessions: (group) =>
        get().sessions.filter((s) => s.group === group),

      getGroupQuestions: (group) =>
        get().questionResults.filter((q) => q.group === group),

      getGroupValidations: (group) =>
        get().recommendationValidations.filter((v) => v.group === group),

      resetStudy: () =>
        set({
          enabled: false,
          sessions: [],
          questionResults: [],
          recommendationValidations: [],
        }),
    }),
    {
      name: 'lakshyam-study-validation',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        sessions: state.sessions,
        questionResults: state.questionResults,
        recommendationValidations: state.recommendationValidations,
      }),
    },
  ),
);
