import { GeneratedQuestion } from './aiMCQGenerator';
import { getTopicMatch } from '../data/topicRelations';

export interface QuestionAlignmentLog {
  questionTopic: string;
  questionSubject: string;
  score: number;
  matchLabel: string;
  generationSource: GeneratedQuestion['source'];
}

export interface SessionValidationReport {
  recommendedSubject: string;
  recommendedTopic?: string;
  alignmentScore: number;
  sessionAccepted: boolean;
  retryCount: number;
  questionLogs: QuestionAlignmentLog[];
  integrityPassed?: boolean;
  integrityFailures?: number;
  confidenceScore?: number;
}

const MIN_ALIGNMENT = 0.80;
const MAX_RETRIES = 3;

export function calculateAlignmentScore(
  questions: GeneratedQuestion[],
  recommendedSubject: string,
  recommendedTopic?: string,
): { score: number; logs: QuestionAlignmentLog[] } {
  if (questions.length === 0) return { score: 0, logs: [] };

  const logs: QuestionAlignmentLog[] = questions.map((q) => {
    const match = getTopicMatch(q.subject, q.topic, recommendedSubject, recommendedTopic);
    return {
      questionTopic: q.topic,
      questionSubject: q.subject,
      score: match.score,
      matchLabel: match.label,
      generationSource: q.source,
    };
  });

  const totalScore = logs.reduce((sum, l) => sum + l.score, 0);
  const score = totalScore / questions.length;

  return { score, logs };
}

export function validateSessionAlignment(
  questions: GeneratedQuestion[],
  recommendedSubject: string,
  recommendedTopic?: string,
  retryCount = 0,
): SessionValidationReport {
  const { score, logs } = calculateAlignmentScore(questions, recommendedSubject, recommendedTopic);
  const accepted = score >= MIN_ALIGNMENT || retryCount >= MAX_RETRIES;

  console.log('[TRUST] alignment report:', {
    recommendedSubject,
    recommendedTopic,
    alignmentScore: score,
    sessionAccepted: accepted,
    retryCount,
    questionLogs: logs,
  });

  return {
    recommendedSubject,
    recommendedTopic,
    alignmentScore: score,
    sessionAccepted: accepted,
    retryCount,
    questionLogs: logs,
  };
}

export function getFallbackMessage(): string {
  return 'Unable to generate a focused session.\nShowing the closest available questions.';
}
