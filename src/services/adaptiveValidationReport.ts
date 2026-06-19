import { QuestionSkipRecord, SkipCategory, computeSkipAuditSummary, computeAcceptanceWindow, analyzeBottleneck } from './skipAuditService';
import { IntegrityMetrics, AlignmentMetrics } from '../store/mcqStore';
import { SessionOutcome } from '../store/performanceStore';

export interface AlignmentHeatmapEntry {
  requestedTopic: string;
  requestedSubject: string;
  generatedTopic: string;
  count: number;
  percent: number;
}

export interface TopicCoverageEntry {
  topic: string;
  subject: string;
  requests: number;
  alignedGenerations: number;
  misalignedGenerations: number;
  alignmentRate: number;
  generatedTopics: { topic: string; count: number }[];
  failureReasons: { reason: string; count: number }[];
}

export interface SessionBreakdown {
  total: number;
  focused: number;
  successfulFocused: number;
  reducedSessions: number;
  emptySessions: number;
}

export interface FailureBreakdown {
  category: SkipCategory;
  count: number;
  percent: number;
}

export interface CauseConfidence {
  label: string;
  code: 'A' | 'B' | 'C' | 'D' | 'E';
  percent: number;
  confidence: number;
  primary: boolean;
}

export interface ValidationReport {
  generatedAt: string;
  generatorAlignment: {
    totalGenerations: number;
    alignedGenerations: number;
    alignmentRate: number;
  };
  acceptance: {
    generated: number;
    accepted: number;
    rejected: number;
    acceptanceRate: number;
  };
  topicCoverage: TopicCoverageEntry[];
  topFailureReasons: FailureBreakdown[];
  sessionOutcomes: SessionBreakdown;
  alignmentHeatmap: AlignmentHeatmapEntry[];
  recommendations: {
    primaryCause: CauseConfidence;
    allCauses: CauseConfidence[];
    summary: string;
  };
}

export function runValidationPhase1(
  skipAuditRecords: QuestionSkipRecord[],
  alignmentMetrics: AlignmentMetrics,
  integrityMetrics: IntegrityMetrics,
  sessionOutcomes: SessionOutcome[],
): ValidationReport {
  const totalGenerations = alignmentMetrics.totalGenerations;
  const alignedGenerations = alignmentMetrics.alignedGenerations;
  const alignmentRate = totalGenerations > 0
    ? Math.round((alignedGenerations / totalGenerations) * 100)
    : 0;

  const accepted = integrityMetrics.passCount;
  const rejected = skipAuditRecords.length;
  const generated = accepted + rejected;
  const acceptanceRate = generated > 0 ? Math.round((accepted / generated) * 100) : 0;

  const skipSummary = computeSkipAuditSummary(skipAuditRecords);
  const window = computeAcceptanceWindow(skipAuditRecords, integrityMetrics.passCount);
  const bottleneck = analyzeBottleneck(skipAuditRecords, window.acceptanceRate);

  const topicMap = new Map<string, {
    subject: string; requests: number; skipRecords: QuestionSkipRecord[];
  }>();
  for (const r of skipAuditRecords) {
    const key = `${r.requestedSubject}::${r.requestedTopic || '__subject__'}`;
    const existing = topicMap.get(key) || { subject: r.requestedSubject, requests: 0, skipRecords: [] };
    existing.requests++;
    existing.skipRecords.push(r);
    topicMap.set(key, existing);
  }

  const topicCoverage: TopicCoverageEntry[] = [];
  for (const [key, data] of topicMap) {
    const [subject, topic] = key.split('::');
    const displayTopic = topic === '__subject__' ? `[${subject}]` : topic;
    const aligned = data.skipRecords.filter((r) => r.generatedTopic === (r.requestedTopic || r.requestedSubject)).length;
    const misaligned = data.skipRecords.length - aligned;

    const genTopicCount = new Map<string, number>();
    const reasonCount = new Map<string, number>();
    for (const r of data.skipRecords) {
      const gKey = r.generatedTopic || r.generatedSubject;
      genTopicCount.set(gKey, (genTopicCount.get(gKey) || 0) + 1);
      reasonCount.set(r.rejectionCategory, (reasonCount.get(r.rejectionCategory) || 0) + 1);
    }

    topicCoverage.push({
      topic: displayTopic,
      subject,
      requests: data.requests,
      alignedGenerations: aligned,
      misalignedGenerations: misaligned,
      alignmentRate: data.requests > 0 ? Math.round((aligned / data.requests) * 100) : 0,
      generatedTopics: Array.from(genTopicCount.entries())
        .map(([t, c]) => ({ topic: t, count: c }))
        .sort((a, b) => b.count - a.count),
      failureReasons: Array.from(reasonCount.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
    });
  }
  topicCoverage.sort((a, b) => b.requests - a.requests);

  const failureReasons: FailureBreakdown[] = (['topic_mismatch', 'integrity_failure', 'coverage_failure', 'inventory_failure', 'diversity_failure'] as SkipCategory[]).map((cat) => ({
    category: cat,
    count: skipSummary.byReason[cat] || 0,
    percent: skipSummary.totalSkips > 0 ? Math.round(((skipSummary.byReason[cat] || 0) / skipSummary.totalSkips) * 100) : 0,
  })).filter((f) => f.count > 0);

  if (failureReasons.length === 0) {
    failureReasons.push({ category: 'topic_mismatch', count: 0, percent: 0 });
  }

  const totalSessions = sessionOutcomes.length;
  const focusedSessions = sessionOutcomes.filter((s) => s.recommendedTopic);
  const successfulFocused = focusedSessions.filter((s) => s.totalQuestions > 0 && (s.alignmentScore === undefined || s.alignmentScore >= 0.8));
  const reducedSessions = sessionOutcomes.filter((s) => s.totalQuestions > 0 && s.alignmentScore !== undefined && s.alignmentScore < 0.8);
  const emptySessions = sessionOutcomes.filter((s) => s.totalQuestions === 0);

  const sessionBreakdown: SessionBreakdown = {
    total: totalSessions,
    focused: focusedSessions.length,
    successfulFocused: successfulFocused.length,
    reducedSessions: reducedSessions.length,
    emptySessions: emptySessions.length,
  };

  const heatmap = new Map<string, Map<string, number>>();
  let totalEntries = 0;
  for (const r of skipAuditRecords) {
    const reqKey = r.requestedTopic || r.requestedSubject;
    const genKey = r.generatedTopic || r.generatedSubject;
    if (!heatmap.has(reqKey)) heatmap.set(reqKey, new Map());
    const inner = heatmap.get(reqKey)!;
    inner.set(genKey, (inner.get(genKey) || 0) + 1);
    totalEntries++;
  }

  const alignmentHeatmap: AlignmentHeatmapEntry[] = [];
  for (const [reqTopic, genMap] of heatmap) {
    const subject = skipAuditRecords.find((r) => (r.requestedTopic || r.requestedSubject) === reqTopic)?.requestedSubject || '';
    for (const [genTopic, count] of genMap) {
      alignmentHeatmap.push({
        requestedTopic: reqTopic,
        requestedSubject: subject,
        generatedTopic: genTopic,
        count,
        percent: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0,
      });
    }
  }
  alignmentHeatmap.sort((a, b) => b.count - a.count);

  const causes: CauseConfidence[] = [
    {
      label: 'A. Generator Alignment',
      code: 'A',
      percent: alignmentRate < 100 ? 100 - alignmentRate : bottleneck.aiGeneratorIgnoreRate,
      confidence: alignmentRate < 100 ? Math.min(100, (100 - alignmentRate) * 1.5) : bottleneck.aiGeneratorIgnoreRate * 1.5,
      primary: false,
    },
    {
      label: 'B. Integrity Validation',
      code: 'B',
      percent: integrityMetrics.failCount > 0 ? Math.round((integrityMetrics.failCount / Math.max(1, generated)) * 100) : 0,
      confidence: integrityMetrics.failCount > 0 ? Math.min(100, integrityMetrics.failCount * 20) : 0,
      primary: false,
    },
    {
      label: 'C. Inventory',
      code: 'C',
      percent: bottleneck.templateInventoryMissRate,
      confidence: Math.min(100, bottleneck.templateInventoryMissRate * 1.2),
      primary: false,
    },
    {
      label: 'D. Coverage',
      code: 'D',
      percent: 0,
      confidence: 0,
      primary: false,
    },
    {
      label: 'E. Metadata',
      code: 'E',
      percent: bottleneck.metadataTaggingIssueRate,
      confidence: Math.min(100, bottleneck.metadataTaggingIssueRate * 1.3),
      primary: false,
    },
  ];

  const sorted = [...causes].sort((a, b) => b.confidence - a.confidence);
  if (sorted.length > 0 && sorted[0].confidence > 0) {
    sorted[0].primary = true;
  }

  const primaryCause = sorted[0];

  const summaryParts: string[] = [];
  if (totalGenerations === 0 && accepted === 0 && rejected === 0) {
    summaryParts.push('No question generation data collected yet. Start adaptive sessions to collect data.');
  } else {
    if (alignmentRate < 90) {
      summaryParts.push(`Generator alignment is ${alignmentRate}% (target >90%). The AI frequently generates off-topic questions.`);
    } else {
      summaryParts.push(`Generator alignment is ${alignmentRate}% — within target range.`);
    }
    if (acceptanceRate < 20) {
      summaryParts.push(`Acceptance rate is ${acceptanceRate}%. Most generated questions are rejected by topic enforcement.`);
    }
    if (primaryCause.confidence > 0) {
      summaryParts.push(`Primary bottleneck: ${primaryCause.label} (confidence: ${Math.round(primaryCause.confidence)}%).`);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    generatorAlignment: { totalGenerations, alignedGenerations, alignmentRate },
    acceptance: { generated, accepted, rejected, acceptanceRate },
    topicCoverage,
    topFailureReasons: failureReasons,
    sessionOutcomes: sessionBreakdown,
    alignmentHeatmap,
    recommendations: {
      primaryCause,
      allCauses: causes,
      summary: summaryParts.join(' '),
    },
  };
}

export function printValidationReport(report: ValidationReport): void {
  const line = '=' .repeat(70);
  const sep = '-'.repeat(70);
  const sub = '·' .repeat(40);

  console.log(line);
  console.log('  ADAPTIVE LEARNING VALIDATION — PHASE 1');
  console.log('  Generated: ' + report.generatedAt);
  console.log(line);
  console.log();

  // 1. Generator Alignment
  console.log('1. GENERATOR ALIGNMENT');
  console.log(sub);
  console.log('   Total Generations:     ' + report.generatorAlignment.totalGenerations);
  console.log('   Aligned Generations:   ' + report.generatorAlignment.alignedGenerations);
  console.log('   Alignment Rate:        ' + report.generatorAlignment.alignmentRate + '%' + (report.generatorAlignment.alignmentRate >= 90 ? ' ✓' : ' ✗ (target >90%)'));
  console.log();

  // 2. Acceptance Metrics
  console.log('2. ACCEPTANCE METRICS');
  console.log(sub);
  console.log('   Generated:             ' + report.acceptance.generated);
  console.log('   Accepted:              ' + report.acceptance.accepted);
  console.log('   Rejected:              ' + report.acceptance.rejected);
  console.log('   Acceptance Rate:       ' + report.acceptance.acceptanceRate + '%');
  console.log();

  // 3. Topic Coverage
  console.log('3. TOPIC COVERAGE');
  console.log(sub);
  if (report.topicCoverage.length === 0) {
    console.log('   No topic data collected yet.');
  } else {
    for (const tc of report.topicCoverage) {
      console.log('   [' + tc.subject + '] ' + tc.topic);
      console.log('     Requests:    ' + tc.requests);
      console.log('     Aligned:     ' + tc.alignedGenerations + ' / ' + tc.requests + ' (' + tc.alignmentRate + '%)');
      console.log('     Misaligned:  ' + tc.misalignedGenerations);
      if (tc.generatedTopics.length > 0) {
        console.log('     Generated Topics:');
        for (const gt of tc.generatedTopics) {
          const bar = '█'.repeat(Math.max(1, Math.round(gt.count / tc.requests * 20)));
          console.log('       ' + gt.topic.padEnd(30) + ' ' + bar + ' ' + gt.count);
        }
      }
      if (tc.failureReasons.length > 0) {
        console.log('     Failures:');
        for (const fr of tc.failureReasons) {
          console.log('       ' + fr.reason + ': ' + fr.count);
        }
      }
      console.log();
    }
  }

  // 4. Top Failure Reasons
  console.log('4. TOP FAILURE REASONS');
  console.log(sub);
  for (const fr of report.topFailureReasons) {
    const bar = '█'.repeat(Math.max(1, Math.round(fr.percent / 5)));
    console.log('   ' + fr.category.padEnd(30) + ' ' + fr.count.toString().padStart(4) + ' (' + fr.percent.toString().padStart(2) + '%) ' + bar);
  }
  if (report.topFailureReasons.length === 1 && report.topFailureReasons[0].count === 0) {
    console.log('   No rejections recorded yet.');
  }
  console.log();

  // 5. Session Outcomes
  console.log('5. SESSION OUTCOMES');
  console.log(sub);
  console.log('   Total Sessions:        ' + report.sessionOutcomes.total);
  console.log('   Focused Sessions:      ' + report.sessionOutcomes.focused);
  console.log('   Successful Focused:    ' + report.sessionOutcomes.successfulFocused);
  console.log('   Reduced Sessions:      ' + report.sessionOutcomes.reducedSessions);
  console.log('   Empty Sessions:        ' + report.sessionOutcomes.emptySessions);
  if (report.sessionOutcomes.total > 0) {
    const successRate = report.sessionOutcomes.focused > 0
      ? Math.round((report.sessionOutcomes.successfulFocused / report.sessionOutcomes.focused) * 100)
      : 0;
    console.log('   Focused Success Rate:  ' + successRate + '%');
  }
  console.log();

  // 6. Alignment Heatmap
  console.log('6. ALIGNMENT HEATMAP');
  console.log(sub);
  if (report.alignmentHeatmap.length === 0) {
    console.log('   No alignment data collected yet.');
  } else {
    console.log('   Requested Topic → Generated Topic (count, %)');
    console.log();
    for (const h of report.alignmentHeatmap) {
      const bar = '█'.repeat(Math.max(1, Math.round(h.percent / 2)));
      console.log('   ' + h.requestedTopic.padEnd(25) + ' → ' + h.generatedTopic.padEnd(25) + ' ' + bar + ' ' + h.count + ' (' + h.percent + '%)');
    }
  }
  console.log();

  // 7. Recommendations
  console.log('7. RECOMMENDATIONS');
  console.log(sub);
  console.log('   ' + report.recommendations.summary);
  console.log();
  console.log('   Cause Analysis:');
  console.log('   ┌────────────────────────────────────────────────────────────────────────────┐');
  for (const c of report.recommendations.allCauses) {
    const marker = c.primary ? ' ← PRIMARY' : '';
    console.log('   │ ' + c.label.padEnd(30) + ' │ ' + c.percent.toString().padStart(5) + '%  │ ' + Math.round(c.confidence).toString().padStart(5) + '%   │' + marker.padEnd(15) + '│');
  }
  console.log('   └────────────────────────────────────────────────────────────────────────────┘');
  console.log(line);
}
