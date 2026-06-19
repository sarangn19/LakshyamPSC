import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { getNode, getNodesByLevel } from '../data/knowledgeTree';

const BASE_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 120, 240];

function computeInterval(attempts: number, masteryScore: number, forgettingScore: number): number {
  const easeFactor = 2.5 - forgettingScore * 1.5;
  const confidence = masteryScore / 100;
  const stageIndex = Math.min(attempts - 1, BASE_INTERVALS_DAYS.length - 1);
  const baseInterval = BASE_INTERVALS_DAYS[stageIndex];
  const interval = Math.round(baseInterval * easeFactor * Math.max(0.5, confidence));
  return Math.max(1, interval);
}

export function getNextReviewDate(nodeId: string): Date | null {
  const state = useCognitiveTwinStore.getState();
  const mastery = state.masteryMap[nodeId];
  if (!mastery || mastery.attempts === 0) return null;
  const lastPracticed = new Date(mastery.lastPracticed);
  if (isNaN(lastPracticed.getTime())) return null;
  const intervalDays = computeInterval(mastery.attempts, mastery.masteryScore, mastery.forgettingScore);
  const nextDate = new Date(lastPracticed);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

export function isDueForReview(nodeId: string): boolean {
  const nextDate = getNextReviewDate(nodeId);
  if (!nextDate) return false;
  return new Date() >= nextDate;
}

export function getDaysOverdue(nodeId: string): number {
  const nextDate = getNextReviewDate(nodeId);
  if (!nextDate) return 0;
  const now = new Date();
  if (now < nextDate) return 0;
  return Math.floor((now.getTime() - nextDate.getTime()) / 86400000);
}

export function getReviewState(nodeId: string): 'due' | 'upcoming' | 'new' | 'unknown' {
  const state = useCognitiveTwinStore.getState();
  const mastery = state.masteryMap[nodeId];
  if (!mastery || mastery.attempts === 0) return 'new';
  if (new Date(mastery.lastPracticed).getTime() === 0) return 'unknown';
  return isDueForReview(nodeId) ? 'due' : 'upcoming';
}

export function getDueSubtopics(): { nodeId: string; name: string; path: string[]; daysOverdue: number; masteryScore: number }[] {
  const state = useCognitiveTwinStore.getState();
  const due: { nodeId: string; name: string; path: string[]; daysOverdue: number; masteryScore: number }[] = [];
  const subtopics = getNodesByLevel('subtopic');
  for (const st of subtopics) {
    const mastery = state.masteryMap[st.id];
    if (!mastery || mastery.attempts === 0) continue;
    if (isDueForReview(st.id)) {
      const ancestors = [];
      let current = getNode(st.id);
      while (current?.parentId) {
        const parent = getNode(current.parentId);
        if (parent) ancestors.unshift(parent.name);
        current = parent;
      }
      due.push({
        nodeId: st.id,
        name: st.name,
        path: ancestors,
        daysOverdue: getDaysOverdue(st.id),
        masteryScore: mastery.masteryScore,
      });
    }
  }
  return due.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export function getDueCount(): number {
  return getDueSubtopics().length;
}

export function getDueSummary(): { count: number; highestOverdue: number; averageMastery: number } {
  const due = getDueSubtopics();
  if (due.length === 0) return { count: 0, highestOverdue: 0, averageMastery: 0 };
  return {
    count: due.length,
    highestOverdue: due[0].daysOverdue,
    averageMastery: Math.round(due.reduce((s, d) => s + d.masteryScore, 0) / due.length),
  };
}
