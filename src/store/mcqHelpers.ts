import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';
import { useMCQStore } from './mcqStore';
import { useBKTStore } from './bktStore';
import { useCognitiveTwinStore } from './cognitiveTwinStore';
import { usePerformanceStore } from './performanceStore';
import { useAuthStore } from './authStore';
import { useKnowledgeStore } from './knowledgeStore';
import { syllabus } from '../data/syllabus';
import { generateMCQs } from '../services/aiMCQGenerator';
import { generateNextAdaptiveQuestion } from '../services/infinityEngine';
import { validateQuestionIntegrity } from '../services/questionValidator';
import { buildBanditContext, selectDifficulty } from '../services/contextualBandit';
import { getRecommendedSubjectAndTopic, getNextCognitiveGapTopic } from '../services/learningRecommendationEngine';
import { hasSufficientInventory, findNearestSupportedTopic, getTopicCoverageReport, recordGeneration, recordAcceptance, recordRejection, recordPresentation, recordCorrectAnswer, recordIncorrectAnswer, getSessionFocusMetrics } from '../services/topicCoverageDiagnostics';
import { isTopicReadyForRecommendation, getCoverageBreadthReport, recordAcceptedQuestion } from '../services/topicDiversityTracker';
import { getTopicMatch } from '../data/topicRelations';
import { getNodeByName, getNodePath } from '../data/knowledgeTree';
import { storeGeneratedMCQ } from '../services/questionBankStorage';
import { shouldSampleAudit, buildAuditEntry } from '../services/questionAudit';
import { recordQuestionQualityAnswer } from '../services/questionQuality';
import { getQuestionPoolSize } from '../services/aiMCQGenerator';
import { makeInitialDifficultyState, recordSessionAnswer } from '../services/sessionDifficultyAdapter';
import { makeAdaptiveState, recordAnswer } from '../services/infinityEngine';
import type { SubjectProgress } from '../data/mockData';
import { getFallbackQuestion } from '../services/questionFallback';
import { getRepositoryQuestion } from '../services/repositoryService';
import type { GapRecord, GapStatus } from './cognitiveTwinStore';
import type { QuestionSkipRecord } from '../services/skipAuditService';
import type { SessionOutcome } from './performanceStore';
import type { IntegrityMetrics, QuestionReport } from './mcqTypes';

const PERSIST_CONFIG = {
  name: 'lakshyam-mcq',
  storage: {
    getItem: async (name: string) => {
      try {
        const val = await AsyncStorage.getItem(name);
        return val;
      } catch { return null; }
    },
    setItem: async (name: string, value: string) => {
      try { await AsyncStorage.setItem(name, value); } catch {}
    },
    removeItem: async (name: string) => {
      try { await AsyncStorage.removeItem(name); } catch {}
    },
  },
  partialize: (state: any) => ({
    score: state.score,
    subjectProgress: state.subjectProgress,
    selectedExam: state.selectedExam,
    reportedQuestions: state.reportedQuestions,
    questionReports: state.questionReports,
    disabledQuestions: state.disabledQuestions,
    auditQueue: state.auditQueue,
    trustScores: state.trustScores,
    enforcementLogs: state.enforcementLogs,
    skipAuditRecords: state.skipAuditRecords,
    alignmentMetrics: state.alignmentMetrics,
    integrityMetrics: state.integrityMetrics,
    sessionFocusMetrics: state.sessionFocusMetrics,
    bookmarkedQuestions: state.bookmarkedQuestions,
    bookmarkedQuestionData: state.bookmarkedQuestionData,
    seenQuestionTexts: state.seenQuestionTexts,
    diversityDashboard: state.diversityDashboard,
    coverageDashboard: state.coverageDashboard,
  }),
};

export function buildEmptySubjectProgress(): SubjectProgress[] {
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

export function trackIntegrity(delta: Partial<IntegrityMetrics>): void {
  const s = useMCQStore.getState();
  useMCQStore.setState({ integrityMetrics: { ...s.integrityMetrics, ...delta } });
}

export function recordQuestionSkip(
  question: { subject: string; topic: string; subtopic?: string | null; source: string; id: string },
  requestedSubject: string,
  requestedTopic: string | undefined,
  rejectionCategory: any,
  rejectionReason: string,
  retryCount: number,
): void {
  const s = useMCQStore.getState();
  const record: QuestionSkipRecord = {
    timestamp: new Date().toISOString(),
    requestedSubject,
    requestedTopic,
    generatedSubject: question.subject,
    generatedTopic: question.topic,
    generatedSubtopic: question.subtopic ?? '',
    source: question.source === 'ai_generated' ? 'ai' : 'template',
    rejectionReason,
    rejectionCategory,
    retryCount,
    sessionId: s.sessionStartTime?.toString() ?? '',
  };
  useMCQStore.setState({ skipAuditRecords: [...s.skipAuditRecords, record] });
}

export async function resolveValidQuestion(
  weakSubjects: string[],
  covered: string[],
  correct: number,
  total: number,
  difficulty: 'easy' | 'medium' | 'hard',
  adaptiveState: any,
  recentSignals: any[],
  wasIncorrect: boolean,
  recommendedSubject: string,
  recommendedTopic: string | undefined,
  targetExams: string[],
  reportedQuestions: string[],
  locale: 'en' | 'ml',
  seenQuestionTexts: string[] = [],
  options?: { priority?: 'high' | 'low'; signal?: AbortSignal },
): Promise<{
  question: any | null;
  report: any | null;
  source: 'ai' | 'cache' | 'template' | 'none';
}> {
  const activeAvoid = [...reportedQuestions, ...useMCQStore.getState().disabledQuestions];
  let lastReport: any | null = null;
  let activeSubject = recommendedSubject;
  let activeTopic = recommendedTopic;
  if (activeTopic) {
    const inventoryOk = hasSufficientInventory(activeSubject, activeTopic);
    const breadthOk = isTopicReadyForRecommendation(activeSubject, activeTopic);
    if (!inventoryOk || !breadthOk) {
      const fallback = findNearestSupportedTopic(activeSubject, activeTopic);
      if (fallback) {
        activeSubject = fallback.subject;
        activeTopic = fallback.topic;
      }
    }
  }
  if (useMCQStore.getState().sessionType === 'practice') {
    return { question: null, report: null, source: 'none' };
  }
  // Phase 1: Repository-first lookup
  if (activeSubject) {
    // Force English for Constitution subjects
    const language = activeSubject === 'Constitution' ? 'en' : locale;
    const repoResult = await getRepositoryQuestion({
      subject: activeSubject,
      topic: activeTopic,
      difficulty,
      examTypes: targetExams,
      language,
    });
    if (repoResult.found && repoResult.question) {
      const q = repoResult.question;
      const integrity = validateQuestionIntegrity(q);
      if (integrity.valid && q.text) {
        const match = getTopicMatch(q.subject, q.topic, activeSubject, activeTopic);
        recordGeneration(q);
        recordAcceptance(q);
        recordAcceptedQuestion(q);
        lastReport = {
          recommendedSubject: activeSubject, recommendedTopic: activeTopic, alignmentScore: match.score,
          integrityPassed: true, integrityFailures: 0,
          confidenceScore: integrity.result.confidenceScore, sessionAccepted: true, retryCount: 0,
          questionLogs: [{ questionTopic: q.topic, questionSubject: q.subject, score: match.score, matchLabel: match.label, generationSource: 'repository' }],
        };
        return { question: q, report: lastReport, source: 'cache' };
      }
    }
  }
  for (let retry = 0; retry < 3; retry++) {
    const result = await generateNextAdaptiveQuestion(
      weakSubjects, covered, correct, total, difficulty, adaptiveState, recentSignals, wasIncorrect, seenQuestionTexts,
      { priority: options?.priority },
    );
    if (result) useMCQStore.getState().recordAlignmentAttempt(result.aligned);
    if (!result?.question) break;
    recordGeneration(result.question);
    if (seenQuestionTexts.includes(result.question.text)) {
      recordRejection(result.question);
      continue;
    }
    const integrity = validateQuestionIntegrity(result.question);
    if (!integrity.valid) {
      seenQuestionTexts.push(result.question.text);
      recordRejection(result.question);
      recordQuestionSkip(result.question, activeSubject, activeTopic, 'integrity_failure', `Integrity: ${integrity.result.failures.map((f: any) => f.reason).join('; ')}`, retry);
      trackIntegrity({ failCount: useMCQStore.getState().integrityMetrics.failCount + 1, regenerationCount: retry > 0 ? useMCQStore.getState().integrityMetrics.regenerationCount + 1 : useMCQStore.getState().integrityMetrics.regenerationCount });
      continue;
    }
    if ((weakSubjects.length > 0 && !weakSubjects.includes(result.question.subject)) || (activeSubject && result.question.subject !== activeSubject)) {
      seenQuestionTexts.push(result.question.text);
      recordRejection(result.question);
      recordQuestionSkip(result.question, activeSubject, activeTopic, 'subject_mismatch', `Expected subject in [${weakSubjects.join(', ')}] or activeSubject=${activeSubject}, got ${result.question.subject}`, retry);
      trackIntegrity({ failCount: useMCQStore.getState().integrityMetrics.failCount + 1, regenerationCount: retry > 0 ? useMCQStore.getState().integrityMetrics.regenerationCount + 1 : useMCQStore.getState().integrityMetrics.regenerationCount });
      continue;
    }
    recordAcceptance(result.question);
    recordAcceptedQuestion(result.question);
    if (integrity.result.confidenceScore >= 0.8) {
      const q = result.question;
      // Force English for Constitution subjects
      const language = activeSubject === 'Constitution' ? 'en' : locale;
      storeGeneratedMCQ({
        questionText: q.text, options: q.options, correctAnswer: q.correctAnswer,
        explanation: q.explanation || '', subject: q.subject, topic: q.topic,
        subtopic: q.subtopic, difficulty: q.difficulty, examType: targetExams[0] || 'LDC',
        language, sourceType: 'ai_generated', tags: [],
      });
    }
    const match = getTopicMatch(result.question.subject, result.question.topic, activeSubject, activeTopic);
    lastReport = {
      recommendedSubject: activeSubject, recommendedTopic: activeTopic, alignmentScore: match.score,
      integrityPassed: true, integrityFailures: 0,
      confidenceScore: integrity.result.confidenceScore, sessionAccepted: true, retryCount: retry,
      questionLogs: [{ questionTopic: result.question.topic, questionSubject: result.question.subject, score: match.score, matchLabel: match.label, generationSource: result.question.source }],
    };
    trackIntegrity({ passCount: useMCQStore.getState().integrityMetrics.passCount + 1, regenerationCount: retry > 0 ? useMCQStore.getState().integrityMetrics.regenerationCount + 1 : useMCQStore.getState().integrityMetrics.regenerationCount });
    if (shouldSampleAudit(result.question.subject)) {
      const entry = buildAuditEntry({
        questionText: result.question.text, options: result.question.options,
        correctAnswer: result.question.correctAnswer, explanation: result.question.explanation,
        topic: result.question.topic, subject: result.question.subject,
        generationSource: result.question.source, alignmentScore: match.score,
        confidenceScore: integrity.result.confidenceScore,
        sourceType: 'topic_enforced', regenerationCount: retry,
      });
      useMCQStore.setState({ auditQueue: [...(useMCQStore.getState().auditQueue || []), entry] });
    }
    return { question: result.question, report: lastReport, source: 'ai' };
  }
  // AI generation failed — use fallback chain
  // Force English for Constitution subjects
  const language = activeSubject === 'Constitution' ? 'en' : locale;
  const fallback = getFallbackQuestion(
    weakSubjects, difficulty, targetExams, language, activeSubject, activeTopic,
  );
  recordAcceptance(fallback.question);
  recordAcceptedQuestion(fallback.question);
  const integrity = validateQuestionIntegrity(fallback.question);
  const match = getTopicMatch(fallback.question.subject, fallback.question.topic, activeSubject, activeTopic);
  lastReport = {
    recommendedSubject: activeSubject, recommendedTopic: activeTopic, alignmentScore: match.score,
    integrityPassed: integrity.valid, integrityFailures: 0,
    confidenceScore: integrity.result.confidenceScore, sessionAccepted: true, retryCount: 3,
    questionLogs: [{ questionTopic: fallback.question.topic, questionSubject: fallback.question.subject, score: match.score, matchLabel: match.label, generationSource: fallback.question.source }],
  };
  return { question: fallback.question, report: lastReport, source: 'template' };
}

export function getLastResortQuestion(
  subjects: string[], difficulty: 'easy' | 'medium' | 'hard', examType: string, locale: 'en' | 'ml',
): any | null {
  // Force English for Constitution subjects
  const language = subjects.includes('Constitution') ? 'en' : locale;
  const pool = generateMCQs({ subjects: subjects.length > 0 ? subjects : undefined, difficulty: difficulty === 'hard' ? 'medium' : difficulty, examType: examType || 'LDC', count: 3, language });
  for (const q of pool) {
    if (validateQuestionIntegrity(q).valid) return q;
  }
  const anyPool = generateMCQs({ difficulty: 'easy', examType: examType || 'LDC', count: 5, language });
  for (const q of anyPool) {
    if (validateQuestionIntegrity(q).valid) return q;
  }
  return null;
}

export function buildSessionOutcome(
  state: any, endTime: number,
): SessionOutcome {
  const durationMinutes = state.sessionStartTime
    ? Math.max(1, Math.round((endTime - state.sessionStartTime) / 60000)) : 1;
  const totalQ = state.score.total;
  const correctA = state.score.correct;
  const accuracy = totalQ > 0 ? correctA / totalQ : 0;
  const subjectScores: Record<string, { correct: number; total: number; accuracy: number }> = {};
  let weakest = ''; let strongest = ''; let weakestAcc = 1; let strongestAcc = 0;
  for (const [sub, data] of Object.entries(state.sessionSubjectAccuracy)) {
    const subAcc = data.total > 0 ? data.correct / data.total : 0;
    subjectScores[sub] = { ...data, accuracy: subAcc };
    if (subAcc < weakestAcc && data.total >= 1) { weakestAcc = subAcc; weakest = sub; }
    if (subAcc > strongestAcc && data.total >= 1) { strongestAcc = subAcc; strongest = sub; }
  }
  return {
    sessionId: `so_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sessionType: state.sessionType,
    startTime: state.sessionStartTime || endTime, endTime,
    durationMinutes, totalQuestions: totalQ, correctAnswers: correctA, accuracy,
    subjectScores, weakestSubject: weakest, strongestSubject: strongest,
    difficultyMix: state.sessionDifficultyCounts || { easy: 0, medium: 0, hard: 0 },
    alignmentScore: state.alignmentReport?.alignmentScore,
    recommendedSubject: state.alignmentReport?.recommendedSubject,
    recommendedTopic: state.alignmentReport?.recommendedTopic,
    recommendationId: state.recommendationId,
  };
}

export { PERSIST_CONFIG };
