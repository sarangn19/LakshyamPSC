import { getNodeByName, getAncestors } from '../data/knowledgeTree';
import type { KnowledgeMastery } from './cognitiveTwinTypes';

const MASTERY_IMPROVING_THRESHOLD = 60;
const MASTERY_CLOSING_THRESHOLD = 80;
const MASTERY_CLOSED_THRESHOLD = 80;

export function computeMasteryScore(accuracy: number, hesitation: number, forgetting: number): number {
  return Math.max(0, Math.min(100, accuracy * 0.6 + (1 - hesitation) * 0.2 + (1 - forgetting) * 0.2));
}

export function computeTrend(m: KnowledgeMastery): 'improving' | 'declining' | 'stable' | 'unknown' {
  if (m.attempts < 3) return 'unknown';
  if (m.accuracy >= 70) return 'improving';
  if (m.accuracy <= 30) return 'declining';
  return 'stable';
}

export function generateGapId(): string {
  return `gap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

export function computeForgettingScore(accuracy: number, attempts: number, daysSinceLastPractice: number): number {
  if (attempts === 0) return 0.5;
  const accuracyFactor = 1 - (accuracy / 100);
  const recencyFactor = Math.min(1, daysSinceLastPractice / 30);
  return Math.round((accuracyFactor * 0.6 + recencyFactor * 0.4) * 100) / 100;
}

export function computeGapStatus(masteryScore: number): 'open' | 'improving' | 'closing' | 'closed' {
  if (masteryScore >= MASTERY_CLOSED_THRESHOLD) return 'closed';
  if (masteryScore >= MASTERY_CLOSING_THRESHOLD) return 'closing';
  if (masteryScore >= MASTERY_IMPROVING_THRESHOLD) return 'improving';
  return 'open';
}

export { MASTERY_IMPROVING_THRESHOLD, MASTERY_CLOSING_THRESHOLD, MASTERY_CLOSED_THRESHOLD };

export function hasValidQuestionMetadata(subject?: string, topic?: string, subtopic?: string): boolean {
  if (!subject || !topic) return false;
  const subjNode = getNodeByName(subject, 'subject');
  const topNode = getNodeByName(topic, 'topic');
  if (!subjNode || !topNode) return false;
  if (subtopic) {
    const subtNode = getNodeByName(subtopic, 'subtopic');
    if (!subtNode) return false;
    const ancestors = getAncestors(subtNode.id);
    if (!ancestors.some((a) => a.id === topNode.id)) return false;
  }
  return true;
}
