import { GeneratedQuestion } from './aiMCQGenerator';
import { syllabus } from '../data/syllabus';

// ─── Minimum threshold before a topic is considered "stocked" ───
const MIN_INVENTORY = 10;

// ─── Types ───

export interface CoverageEntry {
  subject: string;
  topic: string;
  subtopic: string;
  totalGenerated: number;
  totalAccepted: number;
  totalRejected: number;
  totalPresented: number;
  totalCorrect: number;
  totalIncorrect: number;
  lastGeneratedAt: string | null;
  lastPresentedAt: string | null;
}

export interface TopicCoverage {
  subject: string;
  topic: string;
  totalGenerated: number;
  totalAccepted: number;
  totalRejected: number;
  totalPresented: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  acceptanceRate: number;
  inventory: number;
  subtopics: CoverageEntry[];
  lastActivity: string | null;
}

export interface SubjectCoverage {
  subject: string;
  totalGenerated: number;
  totalAccepted: number;
  totalRejected: number;
  totalPresented: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  acceptanceRate: number;
  topics: TopicCoverage[];
  lastActivity: string | null;
}

export interface DiagnosticRecommendation {
  type: 'low_inventory' | 'low_acceptance' | 'high_rejection' | 'low_accuracy' | 'insufficient_data';
  subject: string;
  topic: string;
  subtopic: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CoverageReport {
  generatedAt: string;
  overallStats: {
    totalGenerated: number;
    totalAccepted: number;
    totalRejected: number;
    totalPresented: number;
    totalCorrect: number;
    totalIncorrect: number;
    overallAccuracy: number;
    overallAcceptanceRate: number;
    topicCount: number;
    subtopicCount: number;
  };
  subjectCoverage: SubjectCoverage[];
  recommendations: DiagnosticRecommendation[];
}

// ─── Per-topic coverage report (before recommending) ───

export interface TopicCoverageReport {
  subject: string;
  topic: string;
  availableGenerators: number;
  acceptedQuestions: number;
  rejectedQuestions: number;
  presentedQuestions: number;
  coveragePercent: number;
  hasMinimumInventory: boolean;
}

export function getTopicCoverageReport(subject: string, topic: string): TopicCoverageReport {
  const entries = Array.from(coverageMap.values()).filter(
    (e) => e.subject === subject && e.topic === topic
  );
  const accepted = entries.reduce((s, e) => s + e.totalAccepted, 0);
  const rejected = entries.reduce((s, e) => s + e.totalRejected, 0);
  const presented = entries.reduce((s, e) => s + e.totalPresented, 0);
  const total = accepted + rejected;
  const coveragePercent = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return {
    subject,
    topic,
    availableGenerators: entries.length,
    acceptedQuestions: accepted,
    rejectedQuestions: rejected,
    presentedQuestions: presented,
    coveragePercent,
    hasMinimumInventory: accepted >= MIN_INVENTORY,
  };
}

// ─── Session Focus Metrics ───

export interface SessionFocusMetrics {
  totalGeneratedInFocusedSessions: number;
  totalMatchingRecommendedTopic: number;
  focusedSessionSuccessRate: number;
  targetSuccessRate: number;
}

const focusTracking = {
  totalGenerated: 0,
  totalMatchingRecommended: 0,
};

export function recordTopicGenerationAttempt(
  matchesRecommended: boolean,
): void {
  focusTracking.totalGenerated++;
  if (matchesRecommended) {
    focusTracking.totalMatchingRecommended++;
  }
}

export function getSessionFocusMetrics(): SessionFocusMetrics {
  const rate = focusTracking.totalGenerated > 0
    ? Math.round((focusTracking.totalMatchingRecommended / focusTracking.totalGenerated) * 100)
    : 0;
  return {
    totalGeneratedInFocusedSessions: focusTracking.totalGenerated,
    totalMatchingRecommendedTopic: focusTracking.totalMatchingRecommended,
    focusedSessionSuccessRate: rate,
    targetSuccessRate: 90,
  };
}

export function resetFocusMetrics(): void {
  focusTracking.totalGenerated = 0;
  focusTracking.totalMatchingRecommended = 0;
}

// ─── In-memory coverage map ───

type CoverageKey = string;

const coverageMap = new Map<CoverageKey, CoverageEntry>();

function key(subject: string, topic: string, subtopic: string): CoverageKey {
  return `${subject}||${topic}||${subtopic}`;
}

function ensureEntry(subject: string, topic: string, subtopic: string): CoverageEntry {
  const k = key(subject, topic, subtopic);
  let entry = coverageMap.get(k);
  if (!entry) {
    entry = {
      subject,
      topic,
      subtopic,
      totalGenerated: 0,
      totalAccepted: 0,
      totalRejected: 0,
      totalPresented: 0,
      totalCorrect: 0,
      totalIncorrect: 0,
      lastGeneratedAt: null,
      lastPresentedAt: null,
    };
    coverageMap.set(k, entry);
  }
  return entry;
}

// ─── Recording functions ───

export function recordGeneration(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalGenerated++;
  entry.lastGeneratedAt = new Date().toISOString();
}

export function recordAcceptance(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalAccepted++;
}

export function recordRejection(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalRejected++;
}

export function recordPresentation(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalPresented++;
  entry.lastPresentedAt = new Date().toISOString();
}

export function recordCorrectAnswer(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalCorrect++;
}

export function recordIncorrectAnswer(question: GeneratedQuestion): void {
  const entry = ensureEntry(question.subject, question.topic, question.subtopic ?? '');
  entry.totalIncorrect++;
}

// ─── Report generation ───

export function getCoverageReport(): CoverageReport {
  const entries = Array.from(coverageMap.values());
  const now = new Date().toISOString();

  // Build subject -> topic -> subtopic tree from syllabus
  const subjectMap = new Map<string, SubjectCoverage>();
  const recommendations: DiagnosticRecommendation[] = [];

  for (const subject of syllabus) {
    const sName = subject.name;
    const sEntries = entries.filter((e) => e.subject === sName);
    const topicMap = new Map<string, CoverageEntry[]>();

    for (const topic of subject.topics) {
      const tName = topic.name;
      const tEntries = sEntries.filter((e) => e.topic === tName);

      // Subtopics from syllabus
      const stCoverage: CoverageEntry[] = topic.subtopics.map((st) => {
        const stEntry = tEntries.find((e) => e.subtopic === st.name) ?? {
          subject: sName,
          topic: tName,
          subtopic: st.name,
          totalGenerated: 0, totalAccepted: 0, totalRejected: 0,
          totalPresented: 0, totalCorrect: 0, totalIncorrect: 0,
          lastGeneratedAt: null, lastPresentedAt: null,
        };
        return stEntry;
      });

      // Also include any entries whose subtopic wasn't in syllabus
      const extraSt = tEntries.filter(
        (e) => !topic.subtopics.some((st) => st.name === e.subtopic)
      );

      const allSubtopics = [...stCoverage, ...extraSt];

      const tGenerated = allSubtopics.reduce((s, e) => s + e.totalGenerated, 0);
      const tAccepted = allSubtopics.reduce((s, e) => s + e.totalAccepted, 0);
      const tRejected = allSubtopics.reduce((s, e) => s + e.totalRejected, 0);
      const tPresented = allSubtopics.reduce((s, e) => s + e.totalPresented, 0);
      const tCorrect = allSubtopics.reduce((s, e) => s + e.totalCorrect, 0);
      const tIncorrect = allSubtopics.reduce((s, e) => s + e.totalIncorrect, 0);

      topicMap.set(tName, allSubtopics);

      // Generate recommendations per topic
      if (tAccepted < MIN_INVENTORY) {
        const missing = MIN_INVENTORY - tAccepted;
        recommendations.push({
          type: 'low_inventory',
          subject: sName,
          topic: tName,
          subtopic: '',
          message: `Need ${missing} more accepted questions for minimum inventory (${MIN_INVENTORY})`,
          severity: missing > 5 ? 'high' : missing > 2 ? 'medium' : 'low',
        });
      }

      if (tGenerated > 0 && tAccepted / tGenerated < 0.5) {
        recommendations.push({
          type: 'low_acceptance',
          subject: sName,
          topic: tName,
          subtopic: '',
          message: `Acceptance rate is ${Math.round((tAccepted / tGenerated) * 100)}% — templates may need review`,
          severity: tAccepted / tGenerated < 0.3 ? 'high' : 'medium',
        });
      }

      for (const st of allSubtopics) {
        if (st.totalPresented > 0 && st.totalPresented > 5) {
          const stAccuracy = Math.round((st.totalCorrect / st.totalPresented) * 100);
          if (stAccuracy < 40) {
            recommendations.push({
              type: 'low_accuracy',
              subject: sName,
              topic: tName,
              subtopic: st.subtopic,
              message: `Accuracy ${stAccuracy}% on "${st.subtopic}" — learner struggling`,
              severity: stAccuracy < 25 ? 'high' : 'medium',
            });
          }
        }

        if (st.totalGenerated > 0 && st.totalRejected > st.totalAccepted) {
          recommendations.push({
            type: 'high_rejection',
            subject: sName,
            topic: tName,
            subtopic: st.subtopic,
            message: `More rejections (${st.totalRejected}) than acceptances (${st.totalAccepted}) on "${st.subtopic}"`,
            severity: 'medium',
          });
        }
      }

      // Insufficient data
      if (tGenerated === 0) {
        recommendations.push({
          type: 'insufficient_data',
          subject: sName,
          topic: tName,
          subtopic: '',
          message: `No questions have been generated for "${tName}"`,
          severity: 'high',
        });
      }
    }

    const sEntriesAll = Array.from(topicMap.values()).flat();
    const sGenerated = sEntriesAll.reduce((s, e) => s + e.totalGenerated, 0);
    const sAccepted = sEntriesAll.reduce((s, e) => s + e.totalAccepted, 0);
    const sRejected = sEntriesAll.reduce((s, e) => s + e.totalRejected, 0);
    const sPresented = sEntriesAll.reduce((s, e) => s + e.totalPresented, 0);
    const sCorrect = sEntriesAll.reduce((s, e) => s + e.totalCorrect, 0);
    const sIncorrect = sEntriesAll.reduce((s, e) => s + e.totalIncorrect, 0);

    subjectMap.set(sName, {
      subject: sName,
      totalGenerated: sGenerated,
      totalAccepted: sAccepted,
      totalRejected: sRejected,
      totalPresented: sPresented,
      totalCorrect: sCorrect,
      totalIncorrect: sIncorrect,
      accuracy: sPresented > 0 ? Math.round((sCorrect / sPresented) * 100) : 0,
      acceptanceRate: sGenerated > 0 ? Math.round((sAccepted / sGenerated) * 100) : 0,
      topics: subject.topics.map((t) => {
        const stEntries = (topicMap.get(t.name) ?? []);
        const tGenerated = stEntries.reduce((s, e) => s + e.totalGenerated, 0);
        const tAccepted = stEntries.reduce((s, e) => s + e.totalAccepted, 0);
        const tRejected = stEntries.reduce((s, e) => s + e.totalRejected, 0);
        const tPresented = stEntries.reduce((s, e) => s + e.totalPresented, 0);
        const tCorrect = stEntries.reduce((s, e) => s + e.totalCorrect, 0);
        const tIncorrect = stEntries.reduce((s, e) => s + e.totalIncorrect, 0);
        return {
          subject: sName,
          topic: t.name,
          totalGenerated: tGenerated,
          totalAccepted: tAccepted,
          totalRejected: tRejected,
          totalPresented: tPresented,
          totalCorrect: tCorrect,
          totalIncorrect: tIncorrect,
          accuracy: tPresented > 0 ? Math.round((tCorrect / tPresented) * 100) : 0,
          acceptanceRate: tGenerated > 0 ? Math.round((tAccepted / tGenerated) * 100) : 0,
          inventory: tAccepted,
          subtopics: t.subtopics.map((st) => {
            const stEntry = stEntries.find((e) => e.subtopic === st.name) ?? {
              subject: sName, topic: t.name, subtopic: st.name,
              totalGenerated: 0, totalAccepted: 0, totalRejected: 0,
              totalPresented: 0, totalCorrect: 0, totalIncorrect: 0,
              lastGeneratedAt: null, lastPresentedAt: null,
            };
            return stEntry;
          }),
          lastActivity: stEntries.reduce(
            (latest, e) => {
              const candidates = [e.lastGeneratedAt, e.lastPresentedAt].filter(Boolean) as string[];
              return candidates.reduce((l, c) => (!l || c > l ? c : l), latest);
            },
            null as string | null,
          ),
        };
      }),
      lastActivity: sEntriesAll.reduce(
        (latest, e) => {
          const candidates = [e.lastGeneratedAt, e.lastPresentedAt].filter(Boolean) as string[];
          return candidates.reduce((l, c) => (!l || c > l ? c : l), latest);
        },
        null as string | null,
      ),
    });
  }

  const allEntries = Array.from(coverageMap.values());
  const totalGenerated = allEntries.reduce((s, e) => s + e.totalGenerated, 0);
  const totalAccepted = allEntries.reduce((s, e) => s + e.totalAccepted, 0);
  const totalRejected = allEntries.reduce((s, e) => s + e.totalRejected, 0);
  const totalPresented = allEntries.reduce((s, e) => s + e.totalPresented, 0);
  const totalCorrect = allEntries.reduce((s, e) => s + e.totalCorrect, 0);
  const totalIncorrect = allEntries.reduce((s, e) => s + e.totalIncorrect, 0);

  const distinctTopics = new Set(allEntries.map((e) => `${e.subject}::${e.topic}`));
  const distinctSubtopics = new Set(allEntries.map((e) => `${e.subject}::${e.topic}::${e.subtopic}`));

  // Sort recommendations by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    generatedAt: now,
    overallStats: {
      totalGenerated,
      totalAccepted,
      totalRejected,
      totalPresented,
      totalCorrect,
      totalIncorrect,
      overallAccuracy: totalPresented > 0 ? Math.round((totalCorrect / totalPresented) * 100) : 0,
      overallAcceptanceRate: totalGenerated > 0 ? Math.round((totalAccepted / totalGenerated) * 100) : 0,
      topicCount: distinctTopics.size,
      subtopicCount: distinctSubtopics.size,
    },
    subjectCoverage: Array.from(subjectMap.values()),
    recommendations,
  };
}

// ─── Inventory threshold check ───

export function hasSufficientInventory(subject: string, topic: string): boolean {
  const entries = Array.from(coverageMap.values()).filter(
    (e) => e.subject === subject && e.topic === topic
  );
  const totalAccepted = entries.reduce((s, e) => s + e.totalAccepted, 0);
  return totalAccepted >= MIN_INVENTORY;
}

export function getTopicInventory(subject: string, topic: string): number {
  const entries = Array.from(coverageMap.values()).filter(
    (e) => e.subject === subject && e.topic === topic
  );
  return entries.reduce((s, e) => s + e.totalAccepted, 0);
}

// ─── Fallback to nearest supported topic ───

export function findNearestSupportedTopic(
  preferredSubject: string,
  preferredTopic: string | undefined,
): { subject: string; topic: string | undefined } | null {
  // Prefer exact match if it has inventory
  if (preferredTopic && hasSufficientInventory(preferredSubject, preferredTopic)) {
    return { subject: preferredSubject, topic: preferredTopic };
  }

  // Check other topics in same subject
  const subjectTopics = Array.from(coverageMap.values())
    .filter((e) => e.subject === preferredSubject)
    .reduce((set, e) => set.add(e.topic), new Set<string>());

  const stockedInSubject = Array.from(subjectTopics)
    .filter((t) => hasSufficientInventory(preferredSubject, t));

  if (stockedInSubject.length > 0) {
    return { subject: preferredSubject, topic: stockedInSubject[0] };
  }

  // Fallback: any subject with stocked topics
  const allTopics = Array.from(coverageMap.values())
    .reduce((set, e) => set.add(`${e.subject}::${e.topic}`), new Set<string>());

  const stockedAnywhere = Array.from(allTopics)
    .map((key) => {
      const [subj, top] = key.split('::');
      return { subject: subj, topic: top, inventory: getTopicInventory(subj, top) };
    })
    .filter((t) => t.inventory >= MIN_INVENTORY)
    .sort((a, b) => b.inventory - a.inventory);

  if (stockedAnywhere.length > 0) {
    return { subject: stockedAnywhere[0].subject, topic: stockedAnywhere[0].topic };
  }

  return null;
}

// ─── Reset (for testing) ───

export function resetCoverageData(): void {
  coverageMap.clear();
}
