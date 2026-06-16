import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnalyticsState {
  overallScore: number;
  revisionHealth: string;
  predictedReadiness: string;
  subjectConfidence: { subject: string; percent: number }[];
  updateFromQuiz: (correct: number, total: number, subject: string) => void;
  getPredictedReadiness: () => string;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      overallScore: 0,
      revisionHealth: 'Needs Attention',
      predictedReadiness: 'Start practising to see prediction',
      subjectConfidence: [],

      updateFromQuiz: (correct, total, subject) => {
        const state = get();
        const newConfidence = state.subjectConfidence.map((s) =>
          s.subject === subject
            ? { ...s, percent: Math.min(100, s.percent + (correct / total) * 5 - (total - correct) * 2) }
            : s
        );
        if (!newConfidence.find((s) => s.subject === subject)) {
          newConfidence.push({ subject, percent: Math.round((correct / total) * 100) });
        }
        const avgConfidence = newConfidence.reduce((a, s) => a + s.percent, 0) / newConfidence.length;
        set({
          subjectConfidence: newConfidence,
          overallScore: Math.round(avgConfidence),
          revisionHealth: avgConfidence >= 75 ? 'Excellent' : avgConfidence >= 60 ? 'Good' : avgConfidence >= 45 ? 'Needs Attention' : 'Critical',
        });
      },

      getPredictedReadiness: () => {
        const score = get().overallScore;
        if (score === 0) return 'Start practising to see prediction';
        const days = Math.max(7, Math.round((100 - score) * 1.5));
        return `Exam Ready in ${days} Days`;
      },
    }),
    {
      name: 'lakshyam-analytics',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
