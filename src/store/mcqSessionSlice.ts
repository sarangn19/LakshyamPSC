import type { StateCreator } from 'zustand';
import type { MCQState } from './mcqTypes';
import { useUserStore } from './userStore';
import { useBKTStore } from './bktStore';
import { useCognitiveTwinStore } from './cognitiveTwinStore';
import { usePerformanceStore } from './performanceStore';
import { useAuthStore } from './authStore';
import { useKnowledgeStore } from './knowledgeStore';
import { generateMCQs } from '../services/aiMCQGenerator';
import { validateQuestionIntegrity } from '../services/questionValidator';
import { buildBanditContext, selectDifficulty } from '../services/contextualBandit';
import { getNextCognitiveGapTopic, getRandomSubjectAndTopic } from '../services/learningRecommendationEngine';
import { getNodeByName, getNodePath } from '../data/knowledgeTree';
import { recordPresentation, recordCorrectAnswer, recordIncorrectAnswer, getSessionFocusMetrics } from '../services/topicCoverageDiagnostics';
import { recordQuestionQualityAnswer } from '../services/questionQuality';
import { makeAdaptiveState, recordAnswer } from '../services/infinityEngine';
import { makeInitialDifficultyState, recordSessionAnswer } from '../services/sessionDifficultyAdapter';
import { getRecommendedSubjectAndTopic } from '../services/learningRecommendationEngine';
import { buildEmptySubjectProgress, trackIntegrity, resolveValidQuestion, buildSessionOutcome } from './mcqHelpers';
import type { GapRecord, GapStatus, GapLifecycle } from './cognitiveTwinStore';

export interface SessionSlice {
  currentQuestions: any[];
  currentIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  score: { correct: number; total: number };
  subjectProgress: any[];
  drillMode: 'daily' | 'weakness' | 'exam';
  selectedExam: string;
  sessionActive: boolean;
  timeRemaining: number;
  questionStartTime: number | null;
  sessionStartTime: number | null;
  sessionSubjectAccuracy: Record<string, { correct: number; total: number }>;
  sessionDifficultyCounts: { easy: number; medium: number; hard: number };
  sessionType: string;
  lastSessionOutcome: any | null;
  isGenerating: boolean;
  generationProgress: { current: number; total: number } | null;
  sessionSignals: { subject: string; topic: string; correct: boolean }[];
  sessionCoveredTopics: string[];
  sessionReduced: boolean;
  questionsSkipped: number;
  seenQuestionTexts: string[];
  recommendationId: string;
  prefetchedQuestions: any[];
  prefetchDepth: number;
  startDailyDrill: (exams?: string[], subjects?: string[]) => void;
  startWeaknessPractice: (exams?: string[]) => void;
  startExamMode: (examType: string) => void;
  selectAnswer: (index: number) => void;
  nextQuestion: () => void;
  startCustomSession: (questions: any[], startIndex?: number) => void;
  startOrchestratedSession: (config: {
    subjects?: string[]; difficulty?: 'easy' | 'medium' | 'hard';
    count?: number; examType?: string; sessionType?: string;
    recommendedSubject?: string; recommendedTopic?: string;
    recommendationId?: string;
  }) => void;
  startPracticeSession: (config: {
    subjects?: string[]; difficulty?: 'easy' | 'medium' | 'hard';
    count?: number; examType?: string;
    sourceType?: 'chapter' | 'note' | 'paste';
    noteId?: string; pastedContent?: string;
  }) => void;
  triggerPrefetch: () => void;
  endSession: () => void;
  clearLastSessionOutcome: () => void;
  resetSession: () => void;
}

export const createSessionSlice: StateCreator<MCQState, [], [], SessionSlice> = (set, get) => ({
  currentQuestions: [],
  currentIndex: 0,
  selectedAnswer: null,
  isAnswered: false,
  score: { correct: 0, total: 0 },
  subjectProgress: buildEmptySubjectProgress(),
  drillMode: 'daily',
  selectedExam: 'LDC',
  sessionActive: false,
  timeRemaining: 1800,
  questionStartTime: null,
  sessionStartTime: null,
  sessionSubjectAccuracy: {},
  sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 },
  sessionType: 'daily_drill',
  sessionSubjects: [],
  lastSessionOutcome: null,
  isGenerating: false,
  generationProgress: null,
  sessionSignals: [],
  sessionCoveredTopics: [],
  sessionReduced: false,
  questionsSkipped: 0,
  seenQuestionTexts: [],
  recommendationId: '',
  recommendationActionId: undefined,
  prefetchedQuestions: [],
  prefetchDepth: 3,

  startDailyDrill: async (exams, subjects) => {
    const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
    const weakSubjects = subjects ?? get().getWeakSubjects(targetExams);
    const twinRec = getRecommendedSubjectAndTopic();
    const recommendedSubject = (subjects && subjects.length > 0) ? subjects[0]
      : twinRec.subject || (weakSubjects.length > 0 ? weakSubjects[0] : '');
    const recommendedTopic = twinRec.topic || undefined;
    console.log('[TRACE:startDailyDrill] entered', { targetExams, recommendedSubject, recommendedTopic });
    set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: 'easy', difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), recommendedSubject, recommendedTopic, alignmentReport: null, showAlignmentFallback: false, sessionReduced: false, questionsSkipped: 0, sessionType: 'daily_drill', sessionSubjects: subjects || [], prefetchedQuestions: [] });
    const baseState = makeAdaptiveState();
    const { question, report } = await resolveValidQuestion(
      weakSubjects, [], 0, 0, 'easy', get().adaptiveState, [],
      false, recommendedSubject, recommendedTopic, targetExams,
      get().reportedQuestions, useUserStore.getState().locale,
      get().seenQuestionTexts,
    );
    console.log('[TRACE:startDailyDrill] resolveValidQuestion returned', {
      questionId: question?.id || 'null', hasReport: !!report,
    });
    if (question) {
      set({
        currentQuestions: [question], currentIndex: 0, selectedAnswer: null, isAnswered: false,
        drillMode: 'daily', sessionActive: true, questionStartTime: Date.now(), sessionStartTime: Date.now(),
        sessionSubjectAccuracy: {}, sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 }, sessionType: 'daily_drill', sessionSubjects: subjects || [], lastSessionOutcome: null,
        isGenerating: false, generationProgress: null, adaptiveState: baseState,
        alignmentReport: report, showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
      });
      const after = get();
      console.log('[TRACE:startDailyDrill] state after set', {
        questionId: after.currentQuestions[0]?.id || 'none',
        currentIndex: after.currentIndex, currentQuestionsLen: after.currentQuestions.length,
        sessionActive: after.sessionActive, isGenerating: after.isGenerating,
      });
      setTimeout(() => get().triggerPrefetch?.(), 100);
    } else {
      set({ isGenerating: false, generationProgress: null, sessionReduced: true });
      console.log('[TRACE:startDailyDrill] question is null — sessionReduced');
    }
  },

  startWeaknessPractice: async (exams) => {
    const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
    const weakSubjects = get().getWeakSubjects(targetExams);
    const recommendedSubject = weakSubjects.length > 0 ? weakSubjects[0] : '';
    set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: 'medium', difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), sessionReduced: false, questionsSkipped: 0, sessionType: 'weakness_practice' });
    const { question } = await resolveValidQuestion(
      weakSubjects, [], 0, 0, 'medium', get().adaptiveState, [],
      false, recommendedSubject, undefined, targetExams,
      get().reportedQuestions, useUserStore.getState().locale,
      get().seenQuestionTexts,
    );
    if (question) {
      set({
        currentQuestions: [question], currentIndex: 0, selectedAnswer: null, isAnswered: false,
        drillMode: 'weakness', sessionActive: true, questionStartTime: Date.now(), sessionStartTime: Date.now(),
        sessionSubjectAccuracy: {}, sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 }, sessionType: 'weakness_practice', sessionSubjects: [], lastSessionOutcome: null,
        isGenerating: false, generationProgress: null, adaptiveState: makeAdaptiveState(),
      });
      setTimeout(() => get().triggerPrefetch?.(), 100);
    } else {
      set({ isGenerating: false, generationProgress: null, sessionReduced: true });
    }
  },

  startExamMode: (examType) => {
    const difficulties = ['easy', 'medium', 'hard'];
    const lang = useUserStore.getState().locale;
    const avoidIds = [...get().reportedQuestions, ...get().disabledQuestions];
    const raw = [
      ...generateMCQs({ difficulty: 'easy', examType, count: 7, avoidQuestionIds: avoidIds, language: lang }),
      ...generateMCQs({ difficulty: 'medium', examType, count: 8, avoidQuestionIds: avoidIds, language: lang }),
      ...generateMCQs({ difficulty: 'hard', examType, count: 5, avoidQuestionIds: avoidIds, language: lang }),
    ].sort(() => Math.random() - 0.5).slice(0, 20);
    const validated = raw.filter((q) => validateQuestionIntegrity(q).valid);
    const skipped = raw.length - validated.length;
    const finalQuestions = validated.length > 0 ? validated
      : generateMCQs({ difficulty: 'easy', examType, count: 5, language: lang }).filter((q) => validateQuestionIntegrity(q).valid);
    set({
      currentQuestions: finalQuestions, currentIndex: 0, selectedAnswer: null, isAnswered: false,
      score: { correct: 0, total: 0 }, drillMode: 'exam', selectedExam: examType,
      sessionActive: true, timeRemaining: 1800, questionStartTime: Date.now(), sessionStartTime: Date.now(),
      sessionSubjectAccuracy: {}, sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 }, sessionType: 'exam_simulation', sessionSubjects: [], lastSessionOutcome: null,
      sessionReduced: skipped > 0, questionsSkipped: skipped,
    });
  },

  selectAnswer: async (index) => {
    const state = get();
    if (state.isAnswered) return;
    const current = state.currentQuestions[state.currentIndex];
    if (!current) return;
    const isCorrect = index === current.correctAnswer;
    const timeToAnswer = state.questionStartTime ? Date.now() - state.questionStartTime : 5000;
    recordPresentation(current);
    if (isCorrect) recordCorrectAnswer(current); else recordIncorrectAnswer(current);
    const subject = current.subject;
    const prevSub = state.sessionSubjectAccuracy[subject] || { correct: 0, total: 0 };
    const newTotal = state.score.total + 1;
    const newCorrect = state.score.correct + (isCorrect ? 1 : 0);
    const newSignals = [...state.sessionSignals, { subject: current.subject, topic: current.topic, correct: isCorrect }];
    const updatedAdaptive = recordAnswer(state.adaptiveState, current.text, current.topic, current.subject, isCorrect, current.id, current.subtopic);
    const updatedDiffSession = recordSessionAnswer(state.difficultySessionState, isCorrect);
    const diff = current.difficulty || 'medium';
    const prevDiff = state.sessionDifficultyCounts[diff] || 0;
    set({
      selectedAnswer: index, isAnswered: true,
      score: { correct: newCorrect, total: newTotal },
      seenQuestionTexts: state.seenQuestionTexts.includes(current.text)
        ? state.seenQuestionTexts : [...state.seenQuestionTexts, current.text].slice(-500),
      sessionSubjectAccuracy: { ...state.sessionSubjectAccuracy, [subject]: { correct: prevSub.correct + (isCorrect ? 1 : 0), total: prevSub.total + 1 } },
      sessionDifficultyCounts: { ...state.sessionDifficultyCounts, [diff]: prevDiff + 1 },
      sessionSignals: newSignals,
      currentDifficulty: updatedDiffSession.currentDifficulty,
      difficultySessionState: updatedDiffSession,
      adaptiveState: updatedAdaptive,
    });
    const last5 = newSignals.slice(-5);
    const sessionAcc = last5.length > 0 ? last5.filter((s) => s.correct).length / last5.length : 0.5;
    let consecCorrect = 0; let consecIncorrect = 0;
    for (let i = newSignals.length - 1; i >= 0; i--) {
      if (newSignals[i].correct) { consecCorrect++; consecIncorrect = 0; if (consecCorrect >= 10) break; }
      else { consecIncorrect++; consecCorrect = 0; if (consecIncorrect >= 10) break; }
    }
    const bktTopic = useBKTStore.getState().getTopicPMastered(current.subject, current.topic);
    const twinMastery = (() => { try { return useCognitiveTwinStore.getState().getMetrics().overallMastery; } catch { return 50; } })();
    const streak = useUserStore.getState().streak?.current ?? 0;
    const normTta = Math.min(1, timeToAnswer / 30000);
    let reward = isCorrect ? 1.0 : -0.5;
    if (isCorrect && timeToAnswer < 5000) reward += 0.25;
    if (!isCorrect && timeToAnswer > 20000) reward -= 0.25;
    reward = Math.max(-1, Math.min(1, reward));
    const ctx = buildBanditContext({
      pMastered: bktTopic, sessionAccuracy: sessionAcc, avgTimeToAnswer: normTta,
      overallMastery: twinMastery, consecutiveCorrect: consecCorrect,
      consecutiveIncorrect: consecIncorrect, streakDays: streak,
    });
    if (useAuthStore.getState().isFeatureEnabled('advanced_difficulty_engine')) {
      const { bandit } = await import('../services/contextualBandit');
      bandit.recordReward(ctx, current.difficulty, reward);
    }
    const perfSignals = usePerformanceStore.getState().interactionSignals;
    const overallAcc = perfSignals.length > 0
      ? perfSignals.filter((s: any) => s.answeredCorrect).length / perfSignals.length : 0.5;
    const qKey = `${current.subject}::${current.topic}::${current.text.slice(0, 40)}`;
    recordQuestionQualityAnswer(qKey, current.subject, current.topic, current.difficulty, isCorrect, timeToAnswer, overallAcc, {});
    const perf = usePerformanceStore.getState();
    perf.addInteractionSignal({
      questionId: current.id, topic: current.topic, subject: current.subject,
      postLevel: state.selectedExam.toLowerCase(), answeredCorrect: isCorrect, timeToAnswer,
      confidenceFlip: false, sessionTime: new Date().toISOString(), dayOfWeek: new Date().getDay(),
      attemptNumber: 1, selectedOption: index, correctTopic: current.topic,
    });
    useBKTStore.getState().updateTopic(current.subject, current.topic, isCorrect, current.subtopic);
    if (current.subtopic) {
      const twin = useCognitiveTwinStore.getState();
      const subtopicNode = getNodeByName(current.subtopic, 'subtopic');
      if (subtopicNode) {
        const mastery = twin.getMastery(subtopicNode.id);
        if (mastery.attempts >= 2) {
          const isGap = mastery.accuracy < 40 || mastery.forgettingScore > 0.6 || mastery.hesitationScore > 0.5;
          const existingGap = twin.gapRecords.find((g) => g.nodeId === subtopicNode.id && g.status !== 'closed');
          if (isGap && !existingGap) {
            const nodePath = getNodePath(subtopicNode.id) ?? [];
            const newGap: GapRecord = {
              gapId: `gap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              nodeId: subtopicNode.id, subject: nodePath[0] ?? '', topic: nodePath[1] ?? '',
              subtopic: nodePath[2] ?? '', level: 'subtopic', detectedAt: new Date().toISOString(),
              initialMastery: mastery.masteryScore, currentMastery: mastery.masteryScore,
              bestMastery: mastery.masteryScore,
              status: (mastery.masteryScore < 40 ? 'open' : mastery.masteryScore < 60 ? 'improving' : mastery.masteryScore < 80 ? 'closing' : 'closed') as any,
              recommendationCount: 0, sessionsApplied: 0, questionsAnswered: 1, closedAt: null, daysToClose: null,
            };
            const lifecycle = {
              gapId: newGap.gapId, nodeId: subtopicNode.id, nodeName: subtopicNode.name, nodePath,
              level: 'subtopic', detectedAt: newGap.detectedAt, firstRecommendation: null, closedAt: null,
              sessionsApplied: 0, questionsAnswered: 1,
              masteryTimeline: [{ timestamp: newGap.detectedAt, score: mastery.masteryScore }],
              daysToClose: null, sessionsToClose: null, reopenedCount: 0, reopenedAt: [],
            };
            useCognitiveTwinStore.setState((s: any) => ({
              gapRecords: [...s.gapRecords, newGap],
              gapLifecycles: [...s.gapLifecycles, lifecycle],
            }));
          } else if (existingGap) {
            const newStatus = mastery.masteryScore >= 80 ? 'closed' : mastery.masteryScore >= 60 ? 'closing' : mastery.masteryScore >= 40 ? 'improving' : 'open';
            const now = new Date().toISOString();
            const daysToClose = newStatus === 'closed' && existingGap.status !== 'closed'
              ? Math.round((Date.now() - new Date(existingGap.detectedAt).getTime()) / 86400000) : existingGap.daysToClose;
            useCognitiveTwinStore.setState((s: any) => ({
              gapRecords: s.gapRecords.map((g: any) => g.gapId === existingGap.gapId ? { ...g, currentMastery: mastery.masteryScore, bestMastery: Math.max(g.bestMastery, mastery.masteryScore), status: newStatus, questionsAnswered: g.questionsAnswered + 1, closedAt: newStatus === 'closed' ? now : g.closedAt, daysToClose } : g),
              gapLifecycles: s.gapLifecycles.map((l: any) => l.gapId === existingGap.gapId ? { ...l, questionsAnswered: l.questionsAnswered + 1, masteryTimeline: [...l.masteryTimeline, { timestamp: now, score: mastery.masteryScore }], closedAt: newStatus === 'closed' ? now : l.closedAt, daysToClose: newStatus === 'closed' ? daysToClose : l.daysToClose, sessionsToClose: newStatus === 'closed' ? l.sessionsApplied : l.sessionsToClose } : l),
            }));
          }
        }
      }
    }
    const tsKey = `${current.subject}::${current.topic}::${current.text.slice(0, 30)}`;
    const existingTs = get().trustScores.find((t) => t.questionKey === tsKey);
    if (existingTs) {
      get().updateTrustScore(tsKey, {
        learnerTotalCount: existingTs.learnerTotalCount + 1,
        learnerCorrectCount: existingTs.learnerCorrectCount + (isCorrect ? 1 : 0),
      });
    }
  },

  nextQuestion: async () => {
    const state = get();
    const current = state.currentQuestions[state.currentIndex];
    console.log('[TRACE:1] nextQuestion entered', {
      questionId: current?.id || 'none', currentIndex: state.currentIndex,
      currentQuestionsLen: state.currentQuestions.length, sessionActive: state.sessionActive,
      generatingNext: state.generatingNext, isAnswered: state.isAnswered,
    });
    if (!current) {
      console.log('[TRACE:1b] EARLY RETURN — no current question');
      return;
    }
    console.log('[TRACE:2] current question found', { questionId: current.id, text: current.text?.slice(0, 50) });
    const wasCorrect = state.selectedAnswer === current.correctAnswer;
    if (state.sessionType === 'practice') {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex < state.currentQuestions.length) {
        set({ currentIndex: nextIndex, selectedAnswer: null, isAnswered: false, questionStartTime: Date.now() });
        return;
      } else {
        const endTime = Date.now();
        const outcome = buildSessionOutcome(state, endTime);
        set({ sessionActive: false, lastSessionOutcome: outcome, currentQuestions: [], currentIndex: 0 });
        return;
      }
    }
    const covered = [...state.sessionCoveredTopics, `${current.subject}::${current.topic}`];

    // Consume from prefetched if available
    const prefetched = state.prefetchedQuestions;
    if (prefetched.length > 0) {
      const nextQ = prefetched.shift();
      set({
        currentQuestions: [nextQ], currentIndex: 0, selectedAnswer: null, isAnswered: false,
        questionStartTime: Date.now(), sessionCoveredTopics: covered,
      });
      return;
    }

    set({ generatingNext: true });
    const allWeak = get().getWeakSubjects(useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant']);
    const weakSubjects = state.sessionSubjects.length > 0
      ? state.sessionSubjects : allWeak;
    const dynamicRec = state.sessionSubjects.length > 0
      ? null : getNextCognitiveGapTopic(allWeak, covered);
    const nextSubject = dynamicRec?.subject || state.recommendedSubject;
    const nextTopic = dynamicRec?.topic || state.recommendedTopic;
    const recentSignals = usePerformanceStore.getState().interactionSignals;
    const targetExams = useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
    const last5 = state.sessionSignals.slice(-5);
    const sessionAcc = last5.length > 0 ? last5.filter((s) => s.correct).length / last5.length : 0.5;
    let consecCorrect = 0; let consecIncorrect = 0;
    for (let i = state.sessionSignals.length - 1; i >= 0; i--) {
      if (state.sessionSignals[i].correct) { consecCorrect++; consecIncorrect = 0; if (consecCorrect >= 10) break; }
      else { consecIncorrect++; consecCorrect = 0; if (consecIncorrect >= 10) break; }
    }
    const bktTopic = nextTopic ? useBKTStore.getState().getTopicPMastered(nextSubject, nextTopic) : 0.5;
    const twinMastery = (() => { try { return useCognitiveTwinStore.getState().getMetrics().overallMastery; } catch { return 50; } })();
    const streakVal = useUserStore.getState().streak?.current ?? 0;
    const banditCtx = buildBanditContext({
      pMastered: bktTopic, sessionAccuracy: sessionAcc, avgTimeToAnswer: 0.5,
      overallMastery: twinMastery, consecutiveCorrect: consecCorrect,
      consecutiveIncorrect: consecIncorrect, streakDays: streakVal,
    });
    const useAdvanced = useAuthStore.getState().isFeatureEnabled('advanced_difficulty_engine');
    const banditDifficulty = await selectDifficulty(banditCtx, useAdvanced);
    const { question, report } = await resolveValidQuestion(
      weakSubjects, covered, state.score.correct, state.score.total,
      banditDifficulty, state.adaptiveState, recentSignals, !wasCorrect,
      nextSubject, nextTopic, targetExams, state.reportedQuestions,
      useUserStore.getState().locale, state.seenQuestionTexts,
    );
    console.log('[TRACE:3] AI question generated', {
      questionId: question?.id || 'null', text: question?.text?.slice(0, 50) || 'null',
      source: question?.source || 'none', hasReport: !!report,
    });
    if (question) {
      console.log('[TRACE:4] set({...}) called', { questionId: question.id });
      set({
        currentQuestions: [question], currentIndex: 0, selectedAnswer: null, isAnswered: false,
        questionStartTime: Date.now(), sessionCoveredTopics: covered, generatingNext: false,
        adaptiveState: state.adaptiveState, alignmentReport: report,
        showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
      });
      const after = get();
      console.log('[TRACE:5] Zustand state after set', {
        questionId: after.currentQuestions[0]?.id || 'none',
        currentIndex: after.currentIndex, currentQuestionsLen: after.currentQuestions.length,
        sessionActive: after.sessionActive, generatingNext: after.generatingNext,
        isAnswered: after.isAnswered,
      });
      // Trigger prefetch for subsequent questions
      setTimeout(() => get().triggerPrefetch?.(), 100);
    } else {
      set({ generatingNext: false, sessionReduced: true, questionsSkipped: state.questionsSkipped + 1 });
    }
  },

  triggerPrefetch: async () => {
    const state = get();
    if (state.prefetchedQuestions.length >= state.prefetchDepth) return;
    if (!state.sessionActive) return;
    const current = state.currentQuestions[state.currentIndex];
    if (!current) return;
    const allWeak = get().getWeakSubjects(useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant']);
    const weakSubjects = state.sessionSubjects.length > 0 ? state.sessionSubjects : allWeak;
    const covered = state.sessionCoveredTopics;
    const targetExams = useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
    const { question } = await resolveValidQuestion(
      weakSubjects, covered, state.score.correct, state.score.total,
      state.currentDifficulty, state.adaptiveState,
      usePerformanceStore.getState().interactionSignals, true,
      state.recommendedSubject, state.recommendedTopic, targetExams,
      state.reportedQuestions, useUserStore.getState().locale,
      state.seenQuestionTexts, { priority: 'low' },
    );
    if (question) {
      const updated = [...get().prefetchedQuestions, question];
      set({ prefetchedQuestions: updated });
      if (updated.length < get().prefetchDepth) {
        setTimeout(() => get().triggerPrefetch(), 100);
      }
    }
  },

  endSession: () => {
    const state = get();
    const endTime = Date.now();
    const outcome = buildSessionOutcome(state, endTime);
    const perf = usePerformanceStore.getState();
    perf.addSessionOutcome(outcome);
    if (state.recommendationId) {
      const recs = Array.isArray(perf.recommendations) ? perf.recommendations : [];
      const rec = recs.find((r) => r.id === state.recommendationId);
      if (rec && rec.targetSubject) {
        const subjectScore = outcome.subjectScores[rec.targetSubject];
        if (subjectScore) {
          perf.updateRecommendation(state.recommendationId, {
            accuracyAfter: Math.round(subjectScore.accuracy),
            sessionCompleted: true,
          });
        }
      }
    }
    if (state.recommendationActionId) {
      const durationMinutes = state.sessionStartTime
        ? Math.max(1, Math.round((endTime - state.sessionStartTime) / 60000)) : 0;
      perf.updateRecommendationAction(state.recommendationActionId, {
        questionsAttempted: state.score.total,
        correctAnswers: state.score.correct,
        timeSpentMinutes: durationMinutes,
        completed: true,
      });
    }
    if (state.sessionType === 'exam_simulation' && state.score.total > 0) {
      const lastMockOutcomes = perf.outcomeRecords
        .filter((o) => o.sessionType === 'exam_simulation')
        .sort((a, b) => b.date - a.date);
      const mockBefore = lastMockOutcomes.length > 0
        ? lastMockOutcomes[0].mockAfter ?? lastMockOutcomes[0].accuracy
        : undefined;
      perf.addOutcomeRecord({
        recommendationId: state.recommendationId || undefined,
        mockBefore,
        mockAfter: Math.round((state.score.correct / state.score.total) * 100),
        score: state.score.correct,
        total: state.score.total,
        accuracy: state.score.total > 0 ? state.score.correct / state.score.total : 0,
        date: endTime,
        sessionType: 'exam_simulation',
      });
    }
    useBKTStore.getState().runParameterFitting();
    useCognitiveTwinStore.getState().detectKnowledgeGaps();
    useCognitiveTwinStore.getState().runRetentionCheck();
    useCognitiveTwinStore.getState().scheduleRetentionAssessments();
    set({ sessionActive: false, questionStartTime: null, lastSessionOutcome: outcome, recommendationActionId: undefined });
    if (state.sessionReduced || state.questionsSkipped > 0) {
      console.log('[INTEGRITY] session completed with reduction:', state.questionsSkipped, 'questions skipped');
    }
  },

  startCustomSession: (questions, startIndex) =>
    set({
      currentQuestions: questions, currentIndex: startIndex ?? 0, selectedAnswer: null, isAnswered: false,
      score: { correct: 0, total: 0 }, sessionActive: true, sessionType: 'practice', sessionSubjects: [], drillMode: 'daily',
      sessionSignals: [], sessionCoveredTopics: [], sessionReduced: false, questionsSkipped: 0,
      sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 },
      difficultySessionState: makeInitialDifficultyState(), currentDifficulty: 'medium',
      prefetchedQuestions: [], prefetchDepth: 3,
    }),

  startOrchestratedSession: async (config) => {
    const targetExams = config.examType ? [config.examType] : useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
    const weakSubjects = config.subjects ?? get().getWeakSubjects(targetExams);
    const twinRec = getRecommendedSubjectAndTopic();
    const recommendedSubject = (config.subjects && config.subjects.length > 0) ? config.subjects[0]
      : config.recommendedSubject || twinRec.subject || (weakSubjects.length > 0 ? weakSubjects[0] : '');
    const recommendedTopic = config.recommendedTopic || twinRec.topic || undefined;
    console.log('[TRACE:startOrchestratedSession] entered', { config, recommendedSubject, recommendedTopic });
    set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: config.difficulty || 'medium', difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), recommendedSubject, recommendedTopic, alignmentReport: null, showAlignmentFallback: false, sessionReduced: false, questionsSkipped: 0, recommendationId: config.recommendationId || '', sessionType: config.sessionType || 'orchestrated', sessionSubjects: config.subjects || [], prefetchedQuestions: [] });
    const { question, report } = await resolveValidQuestion(
      weakSubjects, [], 0, 0, config.difficulty || 'medium', get().adaptiveState, [],
      false, recommendedSubject, recommendedTopic, targetExams,
      get().reportedQuestions, useUserStore.getState().locale,
      get().seenQuestionTexts,
    );
    if (question) {
      console.log('[TRACE:startOrchestratedSession] resolveValidQuestion returned', {
        questionId: question?.id || 'null', hasReport: !!report,
      });
      const actionId = config.recommendationId
        ? usePerformanceStore.getState().addRecommendationAction({
            recommendationId: config.recommendationId,
            questionsAttempted: 0, correctAnswers: 0,
            timeSpentMinutes: 0, completed: false,
          })
        : undefined;
      set({
        currentQuestions: [question], currentIndex: 0, selectedAnswer: null, isAnswered: false,
        drillMode: 'daily', sessionActive: true, questionStartTime: Date.now(), sessionStartTime: Date.now(),
        sessionSubjectAccuracy: {}, sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 }, sessionType: config.sessionType || 'orchestrated', sessionSubjects: config.subjects || [], lastSessionOutcome: null,
        isGenerating: false, generationProgress: null, adaptiveState: makeAdaptiveState(),
        alignmentReport: report, showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
        recommendationActionId: actionId,
      });
      setTimeout(() => get().triggerPrefetch?.(), 100);
    } else {
      set({ isGenerating: false, generationProgress: null, sessionReduced: true });
    }
  },

  startPracticeSession: async (config) => {
    const lang = useUserStore.getState().locale;
    const subjects = config.subjects || ['General'];
    const avoidIds = [...get().reportedQuestions, ...get().disabledQuestions];
    const raw = generateMCQs({
      difficulty: config.difficulty || 'medium', examType: config.examType || 'LDC',
      count: config.count || 10, subjects, sourceNotes: useKnowledgeStore.getState().notes,
      avoidQuestionIds: avoidIds, language: lang,
    });
    const validated = raw.filter((q) => validateQuestionIntegrity(q).valid);
    const skipped = raw.length - validated.length;
    set({ currentQuestions: validated, currentIndex: 0, selectedAnswer: null, isAnswered: false, score: { correct: 0, total: 0 }, sessionActive: true, sessionType: 'practice', sessionSubjects: config.subjects || [], sessionSignals: [], sessionCoveredTopics: [], sessionReduced: skipped > 0, questionsSkipped: skipped, questionStartTime: Date.now(), sessionStartTime: Date.now(), sessionSubjectAccuracy: {}, sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 }, difficultySessionState: makeInitialDifficultyState(), currentDifficulty: config.difficulty || 'medium' });
  },

  clearLastSessionOutcome: () => set({ lastSessionOutcome: null }),

  resetSession: () => set({
    currentQuestions: [], currentIndex: 0, selectedAnswer: null, isAnswered: false,
    score: { correct: 0, total: 0 }, sessionActive: false, timeRemaining: 1800,
    questionStartTime: null, sessionStartTime: null, sessionSubjectAccuracy: {},
    lastSessionOutcome: null, isGenerating: false, generationProgress: null,
    sessionSignals: [], sessionCoveredTopics: [], sessionReduced: false, questionsSkipped: 0,
    sessionDifficultyCounts: { easy: 0, medium: 0, hard: 0 },
    currentDifficulty: 'easy', difficultySessionState: makeInitialDifficultyState(),
    generatingNext: false, adaptiveState: makeAdaptiveState(), sessionSubjects: [],
    recommendationActionId: undefined,
    prefetchedQuestions: [], prefetchDepth: 3,
  }),
});
