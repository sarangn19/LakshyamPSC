import { syllabus } from './syllabus';
import { getAlignmentScore, getMatchLabel } from './topicTaxonomy';

export interface TopicMatchResult {
  score: number;
  label: string;
}

export function getTopicMatch(
  questionSubject: string,
  questionTopic: string,
  recommendedSubject: string,
  recommendedTopic?: string,
): TopicMatchResult {
  const score = getAlignmentScore(questionSubject, questionTopic, recommendedSubject, recommendedTopic);
  const label = getMatchLabel(questionSubject, questionTopic, recommendedSubject, recommendedTopic);
  return { score, label };
}

export function getRelatedTopics(subject: string): string[] {
  const s = syllabus.find((s) => s.name === subject);
  if (!s) return [];
  return s.topics.map((t) => t.name);
}

export function getSubjectForTopic(topic: string): string | null {
  for (const s of syllabus) {
    for (const t of s.topics) {
      if (t.name === topic) return s.name;
    }
  }
  return null;
}
