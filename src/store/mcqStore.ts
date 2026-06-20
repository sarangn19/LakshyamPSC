import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question, EXAM_DIFFICULTY } from '../data/questions';
import { SubjectProgress, Note, CurrentAffair } from '../data/mockData';
import { generateMCQs, getQuestionPoolSize, GeneratedQuestion } from '../services/aiMCQGenerator';
import { generateAIQuestion } from '../services/aiQuestionGenerator';
import { generateNextAdaptiveQuestion, makeAdaptiveState, AdaptiveState, recordAnswer } from '../services/infinityEngine';
import { makeInitialDifficultyState, recordSessionAnswer, DifficultySessionState } from '../services/sessionDifficultyAdapter';
import { useUserStore } from './userStore';
import { useKnowledgeStore } from './knowledgeStore';
import { storeGeneratedMCQ } from '../services/questionBankStorage';
import { usePerformanceStore, SessionOutcome } from './performanceStore';
import { useBKTStore } from './bktStore';
import { syllabus } from '../data/syllabus';
import { SessionValidationReport } from '../services/sessionValidation';
import { getTopicMatch } from '../data/topicRelations';
import { getNodeByName, getNodePath } from '../data/knowledgeTree';
import { validateQuestionIntegrity } from '../services/questionValidator';
import { AuditEntry, QuestionTrustScore, buildAuditEntry, buildTrustScore, shouldSampleAudit, computeTrustScore } from '../services/questionAudit';
import { useCognitiveTwinStore, hasValidQuestionMetadata, GapRecord, GapLifecycle, GapStatus } from './cognitiveTwinStore';
import { getRecommendedSubjectAndTopic, getNextCognitiveGapTopic, getRandomSubjectAndTopic } from '../services/cognitiveTwinRecommender';
import { useStudyValidationStore } from './studyValidationStore';
import {
  QuestionSkipRecord, SkipCategory, computeSkipAuditSummary,
  computeAcceptanceWindow, analyzeBottleneck, categorizeRejection,
} from '../services/skipAuditService';
import { runSkipAuditAnalysis, SkipAuditReport } from '../services/skipAuditAnalysis';
import { runValidationPhase1, ValidationReport } from '../services/adaptiveValidationReport';
import {
  recordGeneration,
  recordAcceptance,
  recordRejection,
  recordPresentation,
  recordCorrectAnswer,
  recordIncorrectAnswer,
  hasSufficientInventory,
  findNearestSupportedTopic,
  getCoverageReport,
  getTopicCoverageReport,
  recordTopicGenerationAttempt,
  getSessionFocusMetrics,
  SessionFocusMetrics,
  CoverageReport,
} from '../services/topicCoverageDiagnostics';
import {
  TopicEnforcementLog,
} from '../services/topicEnforcement';
import {
  recordAcceptedQuestion,
  isTopicReadyForRecommendation,
  getTopicDiversity,
  getCoverageBreadthReport,
  getDiversityDashboard,
  getCoverageDashboard,
  DiversityDashboardEntry,
  TopicDiversityReport,
  CoverageBreadthReport,
  CoverageDashboardEntry,
} from '../services/topicDiversityTracker';

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

export interface QuestionReport {
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  reason: string;
  timestamp: number;
}

export interface IntegrityMetrics {
  passCount: number;
  failCount: number;
  fallbackCount: number;
  regenerationCount: number;
}

export interface AlignmentMetrics {
  totalGenerations: number;
  alignedGenerations: number;
}

interface MCQState {
  currentQuestions: Question[];
  currentIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  score: { correct: number; total: number };
  subjectProgress: SubjectProgress[];
  drillMode: 'daily' | 'weakness' | 'exam';
  selectedExam: string;
  sessionActive: boolean;
  timeRemaining: number;
  questionStartTime: number | null;
  reportedQuestions: string[];
  questionReports: QuestionReport[];
  disabledQuestions: string[];
  generatorPoolSize: number;
  sessionStartTime: number | null;
  sessionSubjectAccuracy: Record<string, { correct: number; total: number }>;
  sessionType: string;
  lastSessionOutcome: SessionOutcome | null;
  isGenerating: boolean;
  generationProgress: { current: number; total: number } | null;
  sessionSignals: { subject: string; topic: string; correct: boolean }[];
  // session is infinite until user taps Finish
  sessionCoveredTopics: string[];
  currentDifficulty: 'easy' | 'medium' | 'hard';
  difficultySessionState: DifficultySessionState;
  generatingNext: boolean;
  adaptiveState: AdaptiveState;
  recommendedSubject: string;
  recommendedTopic: string | undefined;
  alignmentReport: SessionValidationReport | null;
  showAlignmentFallback: boolean;
  sessionReduced: boolean;
  questionsSkipped: number;
  integrityMetrics: IntegrityMetrics;
  auditQueue: AuditEntry[];
  trustScores: QuestionTrustScore[];
  enforcementLogs: TopicEnforcementLog[];
  skipAuditRecords: QuestionSkipRecord[];
  alignmentMetrics: AlignmentMetrics;
  sessionFocusMetrics: SessionFocusMetrics;
  diversityDashboard: DiversityDashboardEntry[];
  coverageDashboard: CoverageDashboardEntry[];
  bookmarkedQuestions: string[];
  bookmarkedQuestionData: Record<string, Pick<Question, 'text' | 'subject' | 'topic' | 'subtopic' | 'options' | 'correctAnswer' | 'explanation'>>;
  seenQuestionTexts: string[];
  toggleBookmark: (questionId: string) => void;
  getDiversityDashboard: () => DiversityDashboardEntry[];
  getCoverageDashboard: () => CoverageDashboardEntry[];
  getCoverageBreadthReport: (subject: string, topic: string) => CoverageBreadthReport;
  getTopicDiversity: (subject: string, topic: string) => TopicDiversityReport;
  startDailyDrill: (exams?: string[], subjects?: string[]) => void;
  startWeaknessPractice: (exams?: string[]) => void;
  startExamMode: (examType: string) => void;
  selectAnswer: (index: number) => void;
  nextQuestion: () => void;
  reportQuestion: (id: string) => void;
  reportQuestionWithReason: (id: string, reason: string) => void;
  setSelectedExam: (exam: string) => void;
  startCustomSession: (questions: Question[], startIndex?: number) => void;
  resetSession: () => void;
  startOrchestratedSession: (config: {
    subjects?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
    examType?: string;
    sessionType?: string;
    recommendedSubject?: string;
    recommendedTopic?: string;
  }) => void;
  startPracticeSession: (config: {
    subjects?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
    examType?: string;
    sourceType?: 'chapter' | 'note' | 'paste';
    noteId?: string;
    pastedContent?: string;
  }) => void;
  getWeakSubjects: (exams?: string[]) => string[];
  getSubjectProgress: (subject: string) => SubjectProgress | undefined;
  getExamScore: (exam: string) => { available: number; mastered: number; accuracy: number };
  endSession: () => void;
  clearLastSessionOutcome: () => void;
  addToAuditQueue: (entry: AuditEntry) => void;
  updateTrustScore: (questionKey: string, changes: Partial<QuestionTrustScore>) => void;
  getTrustScore: (questionKey: string) => QuestionTrustScore | undefined;
  getAuditMetrics: () => { approvedRate: number; rejectedRate: number; editedRate: number; disabledRate: number; problematicSubjects: { subject: string; rejectCount: number }[]; problematicTopics: { topic: string; rejectCount: number }[] };
  getCoverageReport: () => CoverageReport;
  recordQuestionSkip: (record: QuestionSkipRecord) => void;
  getSkipAuditSummary: () => ReturnType<typeof computeSkipAuditSummary>;
  getAcceptanceWindow: () => ReturnType<typeof computeAcceptanceWindow>;
  getBottleneckAnalysis: () => ReturnType<typeof analyzeBottleneck>;
  runSkipAuditAnalysis: () => SkipAuditReport;
  recordAlignmentAttempt: (aligned: boolean) => void;
  getGeneratorAlignmentRate: () => number;
  runValidationPhase1: () => ValidationReport;
}

function trackIntegrity(delta: Partial<IntegrityMetrics>): void {
  const s = useMCQStore.getState();
  useMCQStore.setState({ integrityMetrics: { ...s.integrityMetrics, ...delta } });
}

function recordQuestionSkip(
  question: { subject: string; topic: string; subtopic?: string | null; source: string; id: string },
  requestedSubject: string,
  requestedTopic: string | undefined,
  rejectionCategory: SkipCategory,
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

async function resolveValidQuestion(
  weakSubjects: string[],
  covered: string[],
  correct: number,
  total: number,
  difficulty: 'easy' | 'medium' | 'hard',
  adaptiveState: AdaptiveState,
  recentSignals: any[],
  wasIncorrect: boolean,
  recommendedSubject: string,
  recommendedTopic: string | undefined,
  targetExams: string[],
  reportedQuestions: string[],
  locale: 'en' | 'ml',
  seenQuestionTexts: string[] = [],
): Promise<{
  question: GeneratedQuestion | null;
  report: SessionValidationReport | null;
  source: 'ai' | 'cache' | 'template' | 'none';
}> {
  const activeAvoid = [...reportedQuestions, ...useMCQStore.getState().disabledQuestions];
  let lastReport: SessionValidationReport | null = null;

  // Check inventory AND diversity for recommended topic; fallback if either insufficient
  // Uses MIN_INVENTORY = 10 and diversity >= medium threshold
  let activeSubject = recommendedSubject;
  let activeTopic = recommendedTopic;
  if (activeTopic) {
    const inventoryOk = hasSufficientInventory(activeSubject, activeTopic);
    const inventory = getTopicCoverageReport(activeSubject, activeTopic).acceptedQuestions;
    const breadthOk = isTopicReadyForRecommendation(activeSubject, activeTopic);
    if (!inventoryOk || !breadthOk) {
      const covReport = getTopicCoverageReport(activeSubject, activeTopic);
      const breadthReport = getCoverageBreadthReport(activeSubject, activeTopic);
      console.log('[BREADTH] topic', activeSubject, activeTopic,
        `| inventory: ${covReport.acceptedQuestions} (ok: ${inventoryOk})`,
        `| subtopics: ${breadthReport.coveredSubtopics}/${breadthReport.totalSubtopics}`,
        `| concept coverage: ${breadthReport.conceptCoveragePercent}%`,
        `| ok: ${breadthOk}`);
      const fallback = findNearestSupportedTopic(activeSubject, activeTopic);
      if (fallback) {
        console.log('[BREADTH] falling back to', fallback.subject, fallback.topic);
        activeSubject = fallback.subject;
        activeTopic = fallback.topic;
      }
    }
  }

  // Don't use infinite engine for practice sessions (they have predefined questions)
  if (useMCQStore.getState().sessionType === 'practice') {
    return { question: null, report: null, source: 'none' };
  }

  // Attempt AI generation — returns whatever the adaptive engine picks
  for (let retry = 0; retry < 3; retry++) {
    const result = await generateNextAdaptiveQuestion(
      weakSubjects, covered, correct, total, difficulty, adaptiveState, recentSignals, wasIncorrect, seenQuestionTexts,
    );
    if (result) useMCQStore.getState().recordAlignmentAttempt(result.aligned);
    if (!result?.question) break;

    recordGeneration(result.question);

    // Dedup: skip if question text was already seen in a previous session
    if (seenQuestionTexts.includes(result.question.text)) {
      console.log('[DEDUP] seen before, regenerating:', result.question.text.substring(0, 60));
      recordRejection(result.question);
      continue;
    }

    const integrity = validateQuestionIntegrity(result.question);
    if (!integrity.valid) {
      recordRejection(result.question);
      recordQuestionSkip(result.question, activeSubject, activeTopic, 'integrity_failure', `Integrity: ${integrity.result.failures.map((f: any) => f.reason).join('; ')}`, retry);
      trackIntegrity({ failCount: useMCQStore.getState().integrityMetrics.failCount + 1, regenerationCount: retry > 0 ? useMCQStore.getState().integrityMetrics.regenerationCount + 1 : useMCQStore.getState().integrityMetrics.regenerationCount });
      continue;
    }

    recordAcceptance(result.question);
    recordAcceptedQuestion(result.question);
    recordTopicGenerationAttempt(true);

    if (integrity.result.confidenceScore >= 0.8) {
      const q = result.question;
      storeGeneratedMCQ({
        questionText: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        subject: q.subject,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        examType: targetExams[0] || 'LDC',
        language: locale,
        sourceType: 'ai_generated',
        tags: [],
      });
    }

    const match = getTopicMatch(result.question.subject, result.question.topic, activeSubject, activeTopic);
    const alignmentScore = match.score;
    lastReport = {
      recommendedSubject: activeSubject, recommendedTopic: activeTopic, alignmentScore, integrityPassed: true, integrityFailures: 0,
      confidenceScore: integrity.result.confidenceScore, sessionAccepted: true, retryCount: retry,
      questionLogs: [{ questionTopic: result.question.topic, questionSubject: result.question.subject, score: alignmentScore, matchLabel: match.label, generationSource: result.question.source }],
    };
    trackIntegrity({ passCount: useMCQStore.getState().integrityMetrics.passCount + 1, regenerationCount: retry > 0 ? useMCQStore.getState().integrityMetrics.regenerationCount + 1 : useMCQStore.getState().integrityMetrics.regenerationCount });

    if (shouldSampleAudit(result.question.subject)) {
      const entry = buildAuditEntry({
        questionText: result.question.text, options: result.question.options,
        correctAnswer: result.question.correctAnswer, explanation: result.question.explanation,
        topic: result.question.topic, subject: result.question.subject,
        generationSource: result.question.source, alignmentScore, confidenceScore: integrity.result.confidenceScore,
        sourceType: 'topic_enforced',
        regenerationCount: retry,
      });
      useMCQStore.setState({ auditQueue: [...(useMCQStore.getState().auditQueue || []), entry] });
      console.log('[AUDIT] queued for review:', entry.id, result.question.subject, result.question.topic);
    }

    return { question: result.question, report: lastReport, source: 'ai' };
  }

  // AI failed — don't fall back to cache or templates
  console.log('[INTEGRITY] AI generation failed, no fallback');
  return { question: null, report: lastReport, source: 'none' };
}

// ─── Last-resort question: serve any valid question when all topic-specific paths fail ───
function getLastResortQuestion(
  subjects: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  examType: string,
  locale: 'en' | 'ml',
): GeneratedQuestion | null {
  const pool = generateMCQs({
    subjects: subjects.length > 0 ? subjects : undefined,
    difficulty: difficulty === 'hard' ? 'medium' : difficulty,
    examType: examType || 'LDC',
    count: 3,
    language: locale,
  });

  for (const q of pool) {
    const integrity = validateQuestionIntegrity(q);
    if (integrity.valid) {
      console.log('[LAST-RESORT] serving fallback question:', q.subject, q.topic);
      return q;
    }
  }

  // Ultra last resort: any question at all
  const anyPool = generateMCQs({
    difficulty: 'easy',
    examType: examType || 'LDC',
    count: 5,
    language: locale,
  });
  for (const q of anyPool) {
    const integrity = validateQuestionIntegrity(q);
    if (integrity.valid) {
      console.log('[LAST-RESORT] ultra fallback:', q.subject, q.topic);
      return q;
    }
  }

  return null;
}

export const useMCQStore = create<MCQState>()(
  persist(
    (set, get) => ({
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
      reportedQuestions: [],
      questionReports: [],
      disabledQuestions: [],
      generatorPoolSize: getQuestionPoolSize(),
      sessionStartTime: null,
      sessionSubjectAccuracy: {},
      sessionType: 'daily_drill',
      lastSessionOutcome: null,
      isGenerating: false,
      generationProgress: null,
      sessionSignals: [],
      sessionCoveredTopics: [],
      currentDifficulty: 'easy',
      difficultySessionState: makeInitialDifficultyState(),
      generatingNext: false,
      adaptiveState: makeAdaptiveState(),
      recommendedSubject: '',
      recommendedTopic: undefined,
      alignmentReport: null,
      showAlignmentFallback: false,
      sessionReduced: false,
      questionsSkipped: 0,
      integrityMetrics: { passCount: 0, failCount: 0, fallbackCount: 0, regenerationCount: 0 },
      auditQueue: [],
      trustScores: [],
      enforcementLogs: [],
      skipAuditRecords: [],
      alignmentMetrics: { totalGenerations: 0, alignedGenerations: 0 },
      sessionFocusMetrics: { totalGeneratedInFocusedSessions: 0, totalMatchingRecommendedTopic: 0, focusedSessionSuccessRate: 0, targetSuccessRate: 90 },
      diversityDashboard: [],
      coverageDashboard: [],
      bookmarkedQuestions: [],
      bookmarkedQuestionData: {},
      seenQuestionTexts: [],

      toggleBookmark: (questionId) =>
        set((state) => {
          const has = state.bookmarkedQuestions.includes(questionId);
          const ids = has
            ? state.bookmarkedQuestions.filter((id) => id !== questionId)
            : [...state.bookmarkedQuestions, questionId];
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
      

      startDailyDrill: async (exams, subjects) => {
        const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
        const weakSubjects = subjects ?? get().getWeakSubjects(targetExams);
        const twinRec = getRecommendedSubjectAndTopic();
        const recommendedSubject = (subjects && subjects.length > 0) ? subjects[0]
          : twinRec.subject || (weakSubjects.length > 0 ? weakSubjects[0] : '');
        const recommendedTopic = twinRec.topic || undefined;

        set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: 'easy', difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), recommendedSubject, recommendedTopic, alignmentReport: null, showAlignmentFallback: false, sessionReduced: false, questionsSkipped: 0 });

        const baseState = makeAdaptiveState();
        const { question, report } = await resolveValidQuestion(
          weakSubjects, [], 0, 0, 'easy', get().adaptiveState, [],
          false, recommendedSubject, recommendedTopic, targetExams,
          get().reportedQuestions, useUserStore.getState().locale,
          get().seenQuestionTexts,
        );

        if (question) {
          set({
            currentQuestions: [question],
            currentIndex: 0, selectedAnswer: null, isAnswered: false,
            drillMode: 'daily', sessionActive: true,
            questionStartTime: Date.now(), sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {}, sessionType: 'daily_drill',
          lastSessionOutcome: null, isGenerating: false, generationProgress: null,
          adaptiveState: baseState,
          alignmentReport: report,
          showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
          });
        } else {
          set({ isGenerating: false, generationProgress: null, sessionReduced: true });
        }
      },

      startWeaknessPractice: async (exams) => {
        const targetExams = exams || useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];
        const weakSubjects = get().getWeakSubjects(targetExams);
        const recommendedSubject = weakSubjects.length > 0 ? weakSubjects[0] : '';

        set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: 'medium', difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), sessionReduced: false, questionsSkipped: 0 });

        const { question } = await resolveValidQuestion(
          weakSubjects, [], 0, 0, 'medium', get().adaptiveState, [],
          false, recommendedSubject, undefined, targetExams,
          get().reportedQuestions, useUserStore.getState().locale,
          get().seenQuestionTexts,
        );

        if (question) {
          set({
            currentQuestions: [question], currentIndex: 0,
            selectedAnswer: null, isAnswered: false,
            drillMode: 'weakness', sessionActive: true,
            questionStartTime: Date.now(), sessionStartTime: Date.now(),
            sessionSubjectAccuracy: {}, sessionType: 'weakness_practice',
            lastSessionOutcome: null, isGenerating: false, generationProgress: null,
            adaptiveState: makeAdaptiveState(),
          });
        } else {
          set({ isGenerating: false, generationProgress: null, sessionReduced: true });
        }
      },

      startExamMode: (examType: string) => {
        const difficulties = EXAM_DIFFICULTY[examType] || ['easy', 'medium', 'hard'];
        const userStore = useUserStore.getState();
        const notes = useKnowledgeStore.getState().notes;
        const lang = useUserStore.getState().locale;
        const reportedIds = get().reportedQuestions;

        const avoidIds = [...reportedIds, ...get().disabledQuestions];
        const raw = [
          ...generateMCQs({ difficulty: 'easy', examType, count: 7, sourceNotes: notes, avoidQuestionIds: avoidIds, language: lang }),
          ...(difficulties.includes('medium')
            ? generateMCQs({ difficulty: 'medium', examType, count: 8, sourceNotes: notes, avoidQuestionIds: avoidIds, language: lang })
            : []),
          ...(difficulties.includes('hard')
            ? generateMCQs({ difficulty: 'hard', examType, count: 5, sourceNotes: notes, avoidQuestionIds: avoidIds, language: lang })
            : []),
        ].sort(() => Math.random() - 0.5).slice(0, 20);

        const validated = raw.filter((q) => {
          recordGeneration(q);
          const integrity = validateQuestionIntegrity(q);
          if (integrity.valid) {
            recordAcceptance(q);
            recordAcceptedQuestion(q);
            return true;
          }
          recordRejection(q);
          return false;
        });

        const skipped = raw.length - validated.length;
        console.log('[INTEGRITY] exam mode: generated', raw.length, 'validated', validated.length, 'skipped', skipped);

        const finalQuestions = validated.length > 0
          ? validated
          : generateMCQs({ difficulty: 'easy', examType, count: 5, language: lang }).filter((q) => {
              recordGeneration(q);
              const integrity = validateQuestionIntegrity(q);
              if (integrity.valid) {
                recordAcceptance(q);
                recordAcceptedQuestion(q);
                return true;
              }
              recordRejection(q);
              return false;
            });

        set({
          currentQuestions: finalQuestions, currentIndex: 0,
          selectedAnswer: null, isAnswered: false,
          score: { correct: 0, total: 0 },
          drillMode: 'exam', selectedExam: examType,
          sessionActive: true, timeRemaining: 1800,
          questionStartTime: Date.now(), sessionStartTime: Date.now(),
          sessionSubjectAccuracy: {}, sessionType: 'exam_simulation',
          lastSessionOutcome: null,
          sessionReduced: skipped > 0,
          questionsSkipped: skipped,
        });
      },

      selectAnswer: (index) => {
        const state = get();
        if (state.isAnswered) return;
        const current = state.currentQuestions[state.currentIndex];
        if (!current) return;
        const isCorrect = index === current.correctAnswer;
        const timeToAnswer = state.questionStartTime ? Date.now() - state.questionStartTime : 5000;

        recordPresentation(current);
        if (isCorrect) {
          recordCorrectAnswer(current);
        } else {
          recordIncorrectAnswer(current);
        }

        const subject = current.subject;
        const prevSub = state.sessionSubjectAccuracy[subject] || { correct: 0, total: 0 };

        const newTotal = state.score.total + 1;
        const newCorrect = state.score.correct + (isCorrect ? 1 : 0);
        const newSignals = [...state.sessionSignals, { subject: current.subject, topic: current.topic, correct: isCorrect }];
        const updatedAdaptive = recordAnswer(state.adaptiveState, current.text, current.topic, current.subject, isCorrect, current.id, current.subtopic);
        const updatedDiffSession = recordSessionAnswer(state.difficultySessionState, isCorrect);

        set({
          selectedAnswer: index,
          isAnswered: true,
          score: {
            correct: newCorrect,
            total: newTotal,
          },
          seenQuestionTexts: state.seenQuestionTexts.includes(current.text)
            ? state.seenQuestionTexts
            : [...state.seenQuestionTexts, current.text].slice(-500),
          sessionSubjectAccuracy: {
            ...state.sessionSubjectAccuracy,
            [subject]: {
              correct: prevSub.correct + (isCorrect ? 1 : 0),
              total: prevSub.total + 1,
            },
          },
          sessionSignals: newSignals,
          currentDifficulty: updatedDiffSession.currentDifficulty,
          difficultySessionState: updatedDiffSession,
          adaptiveState: updatedAdaptive,
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

        useBKTStore.getState().updateTopic(current.subject, current.topic, isCorrect, current.subtopic);

        // Study validation: capture before mastery
        const studyBeforeMastery = hasValidQuestionMetadata(current.subject, current.topic, current.subtopic) && current.subtopic
          ? useCognitiveTwinStore.getState().getMastery(
              getNodeByName(current.subtopic, 'subtopic')?.id ?? '',
            ).masteryScore ?? null
          : null;

        // Part 2: Only update mastery if question has valid metadata
        if (hasValidQuestionMetadata(current.subject, current.topic, current.subtopic)) {
          // Estimate hesitation from timeToAnswer (quick answer = low hesitation, slow = high)
          const hesitationEstimate = Math.min(1, Math.max(0, (timeToAnswer - 3000) / 15000));
          useCognitiveTwinStore.getState().updateMasteryForQuestion(
            current.subject, current.topic, current.subtopic,
            isCorrect, hesitationEstimate,
          );

          // Real-time gap detection: after mastery update, check subtopic for gap
          if (current.subtopic) {
            const twin = useCognitiveTwinStore.getState();
            const subtopicNode = getNodeByName(current.subtopic, 'subtopic');
            if (subtopicNode) {
              const mastery = twin.getMastery(subtopicNode.id);
              if (mastery.attempts >= 2) {
                const isGap = mastery.accuracy < 40
                  || mastery.forgettingScore > 0.6
                  || mastery.hesitationScore > 0.5;
                const existingGap = twin.gapRecords.find(
                  (g) => g.nodeId === subtopicNode.id && g.status !== 'closed'
                );
                if (isGap && !existingGap) {
                  // Create new gap record
                  const nodePath = getNodePath(subtopicNode.id) ?? [];
                  const newGap: GapRecord = {
                    gapId: `gap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    nodeId: subtopicNode.id,
                    subject: nodePath[0] ?? '',
                    topic: nodePath[1] ?? '',
                    subtopic: nodePath[2] ?? '',
                    level: 'subtopic',
                    detectedAt: new Date().toISOString(),
                    initialMastery: mastery.masteryScore,
                    currentMastery: mastery.masteryScore,
                    bestMastery: mastery.masteryScore,
                    status: mastery.masteryScore < 40 ? 'open' as GapStatus
                      : mastery.masteryScore < 60 ? 'improving' as GapStatus
                      : mastery.masteryScore < 80 ? 'closing' as GapStatus
                      : 'closed' as GapStatus,
                    recommendationCount: 0,
                    sessionsApplied: 0,
                    questionsAnswered: 1,
                    closedAt: null,
                    daysToClose: null,
                  };
                  const lifecycle: GapLifecycle = {
                    gapId: newGap.gapId,
                    nodeId: subtopicNode.id,
                    nodeName: subtopicNode.name,
                    nodePath,
                    level: 'subtopic',
                    detectedAt: newGap.detectedAt,
                    firstRecommendation: null,
                    closedAt: null,
                    sessionsApplied: 0,
                    questionsAnswered: 1,
                    masteryTimeline: [{ timestamp: newGap.detectedAt, score: mastery.masteryScore }],
                    daysToClose: null,
                    sessionsToClose: null,
                    reopenedCount: 0,
                    reopenedAt: [],
                  };
                  useCognitiveTwinStore.setState((s) => ({
                    gapRecords: [...s.gapRecords, newGap],
                    gapLifecycles: [...s.gapLifecycles, lifecycle],
                  }));
                } else if (existingGap) {
                  // Update existing gap's current mastery, status, timeline
                  const newStatus = mastery.masteryScore >= 80 ? 'closed' as GapStatus
                    : mastery.masteryScore >= 60 ? 'closing' as GapStatus
                    : mastery.masteryScore >= 40 ? 'improving' as GapStatus
                    : 'open' as GapStatus;
                  const now = new Date().toISOString();
                  const daysToClose = newStatus === 'closed' && existingGap.status !== 'closed'
                    ? Math.round((Date.now() - new Date(existingGap.detectedAt).getTime()) / 86400000)
                    : existingGap.daysToClose;
                  useCognitiveTwinStore.setState((s) => ({
                    gapRecords: s.gapRecords.map((g) =>
                      g.gapId === existingGap.gapId
                        ? {
                            ...g,
                            currentMastery: mastery.masteryScore,
                            bestMastery: Math.max(g.bestMastery, mastery.masteryScore),
                            status: newStatus,
                            questionsAnswered: g.questionsAnswered + 1,
                            closedAt: newStatus === 'closed' ? now : g.closedAt,
                            daysToClose,
                          }
                        : g
                    ),
                    gapLifecycles: s.gapLifecycles.map((l) =>
                      l.gapId === existingGap.gapId
                        ? {
                            ...l,
                            questionsAnswered: l.questionsAnswered + 1,
                            masteryTimeline: [...l.masteryTimeline, { timestamp: now, score: mastery.masteryScore }],
                            closedAt: newStatus === 'closed' ? now : l.closedAt,
                            daysToClose: newStatus === 'closed' ? daysToClose : l.daysToClose,
                            sessionsToClose: newStatus === 'closed'
                              ? l.sessionsApplied
                              : l.sessionsToClose,
                          }
                        : l
                    ),
                  }));
                }
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

        // Study validation: record question result
        if (useStudyValidationStore.getState().enabled && current.subtopic) {
          const twin = useCognitiveTwinStore.getState();
          const afterMastery = hasValidQuestionMetadata(current.subject, current.topic, current.subtopic)
            ? twin.getMastery(getNodeByName(current.subtopic, 'subtopic')?.id ?? '').masteryScore
            : null;
          useStudyValidationStore.getState().recordQuestionResult({
            questionId: current.id,
            sessionId: state.sessionStartTime?.toString() ?? '',
            group: (state.sessionType === 'random_study' ? 'random' : 'adaptive') as any,
            subject: current.subject,
            topic: current.topic,
            subtopic: current.subtopic,
            correct: isCorrect,
            timestamp: new Date().toISOString(),
            beforeMastery: studyBeforeMastery,
            afterMastery,
          });
        }

      },

      nextQuestion: async () => {
        const state = get();
        const current = state.currentQuestions[state.currentIndex];
        if (!current) return;
        const wasCorrect = state.selectedAnswer === current.correctAnswer;

        // For practice sessions with pre-generated questions, just move to next index
        if (state.sessionType === 'practice') {
          const nextIndex = state.currentIndex + 1;
          if (nextIndex < state.currentQuestions.length) {
            set({
              currentIndex: nextIndex,
              selectedAnswer: null,
              isAnswered: false,
              questionStartTime: Date.now(),
            });
            return;
          } else {
            // End of practice session - navigate to summary
            const endTime = Date.now();
            const durationMinutes = (endTime - (state.sessionStartTime || endTime)) / 60000;
            const accuracy = state.score.total > 0 ? state.score.correct / state.score.total : 0;
            const outcome: SessionOutcome = {
              sessionId: `so_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sessionType: state.sessionType,
              startTime: state.sessionStartTime || endTime,
              endTime,
              durationMinutes,
              totalQuestions: state.score.total,
              correctAnswers: state.score.correct,
              accuracy,
              subjectScores: {},
              weakestSubject: '',
              strongestSubject: '',
              difficultyMix: { easy: 0, medium: 0, hard: 0 },
            };
            set({
              sessionActive: false,
              lastSessionOutcome: outcome,
              currentQuestions: [],
              currentIndex: 0,
            });
            return;
          }
        }

        const covered = [...state.sessionCoveredTopics, `${current.subject}::${current.topic}`];

        set({ generatingNext: true });
        const weakSubjects = state.getWeakSubjects(
              useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'],
            );
        const recentSignals = usePerformanceStore.getState().interactionSignals;
        const targetExams = useUserStore.getState().targetExams || ['LDC', 'Secretariat Assistant'];

        const { question, report } = await resolveValidQuestion(
          weakSubjects, covered,
          state.score.correct, state.score.total,
          state.currentDifficulty, state.adaptiveState,
          recentSignals, !wasCorrect,
          state.recommendedSubject, state.recommendedTopic,
          targetExams, state.reportedQuestions,
          useUserStore.getState().locale,
          state.seenQuestionTexts,
        );

        if (question) {
          set({
            currentQuestions: [question], currentIndex: 0,
            selectedAnswer: null, isAnswered: false,
            questionStartTime: Date.now(),
            sessionCoveredTopics: covered,
            generatingNext: false,
            adaptiveState: state.adaptiveState,
            alignmentReport: report,
            showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
          });
        } else {
          set({
            generatingNext: false,
            sessionReduced: true,
            questionsSkipped: state.questionsSkipped + 1,
          });
        }
      },

      endSession: () => {
        const state = get();
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
          alignmentScore: state.alignmentReport?.alignmentScore,
          recommendedSubject: state.alignmentReport?.recommendedSubject,
          recommendedTopic: state.alignmentReport?.recommendedTopic,
        };

        const perf = usePerformanceStore.getState();
        perf.addSessionOutcome(outcome);

        useBKTStore.getState().runParameterFitting();

        useCognitiveTwinStore.getState().detectKnowledgeGaps();
        useCognitiveTwinStore.getState().runRetentionCheck();
        useCognitiveTwinStore.getState().scheduleRetentionAssessments();

        set({
          sessionActive: false,
          questionStartTime: null,
          lastSessionOutcome: outcome,
        });

        if (state.sessionReduced || state.questionsSkipped > 0) {
          console.log('[INTEGRITY] session completed with reduction:', state.questionsSkipped, 'questions skipped');
        }
        const metrics = get().integrityMetrics;
        const focusMetrics = getSessionFocusMetrics();
        set({ sessionFocusMetrics: focusMetrics });
        console.log('[INTEGRITY] session metrics:', metrics);
        console.log('[FOCUS] metrics:', focusMetrics);

        // Study validation: record session
        const studyStore = useStudyValidationStore.getState();
        if (studyStore.enabled) {
          const studyGroup = state.sessionType === 'random_study' ? 'random' : 'adaptive';
          studyStore.recordSession({
            sessionId: outcome.sessionId,
            group: studyGroup,
            startTime: new Date(outcome.startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            subject: outcome.recommendedSubject || weakest,
            topic: outcome.recommendedTopic || '',
            questionsAsked: totalQ,
            correctAnswers: correctA,
            accuracy: accuracy * 100,
          });
        }
      },


      reportQuestion: (id) =>
        set((state) => ({
          reportedQuestions: state.reportedQuestions.includes(id)
            ? state.reportedQuestions
            : [...state.reportedQuestions, id],
        })),
      reportQuestionWithReason: (id, reason) => {
        const state = get();
        const current = state.currentQuestions[state.currentIndex];
        if (!current) return;
        const report: QuestionReport = {
          questionId: id,
          questionText: current.text,
          subject: current.subject,
          topic: current.topic,
          reason,
          timestamp: Date.now(),
        };
        const newReports = [...state.questionReports, report];
        const reportsForThisQ = newReports.filter((r) => r.questionId === id);
        const trustPenalty = reportsForThisQ.length;
        const shouldDisable = trustPenalty >= 3;

        const updates: Partial<MCQState> = {
          questionReports: newReports,
          reportedQuestions: state.reportedQuestions.includes(id)
            ? state.reportedQuestions
            : [...state.reportedQuestions, id],
        };

        if (shouldDisable && !state.disabledQuestions.includes(id)) {
          updates.disabledQuestions = [...state.disabledQuestions, id];
          console.log('[INTEGRITY] question auto-disabled (trustPenalty=3):', id);
        }

        set(updates);

        const tsKey = `${current.subject}::${current.topic}::${current.text.slice(0, 30)}`;
        get().updateTrustScore(tsKey, { userReports: trustPenalty, subject: current.subject, topic: current.topic, questionKey: tsKey });

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

        console.log('[INTEGRITY] question reported (trustPenalty=' + trustPenalty + '):', report);
      },

      setSelectedExam: (exam) => set({ selectedExam: exam }),

      startCustomSession: (questions, startIndex) =>
        set({
          currentQuestions: questions,
          currentIndex: startIndex ?? 0,
          selectedAnswer: null,
          isAnswered: false,
          score: { correct: 0, total: 0 },
          sessionActive: true,
          sessionType: 'practice',
          drillMode: 'daily',
          sessionSignals: [],
          sessionCoveredTopics: [],
          sessionReduced: false,
          questionsSkipped: 0,
          difficultySessionState: makeInitialDifficultyState(),
          currentDifficulty: 'medium',
        }),

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
          isGenerating: false,
          generationProgress: null,
          sessionSignals: [],
          sessionCoveredTopics: [],
          currentDifficulty: 'easy',
          difficultySessionState: makeInitialDifficultyState(),
          generatingNext: false,
          adaptiveState: makeAdaptiveState(),
          recommendedSubject: '',
          recommendedTopic: undefined,
          alignmentReport: null,
          showAlignmentFallback: false,
          sessionReduced: false,
          questionsSkipped: 0,
          sessionFocusMetrics: { totalGeneratedInFocusedSessions: 0, totalMatchingRecommendedTopic: 0, focusedSessionSuccessRate: 0, targetSuccessRate: 90 },
        }),

      clearLastSessionOutcome: () => set({ lastSessionOutcome: null }),

      addToAuditQueue: (entry) =>
        set((state) => ({ auditQueue: [...state.auditQueue, entry] })),

      updateTrustScore: (questionKey, changes) =>
        set((state) => {
          const existing = state.trustScores.find((t) => t.questionKey === questionKey);
          if (existing) {
            const updated = { ...existing, ...changes, lastUpdated: new Date().toISOString() };
            updated.score = computeTrustScore(100, updated);
            return { trustScores: state.trustScores.map((t) => t.questionKey === questionKey ? updated : t) };
          }
          const fresh = buildTrustScore(changes.subject || '', changes.topic || '');
          const merged = { ...fresh, ...changes, questionKey, lastUpdated: new Date().toISOString() };
          merged.score = computeTrustScore(100, merged);
          return { trustScores: [...state.trustScores, merged] };
        }),

      getTrustScore: (questionKey) => get().trustScores.find((t) => t.questionKey === questionKey),

      getAuditMetrics: () => {
        const state = get();
        const total = state.auditQueue.length;
        if (total === 0) return { approvedRate: 0, rejectedRate: 0, editedRate: 0, disabledRate: 0, problematicSubjects: [], problematicTopics: [] };
        const approved = state.auditQueue.filter((e) => e.status === 'approved').length;
        const rejected = state.auditQueue.filter((e) => e.status === 'rejected').length;
        const edited = state.auditQueue.filter((e) => e.status === 'edited').length;
        const disabled = state.auditQueue.filter((e) => e.status === 'disabled').length;
        const subjectRejects: Record<string, number> = {};
        const topicRejects: Record<string, number> = {};
        state.auditQueue.filter((e) => e.status === 'rejected').forEach((e) => {
          subjectRejects[e.subject] = (subjectRejects[e.subject] || 0) + 1;
          topicRejects[e.topic] = (topicRejects[e.topic] || 0) + 1;
        });
        return {
          approvedRate: Math.round((approved / total) * 100),
          rejectedRate: Math.round((rejected / total) * 100),
          editedRate: Math.round((edited / total) * 100),
          disabledRate: Math.round((disabled / total) * 100),
          problematicSubjects: Object.entries(subjectRejects).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([subject, rejectCount]) => ({ subject, rejectCount })),
          problematicTopics: Object.entries(topicRejects).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, rejectCount]) => ({ topic, rejectCount })),
        };
      },

      startPracticeSession: async (config) => {
        const examType = config.examType || useUserStore.getState().primaryExam || 'LDC';
        const subjects = config.subjects ?? [];
        const diff = config.difficulty ?? 'medium';
        const count = config.count ?? 10;
        const locale = useUserStore.getState().locale;
        const sourceType = config.sourceType ?? 'chapter';
        const noteId = config.noteId;
        const pastedContent = config.pastedContent;

        set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: diff, difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), sessionReduced: false, questionsSkipped: 0 });

        // Resolve source content
        let focusInstruction = '';
        let aiSubject = subjects.length > 0 ? subjects[0] : 'Kerala History';
        let aiTopic = 'General';

        if (sourceType === 'note' && noteId) {
          const note = useKnowledgeStore.getState().notes.find((n) => n.id === noteId);
          console.log('[PRACTICE] note lookup:', { noteId, found: !!note, contentLen: note?.content?.length, subject: note?.subject, title: note?.title });
          if (note && note.content && note.content.length >= 10) {
            focusInstruction = `CONTENT-BASED: ${note.content.substring(0, 2000)}`;
            // For content-based generation, let AI determine subject/topic from content
            aiSubject = 'General';
            aiTopic = 'General';
          } else {
            console.log('[PRACTICE] note rejected: missing content or too short');
          }
        } else if (sourceType === 'paste' && pastedContent && pastedContent.length >= 10) {
          focusInstruction = `CONTENT-BASED: ${pastedContent.substring(0, 2000)}`;
          // For content-based generation, let AI determine subject/topic from content
          aiSubject = 'General';
          aiTopic = 'General';
        } else {
          console.log('[PRACTICE] falling back to chapter mode, sourceType:', sourceType, 'noteId:', noteId, 'pastedContent len:', pastedContent?.length, 'subjects:', subjects);
          // Chapter-based: pick a random topic from the subject syllabus
          if (subjects.length > 0) {
            const subj = syllabus.find((s) => s.name === subjects[0]);
            if (subj) {
              aiSubject = subj.name;
              const topics = subj.topics.map((t) => t.name);
              aiTopic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : 'General';
              console.log('[PRACTICE] found subject in syllabus:', aiSubject, 'topic:', aiTopic);
            } else {
              console.log('[PRACTICE] subject not found in syllabus:', subjects[0], 'using default');
              // Use default subject if not found
              aiSubject = subjects[0];
              aiTopic = 'General';
            }
          } else {
            const subj = syllabus[Math.floor(Math.random() * syllabus.length)];
            aiSubject = subj.name;
            const topics = subj.topics.map((t) => t.name);
            aiTopic = topics.length > 0 ? topics[Math.floor(Math.random() * topics.length)] : 'General';
            console.log('[PRACTICE] no subjects provided, using random:', aiSubject, 'topic:', aiTopic);
          }
          focusInstruction = `Generate a question strictly about topic "${aiTopic}" within subject "${aiSubject}". Do NOT change the topic or subject.`;
        }

        // Keep generating until we have enough validated questions
        const allQuestions: GeneratedQuestion[] = [];
        const targetCount = count;
        const seenQuestions = new Set<string>();
        const maxAttempts = Math.max(targetCount * 3, 15);
        let attempts = 0;

        while (allQuestions.length < targetCount && attempts < maxAttempts) {
          set({ generationProgress: { current: allQuestions.length, total: targetCount } });
          console.log('[PRACTICE] calling generateAIQuestion with:', { subject: aiSubject, topic: aiTopic, hasFocus: !!focusInstruction, focusPrefix: focusInstruction.substring(0, 20) });
          const aiResult = await generateAIQuestion({
            subject: aiSubject,
            topic: aiTopic,
            difficulty: diff,
            examType,
            language: locale,
            focusInstruction,
            recentHistory: allQuestions.slice(-3).map(q => ({ text: q.text, correct: false })),
          });

          if (aiResult.question) {
            const q = aiResult.question;
            // Validate integrity immediately
            const integrity = validateQuestionIntegrity(q);
            if (!integrity.valid) {
              recordGeneration(q);
              recordRejection(q);
              console.log('[PRACTICE] question failed integrity:', integrity.result.failures.map((f: any) => f.reason));
              attempts++;
              if (attempts < maxAttempts) await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            if (integrity.result.confidenceScore >= 0.8) {
              storeGeneratedMCQ({
                questionText: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                subject: q.subject,
                topic: q.topic,
                subtopic: q.subtopic,
                difficulty: q.difficulty,
                examType: examType,
                language: locale,
                sourceType: 'ai_generated',
                sourceNoteId: noteId || undefined,
                tags: [],
              });
            }
            // Check for duplicates by question text
            const questionKey = q.text.trim().toLowerCase().substring(0, 50);
            if (!seenQuestions.has(questionKey)) {
              seenQuestions.add(questionKey);
              recordGeneration(q);
              recordAcceptance(q);
              recordAcceptedQuestion(q);
              allQuestions.push(q);
            } else {
              console.log('[PRACTICE] skipping duplicate question:', questionKey);
            }
          }
          attempts++;
          if (allQuestions.length < targetCount && attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1200));
          }
        }

        set({ generationProgress: null });
        const validated = allQuestions;

        if (validated.length > 0) {
          set({
            currentQuestions: validated, currentIndex: 0,
            selectedAnswer: null, isAnswered: false,
            drillMode: 'daily', selectedExam: examType,
            sessionActive: true,
            questionStartTime: Date.now(), sessionStartTime: Date.now(),
            sessionSubjectAccuracy: {}, sessionType: 'practice',
            lastSessionOutcome: null, isGenerating: false, generationProgress: null,
          });
        } else {
          set({ isGenerating: false, generationProgress: null, sessionReduced: true });
        }
      },

      startOrchestratedSession: async (config) => {
        const examType = config.examType || useUserStore.getState().primaryExam || 'LDC';
        const targetExams = [examType];
        const weakSubjects = config.subjects ?? [];
        const diff = config.difficulty ?? 'medium';
        const twinRec = config.sessionType === 'random_study'
          ? getRandomSubjectAndTopic()
          : getRecommendedSubjectAndTopic();
        const recommendedSubject = config.recommendedSubject
          ?? (weakSubjects.length > 0 ? weakSubjects[0] : twinRec.subject);
        const recommendedTopic = config.recommendedTopic || twinRec.topic;

        set({ isGenerating: true, generationProgress: null, generatingNext: false, sessionSignals: [], sessionCoveredTopics: [], currentDifficulty: diff, difficultySessionState: makeInitialDifficultyState(), score: { correct: 0, total: 0 }, adaptiveState: makeAdaptiveState(), recommendedSubject, recommendedTopic, alignmentReport: null, showAlignmentFallback: false, sessionReduced: false, questionsSkipped: 0 });

        const { question, report } = await resolveValidQuestion(
          weakSubjects, [], 0, 0, diff, get().adaptiveState, [],
          false, recommendedSubject, recommendedTopic, targetExams,
          get().reportedQuestions, useUserStore.getState().locale,
          get().seenQuestionTexts,
        );

        if (question) {
          set({
            currentQuestions: [question], currentIndex: 0,
            selectedAnswer: null, isAnswered: false,
            drillMode: 'daily', selectedExam: examType,
            sessionActive: true,
            questionStartTime: Date.now(), sessionStartTime: Date.now(),
            sessionSubjectAccuracy: {}, sessionType: config.sessionType || 'daily_drill',
            lastSessionOutcome: null, isGenerating: false, generationProgress: null,
            adaptiveState: makeAdaptiveState(),
            alignmentReport: report,
            showAlignmentFallback: report ? report.alignmentScore < 0.80 : false,
          });
        } else {
          set({ isGenerating: false, generationProgress: null, sessionReduced: true });
        }
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
        const totalPossible = 100;
        return { available: totalPossible, mastered: 0, accuracy: 85 };
      },

      getCoverageReport: () => getCoverageReport(),

      getDiversityDashboard: () => {
        const dashboard = getDiversityDashboard();
        set({ diversityDashboard: dashboard });
        return dashboard;
      },

      getCoverageDashboard: () => {
        const dashboard = getCoverageDashboard();
        set({ coverageDashboard: dashboard });
        return dashboard;
      },

      getCoverageBreadthReport: (subject, topic) => getCoverageBreadthReport(subject, topic),

      getTopicDiversity: (subject, topic) => getTopicDiversity(subject, topic),

      recordQuestionSkip: (record) =>
        set((s) => ({ skipAuditRecords: [...s.skipAuditRecords, record] })),

      getSkipAuditSummary: () => computeSkipAuditSummary(get().skipAuditRecords),

      getAcceptanceWindow: () => {
        const state = get();
        return computeAcceptanceWindow(state.skipAuditRecords, state.integrityMetrics.passCount);
      },

      getBottleneckAnalysis: () => {
        const state = get();
        const window = computeAcceptanceWindow(state.skipAuditRecords, state.integrityMetrics.passCount);
        return analyzeBottleneck(state.skipAuditRecords, window.acceptanceRate);
      },

      runSkipAuditAnalysis: () => {
        const state = get();
        return runSkipAuditAnalysis(state.skipAuditRecords, state.integrityMetrics, state.enforcementLogs);
      },

      recordAlignmentAttempt: (aligned) => {
        const s = get();
        set({
          alignmentMetrics: {
            totalGenerations: s.alignmentMetrics.totalGenerations + 1,
            alignedGenerations: s.alignmentMetrics.alignedGenerations + (aligned ? 1 : 0),
          },
        });
      },

      getGeneratorAlignmentRate: () => {
        const s = get();
        if (s.alignmentMetrics.totalGenerations === 0) return 100;
        return Math.round((s.alignmentMetrics.alignedGenerations / s.alignmentMetrics.totalGenerations) * 100);
      },

      runValidationPhase1: () => {
        const state = get();
        const perfState = usePerformanceStore.getState();
        return runValidationPhase1(
          state.skipAuditRecords,
          state.alignmentMetrics,
          state.integrityMetrics,
          perfState.sessionOutcomes,
        );
      },
    }),
    {
      name: 'lakshyam-mcq',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subjectProgress: state.subjectProgress,
        reportedQuestions: state.reportedQuestions,
        questionReports: state.questionReports,
        disabledQuestions: state.disabledQuestions,
        integrityMetrics: state.integrityMetrics,
        auditQueue: state.auditQueue,
        trustScores: state.trustScores,
        enforcementLogs: state.enforcementLogs,
        skipAuditRecords: state.skipAuditRecords,
        alignmentMetrics: state.alignmentMetrics,
        sessionFocusMetrics: state.sessionFocusMetrics,
        bookmarkedQuestions: state.bookmarkedQuestions,
        bookmarkedQuestionData: state.bookmarkedQuestionData,
        seenQuestionTexts: state.seenQuestionTexts,
      }),
    }
  )
);
