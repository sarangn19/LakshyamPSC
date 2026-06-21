import type { StateCreator } from 'zustand';
import type { MCQState, QuestionReport } from './mcqTypes';
import { shouldSampleAudit, buildAuditEntry } from '../services/questionAudit';

export interface QuestionSlice {
  reportedQuestions: string[];
  questionReports: QuestionReport[];
  disabledQuestions: string[];
  generatorPoolSize: number;
  alignmentReport: any | null;
  showAlignmentFallback: boolean;
  integrityMetrics: { passCount: number; failCount: number; fallbackCount: number; regenerationCount: number };
  bookmarkedQuestions: string[];
  bookmarkedQuestionData: Record<string, any>;
  setSelectedExam: (exam: string) => void;
  reportQuestion: (id: string) => void;
  reportQuestionWithReason: (id: string, reason: string) => void;
  toggleBookmark: (questionId: string) => void;
  getWeakSubjects: (exams?: string[]) => string[];
}

export const createQuestionSlice: StateCreator<MCQState, [], [], QuestionSlice> = (set, get) => ({
  reportedQuestions: [],
  questionReports: [],
  disabledQuestions: [],
  generatorPoolSize: 100,
  alignmentReport: null,
  showAlignmentFallback: false,
  integrityMetrics: { passCount: 0, failCount: 0, fallbackCount: 0, regenerationCount: 0 },
  bookmarkedQuestions: [],
  bookmarkedQuestionData: {},

  setSelectedExam: (exam) => set({ selectedExam: exam }),

  reportQuestion: (id) =>
    set((state) => ({
      reportedQuestions: state.reportedQuestions.includes(id)
        ? state.reportedQuestions : [...state.reportedQuestions, id],
    })),

  reportQuestionWithReason: (id, reason) => {
    const state = get();
    const current = state.currentQuestions[state.currentIndex];
    if (!current) return;
    const report: QuestionReport = {
      questionId: id, questionText: current.text, subject: current.subject,
      topic: current.topic, reason, timestamp: Date.now(),
    };
    const newReports = [...state.questionReports, report];
    const reportsForThisQ = newReports.filter((r) => r.questionId === id);
    const trustPenalty = reportsForThisQ.length;
    const shouldDisable = trustPenalty >= 3;
    const updates: any = { questionReports: newReports, reportedQuestions: state.reportedQuestions.includes(id) ? state.reportedQuestions : [...state.reportedQuestions, id] };
    if (shouldDisable && !state.disabledQuestions.includes(id)) {
      updates.disabledQuestions = [...state.disabledQuestions, id];
    }
    set(updates);
    const tsKey = `${current.subject}::${current.topic}::${current.text.slice(0, 30)}`;
    get().updateTrustScore(tsKey, { userReports: trustPenalty, subject: current.subject, topic: current.topic, questionKey: tsKey } as any);
    if (shouldSampleAudit(current.subject)) {
      const existingAuditIdx = state.auditQueue.findIndex((a) => a.questionText === current.text);
      if (existingAuditIdx >= 0) {
        const updated = [...state.auditQueue];
        updated[existingAuditIdx] = { ...updated[existingAuditIdx], reportCount: updated[existingAuditIdx].reportCount + 1, sourceType: 'reported' };
        set({ auditQueue: updated });
      } else {
        const entry = buildAuditEntry({
          questionText: current.text, options: current.options, correctAnswer: current.correctAnswer,
          explanation: current.explanation, topic: current.topic, subject: current.subject,
          generationSource: current.source ?? 'unknown', alignmentScore: 0, confidenceScore: 0,
          reportCount: trustPenalty, sourceType: 'reported',
        });
        set({ auditQueue: [...(get().auditQueue || []), entry] });
      }
    }
  },

  toggleBookmark: (questionId) =>
    set((state) => {
      const has = state.bookmarkedQuestions.includes(questionId);
      const ids = has ? state.bookmarkedQuestions.filter((id) => id !== questionId) : [...state.bookmarkedQuestions, questionId];
      const data = { ...state.bookmarkedQuestionData };
      if (has) {
        delete data[questionId];
      } else {
        const current = state.currentQuestions[state.currentIndex];
        if (current && current.id === questionId) {
          data[questionId] = { text: current.text, subject: current.subject, topic: current.topic, subtopic: current.subtopic, options: current.options, correctAnswer: current.correctAnswer, explanation: current.explanation };
        }
      }
      return { bookmarkedQuestions: ids, bookmarkedQuestionData: data };
    }),

  getWeakSubjects: (exams) => {
    const state = get();
    const targetExams = exams || ['LDC', 'Secretariat Assistant'];
    const allWeak: string[] = [];
    for (const exam of targetExams) {
      const examScore = state.getExamScore(exam);
      if (examScore && examScore.accuracy < 60) {
        const bp = (() => { try { return JSON.parse('{}'); } catch { return {} as any; } })();
      }
    }
    const subAcc = state.sessionSubjectAccuracy;
    const weak = Object.entries(subAcc)
      .filter(([, v]) => v.total >= 2 && v.correct / v.total < 0.5)
      .map(([k]) => k);
    if (weak.length > 0) return weak;
    const prog = state.subjectProgress;
    const fromProg = prog.filter((p) => p.accuracyPercent < 50).map((p) => p.subjectName);
    return fromProg.length > 0 ? fromProg : [];
  },
});
