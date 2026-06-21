import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConfidenceRecord } from '../services/confidenceCalibration';

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

export interface RecommendationAction {
  id: string;
  recommendationId: string;
  questionsAttempted: number;
  correctAnswers: number;
  timeSpentMinutes: number;
  completed: boolean;
  timestamp: number;
}

export interface OutcomeRecord {
  id: string;
  recommendationId?: string;
  mockBefore?: number;
  mockAfter?: number;
  score?: number;
  total?: number;
  accuracy: number;
  date: number;
  sessionType: string;
  notes?: string;
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
  alignmentScore?: number;
  recommendedSubject?: string;
  recommendedTopic?: string;
  recommendationId?: string;
}

export interface RecommendationRecord {
  id: string;
  sessionType: string;
  title: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'skipped';
  reasonFactors: string[];
  targetSubject?: string;
  targetTopic?: string;
  accuracyBefore?: number;
  accuracyAfter?: number;
  sessionCompleted?: boolean;
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
  recommendationActions: RecommendationAction[];
  outcomeRecords: OutcomeRecord[];
  confidenceRecords: ConfidenceRecord[];
  profile: UserProfile | null;
  lastProfileBuild: number | null;
  addInteractionSignal: (signal: Omit<InteractionSignal, 'id'>) => void;
  addFlashcardSignal: (signal: Omit<FlashcardSignal, 'id'>) => void;
  addSessionSignal: (signal: Omit<SessionSignal, 'id'>) => void;
  addSessionOutcome: (outcome: SessionOutcome) => void;
  addRecommendation: (rec: Omit<RecommendationRecord, 'id' | 'timestamp' | 'status'>) => string;
  markRecommendation: (id: string, status: 'accepted' | 'skipped') => void;
  updateRecommendation: (id: string, updates: Partial<Pick<RecommendationRecord, 'accuracyBefore' | 'accuracyAfter' | 'sessionCompleted' | 'targetSubject' | 'targetTopic' | 'status'>>) => void;
  addRecommendationAction: (action: Omit<RecommendationAction, 'id' | 'timestamp'>) => string;
  updateRecommendationAction: (id: string, updates: Partial<Pick<RecommendationAction, 'questionsAttempted' | 'correctAnswers' | 'timeSpentMinutes' | 'completed'>>) => void;
  addOutcomeRecord: (record: Omit<OutcomeRecord, 'id'>) => string;
  getRecommendationActions: (recommendationId: string) => RecommendationAction[];
  getOutcomesForPeriod: (startDate: number, endDate: number) => OutcomeRecord[];
  getActionCompletionRate: () => number;
  getRecommendationStats: () => {
    totalRecs: number;
    acceptedRecs: number;
    completedActions: number;
    avgAccuracyBefore?: number;
    avgAccuracyAfter?: number;
    avgAccuracyGain?: number;
  };
  getOutcomeTrend: (weeks?: number) => {
    date: number;
    mockBefore: number;
    mockAfter: number;
    accuracy: number;
  }[];
  addConfidenceRecord: (record: Omit<ConfidenceRecord, 'timestamp'>) => void;
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
      recommendationActions: [],
      outcomeRecords: [],
      confidenceRecords: [],
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
      updateRecommendation: (id, updates) =>
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      addRecommendationAction: (action) => {
        const id = `ra_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
          recommendationActions: [
            ...state.recommendationActions,
            { ...action, id, timestamp: Date.now() },
          ],
        }));
        return id;
      },

      updateRecommendationAction: (id, updates) =>
        set((state) => ({
          recommendationActions: state.recommendationActions.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      addOutcomeRecord: (record) => {
        const id = `or_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((state) => ({
          outcomeRecords: [...state.outcomeRecords, { ...record, id }],
        }));
        return id;
      },

      getRecommendationActions: (recommendationId) =>
        get().recommendationActions.filter((a) => a.recommendationId === recommendationId),

      getOutcomesForPeriod: (startDate, endDate) =>
        get().outcomeRecords.filter((o) => o.date >= startDate && o.date <= endDate),

      getActionCompletionRate: () => {
        const actions = get().recommendationActions;
        if (actions.length === 0) return 0;
        const completed = actions.filter((a) => a.completed).length;
        return completed / actions.length;
      },

      getRecommendationStats: () => {
        const recs = get().recommendations;
        const actions = get().recommendationActions;
        const totalRecs = recs.length;
        const acceptedRecs = recs.filter((r) => r.status === 'accepted').length;
        const completedActions = actions.filter((a) => a.completed).length;
        const withBefore = recs.filter((r) => r.accuracyBefore != null);
        const withAfter = recs.filter((r) => r.accuracyAfter != null);
        const avgBefore = withBefore.length > 0
          ? withBefore.reduce((s, r) => s + (r.accuracyBefore ?? 0), 0) / withBefore.length : undefined;
        const avgAfter = withAfter.length > 0
          ? withAfter.reduce((s, r) => s + (r.accuracyAfter ?? 0), 0) / withAfter.length : undefined;
        const paired = recs.filter((r) => r.accuracyBefore != null && r.accuracyAfter != null);
        const avgGain = paired.length > 0
          ? paired.reduce((s, r) => s + ((r.accuracyAfter ?? 0) - (r.accuracyBefore ?? 0)), 0) / paired.length
          : undefined;
        return { totalRecs, acceptedRecs, completedActions, avgAccuracyBefore: avgBefore, avgAccuracyAfter: avgAfter, avgAccuracyGain: avgGain };
      },

      getOutcomeTrend: (weeks = 8) => {
        const cutoff = Date.now() - weeks * 7 * 86400000;
        return get().outcomeRecords
          .filter((o) => o.date >= cutoff)
          .sort((a, b) => a.date - b.date)
          .map((o) => ({
            date: o.date,
            mockBefore: o.mockBefore ?? 0,
            mockAfter: o.mockAfter ?? 0,
            accuracy: o.accuracy,
          }));
      },

      addConfidenceRecord: (record) =>
        set((state) => ({
          confidenceRecords: [
            ...state.confidenceRecords,
            { ...record, timestamp: new Date().toISOString() },
          ],
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
