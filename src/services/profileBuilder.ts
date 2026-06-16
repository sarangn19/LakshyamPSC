import { usePerformanceStore, UserProfile, InteractionSignal, FlashcardSignal, SessionSignal, ConfusionPair } from '../store/performanceStore';
import { useFlashcardStore } from '../store/flashcardStore';
import { useUserStore } from '../store/userStore';
import { populationNorms } from '../data/populationNorms';

const SUBJECTS = ['Kerala History', 'Renaissance', 'Constitution', 'Geography', 'Science', 'Current Affairs', 'Quantitative Aptitude', 'Mental Ability', 'Malayalam'];

const HARDCODED_DEFAULTS: Record<string, number> = {
  'Kerala History': 7,
  'Renaissance': 10,
  'Constitution': 12,
  'Geography': 4,
  'Science': 5,
  'Current Affairs': 2,
  'Quantitative Aptitude': 6,
  'Mental Ability': 8,
  'Malayalam': 14,
};

function computeForgettingRates(
  flashcardSignals: FlashcardSignal[],
  flashcardStore: ReturnType<typeof useFlashcardStore.getState>
): Record<string, number> {
  const rates: Record<string, number> = {};

  for (const subject of SUBJECTS) {
    const signals = flashcardSignals.filter(
      (s) => s.subject === subject && s.smRating !== 'hard' && s.intervalDays > 0
    );
    if (signals.length >= 3) {
      const avg = Math.round(
        signals.reduce((sum, s) => sum + s.intervalDays, 0) / signals.length
      );
      rates[subject] = Math.max(1, avg);
      continue;
    }

    const subjectCards = flashcardStore.flashcards.filter(
      (c) => c.subject === subject && c.mastered
    );
    if (subjectCards.length >= 2) {
      const avg = Math.round(
        subjectCards.reduce((sum, c) => sum + c.interval, 0) / subjectCards.length
      );
      rates[subject] = Math.max(1, avg);
      continue;
    }

    const norm = populationNorms[subject];
    if (norm) {
      rates[subject] = Math.max(1, norm.avgForgettingDays);
      continue;
    }

    rates[subject] = HARDCODED_DEFAULTS[subject] || 7;
  }

  return rates;
}

function computeSubjectAccuracy(
  signals: InteractionSignal[]
): Record<string, { correct: number; total: number; accuracy: number }> {
  const acc: Record<string, { correct: number; total: number }> = {};

  for (const s of signals) {
    if (!acc[s.subject]) acc[s.subject] = { correct: 0, total: 0 };
    acc[s.subject].total++;
    if (s.answeredCorrect) acc[s.subject].correct++;
  }

  const result: Record<string, { correct: number; total: number; accuracy: number }> = {};
  for (const [subject, data] of Object.entries(acc)) {
    result[subject] = {
      ...data,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
    };
  }
  return result;
}

function computeHesitationTopics(signals: InteractionSignal[]): string[] {
  const topicStats: Record<string, { correct: number; total: number; totalTime: number }> = {};

  for (const s of signals) {
    if (!topicStats[s.topic]) topicStats[s.topic] = { correct: 0, total: 0, totalTime: 0 };
    topicStats[s.topic].total++;
    if (s.answeredCorrect) topicStats[s.topic].correct++;
    topicStats[s.topic].totalTime += s.timeToAnswer;
  }

  return Object.entries(topicStats)
    .filter(([, stats]) => {
      const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
      const avgTime = stats.totalTime / stats.total;
      return accuracy >= 0.6 && avgTime > 15000 && stats.total >= 2;
    })
    .map(([topic]) => topic);
}

function computeConfusionPairs(signals: InteractionSignal[]): ConfusionPair[] {
  const topicStats: Record<string, { correct: number; total: number; subject: string }> = {};
  for (const s of signals) {
    if (!topicStats[s.topic]) topicStats[s.topic] = { correct: 0, total: 0, subject: s.subject };
    topicStats[s.topic].total++;
    if (s.answeredCorrect) topicStats[s.topic].correct++;
  }

  const weakTopics = Object.entries(topicStats)
    .filter(([, stats]) => stats.total >= 2 && stats.correct / stats.total < 0.5)
    .map(([topic, stats]) => ({ topic, subject: stats.subject, accuracy: stats.correct / stats.total }));

  const bySubject: Record<string, { topic: string; accuracy: number }[]> = {};
  for (const wt of weakTopics) {
    if (!bySubject[wt.subject]) bySubject[wt.subject] = [];
    bySubject[wt.subject].push({ topic: wt.topic, accuracy: wt.accuracy });
  }

  const pairs: ConfusionPair[] = [];
  for (const [, topics] of Object.entries(bySubject)) {
    if (topics.length < 2) continue;
    for (let i = 0; i < topics.length - 1; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const signalsForA = signals.filter(s => s.topic === topics[i].topic && !s.answeredCorrect);
        const signalsForB = signals.filter(s => s.topic === topics[j].topic && !s.answeredCorrect);
        const frequency = Math.max(1, Math.min(signalsForA.length, signalsForB.length));
        pairs.push({ topicA: topics[i].topic, topicB: topics[j].topic, frequency });
      }
    }
  }

  return pairs.sort((a, b) => b.frequency - a.frequency);
}

function findPreferredHour(sessions: SessionSignal[]): number {
  if (sessions.length === 0) return 9;
  const hourCounts: Record<number, number> = {};
  for (const s of sessions) {
    hourCounts[s.startTime] = (hourCounts[s.startTime] || 0) + 1;
  }
  return parseInt(
    Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0],
    10
  );
}

export function buildProfile(): UserProfile {
  const perf = usePerformanceStore.getState();
  const flash = useFlashcardStore.getState();
  const user = useUserStore.getState();

  const interactions = perf.interactionSignals;
  const sessions = perf.sessionSignals;
  const flashSignals = perf.flashcardSignals;

  const subjectAccuracy = computeSubjectAccuracy(interactions);
  const totalQuestions = interactions.length;
  const correctQuestions = interactions.filter((s) => s.answeredCorrect).length;

  const sortedByAccuracy = Object.entries(subjectAccuracy).sort(
    ([, a], [, b]) => a.accuracy - b.accuracy
  );

  const weakSubjects = sortedByAccuracy.slice(0, 3).map(([s]) => s);
  const strongSubjects = sortedByAccuracy.slice(-3).map(([s]) => s).reverse();

  const avgSessionMinutes =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / sessions.length
        )
      : 30;

  const preferredStudyHour = findPreferredHour(sessions);
  const forgettingRates = computeForgettingRates(flashSignals, flash);
  const confusionPairs = computeConfusionPairs(interactions);
  const hesitationTopics = computeHesitationTopics(interactions);
  const streakDays = user.streak.current;

  const daysToExam = user.examDate
    ? Math.max(0, Math.round((new Date(user.examDate).getTime() - Date.now()) / 86400000))
    : 90;

  const averageAccuracy = totalQuestions > 0 ? correctQuestions / totalQuestions : 0;

  return {
    targetPost: user.primaryExam,
    daysToExam,
    weakSubjects,
    strongSubjects,
    averageSessionMinutes: avgSessionMinutes,
    preferredStudyHour,
    forgettingRates,
    confusionPairs,
    hesitationTopics,
    streakDays,
    totalQuestionsAttempted: totalQuestions,
    averageAccuracy,
  };
}

const PROFILE_REBUILD_MS = 6 * 60 * 60 * 1000;

export function shouldRebuildProfile(): boolean {
  const lastBuild = usePerformanceStore.getState().lastProfileBuild;
  return !lastBuild || (Date.now() - lastBuild > PROFILE_REBUILD_MS);
}

export function refreshProfile(force = false): UserProfile {
  if (!force && !shouldRebuildProfile()) {
    const existing = usePerformanceStore.getState().profile;
    if (existing) return existing;
  }
  const profile = buildProfile();
  usePerformanceStore.getState().setProfile(profile);
  usePerformanceStore.getState().setLastProfileBuild(Date.now());
  return profile;
}

export function buildSystemPrompt(profile: UserProfile): string {
  const weakAreas = profile.weakSubjects.length > 0
    ? profile.weakSubjects.join(', ')
    : 'None identified yet';
  const strongAreas = profile.strongSubjects.length > 0
    ? profile.strongSubjects.join(', ')
    : 'None identified yet';
  const forgetting = Object.entries(profile.forgettingRates)
    .slice(0, 5)
    .map(([s, d]) => `- ${s}: ~${d} days`)
    .join('\n');
  const confusion = profile.confusionPairs.length > 0
    ? profile.confusionPairs.map((c) => `${c.topicA} ↔ ${c.topicB} (×${c.frequency})`).join(', ')
    : 'None identified yet';
  const hesitation = profile.hesitationTopics.length > 0
    ? profile.hesitationTopics.join(', ')
    : 'None identified yet';

  return [
    'You are Lakshyam, an AI tutor for Kerala PSC preparation.',
    '',
    'User profile:',
    `- Target post: ${profile.targetPost}`,
    `- Days to exam: ${profile.daysToExam}`,
    `- Weak areas: ${weakAreas}`,
    `- Strong areas: ${strongAreas}`,
    `- Forgetting rates (days before accuracy drops):`,
    forgetting,
    `- Frequently confuses: ${confusion}`,
    `- Hesitates on (correct but slow): ${hesitation}`,
    `- Studies best at ${profile.preferredStudyHour}:00`,
    `- Average session: ${profile.averageSessionMinutes} minutes`,
    `- Current accuracy: ${(profile.averageAccuracy * 100).toFixed(0)}%`,
    `- Streak: ${profile.streakDays} days`,
    '',
    'Rules:',
    '- Never test strong areas unless user requests',
    '- Always prioritise weak areas and confusion pairs',
    '- For hesitation topics, ask the same concept in different formats to reinforce',
    `- Calibrate depth to ${profile.targetPost} level`,
    '- Respond in Malayalam if user writes in Malayalam',
    '- Keep explanations concise unless user asks for detail',
  ].join('\n');
}
