import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InteractionSignal {
  id: string;
  questionId: string;
  topic: string;
  subject: string;
  postLevel: string;
  answeredCorrect: boolean;
  timeToAnswer: number;
  confidenceFlip: boolean;
  sessionTime: string;
  dayOfWeek: number;
  attemptNumber: number;
  selectedOption: number;
  correctTopic: string;
}

export interface ConfusionPair {
  topicA: string;
  topicB: string;
  frequency: number;
}

export interface FlashcardSignal {
  id: string;
  cardId: string;
  topic: string;
  subject: string;
  smRating: 'hard' | 'good' | 'easy';
  intervalDays: number;
  actualRecallDays: number;
  forgotAfterCorrect: boolean;
  timestamp: string;
}

export interface SessionSignal {
  id: string;
  date: string;
  startTime: number;
  durationMinutes: number;
  questionsAttempted: number;
  flashcardsReviewed: number;
  completedSession: boolean;
}

export interface SubjectForgetting {
  subject: string;
  avgIntervalDays: number;
  accuracyAtInterval: number;
}

export interface SubjectScore {
  correct: number;
  total: number;
  accuracy: number;
}

export interface SessionOutcome {
  sessionId: string;
  sessionType: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  subjectScores: Record<string, SubjectScore>;
  weakestSubject: string;
  strongestSubject: string;
  difficultyMix: { easy: number; medium: number; hard: number };
}

export interface RecommendationRecord {
  id: string;
  sessionType: string;
  title: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'skipped';
  reasonFactors: string[];
}

export interface UserProfile {
  targetPost: string;
  daysToExam: number;
  weakSubjects: string[];
  strongSubjects: string[];
  averageSessionMinutes: number;
  preferredStudyHour: number;
  forgettingRates: Record<string, number>;
  confusionPairs: ConfusionPair[];
  hesitationTopics: string[];
  streakDays: number;
  totalQuestionsAttempted: number;
  averageAccuracy: number;
}

interface PerformanceState {
  interactionSignals: InteractionSignal[];
  flashcardSignals: FlashcardSignal[];
  sessionSignals: SessionSignal[];
  sessionOutcomes: SessionOutcome[];
  recommendations: RecommendationRecord[];
  profile: UserProfile | null;
  lastProfileBuild: number | null;
  addInteractionSignal: (signal: Omit<InteractionSignal, 'id'>) => void;
  addFlashcardSignal: (signal: Omit<FlashcardSignal, 'id'>) => void;
  addSessionSignal: (signal: Omit<SessionSignal, 'id'>) => void;
  addSessionOutcome: (outcome: SessionOutcome) => void;
  addRecommendation: (rec: Omit<RecommendationRecord, 'id' | 'timestamp' | 'status'>) => string;
  markRecommendation: (id: string, status: 'accepted' | 'skipped') => void;
  setProfile: (profile: UserProfile) => void;
  setLastProfileBuild: (timestamp: number) => void;
  clearSignals: () => void;
  getInteractionCount: () => number;
  getSessionCount: () => number;
  getRecentSessions: (days: number) => SessionSignal[];
  getInteractionAccuracy: () => number;
  getSubjectAccuracy: (subject: string) => { correct: number; total: number };
  getPreviousOutcome: () => SessionOutcome | null;
}

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      interactionSignals: [],
      flashcardSignals: [],
      sessionSignals: [],
      sessionOutcomes: [],
      recommendations: [],
      profile: null,
      lastProfileBuild: null,

      addInteractionSignal: (signal) =>
        set((state) => ({
          interactionSignals: [
            ...state.interactionSignals,
            { ...signal, id: `is_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
          ],
        })),

      addFlashcardSignal: (signal) =>
        set((state) => ({
          flashcardSignals: [
            ...state.flashcardSignals,
            { ...signal, id: `fs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
          ],
        })),

      addSessionSignal: (signal) =>
        set((state) => ({
          sessionSignals: [
            ...state.sessionSignals,
            { ...signal, id: `ss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` },
          ],
        })),

      addSessionOutcome: (outcome) =>
        set((state) => ({
          sessionOutcomes: [...state.sessionOutcomes, outcome],
        })),

      addRecommendation: (rec) => {
        const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
          recommendations: [
            ...state.recommendations,
            { ...rec, id, timestamp: Date.now(), status: 'pending' },
          ],
        }));
        return id;
      },

      markRecommendation: (id, status) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        })),

      setProfile: (profile) => set({ profile }),

      setLastProfileBuild: (timestamp) => set({ lastProfileBuild: timestamp }),

      clearSignals: () =>
        set({ interactionSignals: [], flashcardSignals: [], sessionSignals: [], profile: null, lastProfileBuild: null }),

      getInteractionCount: () => get().interactionSignals.length,

      getSessionCount: () => get().sessionSignals.length,

      getRecentSessions: (days) => {
        const cutoff = Date.now() - days * 86400000;
        return get().sessionSignals.filter((s) => new Date(s.date).getTime() >= cutoff);
      },

      getInteractionAccuracy: () => {
        const signals = get().interactionSignals;
        if (signals.length === 0) return 0;
        return signals.filter((s) => s.answeredCorrect).length / signals.length;
      },

      getSubjectAccuracy: (subject) => {
        const signals = get().interactionSignals.filter((s) => s.subject === subject);
        return {
          correct: signals.filter((s) => s.answeredCorrect).length,
          total: signals.length,
        };
      },

      getPreviousOutcome: () => {
        const outcomes = get().sessionOutcomes;
        return outcomes.length > 0 ? outcomes[outcomes.length - 1] : null;
      },
    }),
    {
      name: 'lakshyam-performance',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
