import { TopicKnowledge, getLearningGap, getPrerequisites, getSubtopicsForTopic } from './knowledgeEngine';
import { getScorableTopics } from './infinityScorer';
import { useBKTStore, getKey } from '../store/bktStore';
import { getSubjectWeight, getTopicWeight, getCategoryBoost } from '../data/examBlueprint';

export interface TopicPriority {
  subject: string;
  topic: string;
  importance: number;
  forgetting: number;
  learningGap: number;
  priority: number;
  totalAttempts: number;
  pMastered: number;
}

function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / 86400000;
}

function getImportance(subject: string, topic: string): number {
  const sw = getSubjectWeight(subject);
  const tw = getTopicWeight(subject, topic);
  const cb = getCategoryBoost(subject);
  return Math.max(0.1, Math.min(1, (sw * tw * cb) / 50));
}

export function computePriorities(
  knowledgeMap: Record<string, TopicKnowledge>,
  forgettingRates: Record<string, number>,
): TopicPriority[] {
  const scorable = getScorableTopics();

  return scorable.map((st) => {
    // Aggregate subtopic BKT states into a topic-level score
    const subtopics = getSubtopicsForTopic(st.topic);
    let pMastered: number;
    let totalAttempts: number;
    let lastAttempted: number;

    if (subtopics.length === 0) {
      const k = getKey(st.subject, st.topic);
      const state = knowledgeMap[k] || { subject: st.subject, topic: st.topic, pMastered: 0.15, totalAttempts: 0, consecutiveCorrect: 0, lastCorrect: true, lastAttempted: 0 };
      pMastered = state.pMastered;
      totalAttempts = state.totalAttempts;
      lastAttempted = state.lastAttempted;
    } else {
      let sumPMastered = 0;
      let sumAttempts = 0;
      let maxLastAttempted = 0;
      for (const sub of subtopics) {
        const k = getKey(st.subject, st.topic, sub);
        const state = knowledgeMap[k];
        if (state) {
          sumPMastered += state.pMastered;
          sumAttempts += state.totalAttempts;
          if (state.lastAttempted > maxLastAttempted) maxLastAttempted = state.lastAttempted;
        } else {
          sumPMastered += 0.15;
        }
      }
      pMastered = sumPMastered / subtopics.length;
      totalAttempts = sumAttempts;
      lastAttempted = maxLastAttempted;
    }

    const learningGap = Math.max(0, 1 - pMastered);
    const importance = getImportance(st.subject, st.topic);
    const days = lastAttempted > 0 ? daysSince(lastAttempted) : 30;
    const forgettingRate = forgettingRates[st.subject] ?? 7;
    const forgetting = Math.min(1, days / forgettingRate);

    const priority = importance * forgetting * learningGap;

    return {
      subject: st.subject,
      topic: st.topic,
      importance,
      forgetting,
      learningGap,
      priority,
      totalAttempts,
      pMastered,
    };
  }).sort((a, b) => b.priority - a.priority);
}

export function getTopicKnowledge(
  subject: string,
  topic: string,
  subtopic?: string,
): TopicKnowledge {
  return useBKTStore.getState().getTopic(subject, topic, subtopic);
}

export function checkPrerequisites(topic: string): string[] {
  return getPrerequisites(topic);
}
