import { useCognitiveTwinStore, GapRecord } from '../store/cognitiveTwinStore';
import { getNode, getNodePath, getChildren, getAncestors, getNodesByLevel, getAllNodes } from '../data/knowledgeTree';
import { useBKTStore } from '../store/bktStore';
import { computePriorities } from './revisionEngine';
import { useAdminStore } from '../store/adminStore';
import { getRetentionFailures } from './retentionAssessmentService';

export interface GapRecommendation {
  gap: GapRecord;
  nodePath: string[];
  priorityScore: number;
  weaknessFactor: number;
  forgettingFactor: number;
  recencyFactor: number;
  weightFactor: number;
}

export interface UnifiedTopicPriority {
  subject: string;
  topic: string;
  subtopic: string | null;
  gapPriority: number;
  bktPriority: number;
  unifiedScore: number;
  isCognitiveGap: boolean;
  isBKTGap: boolean;
}

const RECENCY_DAYS_THRESHOLD = 3;

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

// ─── PART 5: Subtopic-first gap recommendations ───

export function getGapRecommendations(): GapRecommendation[] {
  const state = useCognitiveTwinStore.getState();
  const config = useAdminStore.getState().cognitiveTwinConfig;
  const gaps = state.getOpenGaps();
  const masteryMap = state.masteryMap;

  return gaps.map((gap) => {
    const nodePath = getNodePath(gap.nodeId);
    const mastery = masteryMap[gap.nodeId];
    const weaknessFactor = Math.max(0, (50 - gap.currentMastery) / 50) * (config.weaknessWeight / 100);
    const forgettingFactor = (mastery?.forgettingScore ?? 0) * (config.forgettingWeight / 100);
    const recencyDays = mastery?.lastPracticed ? daysSince(mastery.lastPracticed) : 999;
    const recencyFactor = recencyDays > RECENCY_DAYS_THRESHOLD
      ? Math.min(1, recencyDays / 30) * (config.coverageWeight / 100)
      : 0;
    // Priority: subtopic first (Part 5)
    const baseWeightFactor = gap.level === 'subtopic' ? 0.4 : gap.level === 'topic' ? 0.35 : 0.25;
    const weightFactor = baseWeightFactor * (config.coverageWeight / 100);
    const priorityScore = Math.round(
      weaknessFactor * 40 + forgettingFactor * 20 + recencyFactor * 20 + weightFactor * 20
    );

    return { gap, nodePath, priorityScore, weaknessFactor, forgettingFactor, recencyFactor, weightFactor };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
}

export function getUnifiedPriorities(): UnifiedTopicPriority[] {
  const bkt = useBKTStore.getState();
  const twin = useCognitiveTwinStore.getState();
  const bktPriorities = computePriorities(bkt.topicMap, {});
  const gapRecs = getGapRecommendations();

  const gapByTopic: Record<string, GapRecommendation> = {};
  for (const rec of gapRecs) {
    const path = rec.nodePath;
    const topicName = path.length >= 2 ? path[1] : null;
    if (topicName) {
      const existing = gapByTopic[topicName];
      if (!existing || rec.priorityScore > existing.priorityScore) {
        gapByTopic[topicName] = rec;
      }
    }
  }

  const unified: UnifiedTopicPriority[] = bktPriorities.map((bp) => {
    const matchingGap = gapByTopic[bp.topic];
    const gapPriority = matchingGap?.priorityScore ?? 0;
    const bktNorm = Math.round(bp.priority * 100);
    const unifiedScore = Math.round(
      gapPriority * 0.6 + bktNorm * 0.4
    );
    return {
      subject: bp.subject,
      topic: bp.topic,
      subtopic: matchingGap?.gap.level === 'subtopic' ? getNode(matchingGap.gap.nodeId)?.name ?? null : null,
      gapPriority,
      bktPriority: bktNorm,
      unifiedScore,
      isCognitiveGap: !!matchingGap,
      isBKTGap: bp.learningGap > 0.3,
    };
  }).sort((a, b) => b.unifiedScore - a.unifiedScore);

  return unified;
}

export function getTopGapTopics(limit = 5): { subject: string; topic: string; score: number }[] {
  return getUnifiedPriorities()
    .filter((u) => u.isCognitiveGap)
    .slice(0, limit)
    .map((u) => ({ subject: u.subject, topic: u.topic, score: u.unifiedScore }));
}

export function getSubjectGapReport(subject: string): { topic: string; gapCount: number; avgMastery: number; subtopicsNeedingAttention: string[] }[] {
  const state = useCognitiveTwinStore.getState();
  const subjectNode = getNode(subject);
  if (!subjectNode) return [];
  const subjectChildren = getChildren(subjectNode.id);
  return subjectChildren.map((topicNode) => {
    const topicGaps = state.gapRecords.filter((g) => {
      const ancestors = getAncestors(g.nodeId);
      return ancestors.some((a) => a.id === topicNode.id) && g.status !== 'closed';
    });
    // Subtopic-level attention (Part 5)
    const subtopicNodes = getChildren(topicNode.id);
    const subtopicGaps = subtopicNodes
      .filter((st) => {
        const m = state.masteryMap[st.id];
        return m && (m.accuracy < 40 || m.forgettingScore > 0.6);
      })
      .map((st) => st.name);
    const avgMastery = topicGaps.length > 0
      ? Math.round(topicGaps.reduce((s, g) => s + g.currentMastery, 0) / topicGaps.length)
      : 0;
    return { topic: topicNode.name, gapCount: topicGaps.length, avgMastery, subtopicsNeedingAttention: subtopicGaps };
  });
}

export function getCognitiveTwinSummary(): { totalMastered: number; totalGaps: number; openGaps: number; strongestSubject: string; weakestSubject: string; overallMastery: number } {
  const state = useCognitiveTwinStore.getState();
  const masteryEntries = Object.entries(state.masteryMap);
  const subjectMastery: Record<string, { total: number; count: number }> = {};
  let overallTotal = 0;
  let overallCount = 0;

  for (const [nodeId, m] of masteryEntries) {
    if (m.attempts < 2) continue;
    overallTotal += m.masteryScore;
    overallCount++;
    const node = getNode(nodeId);
    if (node) {
      const ancestors = getAncestors(nodeId);
      const subjectName = ancestors[0]?.name ?? node.name;
      if (!subjectMastery[subjectName]) subjectMastery[subjectName] = { total: 0, count: 0 };
      subjectMastery[subjectName].total += m.masteryScore;
      subjectMastery[subjectName].count++;
    }
  }

  let strongest = '';
  let weakest = '';
  let strongestAvg = 0;
  let weakestAvg = 999;
  for (const [sub, data] of Object.entries(subjectMastery)) {
    const avg = data.total / data.count;
    if (avg > strongestAvg) { strongestAvg = avg; strongest = sub; }
    if (avg < weakestAvg) { weakestAvg = avg; weakest = sub; }
  }

  return {
    totalMastered: Object.values(state.masteryMap).filter((m) => m.masteryScore >= 75).length,
    totalGaps: state.gapRecords.length,
    openGaps: state.gapRecords.filter((g) => g.status !== 'closed').length,
    strongestSubject: strongest,
    weakestSubject: weakest,
    overallMastery: overallCount > 0 ? Math.round(overallTotal / overallCount) : 0,
  };
}

// ─── Retention failure priority (forgotten > undiscovered) ───

export function getRetentionPriorityTopics(limit = 3): { subject: string; topic: string; retentionRate: number; daysSinceClosure: number }[] {
  const twin = useCognitiveTwinStore.getState();
  const failures = getRetentionFailures(
    twin.retentionRecords,
    twin.gapRecords,
    twin.gapLifecycles,
  );
  const seen = new Set<string>();
  return failures
    .filter((f) => {
      const key = `${f.subject}::${f.topic}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map((f) => ({
      subject: f.subject,
      topic: f.topic,
      retentionRate: f.retentionRate,
      daysSinceClosure: f.daysSinceClosure,
    }));
}

// ─── PART 6: Subtopic-first recommendation ───

export function getRecommendedSubjectAndTopic(): { subject: string; topic: string | undefined; subtopic: string | undefined } {
  const twin = useCognitiveTwinStore.getState();

  // Priority 0: At-risk retention gaps (forgotten knowledge > undiscovered weakness)
  const retentionFailures = getRetentionPriorityTopics(1);
  if (retentionFailures.length > 0) {
    const top = retentionFailures[0];
    return {
      subject: top.subject,
      topic: top.topic,
      subtopic: undefined,
    };
  }

  // Priority 1: Find the weakest subtopic gap
  const smallestGap = twin.getSmallestMeaningfulGap();
  if (smallestGap) {
    const path = getNodePath(smallestGap.node.id);
    return {
      subject: path[0] || '',
      topic: path.length >= 2 ? path[1] : undefined,
      subtopic: smallestGap.node.level === 'subtopic' ? smallestGap.node.name : undefined,
    };
  }

  // Priority 2: Fall back to unified priorities
  const unified = getUnifiedPriorities();
  if (unified.length === 0) return { subject: '', topic: undefined, subtopic: undefined };
  const top = unified[0];
  return { subject: top.subject, topic: top.topic, subtopic: top.subtopic ?? undefined };
}

export function getNextCognitiveGapTopic(
  weakSubjects: string[],
  sessionCovered: string[],
): { subject: string; topic: string; subtopic: string; score: number } | null {
  const twin = useCognitiveTwinStore.getState();

  // Part 6: Subtopic-first targeting
  const prioritized = twin.prioritizeGaps().filter((gs) => {
    if (weakSubjects.length === 0) return true;
    const path = getNodePath(gs.node.id);
    return weakSubjects.some((ws) => path.includes(ws));
  });

  if (prioritized.length === 0) return null;

  // Pick subtopic-level gap first
  const subtopicGap = prioritized.find((gs) => gs.node.level === 'subtopic');
  const target = subtopicGap || prioritized[0];
  const path = getNodePath(target.node.id);
  const subject = path[0] || '';
  const topic = path.length >= 2 ? path[1] : '';
  const subtopicName = target.node.level === 'subtopic' ? target.node.name : '';

  const coveredKey = `${subject}::${topic}`;
  if (sessionCovered.includes(coveredKey)) {
    const next = prioritized.find((gs) => {
      const p = getNodePath(gs.node.id);
      const k = `${p[0] || ''}::${p.length >= 2 ? p[1] : ''}`;
      return !sessionCovered.includes(k);
    });
    if (next) {
      const np = getNodePath(next.node.id);
      return {
        subject: np[0] || '',
        topic: np.length >= 2 ? np[1] : '',
        subtopic: next.node.level === 'subtopic' ? next.node.name : '',
        score: next.score,
      };
    }
  }

  return { subject, topic, subtopic: subtopicName, score: target.score };
}

// ─── Random topic selection for Group B (random practice) ───

export function getRandomSubjectAndTopic(): { subject: string; topic: string | undefined; subtopic: string | undefined } {
  const subjects = getNodesByLevel('subject');
  if (subjects.length === 0) return { subject: '', topic: undefined, subtopic: undefined };

  const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
  const topics = getChildren(randomSubject.id);
  if (topics.length === 0) return { subject: randomSubject.name, topic: undefined, subtopic: undefined };

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const subtopics = getChildren(randomTopic.id);
  const randomSubtopic = subtopics.length > 0
    ? subtopics[Math.floor(Math.random() * subtopics.length)]
    : null;

  return {
    subject: randomSubject.name,
    topic: randomTopic.name,
    subtopic: randomSubtopic?.name ?? undefined,
  };
}
