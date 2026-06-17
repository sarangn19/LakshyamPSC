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

export interface SprintDayPlan {
  day: number;
  sessionType: string;
  title: string;
  description: string;
}

export interface SprintData {
  active: boolean;
  startDate: number;
  currentDay: number;
  completedDays: number[];
  startedDays: number[];
  dayPlans: SprintDayPlan[];
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
  sprint: SprintData;
  startSprint: () => void;
  startSprintDay: (day: number) => void;
  completeSprintDay: () => void;
  getSprintProgress: () => { currentDay: number; totalDays: number; completedCount: number; isActive: boolean; dayPlans: SprintDayPlan[] };
  abandonSprint: () => void;
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
      sprint: { active: false, startDate: 0, currentDay: 1, completedDays: [], startedDays: [], dayPlans: [] },

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

      startSprint: () => {
        const dayPlans: SprintDayPlan[] = [
          { day: 1, sessionType: 'weakness_practice', title: 'Foundation Check', description: 'Medium-difficulty MCQs on weak subjects' },
          { day: 2, sessionType: 'flashcard_review', title: 'Memory Reinforcement', description: 'All due flashcards + light MCQs' },
          { day: 3, sessionType: 'revision_reinforcement', title: 'Mixed Practice', description: 'Medium-hard MCQs across subjects' },
          { day: 4, sessionType: 'knowledge_revisit', title: 'Concept Deep-Dive', description: 'Review notes and key topics' },
          { day: 5, sessionType: 'confusion_repair', title: 'Gap Closure', description: 'Target confusion pairs and hesitation topics' },
          { day: 6, sessionType: 'exam_simulation', title: 'Full Mock', description: '45min timed exam simulation — all subjects' },
          { day: 7, sessionType: 'flashcard_review', title: 'Consolidation', description: 'Light flashcard review + easy MCQs' },
        ];
        set({ sprint: { active: true, startDate: Date.now(), currentDay: 1, completedDays: [], startedDays: [], dayPlans } });
      },

      startSprintDay: (day) => {
        const s = get().sprint;
        if (!s.active || s.startedDays.includes(day) || s.completedDays.includes(day)) return;
        set({ sprint: { ...s, startedDays: [...s.startedDays, day] } });
      },

      completeSprintDay: () => {
        const s = get().sprint;
        if (!s.active) return;
        const newCompleted = [...s.completedDays, s.currentDay];
        if (s.currentDay >= 7) {
          set({ sprint: { ...s, active: false, completedDays: newCompleted } });
        } else {
          set({ sprint: { ...s, completedDays: newCompleted, startedDays: s.startedDays.filter(d => d !== s.currentDay), currentDay: s.currentDay + 1 } });
        }
      },

      getSprintProgress: () => {
        const s = get().sprint;
        return { currentDay: s.currentDay, totalDays: 7, completedCount: s.completedDays.length, isActive: s.active, dayPlans: s.dayPlans };
      },

      abandonSprint: () => {
        set({ sprint: { active: false, startDate: 0, currentDay: 1, completedDays: [], startedDays: [], dayPlans: [] } });
      },

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
      version: 1,
      migrate: (persisted: any, version) => {
        if (version < 1) {
          if (!persisted.sprint) {
            persisted.sprint = { active: false, startDate: 0, currentDay: 1, completedDays: [], startedDays: [], dayPlans: [] };
          } else if (!persisted.sprint.startedDays) {
            persisted.sprint.startedDays = [];
          }
        }
        return persisted as PerformanceState;
      },
    }
  )
);
