import type { StateCreator } from 'zustand';
import type { MCQState } from './mcqTypes';
import { useUserStore } from './userStore';

export interface RecommendationSlice {
  recommendedSubject: string;
  recommendedTopic: string | undefined;
  getSubjectProgress: (subject: string) => any | undefined;
  getExamScore: (exam: string) => { available: number; mastered: number; accuracy: number };
}

export const createRecommendationSlice: StateCreator<MCQState, [], [], RecommendationSlice> = (set, get) => ({
  recommendedSubject: '',
  recommendedTopic: undefined,

  getSubjectProgress: (subject) => get().subjectProgress.find((p) => p.subjectName === subject),

  getExamScore: (exam) => {
    const state = get();
    const relevant = state.subjectProgress.filter((p) => p.accuracyPercent > 0);
    const count = relevant.length;
    const mastered = relevant.filter((p) => p.accuracyPercent >= 70).length;
    const accuracy = count > 0 ? relevant.reduce((s, p) => s + p.accuracyPercent, 0) / count : 0;
    return { available: count, mastered, accuracy: Math.round(accuracy) };
  },
});
