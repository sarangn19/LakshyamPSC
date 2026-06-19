import { RetentionRecord, GapRecord, GapLifecycle } from '../store/cognitiveTwinStore';
import { generateMCQs, GeneratedQuestion } from './aiMCQGenerator';
import { getNodeByName } from '../data/knowledgeTree';

// ─── Types ───

export type AssessmentCheckpoint = '7day' | '30day' | '90day';

export interface RetentionAssessment {
  id: string;
  gapId: string;
  nodeId: string;
  subject: string;
  topic: string;
  subtopic: string;
  checkpoint: AssessmentCheckpoint;
  dueAt: string;
  assessmentDate: string | null;
  questionCount: number;
  questionIds: string[];
  score: number | null;
  retentionRate: number | null;
  passed: boolean | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
}

export interface AssessmentDashboard {
  dueCount: number;
  due7Day: number;
  due30Day: number;
  due90Day: number;
  completedCount: number;
  overdueCount: number;
  averageScore: number;
  averageRetentionRate: number;
  passRate: number;
}

// ─── Constants ───

const RETENTION_ASSESSMENT_QUESTIONS = 4;
const RETENTION_PASS_THRESHOLD = 60;
const RETENTION_AT_RISK_RATE = 50;

// ─── Helpers ───

function generateAssessmentId(): string {
  return `ra_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

// ─── Scheduling ───

export function scheduleAssessments(
  retentionRecords: RetentionRecord[],
  existingAssessments: RetentionAssessment[],
): RetentionAssessment[] {
  const newAssessments: RetentionAssessment[] = [];
  const now = Date.now();

  for (const record of retentionRecords) {
    if (!record.closedAt) continue;
    const gapId = record.gapId;
    const daysSince = daysBetween(record.closedAt, new Date().toISOString());

    const checkpoints: { key: AssessmentCheckpoint; day: number }[] = [
      { key: '7day', day: 7 },
      { key: '30day', day: 30 },
      { key: '90day', day: 90 },
    ];

    for (const cp of checkpoints) {
      // Skip if already scheduled or completed for this checkpoint
      const existing = existingAssessments.find(
        (a) => a.gapId === gapId && a.checkpoint === cp.key,
      );
      if (existing) continue;

      // Only schedule if the checkpoint day has been reached
      if (daysSince < cp.day) continue;

      const dueAt = new Date(
        new Date(record.closedAt).getTime() + cp.day * 86400000,
      ).toISOString();

      newAssessments.push({
        id: generateAssessmentId(),
        gapId,
        nodeId: record.nodeId,
        subject: record.subject,
        topic: record.topic,
        subtopic: record.subtopic,
        checkpoint: cp.key,
        dueAt,
        assessmentDate: null,
        questionCount: RETENTION_ASSESSMENT_QUESTIONS,
        questionIds: [],
        score: null,
        retentionRate: null,
        passed: null,
        status: now >= new Date(dueAt).getTime() ? 'overdue' : 'scheduled',
      });
    }
  }

  return newAssessments;
}

// ─── Due assessments ───

export function getDueAssessments(
  assessments: RetentionAssessment[],
): RetentionAssessment[] {
  const now = Date.now();
  return assessments.filter((a) => {
    if (a.status === 'completed') return false;
    return now >= new Date(a.dueAt).getTime();
  });
}

export function getAssessmentDashboard(
  assessments: RetentionAssessment[],
): AssessmentDashboard {
  const total = assessments.length;
  const completed = assessments.filter((a) => a.status === 'completed');
  const due = getDueAssessments(assessments);
  const overdue = assessments.filter((a) => a.status === 'overdue');

  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.score ?? 0), 0) / completed.length)
    : 0;

  const avgRetention = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.retentionRate ?? 0), 0) / completed.length * 10) / 10
    : 0;

  const passRate = completed.length > 0
    ? Math.round(completed.filter((a) => a.passed).length / completed.length * 100)
    : 0;

  return {
    dueCount: due.length,
    due7Day: due.filter((a) => a.checkpoint === '7day').length,
    due30Day: due.filter((a) => a.checkpoint === '30day').length,
    due90Day: due.filter((a) => a.checkpoint === '90day').length,
    completedCount: completed.length,
    overdueCount: overdue.length,
    averageScore: avgScore,
    averageRetentionRate: avgRetention,
    passRate,
  };
}

// ─── Question generation ───

export function generateAssessmentQuestions(
  subject: string,
  topic: string,
  subtopic: string,
  examType: string[],
  count: number = RETENTION_ASSESSMENT_QUESTIONS,
): GeneratedQuestion[] {
  // Generate questions targeting the specific subject/topic/subtopic
  return generateMCQs({
    subjects: [subject],
    topics: [topic],
    difficulty: 'medium',
    examType: examType[0] || 'LDC',
    count,
  });
}

// ─── Scoring ───

export function scoreAssessment(
  masteryAtClosure: number,
  correctCount: number,
  totalCount: number,
): { score: number; retentionRate: number; passed: boolean } {
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const retentionRate = masteryAtClosure > 0
    ? Math.round((score / masteryAtClosure) * 1000) / 10
    : 0;
  const passed = score >= RETENTION_PASS_THRESHOLD && retentionRate >= RETENTION_AT_RISK_RATE;
  return { score, retentionRate, passed };
}

// ─── Reopen decision ───

export function shouldReopenFromAssessment(
  score: number,
  retentionRate: number,
): { reopen: boolean; reason: string } {
  if (score < RETENTION_PASS_THRESHOLD) {
    return { reopen: true, reason: `Assessment score ${score}% is below ${RETENTION_PASS_THRESHOLD}% threshold` };
  }
  if (retentionRate < RETENTION_AT_RISK_RATE) {
    return { reopen: true, reason: `Retention rate ${retentionRate}% is below ${RETENTION_AT_RISK_RATE}% threshold` };
  }
  return { reopen: false, reason: '' };
}

// ─── At-risk retention gaps for recommendation engine ───

export interface RetentionFailureCandidate {
  gapId: string;
  nodeId: string;
  nodeName: string;
  subject: string;
  topic: string;
  retentionRate: number;
  currentMastery: number;
  masteryAtClosure: number;
  daysSinceClosure: number;
}

export function getRetentionFailures(
  retentionRecords: RetentionRecord[],
  gapRecords: GapRecord[],
  gapLifecycles: GapLifecycle[],
): RetentionFailureCandidate[] {
  return retentionRecords
    .filter((r) => {
      // Filter records that show retention < 75% (at risk or lost)
      return r.retentionRate < 75;
    })
    .map((r) => {
      const gap = gapRecords.find((g) => g.gapId === r.gapId);
      return {
        gapId: r.gapId,
        nodeId: r.nodeId,
        nodeName: r.nodeName,
        subject: r.subject,
        topic: r.topic,
        retentionRate: r.retentionRate,
        currentMastery: gap?.currentMastery ?? r.masteryAtClosure,
        masteryAtClosure: r.masteryAtClosure,
        daysSinceClosure: r.daysSinceClosure,
      };
    })
    .filter((f) => {
      // Exclude gaps already reopened or in progress
      const gap = gapRecords.find((g) => g.gapId === f.gapId);
      return gap && (gap.status === 'closed' || gap.status === 'retained');
    })
    .sort((a, b) => a.retentionRate - b.retentionRate);
}
