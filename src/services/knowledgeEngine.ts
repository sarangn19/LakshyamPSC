export interface TopicKnowledge {
  subject: string;
  topic: string;
  subtopic?: string;
  pMastered: number;
  totalAttempts: number;
  consecutiveCorrect: number;
  lastCorrect: boolean;
  lastAttempted: number;
}

export interface BKTFittedParams {
  pGuess: number;
  pSlip: number;
  pLearn: number;
  pL0: number;
  pForget: number;
}

export interface ScorableSubtopic {
  subject: string;
  topic: string;
  subtopic: string;
}

export function getAllScorableSubtopics(): ScorableSubtopic[] {
  const { syllabus } = require('../data/syllabus') as {
    syllabus: { name: string; topics: { name: string; subtopics: { name: string }[] }[] }[];
  };
  const result: ScorableSubtopic[] = [];
  for (const subject of syllabus) {
    for (const topic of subject.topics) {
      for (const subtopic of topic.subtopics) {
        result.push({ subject: subject.name, topic: topic.name, subtopic: subtopic.name });
      }
    }
  }
  return result;
}

export function getSubtopicsForTopic(topicName: string): string[] {
  const { syllabus } = require('../data/syllabus') as {
    syllabus: { name: string; topics: { name: string; subtopics: { name: string }[] }[] }[];
  };
  for (const subject of syllabus) {
    for (const topic of subject.topics) {
      if (topic.name === topicName) {
        return topic.subtopics.map((st) => st.name);
      }
    }
  }
  return [];
}

export const DEFAULT_BKT_PARAMS: BKTFittedParams = {
  pGuess: 0.15,
  pSlip: 0.10,
  pLearn: 0.18,
  pL0: 0.15,
  pForget: 0.05,
};

const MASTERY_THRESHOLD = 0.92;
const MASTERY_MIN_ATTEMPTS = 5;

export function makeInitialKnowledge(subject: string, topic: string, subtopic?: string): TopicKnowledge {
  return {
    subject,
    topic,
    subtopic,
    pMastered: DEFAULT_BKT_PARAMS.pL0,
    totalAttempts: 0,
    consecutiveCorrect: 0,
    lastCorrect: true,
    lastAttempted: 0,
  };
}

export function updateKnowledge(
  state: TopicKnowledge,
  correct: boolean,
  timestamp: number,
  params: BKTFittedParams = DEFAULT_BKT_PARAMS,
): TopicKnowledge {
  let pGivenObs: number;
  if (correct) {
    const pCorrect = state.pMastered * (1 - params.pSlip) + (1 - state.pMastered) * params.pGuess;
    pGivenObs = (state.pMastered * (1 - params.pSlip)) / pCorrect;
  } else {
    const pWrong = state.pMastered * params.pSlip + (1 - state.pMastered) * (1 - params.pGuess);
    pGivenObs = (state.pMastered * params.pSlip) / pWrong;
  }

  const pAfterLearn = pGivenObs + (1 - pGivenObs) * params.pLearn;

  return {
    ...state,
    pMastered: Math.max(0.01, Math.min(0.99, pAfterLearn)),
    totalAttempts: state.totalAttempts + 1,
    consecutiveCorrect: correct ? state.consecutiveCorrect + 1 : 0,
    lastCorrect: correct,
    lastAttempted: timestamp,
  };
}

export function getConfidence(state: TopicKnowledge): number {
  return state.pMastered;
}

export function isMastered(state: TopicKnowledge): boolean {
  return state.pMastered >= MASTERY_THRESHOLD && state.totalAttempts >= MASTERY_MIN_ATTEMPTS;
}

export function getLearningGap(state: TopicKnowledge): number {
  if (isMastered(state)) return 0;
  return 1 - state.pMastered;
}

const FORGETTING_HALF_LIFE_DAYS = 21;

export function applyDecay(state: TopicKnowledge, nowTimestamp?: number): TopicKnowledge {
  const now = nowTimestamp || Date.now();
  if (!state.lastAttempted || state.lastAttempted <= 0) return state;
  const daysElapsed = (now - state.lastAttempted) / 86400000;
  if (daysElapsed <= 1) return state;
  const decayFactor = Math.pow(2, -daysElapsed / FORGETTING_HALF_LIFE_DAYS);
  const decayed = state.pMastered * decayFactor;
  return { ...state, pMastered: Math.max(0.01, decayed) };
}

const PREREQUISITES: Record<string, string[]> = {
  'Medieval Kerala': ['Ancient Kerala'],
  'Modern Kerala': ['Medieval Kerala'],
  'Temple Entry Movement': ['Social Reform Movements'],
  'Directive Principles': ['Fundamental Rights'],
  'Union Executive': ['Fundamental Rights', 'Directive Principles'],
  'Kerala Geography': ['Physical Geography'],
  'Chemistry': ['Physics'],
  'Biology': ['Chemistry'],
  'Data Interpretation': ['Arithmetic'],
};

export function getPrerequisites(topic: string): string[] {
  return PREREQUISITES[topic] ?? [];
}

export function arePrerequisitesMet(
  topic: string,
  knowledgeMap: Map<string, TopicKnowledge>,
): boolean {
  const prereqs = getPrerequisites(topic);
  if (prereqs.length === 0) return true;
  return prereqs.every((p) => {
    const state = knowledgeMap.get(p);
    return state && isMastered(state);
  });
}
