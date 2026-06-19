import { QuestionSkipRecord, SkipCategory, computeSkipAuditSummary, computeAcceptanceWindow, analyzeBottleneck, ACCEPTANCE_WINDOW_SIZE } from './skipAuditService';
import { IntegrityMetrics } from '../store/mcqStore';
import { TopicEnforcementLog } from './topicEnforcement';
import { getNodesByLevel, getChildren } from '../data/knowledgeTree';
import { getTopicCoverageReport, getCoverageReport } from './topicCoverageDiagnostics';
import { isTopicReadyForRecommendation, getCoverageBreadthReport, getTopicDiversity } from './topicDiversityTracker';

export interface TopicRequestStats {
  topic: string;
  subject: string;
  requestedCount: number;
  acceptedCount: number;
  skippedCount: number;
  acceptanceRate: number;
}

export interface TopicDeepDive {
  topic: string;
  subject: string;
  totalRequests: number;
  accepted: number;
  rejected: number;
  generatedTopicsReturned: string[];
  rejectionReasons: { reason: string; count: number }[];
}

export interface ReadinessFailure {
  subject: string;
  topic: string;
  inventoryCount: number;
  inventoryOk: boolean;
  diversityLevel: string;
  diversityOk: boolean;
  conceptCoveragePercent: number;
  coverageOk: boolean;
  overallReady: boolean;
  failureReasons: string[];
}

export interface RootCauseAnalysis {
  generatorAlignment: { percent: number; confidence: number };
  contentInventory: { percent: number; confidence: number };
  metadataProblem: { percent: number; confidence: number };
  validationTooStrict: { percent: number; confidence: number };
  primaryCause: string;
}

export interface SkipAuditReport {
  generated: number;
  accepted: number;
  skipped: number;
  acceptanceRate: number;
  skipBreakdown: Record<SkipCategory, { count: number; percent: number }>;
  bottleneckAnalysis: {
    hasBottleneck: boolean;
    aiGeneratorIgnoreRate: number;
    templateInventoryMissRate: number;
    metadataTaggingIssueRate: number;
    strictEnforcementRate: number;
    primaryBottleneck: string;
  };
  topRequestedTopics: TopicRequestStats[];
  worstPerformingTopics: TopicRequestStats[];
  deepDives: {
    fundamentalRights?: TopicDeepDive;
    modernKerala?: TopicDeepDive;
  };
  readinessFailures: ReadinessFailure[];
  rootCause: RootCauseAnalysis;
  timestamp: string;
}

export function runSkipAuditAnalysis(
  skipAuditRecords: QuestionSkipRecord[],
  integrityMetrics: IntegrityMetrics,
  enforcementLogs: TopicEnforcementLog[],
): SkipAuditReport {
  const totalGenerated = integrityMetrics.passCount + skipAuditRecords.length;
  const acceptanceRate = totalGenerated > 0
    ? Math.round((integrityMetrics.passCount / totalGenerated) * 100)
    : 0;

  // 1. Skip Breakdown
  const summary = computeSkipAuditSummary(skipAuditRecords);
  const skipBreakdown = {} as Record<SkipCategory, { count: number; percent: number }>;
  for (const cat of ['topic_mismatch', 'integrity_failure', 'coverage_failure', 'inventory_failure', 'diversity_failure'] as SkipCategory[]) {
    const count = summary.byReason[cat] || 0;
    skipBreakdown[cat] = {
      count,
      percent: summary.totalSkips > 0 ? Math.round((count / summary.totalSkips) * 100) : 0,
    };
  }

  // 2. Acceptance Window
  const window = computeAcceptanceWindow(skipAuditRecords, integrityMetrics.passCount);

  // 3. Bottleneck
  const bottleneckRaw = analyzeBottleneck(skipAuditRecords, window.acceptanceRate);
  const bottleneckAnalysis = {
    hasBottleneck: bottleneckRaw.hasBottleneck,
    aiGeneratorIgnoreRate: bottleneckRaw.aiGeneratorIgnoreRate,
    templateInventoryMissRate: bottleneckRaw.templateInventoryMissRate,
    metadataTaggingIssueRate: bottleneckRaw.metadataTaggingIssueRate,
    strictEnforcementRate: bottleneckRaw.strictEnforcementRate,
    primaryBottleneck: bottleneckRaw.primaryBottleneck,
  };

  // 4. Top Requested Topics / Topic Stats
  const topicStats = computeTopicStats(skipAuditRecords, integrityMetrics);
  const topRequestedTopics = [...topicStats].sort((a, b) => b.requestedCount - a.requestedCount).slice(0, 20);
  const worstPerformingTopics = [...topicStats]
    .filter((t) => t.requestedCount >= 3)
    .sort((a, b) => a.acceptanceRate - b.acceptanceRate);

  // 5. Deep Dives
  const deepDives: { fundamentalRights?: TopicDeepDive; modernKerala?: TopicDeepDive } = {};
  const fundamentalRights = computeDeepDive(skipAuditRecords, 'Constitution', 'Fundamental Rights');
  if (fundamentalRights) deepDives.fundamentalRights = fundamentalRights;
  const modernKerala = computeDeepDive(skipAuditRecords, 'Kerala History', 'Modern Kerala');
  if (modernKerala) deepDives.modernKerala = modernKerala;

  // 6. Readiness Failures
  const readinessFailures = computeReadinessFailures();

  // 7. Root Cause Analysis
  const rootCause = computeRootCause(skipBreakdown, bottleneckRaw, acceptanceRate);

  return {
    generated: totalGenerated,
    accepted: integrityMetrics.passCount,
    skipped: skipAuditRecords.length,
    acceptanceRate,
    skipBreakdown,
    bottleneckAnalysis,
    topRequestedTopics,
    worstPerformingTopics,
    deepDives,
    readinessFailures,
    rootCause,
    timestamp: new Date().toISOString(),
  };
}

function computeTopicStats(
  records: QuestionSkipRecord[],
  metrics: IntegrityMetrics,
): TopicRequestStats[] {
  const topicMap = new Map<string, { subject: string; requested: number; skipped: number }>();

  for (const r of records) {
    const key = `${r.requestedSubject}::${r.requestedTopic || '__subject__'}`;
    const existing = topicMap.get(key) || { subject: r.requestedSubject, requested: 0, skipped: 0 };
    existing.requested++;
    existing.skipped++;
    topicMap.set(key, existing);
  }

  const results: TopicRequestStats[] = [];
  for (const [key, data] of topicMap) {
    const [subject, topic] = key.split('::');
    const displayTopic = topic === '__subject__' ? `[${subject}]` : topic;
    const accepted = Math.max(0, data.requested - data.skipped);
    results.push({
      topic: displayTopic,
      subject,
      requestedCount: data.requested,
      acceptedCount: accepted,
      skippedCount: data.skipped,
      acceptanceRate: data.requested > 0 ? Math.round((accepted / data.requested) * 100) : 0,
    });
  }

  return results;
}

function computeDeepDive(
  records: QuestionSkipRecord[],
  subject: string,
  topic: string,
): TopicDeepDive | undefined {
  const matching = records.filter(
    (r) => r.requestedSubject === subject && r.requestedTopic === topic,
  );
  if (matching.length === 0) return undefined;

  const generatedTopics = new Set(matching.map((r) => r.generatedTopic));
  const rejectionMap = new Map<string, number>();
  for (const r of matching) {
    const reason = r.rejectionReason.split(';')[0].slice(0, 100);
    rejectionMap.set(reason, (rejectionMap.get(reason) || 0) + 1);
  }

  return {
    topic,
    subject,
    totalRequests: matching.length,
    accepted: 0,
    rejected: matching.length,
    generatedTopicsReturned: Array.from(generatedTopics),
    rejectionReasons: Array.from(rejectionMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function computeReadinessFailures(): ReadinessFailure[] {
  const failures: ReadinessFailure[] = [];
  const subjects = getNodesByLevel('subject');

  for (const subj of subjects) {
    const topics = getChildren(subj.id);
    for (const t of topics) {
      const report = getTopicCoverageReport(subj.name, t.name);
      const breadth = getCoverageBreadthReport(subj.name, t.name);
      const diversity = getTopicDiversity(subj.name, t.name);
      const ready = isTopicReadyForRecommendation(subj.name, t.name);

      const reasons: string[] = [];
      const inventoryOk = report.acceptedQuestions >= 10;
      if (!inventoryOk) {
        reasons.push(`Inventory: ${report.acceptedQuestions}/10 accepted questions`);
      }
      const diversityOk = diversity.diversityScore !== 'low';
      if (!diversityOk) {
        reasons.push(`Diversity: ${diversity.diversityScore} (unique subtopics: ${diversity.uniqueSubtopics})`);
      }
      const coverageOk = breadth.conceptCoveragePercent >= 60;
      if (!coverageOk) {
        reasons.push(`Coverage: ${breadth.conceptCoveragePercent}% concept coverage`);
      }

      if (!ready) {
        failures.push({
          subject: subj.name,
          topic: t.name,
          inventoryCount: report.acceptedQuestions,
          inventoryOk,
          diversityLevel: diversity.diversityScore,
          diversityOk,
          conceptCoveragePercent: breadth.conceptCoveragePercent,
          coverageOk,
          overallReady: ready,
          failureReasons: reasons,
        });
      }
    }
  }

  return failures.sort((a, b) => b.failureReasons.length - a.failureReasons.length);
}

function computeRootCause(
  skipBreakdown: Record<SkipCategory, { count: number; percent: number }>,
  bottleneck: ReturnType<typeof analyzeBottleneck>,
  acceptanceRate: number,
): RootCauseAnalysis {
  const totalSkips = Object.values(skipBreakdown).reduce((s, b) => s + b.count, 0);
  if (totalSkips === 0) {
    return {
      generatorAlignment: { percent: 0, confidence: 0 },
      contentInventory: { percent: 0, confidence: 0 },
      metadataProblem: { percent: 0, confidence: 0 },
      validationTooStrict: { percent: 0, confidence: 0 },
      primaryCause: 'Insufficient data — no questions skipped yet',
    };
  }

  // A. Generator Alignment Problem: AI generates wrong topic despite being asked for a specific one
  const generatorAlignment = {
    percent: bottleneck.aiGeneratorIgnoreRate,
    confidence: Math.min(100, bottleneck.aiGeneratorIgnoreRate * 1.5),
  };

  // B. Content Inventory Problem: Not enough questions in templates/fallback
  const contentInventory = {
    percent: bottleneck.templateInventoryMissRate,
    confidence: Math.min(100, bottleneck.templateInventoryMissRate * 1.2),
  };

  // C. Metadata Problem: Generated topic doesn't match expected topics for subject
  const metadataProblem = {
    percent: bottleneck.metadataTaggingIssueRate,
    confidence: Math.min(100, bottleneck.metadataTaggingIssueRate * 1.3),
  };

  // D. Validation Too Strict: Integrity gate is rejecting valid questions
  const integrityPct = skipBreakdown.integrity_failure?.percent || 0;
  const validationTooStrict = {
    percent: integrityPct,
    confidence: Math.min(100, integrityPct * 1.2),
  };

  const causes = [
    { label: 'A. Generator Alignment Problem', ...generatorAlignment },
    { label: 'B. Content Inventory Problem', ...contentInventory },
    { label: 'C. Metadata Problem', ...metadataProblem },
    { label: 'D. Validation Too Strict', ...validationTooStrict },
  ];

  const sorted = [...causes].sort((a, b) => b.confidence - a.confidence);
  const primaryCause = sorted[0].confidence > 0
    ? sorted[0].label
    : 'Insufficient data';

  return { generatorAlignment, contentInventory, metadataProblem, validationTooStrict, primaryCause };
}
