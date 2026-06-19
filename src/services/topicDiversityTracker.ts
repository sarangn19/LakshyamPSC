import { GeneratedQuestion } from './aiMCQGenerator';
import { syllabus } from '../data/syllabus';

// ─── Constants ───

export const CONCEPT_DEPTH_THRESHOLD = 2;
export const MIN_CONCEPTS_PER_SUBTOPIC = 3;
export const MIN_BREADTH_PERCENT = 60;

// ─── Diversity levels ───

export type DiversityLevel = 'low' | 'medium' | 'high';

export const DIVERSITY_THRESHOLDS = {
  low: { minSubtopics: 0, maxSubtopics: 2 },
  medium: { minSubtopics: 3, maxSubtopics: 5 },
  high: { minSubtopics: 6, maxSubtopics: Infinity },
};

export const MIN_DIVERSITY_FOR_RECOMMENDATION: DiversityLevel = 'medium';

// ─── Concept fingerprint ───

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could',
  'shall', 'should', 'may', 'might', 'must', 'to', 'of', 'in', 'for', 'on',
  'by', 'with', 'at', 'from', 'as', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or',
  'if', 'while', 'about', 'up', 'which', 'who', 'whom', 'what', 'this',
  'that', 'these', 'those', 'it', 'its', 'ഒരു', 'എന്ന', 'ആണ്', 'ആയ',
  'ഈ', 'അത്', 'അവ', 'ഇത്', 'എന്നാൽ', 'അങ്ങനെ', 'വേണ്ടി', 'കൊണ്ട്',
]);

function extractSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function buildConceptFingerprint(question: GeneratedQuestion): string {
  const words = extractSignificantWords(question.text);
  const unique = Array.from(new Set(words));
  unique.sort();
  return unique.join('::');
}

// ─── Per-topic diversity tracking ───

interface SubtopicConceptState {
  fingerprints: Map<string, number>;
}

interface TopicDiversityState {
  totalAccepted: number;
  subtopics: Map<string, number>;
  subtopicConcepts: Map<string, SubtopicConceptState>;
  concepts: Map<string, number>;
}

const diversityMap = new Map<string, TopicDiversityState>();

function topicKey(subject: string, topic: string): string {
  return `${subject}||${topic}`;
}

function ensureState(subject: string, topic: string): TopicDiversityState {
  const k = topicKey(subject, topic);
  let state = diversityMap.get(k);
  if (!state) {
    state = {
      totalAccepted: 0,
      subtopics: new Map(),
      subtopicConcepts: new Map(),
      concepts: new Map(),
    };
    diversityMap.set(k, state);
  }
  return state;
}

function getSyllabusSubtopics(subject: string, topic: string): string[] {
  for (const s of syllabus) {
    if (s.name !== subject) continue;
    for (const t of s.topics) {
      if (t.name === topic) {
        return t.subtopics.map((st) => st.name);
      }
    }
  }
  return [];
}

// ─── Public API ───

export function recordAcceptedQuestion(question: GeneratedQuestion): void {
  const state = ensureState(question.subject, question.topic);
  state.totalAccepted++;

  const sub = question.subtopic || '__no_subtopic__';
  state.subtopics.set(sub, (state.subtopics.get(sub) || 0) + 1);

  const concept = buildConceptFingerprint(question);
  state.concepts.set(concept, (state.concepts.get(concept) || 0) + 1);

  let scs = state.subtopicConcepts.get(sub);
  if (!scs) {
    scs = { fingerprints: new Map() };
    state.subtopicConcepts.set(sub, scs);
  }
  scs.fingerprints.set(concept, (scs.fingerprints.get(concept) || 0) + 1);
}

export interface TopicDiversityReport {
  subject: string;
  topic: string;
  totalQuestions: number;
  uniqueSubtopics: number;
  subtopicList: string[];
  uniqueConcepts: number;
  diversityScore: DiversityLevel;
  eligible: boolean;
}

export function getTopicDiversity(subject: string, topic: string): TopicDiversityReport {
  const state = diversityMap.get(topicKey(subject, topic));
  if (!state || state.totalAccepted === 0) {
    return {
      subject, topic,
      totalQuestions: 0, uniqueSubtopics: 0, subtopicList: [],
      uniqueConcepts: 0, diversityScore: 'low', eligible: false,
    };
  }

  const uniqueSubtopics = state.subtopics.size;
  const uniqueConcepts = state.concepts.size;

  let diversityScore: DiversityLevel;
  if (uniqueSubtopics <= DIVERSITY_THRESHOLDS.low.maxSubtopics) {
    diversityScore = 'low';
  } else if (uniqueSubtopics <= DIVERSITY_THRESHOLDS.medium.maxSubtopics) {
    diversityScore = 'medium';
  } else {
    diversityScore = 'high';
  }

  const eligible = diversityScore !== 'low';

  return {
    subject, topic,
    totalQuestions: state.totalAccepted,
    uniqueSubtopics, subtopicList: Array.from(state.subtopics.keys()).filter((k) => k !== '__no_subtopic__'),
    uniqueConcepts, diversityScore, eligible,
  };
}

export function isTopicDiverseEnough(subject: string, topic: string, inventory: number): boolean {
  if (inventory < 10) return false;
  const report = getTopicDiversity(subject, topic);
  return report.eligible;
}

// ─── Coverage Breadth ───

export interface SubtopicBreadthReport {
  subtopic: string;
  totalQuestions: number;
  totalConcepts: number;
  coveredConcepts: number;
  conceptCoveragePercent: number;
  isReady: boolean;
  missingConceptCount: number;
}

export interface CoverageBreadthReport {
  subject: string;
  topic: string;
  totalSubtopics: number;
  coveredSubtopics: number;
  subtopicCoveragePercent: number;
  missingSubtopics: string[];
  totalConcepts: number;
  coveredConcepts: number;
  conceptCoveragePercent: number;
  subtopicReports: SubtopicBreadthReport[];
  status: 'Ready' | 'Not Ready';
}

export function getCoverageBreadthReport(subject: string, topic: string): CoverageBreadthReport {
  const state = diversityMap.get(topicKey(subject, topic));
  const syllabusSubtopics = getSyllabusSubtopics(subject, topic);

  const totalSubtopics = syllabusSubtopics.length;
  const missingSubtopics: string[] = [];
  const subtopicReports: SubtopicBreadthReport[] = [];

  let totalConceptsAll = 0;
  let coveredConceptsAll = 0;

  for (const stName of syllabusSubtopics) {
    const scs = state?.subtopicConcepts.get(stName);
    const fingerprints = scs?.fingerprints ?? new Map();
    const totalConcepts = fingerprints.size;

    let coveredConcepts = 0;
    for (const count of fingerprints.values()) {
      if (count >= CONCEPT_DEPTH_THRESHOLD) coveredConcepts++;
    }

    const conceptCoveragePercent = totalConcepts > 0
      ? Math.round((coveredConcepts / totalConcepts) * 100)
      : 0;

    const isReady = coveredConcepts >= MIN_CONCEPTS_PER_SUBTOPIC;
    const totalQuestions = Array.from(fingerprints.values()).reduce((s, c) => s + c, 0);

    totalConceptsAll += totalConcepts;
    coveredConceptsAll += coveredConcepts;

    subtopicReports.push({
      subtopic: stName,
      totalQuestions,
      totalConcepts,
      coveredConcepts,
      conceptCoveragePercent,
      isReady,
      missingConceptCount: Math.max(0, MIN_CONCEPTS_PER_SUBTOPIC - coveredConcepts),
    });

    if (!isReady || totalConcepts === 0) {
      missingSubtopics.push(stName);
    }
  }

  const coveredSubtopics = totalSubtopics - missingSubtopics.length;
  const subtopicCoveragePercent = totalSubtopics > 0
    ? Math.round((coveredSubtopics / totalSubtopics) * 100)
    : 0;
  const conceptCoveragePercent = totalConceptsAll > 0
    ? Math.round((coveredConceptsAll / totalConceptsAll) * 100)
    : 0;

  // Topic readiness: inventory >= 10 AND diversity != low AND conceptCoveragePercent >= 60%
  const diversity = getTopicDiversity(subject, topic);
  const inventory = state?.totalAccepted ?? 0;
  const topicReady = inventory >= 10
    && diversity.diversityScore !== 'low'
    && conceptCoveragePercent >= MIN_BREADTH_PERCENT;

  return {
    subject, topic,
    totalSubtopics, coveredSubtopics, subtopicCoveragePercent,
    missingSubtopics,
    totalConcepts: totalConceptsAll,
    coveredConcepts: coveredConceptsAll,
    conceptCoveragePercent,
    subtopicReports,
    status: topicReady ? 'Ready' : 'Not Ready',
  };
}

// ─── Eligibility (combined check) ───

export function isTopicReadyForRecommendation(subject: string, topic: string): boolean {
  const report = getCoverageBreadthReport(subject, topic);
  return report.status === 'Ready';
}

// ─── Dashboard ───

export interface DiversityDashboardEntry {
  subject: string;
  topic: string;
  totalQuestions: number;
  uniqueSubtopics: number;
  uniqueConcepts: number;
  diversityScore: DiversityLevel;
  status: 'Ready' | 'Not Ready';
}

export function getDiversityDashboard(): DiversityDashboardEntry[] {
  const entries: DiversityDashboardEntry[] = [];
  for (const [key, state] of diversityMap) {
    const [subject, topic] = key.split('||');
    const report = getTopicDiversity(subject, topic);
    entries.push({
      subject: report.subject, topic: report.topic,
      totalQuestions: report.totalQuestions,
      uniqueSubtopics: report.uniqueSubtopics,
      uniqueConcepts: report.uniqueConcepts,
      diversityScore: report.diversityScore,
      status: report.eligible ? 'Ready' : 'Not Ready',
    });
  }
  const order = { high: 0, medium: 1, low: 2 };
  return entries.sort((a, b) => order[a.diversityScore] - order[b.diversityScore]);
}

export interface CoverageDashboardEntry {
  subject: string;
  topic: string;
  totalQuestions: number;
  subtopicsTotal: number;
  subtopicsCovered: number;
  subtopicCoveragePercent: number;
  conceptCoveragePercent: number;
  missingSubtopics: string[];
  missingConcepts: { subtopic: string; count: number }[];
  status: 'Ready' | 'Not Ready';
}

export function getCoverageDashboard(): CoverageDashboardEntry[] {
  const entries: CoverageDashboardEntry[] = [];
  for (const [key] of diversityMap) {
    const [subject, topic] = key.split('||');
    const report = getCoverageBreadthReport(subject, topic);
    const missingConcepts = report.subtopicReports
      .filter((sr) => sr.missingConceptCount > 0)
      .map((sr) => ({ subtopic: sr.subtopic, count: sr.missingConceptCount }));
    entries.push({
      subject: report.subject,
      topic: report.topic,
      totalQuestions: report.subtopicReports.reduce((s, r) => s + r.totalQuestions, 0),
      subtopicsTotal: report.totalSubtopics,
      subtopicsCovered: report.coveredSubtopics,
      subtopicCoveragePercent: report.subtopicCoveragePercent,
      conceptCoveragePercent: report.conceptCoveragePercent,
      missingSubtopics: report.missingSubtopics,
      missingConcepts,
      status: report.status,
    });
  }
  return entries.sort((a, b) => {
    const percentA = a.subtopicCoveragePercent + a.conceptCoveragePercent;
    const percentB = b.subtopicCoveragePercent + b.conceptCoveragePercent;
    return percentB - percentA;
  });
}

// ─── Reset (for testing) ───

export function resetDiversityData(): void {
  diversityMap.clear();
}
