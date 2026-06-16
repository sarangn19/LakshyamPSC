import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question, EXAM_DIFFICULTY } from '../data/questions';
import { MistakeCard, SubjectProgress, Note, CurrentAffair } from '../data/mockData';
import { generateMCQs, getQuestionPoolSize } from '../services/aiMCQGenerator';
import { useUserStore } from './userStore';
import { useKnowledgeStore } from './knowledgeStore';
import { usePerformanceStore, SessionOutcome } from './performanceStore';
import { syllabus } from '../data/syllabus';

function buildEmptySubjectProgress(): SubjectProgress[] {
  return syllabus.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    completionPercent: 0,
    accuracyPercent: 0,
    confidenceScore: 0,
    revisionStatus: 'needs_attention' as const,
    lastStudied: '',
  }));
}

interface MCQState {
  currentQuestions: Question[];
  currentIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  score: { correct: number; total: number };
  mistakes: MistakeCard[];
  subjectProgress: SubjectProgress[];
  drillMode: 'daily' | 'weakness' | 'exam';
  selectedExam: string;
  sessionActive: boolean;
  timeRemaining: number;
  questionStartTime: number | null;
  reportedQuestions: string[];
  generatorPoolSize: number;
  sessionStartTime: number | null;
  sessionSubjectAccuracy: Record<string, { correct: number; total: number }>;
  sessionType: string;
  lastSessionOutcome: SessionOutcome | null;
  startDailyDrill: (exams?: string[]) => void;
  startWeaknessPractice: (exams?: string[]) => void;
  startExamMode: (examType: string) => void;
  selectAnswer: (index: number) => void;
  nextQuestion: () => void;
  addMistake: (mistake: MistakeCard) => void;
  reviewMistake: (id: string) => void;
  reportQuestion: (id: string) => void;
  setSelectedExam: (exam: string) => void;
  resetSession: () => void;
  startOrchestratedSession: (config: {
    subjects?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
    examType?: string;
    sessionType?: string;
  }) => void;
  getWeakSubjects: (exams?: string[]) => string[];
  getSubjectProgress: (subject: string) => SubjectProgress | undefined;
  getExamScore: (exam: string) => { available: number; mastered: number; accuracy: number };
  clearLastSessionOutcome: () => void;
}

export const useMCQStore = create<MCQState>()(
  persist(
    (set, get) => ({
      currentQuestions: [],
      currentIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: { correct: 0, total: 0 },
      mistakes: [],
      subjectProgress: buildEmptySubjectProgress(),
      drillMode: 'daily',
      selectedExam: 'LDC',
      sessionActive: false,
      timeRemaining: 1800,
      questionStartTime: null,
      reportedQuestions: [],
      generatorPoolSize: getQuestionPoolSize(),
      sessionStartTime: null,
      sessionSubjectAccuracy: {},
      sessionType: 'daily_drill',
      lastSessionOutcome: null,

      startDailyDrill: (exams) => {
        const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
        const topExam = targetExams[0];
        const difficulties = EXAM_DIFFICULTY[topExam] || ['easy', 'medium'];

        const difficulty = difficulties[difficulties.length - 1] === 'hard'
          ? (Math.random() > 0.4 ? 'medium' : 'hard')
          : difficulties[difficulties.length - 1] === 'medium'
            ? (Math.random() > 0.3 ? 'easy' : 'medium')
            : 'easy';

        const state = get();
        const notes = useKnowledgeStore.getState().notes;
        const userStore = useUserStore.getState();
        const weakSubjects = state.getWeakSubjects(targetExams);

        const generated = generateMCQs({
          subjects: weakSubjects.length > 0 ? weakSubjects : undefined,
          difficulty: difficulty as 'easy' | 'medium' | 'hard',
          examType: topExam,
          count: 10,
          sourceNotes: notes,
          sourceCurrentAffairs: userStore.currentAffairs.filter((ca) => ca.isImportant),
          avoidQuestionIds: state.reportedQuestions,
        });

        set({
          currentQuestions: generated,
          currentIndex: 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          drillMode: 'daily',
          sessionActive: true,
          timeRemaining: 600,
          questionStartTime: Date.now(),
          sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {},
          sessionType: 'daily_drill',
          lastSessionOutcome: null,
        });
      },

      startWeaknessPractice: (exams) => {
        const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
        const topExam = targetExams[0];
        const weakSubjects = get().getWeakSubjects(targetExams);
        const userStore = useUserStore.getState();
        const notes = useKnowledgeStore.getState().notes;

        const generated = generateMCQs({
          subjects: weakSubjects.length > 0 ? weakSubjects : undefined,
          difficulty: 'medium',
          examType: topExam,
          count: 10,
          sourceNotes: notes,
          sourceCurrentAffairs: userStore.currentAffairs,
          avoidQuestionIds: get().reportedQuestions,
        });

        set({
          currentQuestions: generated.length > 0 ? generated : generateMCQs({
            difficulty: 'easy',
            examType: topExam,
            count: 10,
            avoidQuestionIds: get().reportedQuestions,
          }),
          currentIndex: 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          drillMode: 'weakness',
          sessionActive: true,
          timeRemaining: 600,
          questionStartTime: Date.now(),
          sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {},
          sessionType: 'weakness_practice',
          lastSessionOutcome: null,
        });
      },

      startExamMode: (examType: string) => {
        const difficulties = EXAM_DIFFICULTY[examType] || ['easy', 'medium', 'hard'];
        const userStore = useUserStore.getState();
        const notes = useKnowledgeStore.getState().notes;

        const easyQs = generateMCQs({ difficulty: 'easy', examType, count: 7, sourceNotes: notes, avoidQuestionIds: get().reportedQuestions });
        const mediumQs = difficulties.includes('medium') ? generateMCQs({ difficulty: 'medium', examType, count: 8, sourceNotes: notes, avoidQuestionIds: get().reportedQuestions }) : [];
        const hardQs = difficulties.includes('hard') ? generateMCQs({ difficulty: 'hard', examType, count: 5, sourceNotes: notes, avoidQuestionIds: get().reportedQuestions }) : [];

        const combined = [...easyQs, ...mediumQs, ...hardQs].sort(() => Math.random() - 0.5).slice(0, 20);

        set({
          currentQuestions: combined.length > 0 ? combined : generateMCQs({ difficulty: 'easy', examType, count: 10 }),
          currentIndex: 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          drillMode: 'exam',
          selectedExam: examType,
          sessionActive: true,
          timeRemaining: 1800,
          questionStartTime: Date.now(),
          sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {},
          sessionType: 'exam_simulation',
          lastSessionOutcome: null,
        });
      },

      selectAnswer: (index) => {
        const state = get();
        if (state.isAnswered) return;
        const current = state.currentQuestions[state.currentIndex];
        if (!current) return;
        const isCorrect = index === current.correctAnswer;
        const timeToAnswer = state.questionStartTime ? Date.now() - state.questionStartTime : 5000;

        const subject = current.subject;
        const prevSub = state.sessionSubjectAccuracy[subject] || { correct: 0, total: 0 };
        set({
          selectedAnswer: index,
          isAnswered: true,
          score: {
            correct: state.score.correct + (isCorrect ? 1 : 0),
            total: state.score.total + 1,
          },
          sessionSubjectAccuracy: {
            ...state.sessionSubjectAccuracy,
            [subject]: {
              correct: prevSub.correct + (isCorrect ? 1 : 0),
              total: prevSub.total + 1,
            },
          },
        });

        const perf = usePerformanceStore.getState();
        perf.addInteractionSignal({
          questionId: current.id,
          topic: current.topic,
          subject: current.subject,
          postLevel: state.selectedExam.toLowerCase(),
          answeredCorrect: isCorrect,
          timeToAnswer,
          confidenceFlip: false,
          sessionTime: new Date().toISOString(),
          dayOfWeek: new Date().getDay(),
          attemptNumber: 1,
          selectedOption: index,
          correctTopic: current.topic,
        });

        if (!isCorrect) {
          const mistake: MistakeCard = {
            id: `m${Date.now()}`,
            questionId: current.id,
            questionText: current.text,
            userAnswer: current.options[index],
            correctAnswer: current.options[current.correctAnswer],
            explanation: current.explanation,
            subject: current.subject,
            topic: current.topic,
            date: new Date().toISOString(),
            reviewed: false,
            timesMistaken: 1,
          };
          get().addMistake(mistake);
        }
      },

      nextQuestion: () => {
        const state = get();
        if (state.currentIndex < state.currentQuestions.length - 1) {
          set({
            currentIndex: state.currentIndex + 1,
            selectedAnswer: null,
            isAnswered: false,
            questionStartTime: Date.now(),
          });
        } else {
          const endTime = Date.now();
          const durationMinutes = state.sessionStartTime
            ? Math.max(1, Math.round((endTime - state.sessionStartTime) / 60000))
            : 1;
          const totalQ = state.score.total;
          const correctA = state.score.correct;
          const accuracy = totalQ > 0 ? correctA / totalQ : 0;

          const subjectScores: Record<string, { correct: number; total: number; accuracy: number }> = {};
          let weakest = '';
          let strongest = '';
          let weakestAcc = 1;
          let strongestAcc = 0;
          for (const [sub, data] of Object.entries(state.sessionSubjectAccuracy)) {
            const subAcc = data.total > 0 ? data.correct / data.total : 0;
            subjectScores[sub] = { ...data, accuracy: subAcc };
            if (subAcc < weakestAcc && data.total >= 1) {
              weakestAcc = subAcc;
              weakest = sub;
            }
            if (subAcc > strongestAcc && data.total >= 1) {
              strongestAcc = subAcc;
              strongest = sub;
            }
          }

          const outcome: SessionOutcome = {
            sessionId: `so_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sessionType: state.sessionType,
            startTime: state.sessionStartTime || endTime,
            endTime,
            durationMinutes,
            totalQuestions: totalQ,
            correctAnswers: correctA,
            accuracy,
            subjectScores,
            weakestSubject: weakest,
            strongestSubject: strongest,
            difficultyMix: { easy: 0, medium: 0, hard: 0 },
          };

          const perf = usePerformanceStore.getState();
          perf.addSessionOutcome(outcome);

          set({
            sessionActive: false,
            questionStartTime: null,
            lastSessionOutcome: outcome,
          });
        }
      },

      addMistake: (mistake) =>
        set((state) => ({ mistakes: [mistake, ...state.mistakes] })),

      reviewMistake: (id) =>
        set((state) => ({
          mistakes: state.mistakes.map((m) => (m.id === id ? { ...m, reviewed: true } : m)),
        })),

      reportQuestion: (id) =>
        set((state) => ({
          reportedQuestions: state.reportedQuestions.includes(id)
            ? state.reportedQuestions
            : [...state.reportedQuestions, id],
        })),

      setSelectedExam: (exam) => set({ selectedExam: exam }),

      resetSession: () =>
        set({
          currentQuestions: [],
          currentIndex: 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          sessionActive: false,
          questionStartTime: null,
          sessionStartTime: null,
          sessionSubjectAccuracy: {},
          sessionType: 'daily_drill',
        }),

      clearLastSessionOutcome: () => set({ lastSessionOutcome: null }),

      startOrchestratedSession: (config) => {
        const examType = config.examType || useUserStore.getState().primaryExam || 'LDC';
        const difficulties = EXAM_DIFFICULTY[examType] || ['easy', 'medium'];
        const difficulty = config.difficulty || (difficulties[difficulties.length - 1] as 'easy' | 'medium' | 'hard');
        const count = config.count || 10;
        const notes = useKnowledgeStore.getState().notes;
        const userStore = useUserStore.getState();

        const generated = generateMCQs({
          subjects: config.subjects,
          difficulty,
          examType,
          count,
          sourceNotes: notes,
          sourceCurrentAffairs: userStore.currentAffairs.filter((ca) => ca.isImportant),
          avoidQuestionIds: get().reportedQuestions,
        });

        set({
          currentQuestions: generated,
          currentIndex: 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          drillMode: 'daily',
          selectedExam: examType,
          sessionActive: true,
          timeRemaining: 600,
          questionStartTime: Date.now(),
          sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {},
          sessionType: config.sessionType || 'daily_drill',
          lastSessionOutcome: null,
        });
      },

      getWeakSubjects: (exams) => {
        const subjects = get().subjectProgress;
        const threshold = exams
          ? exams.some((e) => ['Degree Level', 'University Assistant'].includes(e)) ? 65 : 60
          : 60;
        return subjects.filter((s) => s.confidenceScore < threshold).map((s) => s.subjectName);
      },

      getSubjectProgress: (subject) =>
        get().subjectProgress.find((s) => s.subjectName === subject),

      getExamScore: (exam) => {
        const mistakes = get().mistakes;
        const totalPossible = 100;
        const examMistakes = mistakes.length;
        return { available: totalPossible, mastered: Math.max(0, totalPossible - examMistakes), accuracy: 85 };
      },
    }),
    {
      name: 'lakshyam-mcq',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mistakes: state.mistakes,
        subjectProgress: state.subjectProgress,
        reportedQuestions: state.reportedQuestions,
      }),
    }
  )
);
