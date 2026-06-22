import { GeneratedQuestion } from './aiMCQGenerator';
import { generateAIQuestion } from './aiQuestionGenerator';
import { computePriorities, TopicPriority, checkPrerequisites, getScorableTopics, getUnifiedPriorities } from './learningRecommendationEngine';
import { getSubtopicsForTopic } from './knowledgeEngine';
import { useBKTStore } from '../store/bktStore';
import { useUserStore } from '../store/userStore';
import { InteractionSignal } from '../store/performanceStore';
import { getLearnerProfile, getStageConfig } from './learnerStage';
import { getBlueprintBoost, recordBlueprintGeneration } from './blueprintAlignment';

export interface RecentAnswer {
  text: string;
  correct: boolean;
}

export interface AdaptiveState {
  currentSubtopic: { subject: string; topic: string; subtopic: string } | null;
  recentHistory: Record<string, RecentAnswer[]>;
  usedQuestionIds: string[];
}

export function makeAdaptiveState(): AdaptiveState {
  return { currentSubtopic: null, recentHistory: {}, usedQuestionIds: [] };
}

const RECENCY_PENALTY = 0.3;
const RECENCY_WINDOW = 3;
const MAX_RECENT_HISTORY = 4;

function getWeaknessTier(priority: TopicPriority): 'weak' | 'unattempted' | 'strong' | 'default' {
  if (priority.totalAttempts === 0) return 'unattempted';
  if (priority.pMastered < 0.4) return 'weak';
  if (priority.pMastered > 0.8) return 'strong';
  return 'default';
}

function difficultyForTier(tier: 'weak' | 'unattempted' | 'strong' | 'default', difficultyShift?: number): 'easy' | 'medium' | 'hard' {
  const base = (() => {
    switch (tier) {
      case 'weak': return 'easy';
      case 'unattempted': return 'medium';
      case 'strong': return 'hard';
      default: return 'medium';
    }
  })();
  const shift = difficultyShift ?? 0;
  if (shift === 0) return base;
  const levels: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const idx = Math.max(0, Math.min(2, levels.indexOf(base) + shift));
  return levels[idx];
}

function focusForTier(tier: 'weak' | 'unattempted' | 'strong' | 'default', difficultyShift?: number): string {
  const shift = difficultyShift ?? 0;
  if (shift >= 1 && tier === 'weak') {
    return 'They have practiced this before but still struggle. Test with a medium-level conceptual question that builds on their existing knowledge.';
  }
  if (shift >= 2 && tier === 'unattempted') {
    return 'They are an advanced learner. Start with a challenging but fair question to gauge their current level.';
  }
  switch (tier) {
    case 'weak': return 'Focus on the CORE CONCEPT they are missing';
    case 'unattempted': return 'Build interest with a clear conceptual question';
    case 'strong': return 'Test application-level understanding connecting multiple ideas';
    default: return 'Test foundational understanding';
  }
}

function weightedRandomPick(
  candidates: { subject: string; topic: string; adjustedScore: number }[],
): { subject: string; topic: string } | null {
  if (candidates.length === 0) return null;
  const totalScore = candidates.reduce((s, t) => s + t.adjustedScore, 0);
  if (totalScore <= 0) return candidates[Math.floor(Math.random() * candidates.length)];
  let r = Math.random() * totalScore;
  for (const t of candidates) {
    r -= t.adjustedScore;
    if (r <= 0) return { subject: t.subject, topic: t.topic };
  }
  return candidates[candidates.length - 1];
}

function getRecentTopicKeys(signals: InteractionSignal[], n: number): string[] {
  return signals.slice(-n).map((s) => `${s.subject}::${s.topic}`);
}

function pickTopic(
  weakSubjects: string[],
  sessionCovered: string[],
  recentSignals: InteractionSignal[],
  preferredTopic?: string,
  preferredSubject?: string,
): { subject: string; topic: string } | null {
  const bkt = useBKTStore.getState();
  const knowledgeMap = bkt.topicMap;
  const priorities = computePriorities(knowledgeMap, {});

  const recentKeys = getRecentTopicKeys(recentSignals, RECENCY_WINDOW);
  const coveredSet = new Set(sessionCovered);

  let candidates = priorities
    .filter((p) => {
      if (weakSubjects.length === 0) return true;
      return weakSubjects.includes(p.subject);
    })
    .map((p) => {
      const key = `${p.subject}::${p.topic}`;
      let adjustedScore = p.priority;
      if (coveredSet.has(key)) adjustedScore = 0;
      if (recentKeys.includes(key)) adjustedScore *= RECENCY_PENALTY;
      const prereqs = checkPrerequisites(p.topic);
      for (const prereq of prereqs) {
        if (!knowledgeMap[prereq] || knowledgeMap[prereq].pMastered < 0.8) {
          adjustedScore *= 0.5;
        }
      }
      const boost = getBlueprintBoost(p.subject, p.topic);
      adjustedScore *= boost;
      return { subject: p.subject, topic: p.topic, adjustedScore };
    })
    .filter((c) => c.adjustedScore > 0);

  if (candidates.length === 0) {
    let fallback: typeof priorities = [];
    if (preferredTopic) {
      fallback = priorities.filter((p) => p.topic === preferredTopic);
    }
    if (fallback.length === 0 && preferredTopic && preferredSubject) {
      fallback = priorities.filter((p) => p.subject === preferredSubject);
    }
    if (fallback.length === 0 && weakSubjects.length > 0) {
      fallback = priorities.filter((p) => weakSubjects.includes(p.subject));
    }
    if (fallback.length === 0) fallback = priorities;
    candidates = fallback.map((p) => ({
      subject: p.subject,
      topic: p.topic,
      adjustedScore: Math.max(0.01, p.priority),
    }));
  }

  if (preferredTopic) {
    const hasPreferred = candidates.some((c) => c.topic === preferredTopic);
    if (hasPreferred) {
      candidates = candidates.map((c) => ({
        ...c,
        adjustedScore: c.topic === preferredTopic ? c.adjustedScore * 100 : c.adjustedScore * 0.01,
      }));
    } else if (preferredSubject && candidates.some((c) => c.subject === preferredSubject)) {
      candidates.push({
        subject: preferredSubject,
        topic: preferredTopic,
        adjustedScore: 100,
      });
    }
  }

  return weightedRandomPick(candidates);
}

function pickWeakestSubtopic(
  subject: string,
  topic: string,
): string {
  const bkt = useBKTStore.getState();
  const weakest = bkt.getWeakestSubtopicInTopic(subject, topic);
  if (weakest) return weakest.subtopic;
  const subtopics = getSubtopicsForTopic(topic);
  if (subtopics.length > 0) return subtopics[0];
  return topic;
}

export async function generateNextAdaptiveQuestion(
  weakSubjects: string[],
  sessionCovered: string[],
  sessionCorrect: number,
  sessionTotal: number,
  currentDifficulty: 'easy' | 'medium' | 'hard',
  adaptiveState: AdaptiveState,
  recentSignals: InteractionSignal[],
  lastAnswerCorrect?: boolean,
  avoidTexts?: string[],
  preferredTopic?: string,
  preferredSubject?: string,
  options?: { priority?: 'high' | 'low'; signal?: AbortSignal },
): Promise<{
  question: GeneratedQuestion | null;
  adaptiveState: AdaptiveState;
  aligned: boolean;
}> {
  const state = {
    ...adaptiveState,
    recentHistory: { ...adaptiveState.recentHistory },
  };

  // Reinforcement loop: if wrong, stay on same subtopic
  let topic: { subject: string; topic: string } | null = null;
  let subtopic: string;
  if (lastAnswerCorrect === false && state.currentSubtopic) {
    topic = { subject: state.currentSubtopic.subject, topic: state.currentSubtopic.topic };
    subtopic = state.currentSubtopic.subtopic;
  } else {
    topic = pickTopic(weakSubjects, sessionCovered, recentSignals, preferredTopic, preferredSubject);
    if (!topic) {
      const allTopics = getScorableTopics();
      if (allTopics.length > 0) {
        const idx = Math.floor(Math.random() * allTopics.length);
        topic = allTopics[idx];
      }
    }
    if (!topic) return { question: null, adaptiveState: state, aligned: false };
    subtopic = pickWeakestSubtopic(topic.subject, topic.topic);
  }

  state.currentSubtopic = { ...topic, subtopic };

  // Compute priority for this topic
  const bkt = useBKTStore.getState();
  const knowledgeMap = bkt.topicMap;
  const priorities = computePriorities(knowledgeMap, {});
  const thisPriority = priorities.find((p) => p.subject === topic!.subject && p.topic === topic!.topic);
  const tier = thisPriority ? getWeaknessTier(thisPriority) : 'default';
  const stageConfig = (() => {
    try { const p = getLearnerProfile(); return getStageConfig(p.stage); } catch { return getStageConfig('discovering'); }
  })();
  const difficulty = difficultyForTier(tier, stageConfig.difficultyShift);
  const focusInstruction = focusForTier(tier, stageConfig.difficultyShift);

  // Build recent history for this subtopic
  const historyKey = `${topic.subject}::${topic.topic}::${subtopic}`;
  const topicHistory = state.recentHistory[historyKey] || [];

  // Syllabus items for this topic (all subtopics the AI can draw from)
  const syllabusItems = getSubtopicsForTopic(topic.topic);

  // Language: read locale from user store for AI-generated questions
  const locale = useUserStore.getState().locale;

  console.log('[AUDIT] selectedTopic:', topic.subject + '::' + topic.topic);

  const topicConstraint =
    `PREFERRED TOPIC: Generate a question about "${topic.topic}" within the subject "${topic.subject}". `
    + `The question should ideally cover "${topic.topic}" or its subtopics. `
    + `If you cannot generate for this exact topic, generate for the closest related topic within the same subject. `
    + `Always generate a question — never return empty.`;

  // AI generation — single attempt, alignment is checked downstream
  // Force English for all subjects
  const aiResult = await generateAIQuestion({
    subject: topic.subject,
    topic: topic.topic,
    subtopic,
    difficulty,
    focusInstruction,
    recentHistory: topicHistory,
    syllabusItems,
    language: 'en',
    topicConstraint,
    avoidTexts,
  }, options);

  if (aiResult.question) {
    const q = aiResult.question;
    q.subtopic = subtopic;
    recordBlueprintGeneration(q.subject, q.topic);
    console.log('[AUDIT] generatedQuestionTopic:', q.subject + '::' + q.topic);
    const aligned = q.topic === topic.topic && q.subject === topic.subject;
    if (!aligned) {
      console.log('[ALIGNMENT] MISMATCH — requested:', topic.subject, topic.topic, '| got:', q.subject, q.topic, '| enforcement will handle');
    }
    return { question: q, adaptiveState: state, aligned };
  }

  // No fallback — if AI fails, return null
  console.log('[AUDIT] generatedQuestionTopic: none (AI failed, no template fallback)');
  return { question: null, adaptiveState: state, aligned: false };
}

export function recordAnswer(
  adaptiveState: AdaptiveState,
  questionText: string,
  topic: string,
  subject: string,
  correct: boolean,
  questionId?: string,
  subtopic?: string,
): AdaptiveState {
  const historyKey = `${subject}::${topic}${subtopic ? `::${subtopic}` : ''}`;
  const history = adaptiveState.recentHistory[historyKey] || [];
  const updated = [...history, { text: questionText, correct }].slice(-MAX_RECENT_HISTORY);
  const usedIds = questionId && !adaptiveState.usedQuestionIds.includes(questionId)
    ? [...adaptiveState.usedQuestionIds, questionId]
    : adaptiveState.usedQuestionIds;
  return {
    ...adaptiveState,
    recentHistory: { ...adaptiveState.recentHistory, [historyKey]: updated },
    usedQuestionIds: usedIds,
  };
}
