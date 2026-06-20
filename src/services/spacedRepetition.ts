import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import { useBKTStore } from '../store/bktStore';
import { useUserStore } from '../store/userStore';
import { getNode, getNodesByLevel } from '../data/knowledgeTree';
import { getCompositeExamWeight } from '../data/examBlueprints';
import { getLearnerProfile, getStageConfig } from './learnerStage';

const DEFAULT_P_FORGET = 0.15;
const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 365;

function getPForget(subject: string, topic: string): number {
  const params = useBKTStore.getState().getFittedParamsForTopic(topic);
  return params.pForget ?? DEFAULT_P_FORGET;
}

function getPMastered(subject: string, topic: string, subtopic?: string): number {
  return useBKTStore.getState().getTopicPMastered(subject, topic);
}

function getTotalQuestions(): number {
  try {
    const { usePerformanceStore } = require('../store/performanceStore');
    return usePerformanceStore.getState().interactionSignals.length;
  } catch {
    return 0;
  }
}

function isNewUser(): boolean {
  return getTotalQuestions() < 20;
}

function getLearnerStageName(): string {
  try {
    return getLearnerProfile().stage;
  } catch {
    return 'discovering';
  }
}

function getMemoryThreshold(): number {
  const stage = getLearnerStageName();
  if (isNewUser()) return 0.7;
  switch (stage) {
    case 'discovering': return 0.65;
    case 'building': return 0.55;
    case 'mastering': return 0.50;
    case 'polishing': return 0.45;
    default: return 0.60;
  }
}

function getStageMultiplier(): number {
  const stage = getLearnerStageName();
  if (isNewUser()) return 0.4;
  switch (stage) {
    case 'discovering': return 0.6;
    case 'building': return 0.8;
    case 'mastering': return 1.0;
    case 'polishing': return 1.2;
    default: return 0.6;
  }
}

function getExamWeightBoost(subject: string, topic: string): number {
  const targetExams = useUserStore.getState().targetExams;
  if (!targetExams || targetExams.length === 0) return 1.0;
  const weight = getCompositeExamWeight(targetExams, subject, topic);
  return 0.8 + (weight / 20) * 0.4;
}

function computeDaysUntilDecay(pMastered: number, pForget: number, threshold: number): number {
  if (pMastered <= threshold) return 0;
  if (pForget <= 0) return MAX_INTERVAL_DAYS;
  const dailyRetention = 1 - pForget;
  if (dailyRetention <= 0) return 0;
  if (dailyRetention >= 1) return MAX_INTERVAL_DAYS;
  const days = Math.log(threshold / pMastered) / Math.log(dailyRetention);
  return Math.max(0, Math.ceil(days));
}

function computeOptimalInterval(
  subject: string,
  topic: string,
  lastPracticed: string | null,
  attempts: number,
): number {
  const pMastered = getPMastered(subject, topic);
  const pForget = getPForget(subject, topic);
  const threshold = getMemoryThreshold();

  let baseDays = computeDaysUntilDecay(pMastered, pForget, threshold);

  if (attempts === 0 || !lastPracticed) {
    baseDays = isNewUser() ? 1 : 2;
  } else if (attempts === 1) {
    baseDays = Math.max(baseDays, isNewUser() ? 2 : 3);
  }

  const stageMul = getStageMultiplier();
  const examBoost = getExamWeightBoost(subject, topic);
  const interval = Math.round(baseDays * stageMul * examBoost);
  return Math.max(MIN_INTERVAL_DAYS, Math.min(MAX_INTERVAL_DAYS, interval));
}

function hasAttempts(nodeId: string): boolean {
  const state = useCognitiveTwinStore.getState();
  const mastery = state.masteryMap[nodeId];
  return !!(mastery && mastery.attempts > 0);
}

export function getNextReviewDate(nodeId: string): Date | null {
  const state = useCognitiveTwinStore.getState();
  const mastery = state.masteryMap[nodeId];
  if (!mastery || mastery.attempts === 0) return null;
  const lastPracticed = mastery.lastPracticed ? new Date(mastery.lastPracticed) : null;
  if (!lastPracticed || isNaN(lastPracticed.getTime())) return null;

  const node = getNode(nodeId);
  const ancestors: string[] = [];
  let current = node;
  while (current?.parentId) {
    const parent = getNode(current.parentId);
    if (parent) ancestors.unshift(parent.name);
    current = parent;
  }
  const subject = ancestors[0] || '';
  const topic = ancestors[1] || node?.name || '';

  const interval = computeOptimalInterval(subject, topic, mastery.lastPracticed, mastery.attempts);
  const next = new Date(lastPracticed);
  next.setDate(next.getDate() + interval);
  return next;
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
  if (!mastery.lastPracticed) return 'unknown';
  return isDueForReview(nodeId) ? 'due' : 'upcoming';
}

export function getDueSubtopics(): { nodeId: string; name: string; path: string[]; daysOverdue: number; masteryScore: number; priorityScore: number; subject: string; topic: string; status: string }[] {
  const state = useCognitiveTwinStore.getState();
  const twin = useCognitiveTwinStore.getState();
  const result: any[] = [];
  const subtopics = getNodesByLevel('subtopic');

  const targetExams = useUserStore.getState().targetExams || ['LDC'];
  const userStage = getLearnerStageName();
  const newUser = isNewUser();

  for (const st of subtopics) {
    const mastery = state.masteryMap[st.id];
    const ancestors: string[] = [];
    let current = getNode(st.id);
    while (current?.parentId) {
      const parent = getNode(current.parentId);
      if (parent) ancestors.unshift(parent.name);
      current = parent;
    }
    const subject = ancestors[0] || '';
    const topic = ancestors[1] || st.name;

    if (!mastery || mastery.attempts === 0) {
      if (newUser) {
        const examWeight = getCompositeExamWeight(targetExams, subject, topic);
        result.push({
          nodeId: st.id, name: st.name, path: ancestors,
          daysOverdue: 0, masteryScore: 0, priorityScore: Math.round(examWeight * 5),
          subject, topic, status: 'new',
        });
      }
      continue;
    }

    const due = isDueForReview(st.id);
    if (due) {
      const overdue = getDaysOverdue(st.id);
      const examWeight = getCompositeExamWeight(targetExams, subject, topic);
      const forgettingRisk = 1 - getPMastered(subject, topic);
      const gapUrgency = twin.gapRecords.filter((g) => g.nodeId === st.id && g.status !== 'closed').length > 0 ? 30 : 0;
      const priorityScore = Math.round(overdue * 10 + forgettingRisk * 40 + examWeight * 5 + gapUrgency);
      result.push({
        nodeId: st.id, name: st.name, path: ancestors,
        daysOverdue: overdue, masteryScore: mastery.masteryScore,
        priorityScore, subject, topic, status: 'due',
      });
    }
  }

  return result.sort((a: any, b: any) => b.priorityScore - a.priorityScore);
}

export function getDueCount(): number {
  return getDueSubtopics().filter((d) => d.status === 'due').length;
}

export interface DueItem {
  nodeId: string; name: string; path: string[];
  daysOverdue: number; masteryScore: number;
  priorityScore: number; subject: string; topic: string; status: string;
}

export function getDueSummary(): { count: number; highestOverdue: number; averageMastery: number; newItemsCount: number; items: DueItem[] } {
  const due = getDueSubtopics();
  const dueItems = due.filter((d) => d.status === 'due');
  const newItems = due.filter((d) => d.status === 'new');
  if (dueItems.length === 0 && newItems.length === 0) {
    return { count: 0, highestOverdue: 0, averageMastery: 0, newItemsCount: 0, items: [] };
  }
  return {
    count: dueItems.length + (isNewUser() ? newItems.length : 0),
    highestOverdue: dueItems.length > 0 ? dueItems[0].daysOverdue : 0,
    averageMastery: dueItems.length > 0
      ? Math.round(dueItems.reduce((s, d) => s + d.masteryScore, 0) / dueItems.length)
      : 0,
    newItemsCount: newItems.length,
    items: due.slice(0, 5),
  };
}
