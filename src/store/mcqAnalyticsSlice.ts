import type { StateCreator } from 'zustand';
import type { MCQState, AlignmentMetrics } from './mcqTypes';
import type { AuditEntry, QuestionTrustScore } from '../services/questionAudit';
import type { QuestionSkipRecord } from '../services/skipAuditService';
import type { SkipAuditReport } from '../services/skipAuditAnalysis';
import type { ValidationReport } from '../services/adaptiveValidationReport';
import type { SessionFocusMetrics, CoverageReport } from '../services/topicCoverageDiagnostics';
import type { TopicEnforcementLog } from '../services/topicEnforcement';
import type { DiversityDashboardEntry, TopicDiversityReport, CoverageBreadthReport, CoverageDashboardEntry } from '../services/topicDiversityTracker';
import { getDiversityDashboard, getCoverageDashboard, getTopicDiversity, getCoverageBreadthReport } from '../services/topicDiversityTracker';
import { computeSkipAuditSummary, computeAcceptanceWindow, analyzeBottleneck } from '../services/skipAuditService';
import { runSkipAuditAnalysis } from '../services/skipAuditAnalysis';
import { runValidationPhase1 } from '../services/adaptiveValidationReport';
import { getAuditMetrics as getAuditMetricsSvc } from '../services/questionAudit';
import { getCoverageReport as getCoverageReportSvc } from '../services/topicCoverageDiagnostics';

export interface AnalyticsSlice {
  auditQueue: AuditEntry[];
  trustScores: QuestionTrustScore[];
  enforcementLogs: TopicEnforcementLog[];
  skipAuditRecords: QuestionSkipRecord[];
  alignmentMetrics: AlignmentMetrics;
  sessionFocusMetrics: SessionFocusMetrics;
  diversityDashboard: DiversityDashboardEntry[];
  coverageDashboard: CoverageDashboardEntry[];
  addToAuditQueue: (entry: AuditEntry) => void;
  updateTrustScore: (questionKey: string, changes: Partial<QuestionTrustScore>) => void;
  getTrustScore: (questionKey: string) => QuestionTrustScore | undefined;
  getAuditMetrics: () => any;
  getCoverageReport: () => CoverageReport;
  recordQuestionSkip: (record: QuestionSkipRecord) => void;
  getSkipAuditSummary: () => any;
  getAcceptanceWindow: () => any;
  getBottleneckAnalysis: () => any;
  runSkipAuditAnalysis: () => SkipAuditReport;
  recordAlignmentAttempt: (aligned: boolean) => void;
  getGeneratorAlignmentRate: () => number;
  runValidationPhase1: () => ValidationReport;
  getDiversityDashboard: () => DiversityDashboardEntry[];
  getCoverageDashboard: () => CoverageDashboardEntry[];
  getCoverageBreadthReport: (subject: string, topic: string) => CoverageBreadthReport;
  getTopicDiversity: (subject: string, topic: string) => TopicDiversityReport;
}

export const createAnalyticsSlice: StateCreator<MCQState, [], [], AnalyticsSlice> = (set, get) => ({
  auditQueue: [],
  trustScores: [],
  enforcementLogs: [],
  skipAuditRecords: [],
  alignmentMetrics: { totalGenerations: 0, alignedGenerations: 0 },
  sessionFocusMetrics: { totalGeneratedInFocusedSessions: 0, totalMatchingRecommendedTopic: 0, focusedSessionSuccessRate: 0, targetSuccessRate: 90 },
  diversityDashboard: [],
  coverageDashboard: [],

  addToAuditQueue: (entry) => set((state) => ({ auditQueue: [...state.auditQueue, entry] })),

  updateTrustScore: (questionKey, changes) =>
    set((state) => {
      const existing = state.trustScores.find((t) => t.questionKey === questionKey);
      if (existing) {
        return { trustScores: state.trustScores.map((t) => t.questionKey === questionKey ? { ...t, ...changes } : t) };
      }
      return { trustScores: [...state.trustScores, { questionKey, subject: '', topic: '', userReports: 0, learnerTotalCount: 0, learnerCorrectCount: 0, ...changes } as any] };
    }),

  getTrustScore: (questionKey) => get().trustScores.find((t) => t.questionKey === questionKey),

  getAuditMetrics: () => getAuditMetricsSvc(),

  getCoverageReport: () => getCoverageReportSvc(),

  recordQuestionSkip: (record) => set((state) => ({ skipAuditRecords: [...state.skipAuditRecords, record] })),

  getSkipAuditSummary: () => computeSkipAuditSummary(get().skipAuditRecords),

  getAcceptanceWindow: () => computeAcceptanceWindow(get().skipAuditRecords),

  getBottleneckAnalysis: () => analyzeBottleneck(get().skipAuditRecords),

  runSkipAuditAnalysis: () => runSkipAuditAnalysis(get().skipAuditRecords),

  recordAlignmentAttempt: (aligned) =>
    set((state) => ({
      alignmentMetrics: {
        totalGenerations: state.alignmentMetrics.totalGenerations + 1,
        alignedGenerations: state.alignmentMetrics.alignedGenerations + (aligned ? 1 : 0),
      },
    })),

  getGeneratorAlignmentRate: () => {
    const m = get().alignmentMetrics;
    return m.totalGenerations > 0 ? m.alignedGenerations / m.totalGenerations : 0;
  },

  runValidationPhase1: () => runValidationPhase1(get().skipAuditRecords),

  getDiversityDashboard: () => getDiversityDashboard(),
  getCoverageDashboard: () => getCoverageDashboard(),
  getCoverageBreadthReport: (s, t) => getCoverageBreadthReport(s, t),
  getTopicDiversity: (s, t) => getTopicDiversity(s, t),
});
