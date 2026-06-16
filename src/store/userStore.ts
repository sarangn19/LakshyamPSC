import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyGoal, StudyStreak, CurrentAffair, ExamReadiness } from '../data/mockData';
import { examTypes } from '../data/questions';

interface UserState {
  userName: string;
  targetExams: string[];
  primaryExam: string;
  examDate: string;
  dailyTargetMCQs: number;
  dailyTargetFlashcards: number;
  streak: StudyStreak;
  masteredTopics: string[];
  accuracyImprovement: number;
  currentAffairs: CurrentAffair[];
  dailyGoal: DailyGoal | null;
  examReadiness: ExamReadiness[];
  setupComplete: boolean;
  setUserName: (name: string) => void;
  toggleTargetExam: (exam: string) => void;
  setPrimaryExam: (exam: string) => void;
  setExamDate: (date: string) => void;
  completeSetup: () => void;
  updateStreak: () => void;
  markMasteredTopic: (topic: string) => void;
  getCategoryAffairs: (category: string) => CurrentAffair[];
  updateDailyGoal: (goal: Partial<DailyGoal>) => void;
  getReadinessForExam: (exam: string) => ExamReadiness | undefined;
  isExamActive: (exam: string) => boolean;
}

const emptyStreak: StudyStreak = { current: 0, longest: 0, lastStudyDate: '', dates: [] };

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userName: '',
      targetExams: [],
      primaryExam: '',
      examDate: '',
      dailyTargetMCQs: 10,
      dailyTargetFlashcards: 10,
      streak: emptyStreak,
      masteredTopics: [],
      accuracyImprovement: 0,
      currentAffairs: [],
      dailyGoal: null,
      examReadiness: [],
      setupComplete: false,

      setUserName: (name) => set({ userName: name }),

      toggleTargetExam: (exam) => {
        const state = get();
        const exists = state.targetExams.includes(exam);
        set({
          targetExams: exists
            ? state.targetExams.filter((e) => e !== exam)
            : [...state.targetExams, exam],
          primaryExam: exists && state.primaryExam === exam ? '' : state.primaryExam,
        });
      },

      setPrimaryExam: (exam) => set({ primaryExam: exam }),
      setExamDate: (date) => set({ examDate: date }),
      completeSetup: () => set({ setupComplete: true }),

      updateStreak: () => {
        const now = new Date().toISOString().split('T')[0];
        const state = get();
        const lastDate = state.streak.lastStudyDate;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = state.streak.current;
        if (lastDate === yesterday) newStreak += 1;
        else if (lastDate !== now) newStreak = 1;

        set({
          streak: {
            current: newStreak,
            longest: Math.max(newStreak, state.streak.longest),
            lastStudyDate: now,
            dates: [...state.streak.dates, now],
          },
        });
      },

      markMasteredTopic: (topic) =>
        set((state) => ({
          masteredTopics: state.masteredTopics.includes(topic)
            ? state.masteredTopics
            : [...state.masteredTopics, topic],
        })),

      getCategoryAffairs: (category) =>
        get().currentAffairs.filter((ca) => ca.category === category),

      updateDailyGoal: (goal) =>
        set((state) => ({
          dailyGoal: state.dailyGoal ? { ...state.dailyGoal, ...goal } : null,
        })),

      getReadinessForExam: (exam) =>
        get().examReadiness.find((r) => r.examName === exam),

      isExamActive: (exam) =>
        get().targetExams.includes(exam),
    }),
    {
      name: 'lakshyam-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
