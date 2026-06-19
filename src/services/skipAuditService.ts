export type SkipCategory = 'topic_mismatch' | 'integrity_failure' | 'coverage_failure' | 'inventory_failure' | 'diversity_failure';

export type SkipSource = 'ai' | 'template' | 'cache';

export interface QuestionSkipRecord {
  timestamp: string;
  requestedSubject: string;
  requestedTopic: string | undefined;
  generatedSubject: string;
  generatedTopic: string;
  generatedSubtopic: string;
  source: SkipSource;
  rejectionReason: string;
  rejectionCategory: SkipCategory;
  retryCount: number;
  sessionId: string;
}

export interface SkipAuditSummary {
  totalSkips: number;
  byReason: Record<SkipCategory, number>;
  bySource: Record<string, number>;
}

export interface AcceptanceWindow {
  generated: number;
  accepted: number;
  acceptanceRate: number;
}

export interface BottleneckBreakdown {
  label: string;
  percent: number;
  color: string;
}

export interface BottleneckAnalysis {
  hasBottleneck: boolean;
  aiGeneratorIgnoreRate: number;
  templateInventoryMissRate: number;
  metadataTaggingIssueRate: number;
  strictEnforcementRate: number;
  primaryBottleneck: string;
  breakdown: BottleneckBreakdown[];
}

export const ACCEPTANCE_WINDOW_SIZE = 100;
export const ACCEPTANCE_RATE_THRESHOLD = 20;

export function computeSkipAuditSummary(records: QuestionSkipRecord[]): SkipAuditSummary {
  const byReason: Record<SkipCategory, number> = {
    topic_mismatch: 0,
    integrity_failure: 0,
    coverage_failure: 0,
    inventory_failure: 0,
    diversity_failure: 0,
  };
  const bySource: Record<string, number> = {};

  for (const r of records) {
    byReason[r.rejectionCategory] = (byReason[r.rejectionCategory] || 0) + 1;
    bySource[r.source] = (bySource[r.source] || 0) + 1;
  }

  return { totalSkips: records.length, byReason, bySource };
}

export function computeAcceptanceWindow(
  records: QuestionSkipRecord[],
  totalAccepted: number,
): AcceptanceWindow {
  const windowEnd = records.length;
  const windowStart = Math.max(0, windowEnd - ACCEPTANCE_WINDOW_SIZE);

  const recentRecords = records.slice(windowStart, windowEnd);
  const accepted = records.length > 0
    ? Math.round((totalAccepted / (totalAccepted + records.length)) * 100)
    : 0;

  return {
    generated: totalAccepted + records.length,
    accepted: totalAccepted,
    acceptanceRate: (totalAccepted + records.length) > 0
      ? Math.round((totalAccepted / (totalAccepted + records.length)) * 100)
      : 0,
  };
}

export function analyzeBottleneck(records: QuestionSkipRecord[], acceptanceRate: number): BottleneckAnalysis {
  const hasBottleneck = acceptanceRate < ACCEPTANCE_RATE_THRESHOLD;
  const total = records.length || 1;

  // 1. AI generator ignoring requested topic: AI source skips due to topic mismatch
  const aiTopicMismatches = records.filter(
    (r) => r.source === 'ai' && r.rejectionCategory === 'topic_mismatch',
  ).length;
  const aiGeneratorIgnoreRate = Math.round((aiTopicMismatches / total) * 100);

  // 2. Missing template inventory: template source skips
  const templateSkips = records.filter((r) => r.source === 'template').length;
  const templateInventoryMissRate = Math.round((templateSkips / total) * 100);

  // 3. Incorrect metadata tagging: topic_mismatch where the generated topic
  //    doesn't match what we'd expect for the subject. We count topic_mismatch
  //    skips that aren't AI-specific.
  const metadataSkips = records.filter(
    (r) => r.rejectionCategory === 'topic_mismatch' && r.source !== 'ai',
  ).length + aiTopicMismatches;
  const metadataTaggingIssueRate = Math.round((metadataSkips / total) * 100);

  // 4. Overly strict topic enforcement: all topic_mismatch skips
  const totalTopicMismatches = records.filter(
    (r) => r.rejectionCategory === 'topic_mismatch',
  ).length;
  const strictEnforcementRate = Math.round((totalTopicMismatches / total) * 100);

  // Primary bottleneck = highest percentage
  const candidates = [
    { label: 'AI generator ignoring requested topic', percent: aiGeneratorIgnoreRate },
    { label: 'Missing template inventory', percent: templateInventoryMissRate },
    { label: 'Incorrect metadata tagging', percent: metadataTaggingIssueRate },
    { label: 'Overly strict topic enforcement', percent: strictEnforcementRate },
  ];
  const sorted = [...candidates].sort((a, b) => b.percent - a.percent);
  const primaryBottleneck = sorted[0].percent > 0 ? sorted[0].label : 'Insufficient data';

  const integritySkips = records.filter((r) => r.rejectionCategory === 'integrity_failure').length;
  const integrityRate = Math.round((integritySkips / total) * 100);

  const breakdown: BottleneckBreakdown[] = [
    { label: 'Topic Mismatch (AI)', percent: aiGeneratorIgnoreRate, color: '#F59E0B' },
    { label: 'Topic Mismatch (all)', percent: totalTopicMismatches, color: '#DC2626' },
    { label: 'Template Failure', percent: templateInventoryMissRate, color: '#0891B2' },
    { label: 'Integrity Failure', percent: integrityRate, color: '#7C3AED' },
    { label: 'Metadata Tagging', percent: metadataTaggingIssueRate, color: '#EC4899' },
  ];

  return {
    hasBottleneck,
    aiGeneratorIgnoreRate,
    templateInventoryMissRate,
    metadataTaggingIssueRate,
    strictEnforcementRate,
    primaryBottleneck,
    breakdown: breakdown.filter((b) => b.percent > 0),
  };
}

export function categorizeRejection(
  accepted: boolean,
  integrityValid: boolean | null,
  enforcementReason: string | null,
  requestedTopic: string | undefined,
  generatedTopic: string,
): { category: SkipCategory; reason: string } {
  if (!accepted) {
    if (requestedTopic && generatedTopic !== requestedTopic) {
      return { category: 'topic_mismatch', reason: enforcementReason ?? `Topic mismatch: requested "${requestedTopic}", got "${generatedTopic}"` };
    }
    return { category: 'topic_mismatch', reason: enforcementReason ?? 'Topic enforcement rejected' };
  }
  if (integrityValid === false) {
    return { category: 'integrity_failure', reason: 'Question integrity validation failed' };
  }
  return { category: 'coverage_failure', reason: 'Inventory or coverage check failed' };
}
