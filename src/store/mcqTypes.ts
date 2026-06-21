import type { SubjectProgress, GapRecord, GapStatus } from '../data/mockData';
import type { Question } from '../data/questions';
import type { SessionOutcome } from './performanceStore';
import type { AdaptiveState } from '../services/infinityEngine';
import type { DifficultySessionState } from '../services/sessionDifficultyAdapter';
import type { SessionValidationReport } from '../services/sessionValidation';
import type { AuditEntry, QuestionTrustScore } from '../services/questionAudit';
import type { QuestionSkipRecord } from '../services/skipAuditService';
import type { SkipAuditReport } from '../services/skipAuditAnalysis';
import type { ValidationReport } from '../services/adaptiveValidationReport';
import type { SessionFocusMetrics, CoverageReport } from '../services/topicCoverageDiagnostics';
import type { TopicEnforcementLog } from '../services/topicEnforcement';
import type { DiversityDashboardEntry, TopicDiversityReport, CoverageBreadthReport, CoverageDashboardEntry } from '../services/topicDiversityTracker';

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

export interface MCQState {
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
  sessionDifficultyCounts: { easy: number; medium: number; hard: number };
  sessionType: string;
  sessionSubjects: string[];
  lastSessionOutcome: SessionOutcome | null;
  isGenerating: boolean;
  generationProgress: { current: number; total: number } | null;
  sessionSignals: { subject: string; topic: string; correct: boolean }[];
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
  recommendationId: string;
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
    recommendationId?: string;
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
  getSkipAuditSummary: () => ReturnType<typeof import('../services/skipAuditService').computeSkipAuditSummary>;
  getAcceptanceWindow: () => ReturnType<typeof import('../services/skipAuditService').computeAcceptanceWindow>;
  getBottleneckAnalysis: () => ReturnType<typeof import('../services/skipAuditService').analyzeBottleneck>;
  runSkipAuditAnalysis: () => SkipAuditReport;
  recordAlignmentAttempt: (aligned: boolean) => void;
  getGeneratorAlignmentRate: () => number;
  runValidationPhase1: () => ValidationReport;
}
