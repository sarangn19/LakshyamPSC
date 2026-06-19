export interface AuditEntry {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  subject: string;
  generationSource: string;
  alignmentScore: number;
  confidenceScore: number;
  reportCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'edited' | 'disabled' | 'flagged';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  failureReasons?: string[];
  validationFailures: number;
  regenerationCount: number;
  sourceType: 'ai_generated' | 'reported' | 'high_regeneration' | 'frequent_failure';
}

export interface QuestionTrustScore {
  questionKey: string;
  score: number;
  userReports: number;
  validationFailures: number;
  manualRejections: number;
  manualApprovals: number;
  learnerCorrectCount: number;
  learnerTotalCount: number;
  lastUpdated: string;
  subject: string;
  topic: string;
}

const AUDIT_SUBJECTS = [
  'Kerala History',
  'Kerala Renaissance',
  'Geography',
  'Polity',
  'Economy',
  'Science',
  'Current Affairs',
];

const TRUST_PENALTY_REPORT = 15;
const TRUST_PENALTY_VALIDATION_FAIL = 10;
const TRUST_PENALTY_MANUAL_REJECT = 25;
const TRUST_BOOST_APPROVAL = 20;
const TRUST_BOOST_LEARNER_CORRECT = 1;

export function computeTrustScore(base: number, score: QuestionTrustScore): number {
  let s = base;
  s -= score.userReports * TRUST_PENALTY_REPORT;
  s -= score.validationFailures * TRUST_PENALTY_VALIDATION_FAIL;
  s -= score.manualRejections * TRUST_PENALTY_MANUAL_REJECT;
  s += score.manualApprovals * TRUST_BOOST_APPROVAL;
  const learnerAccuracy = score.learnerTotalCount > 0
    ? score.learnerCorrectCount / score.learnerTotalCount
    : 0;
  s += Math.round(learnerAccuracy * score.learnerTotalCount * TRUST_BOOST_LEARNER_CORRECT);
  return Math.max(0, Math.min(100, s));
}

export function buildTrustScore(
  subject: string,
  topic: string,
): QuestionTrustScore {
  return {
    questionKey: '',
    score: 100,
    userReports: 0,
    validationFailures: 0,
    manualRejections: 0,
    manualApprovals: 0,
    learnerCorrectCount: 0,
    learnerTotalCount: 0,
    lastUpdated: new Date().toISOString(),
    subject,
    topic,
  };
}

export function shouldSampleAudit(subject: string): boolean {
  return AUDIT_SUBJECTS.includes(subject);
}

export function createAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAuditEntry(params: {
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
  subject: string;
  generationSource: string;
  alignmentScore: number;
  confidenceScore: number;
  reportCount?: number;
  sourceType: AuditEntry['sourceType'];
  failureReasons?: string[];
  validationFailures?: number;
  regenerationCount?: number;
}): AuditEntry {
  return {
    id: createAuditId(),
    questionText: params.questionText,
    options: params.options,
    correctAnswer: params.correctAnswer,
    explanation: params.explanation,
    topic: params.topic,
    subject: params.subject,
    generationSource: params.generationSource,
    alignmentScore: params.alignmentScore,
    confidenceScore: params.confidenceScore,
    reportCount: params.reportCount ?? 0,
    status: 'pending',
    createdAt: new Date().toISOString(),
    failureReasons: params.failureReasons,
    validationFailures: params.validationFailures ?? 0,
    regenerationCount: params.regenerationCount ?? 0,
    sourceType: params.sourceType,
  };
}
