import { InteractionSignal, UserProfile, ConfusionPair } from '../store/performanceStore';
import { getSubjectWeight, getTopicWeight } from '../data/examBlueprint';
import { boostWithPSCFrequency } from './pscFrequencyBoost';

export interface TopicScore {
  subject: string;
  topic: string;
  weaknessScore: number;
  forgettingScore: number;
  importanceScore: number;
  confusionScore: number;
  hesitationScore: number;
  recencyPenalty: number;
  coverageBalance: number;
  finalScore: number;
  // Debug telemetry (populated by boostWithPSCFrequency)
  pscFrequencyWeight?: number;
  scoreBeforePscBoost?: number;
}

export interface ScorerWeights {
  weakness: number;
  forgetting: number;
  importance: number;
  confusion: number;
  hesitation: number;
  recency: number;
  coverage: number;
}

const DEFAULT_WEIGHTS: ScorerWeights = {
  weakness: 3.0,
  forgetting: 2.5,
  importance: 2.0,
  confusion: 2.0,
  hesitation: 1.0,
  recency: 1.5,
  coverage: 1.0,
};

let weights: ScorerWeights = { ...DEFAULT_WEIGHTS };

export function setScorerWeights(overrides: Partial<ScorerWeights>): void {
  weights = { ...weights, ...overrides };
}

export function resetScorerWeights(): void {
  weights = { ...DEFAULT_WEIGHTS };
}

export function getScorerWeights(): ScorerWeights {
  return { ...weights };
}

const SCORABLE_TOPICS: { subject: string; topic: string }[] = [
  { subject: 'Kerala History', topic: 'Ancient Kerala' },
  { subject: 'Kerala History', topic: 'Medieval Kerala' },
  { subject: 'Kerala History', topic: 'Arrival of Europeans & Early Resistance' },
  { subject: 'Kerala History', topic: 'Modern Kerala' },
  { subject: 'Kerala History', topic: 'Cultural History' },
  { subject: 'Renaissance', topic: 'Social Reform Movements' },
  { subject: 'Renaissance', topic: 'Temple Entry Movement' },
  { subject: 'Renaissance', topic: 'Major Agitations & Structural Protests' },
  { subject: 'Renaissance', topic: 'Literary Renaissance' },
  { subject: 'Constitution', topic: 'Constitutional Framework' },
  { subject: 'Constitution', topic: 'Fundamental Rights' },
  { subject: 'Constitution', topic: 'Directive Principles & Fundamental Duties' },
  { subject: 'Constitution', topic: 'Union Executive' },
  { subject: 'Constitution', topic: 'Union Legislature' },
  { subject: 'Constitution', topic: 'Judiciary' },
  { subject: 'Constitution', topic: 'State Executive & Legislature' },
  { subject: 'Constitution', topic: 'Federal System & Local Government' },
  { subject: 'Constitution', topic: 'Constitutional Bodies' },
  { subject: 'Geography', topic: 'Physical Geography (World)' },
  { subject: 'Geography', topic: 'Geophysical Phenomena' },
  { subject: 'Geography', topic: 'Physiography of India' },
  { subject: 'Geography', topic: 'Indian River Systems' },
  { subject: 'Geography', topic: 'Climate of India' },
  { subject: 'Geography', topic: 'Kerala Geography' },
  { subject: 'Science', topic: 'Physics — Mechanics & Properties of Matter' },
  { subject: 'Science', topic: 'Physics — Light, Sound, Heat & Electronics' },
  { subject: 'Science', topic: 'Chemistry — Atomic Structure & Periodicity' },
  { subject: 'Science', topic: 'Chemistry — Acids, Bases & Chemical Reactions' },
  { subject: 'Science', topic: 'Biology — Human Physiology' },
  { subject: 'Science', topic: 'Biology — Biochemistry, Nutrition & Diseases' },
  { subject: 'Science', topic: 'Biology — Plant Physiology & Ecology' },
  { subject: 'Science', topic: 'Environmental Science & Waste Management' },
  { subject: 'Current Affairs', topic: 'Kerala News' },
  { subject: 'Current Affairs', topic: 'National News' },
  { subject: 'Current Affairs', topic: 'International News' },
  { subject: 'Current Affairs', topic: 'Science & Technology' },
  { subject: 'Current Affairs', topic: 'Sports' },
  { subject: 'Quantitative Aptitude', topic: 'Number System & Basic Operations' },
  { subject: 'Quantitative Aptitude', topic: 'Arithmetic' },
  { subject: 'Quantitative Aptitude', topic: 'Time, Speed, Distance & Work' },
  { subject: 'Quantitative Aptitude', topic: 'Mensuration' },
  { subject: 'Quantitative Aptitude', topic: 'Algebra & Progressions' },
  { subject: 'Quantitative Aptitude', topic: 'Data Interpretation' },
  { subject: 'Mental Ability', topic: 'Series & Patterns' },
  { subject: 'Mental Ability', topic: 'Analogy & Classification' },
  { subject: 'Mental Ability', topic: 'Coding & Decoding' },
  { subject: 'Mental Ability', topic: 'Blood Relations & Direction Sense' },
  { subject: 'Mental Ability', topic: 'Syllogisms & Venn Diagrams' },
  { subject: 'Mental Ability', topic: 'Clock, Calendar & Miscellaneous' },
  { subject: 'Malayalam', topic: 'Grammar (വ്യാകരണം)' },
  { subject: 'Malayalam', topic: 'Literature (സാഹിത്യം)' },
  { subject: 'Malayalam', topic: 'Poetry (കവിത)' },
  { subject: 'Malayalam', topic: 'Prose & Drama (ഗദ്യവും നാടകവും)' },
  { subject: 'Indian History & National Movement', topic: 'Ancient India' },
  { subject: 'Indian History & National Movement', topic: 'Medieval India' },
  { subject: 'Indian History & National Movement', topic: 'British Rule & Early Struggles' },
  { subject: 'Indian History & National Movement', topic: 'Indian National Movement' },
  { subject: 'World History', topic: 'Great Revolutions' },
  { subject: 'World History', topic: 'World Wars & International Alliances' },
  { subject: 'Civics & Public Administration', topic: 'Bureaucracy & Administrative Machinery' },
  { subject: 'Civics & Public Administration', topic: 'Digital Governance & E-Governance' },
  { subject: 'Civics & Public Administration', topic: 'Social Welfare & Public Policy' },
  { subject: 'Indian Economy', topic: 'National Income & Macroeconomic Indicators' },
  { subject: 'Indian Economy', topic: 'Banking & Monetary Policy' },
  { subject: 'Indian Economy', topic: 'Public Finance & Fiscal System' },
  { subject: 'Indian Economy', topic: 'Sectors of Indian Economy' },
  { subject: 'Indian Economy', topic: 'Planning & Development' },
  { subject: 'Kerala Economy', topic: 'Kerala Model of Development' },
  { subject: 'Kerala Economy', topic: 'Socio-Economic Safety Networks' },
  { subject: 'Kerala Economy', topic: 'Kerala Fiscal & Industrial Landscape' },
  { subject: 'Information Technology & Cyber Laws', topic: 'Computer Hardware & Architecture' },
  { subject: 'Information Technology & Cyber Laws', topic: 'Software & Operating Systems' },
  { subject: 'Information Technology & Cyber Laws', topic: 'Networks & Internet' },
  { subject: 'Information Technology & Cyber Laws', topic: 'Web Technologies & Languages' },
  { subject: 'Information Technology & Cyber Laws', topic: 'Cyber Security & Threats' },
  { subject: 'Information Technology & Cyber Laws', topic: 'IT Act & Legal Frameworks' },
  { subject: 'English', topic: 'Grammar' },
  { subject: 'English', topic: 'Vocabulary' },
  { subject: 'English', topic: 'Reading Comprehension & Writing' },
  { subject: 'Arts, Sports & Culture', topic: 'Classical & Ritualistic Art Forms' },
  { subject: 'Arts, Sports & Culture', topic: 'Folk & Traditional Arts' },
  { subject: 'Arts, Sports & Culture', topic: 'Malayalam Cinema' },
  { subject: 'Arts, Sports & Culture', topic: 'Sports & Athletics' },
  { subject: 'Special Acts & Social Welfare', topic: 'Human Rights & Civil Rights' },
  { subject: 'Special Acts & Social Welfare', topic: 'Gender & Child Welfare' },
  { subject: 'Special Acts & Social Welfare', topic: 'Transparency & Anti-Corruption' },
];

export function getScorableTopics(): { subject: string; topic: string }[] {
  return SCORABLE_TOPICS;
}

function now(): number {
  return Date.now();
}

function hoursSince(timestamp: number): number {
  return (now() - timestamp) / 3600000;
}

function daysSince(timestamp: number): number {
  return hoursSince(timestamp) / 24;
}

interface ScorerInput {
  profile: UserProfile | null;
  signals: InteractionSignal[];
  subjectQuestionCounts: Record<string, number>;
  totalQuestions: number;
}

export function computeTopicScores(input: ScorerInput): TopicScore[] {
  const { profile, signals, subjectQuestionCounts, totalQuestions } = input;

  const recentPracticeByTopic: Record<string, number> = {};
  const accuracyByTopic: Record<string, { correct: number; total: number }> = {};
  const slowCorrectByTopic: Record<string, number> = {};
  const topicLastPractice: Record<string, number> = {};

  for (const sig of signals) {
    const key = `${sig.subject}::${sig.topic}`;
    if (!accuracyByTopic[key]) accuracyByTopic[key] = { correct: 0, total: 0 };
    accuracyByTopic[key].total++;
    if (sig.answeredCorrect) accuracyByTopic[key].correct++;

    if (sig.answeredCorrect && sig.timeToAnswer > 15000) {
      slowCorrectByTopic[key] = (slowCorrectByTopic[key] || 0) + 1;
    }

    const sigTime = new Date(sig.sessionTime).getTime();
    if (!topicLastPractice[key] || sigTime > topicLastPractice[key]) {
      topicLastPractice[key] = sigTime;
    }
  }

  const confusionMap: Record<string, number> = {};
  if (profile) {
    for (const cp of profile.confusionPairs) {
      for (const topic of [cp.topicA, cp.topicB]) {
        confusionMap[topic] = (confusionMap[topic] || 0) + cp.frequency;
      }
    }
  }

  const maxConfusionFreq = Math.max(1, ...Object.values(confusionMap));
  const recentSignals = signals.slice(-100);
  recentSignals.forEach((sig) => {
    const key = `${sig.subject}::${sig.topic}`;
    recentPracticeByTopic[key] = (recentPracticeByTopic[key] || 0) + 1;
  });
  const maxRecentPractice = Math.max(1, ...Object.values(recentPracticeByTopic));
  const maxSubjectQ = Math.max(1, ...Object.values(subjectQuestionCounts));

  const scores: TopicScore[] = SCORABLE_TOPICS.map((st) => {
    const key = `${st.subject}::${st.topic}`;
    const acc = accuracyByTopic[key];
    const accuracy = acc ? acc.correct / acc.total : 0.5;
    const totalAttempts = acc?.total ?? 0;

    const weaknessScore = totalAttempts > 0 ? 1 - accuracy : 0.5;

    const lastPracticeTime = topicLastPractice[key];
    const forgettingRate = profile?.forgettingRates[st.subject] ?? 7;
    const daysSinceLastPractice = lastPracticeTime ? daysSince(lastPracticeTime) : 30;
    const forgettingScore = Math.min(1, daysSinceLastPractice / forgettingRate);

    const subjectWeight = getSubjectWeight(st.subject);
    const topicWeight = getTopicWeight(st.subject, st.topic);
    const importanceScore = (subjectWeight * topicWeight) / 100;

    const confusionFreq = confusionMap[st.topic] ?? 0;
    const confusionScore = confusionFreq / maxConfusionFreq;

    const slowCorrectTotal = slowCorrectByTopic[key] ?? 0;
    const hesTotal = acc?.total ?? 0;
    const hesitationScore = hesTotal > 0 ? slowCorrectTotal / hesTotal : 0;

    const hoursSincePractice = lastPracticeTime ? hoursSince(lastPracticeTime) : 999;
    const recencyPenalty = Math.min(1, Math.max(0, 1 - hoursSincePractice / 24));

    const subjectQ = subjectQuestionCounts[st.subject] ?? 0;
    const coverageBalance = 1 - (subjectQ / maxSubjectQ);

    const finalScore =
      weights.weakness * weaknessScore +
      weights.forgetting * forgettingScore +
      weights.importance * importanceScore +
      weights.confusion * confusionScore +
      weights.hesitation * hesitationScore -
      weights.recency * recencyPenalty +
      weights.coverage * coverageBalance;

    return {
      subject: st.subject,
      topic: st.topic,
      weaknessScore,
      forgettingScore,
      importanceScore,
      confusionScore,
      hesitationScore,
      recencyPenalty,
      coverageBalance,
      finalScore: Math.max(0, finalScore),
    };
  });

  return boostWithPSCFrequency(scores);
}

export function pickBestTopic(scores: TopicScore[], excludeTopics: string[] = []): TopicScore | null {
  const filtered = excludeTopics.length > 0
    ? scores.filter((s) => !excludeTopics.includes(`${s.subject}::${s.topic}`))
    : scores;
  return filtered[0] ?? null;
}
