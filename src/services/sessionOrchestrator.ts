import { UserProfile, ConfusionPair, usePerformanceStore } from '../store/performanceStore';
import { useFlashcardStore } from '../store/flashcardStore';

export type SessionType =
  | 'confusion_repair'
  | 'revision_reinforcement'
  | 'flashcard_review'
  | 'weakness_practice'
  | 'exam_simulation'
  | 'knowledge_revisit';

export interface ActivityItem {
  type: 'mcq' | 'flashcard' | 'notes' | 'review';
  count: number;
  durationMinutes: number;
  focusSubject?: string;
  focusTopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface ScoredSession {
  sessionType: SessionType;
  totalScore: number;
  breakdown: { factor: string; delta: number }[];
}

export interface StudySessionPlan {
  sessionType: SessionType;
  title: string;
  estimatedDuration: number;
  activities: ActivityItem[];
  reasoning: string[];
  focusSubjects: string[];
  difficultyMix: { easy: number; medium: number; hard: number };
  expectedOutcome: string;
  alternatives: { sessionType: SessionType; score: number }[];
}

export interface OrchestratorInput {
  profile: UserProfile | null;
  availableMinutes: number;
  lastSessionType: SessionType | null;
  recentSessionTypes: SessionType[];
}

const BASE_WEIGHTS: Record<SessionType, number> = {
  confusion_repair: 35,
  revision_reinforcement: 25,
  flashcard_review: 30,
  weakness_practice: 40,
  exam_simulation: 30,
  knowledge_revisit: 15,
};

const SESSION_TYPES: SessionType[] = [
  'confusion_repair',
  'revision_reinforcement',
  'flashcard_review',
  'weakness_practice',
  'exam_simulation',
  'knowledge_revisit',
];

function confusionRepairModifier(profile: UserProfile): { delta: number; factor: string } {
  const count = profile.confusionPairs.length;
  if (count >= 3) return { delta: 45, factor: `${count} confusion pairs detected` };
  if (count >= 1) return { delta: 25, factor: `${count} confusion pair${count > 1 ? 's' : ''} detected` };
  return { delta: -10, factor: 'No confusion pairs' };
}

function weaknessModifier(profile: UserProfile): { delta: number; factor: string } {
  const count = profile.weakSubjects.length;
  if (count >= 3) return { delta: 35, factor: `${count} weak subjects need attention` };
  if (count >= 1) return { delta: 20, factor: `${count} weak subject${count > 1 ? 's' : ''}` };
  return { delta: 0, factor: 'No weak subjects identified' };
}

function flashcardUrgencyModifier(): { delta: number; factor: string } {
  const dueCount = useFlashcardStore.getState().getDueCount();
  if (dueCount > 15) return { delta: 45, factor: `${dueCount} flashcards due for review` };
  if (dueCount > 8) return { delta: 30, factor: `${dueCount} flashcards due` };
  if (dueCount > 3) return { delta: 15, factor: `${dueCount} flashcards due` };
  if (dueCount === 0) return { delta: -10, factor: 'No flashcards due' };
  return { delta: 5, factor: `${dueCount} flashcard${dueCount > 1 ? 's' : ''} due` };
}

function hesitationModifier(profile: UserProfile): { delta: number; factor: string } {
  const count = profile.hesitationTopics.length;
  if (count >= 4) return { delta: 20, factor: `${count} hesitation topics — needs varied formats` };
  if (count >= 2) return { delta: 10, factor: `${count} hesitation topics` };
  return { delta: 0, factor: '' };
}

function examProximityModifier(profile: UserProfile): Record<SessionType, { delta: number; factor: string }> {
  const days = profile.daysToExam;
  if (days <= 3) {
    return {
      exam_simulation: { delta: 60, factor: 'Exam in 3 days — full simulation recommended' },
      revision_reinforcement: { delta: 15, factor: 'Exam proximity — rapid revision' },
      flashcard_review: { delta: 10, factor: '' },
      weakness_practice: { delta: -10, factor: 'Too close to exam for new weakness training' },
      confusion_repair: { delta: -5, factor: '' },
      knowledge_revisit: { delta: -15, factor: 'No time for exploratory learning' },
    };
  }
  if (days <= 14) {
    return {
      exam_simulation: { delta: 40, factor: `${days} days to exam — simulation mode` },
      revision_reinforcement: { delta: 20, factor: 'Exam approaching — reinforce known topics' },
      flashcard_review: { delta: 5, factor: '' },
      weakness_practice: { delta: 5, factor: '' },
      confusion_repair: { delta: 15, factor: 'Resolve confusion pairs before exam' },
      knowledge_revisit: { delta: -10, factor: 'Prioritise revision over exploration' },
    };
  }
  if (days <= 45) {
    return {
      exam_simulation: { delta: 20, factor: `${days} days to exam — build endurance` },
      revision_reinforcement: { delta: 10, factor: '' },
      flashcard_review: { delta: 0, factor: '' },
      weakness_practice: { delta: 15, factor: 'Time to address weak subjects' },
      confusion_repair: { delta: 20, factor: 'Good window for confusion repair' },
      knowledge_revisit: { delta: 0, factor: '' },
    };
  }
  return {
    exam_simulation: { delta: -10, factor: 'Distant exam — focus on foundation' },
    revision_reinforcement: { delta: 5, factor: '' },
    flashcard_review: { delta: 0, factor: '' },
    weakness_practice: { delta: 10, factor: '' },
    confusion_repair: { delta: 10, factor: '' },
    knowledge_revisit: { delta: 20, factor: 'Early preparation — build knowledge base' },
  };
}

function timeFitModifier(availableMinutes: number): Record<SessionType, { delta: number; factor: string }> {
  return {
    flashcard_review: availableMinutes <= 15
      ? { delta: 25, factor: `Perfect for a ${availableMinutes}min flashcard session` }
      : availableMinutes >= 45 ? { delta: -10, factor: 'Flashcard review too short for available time' }
      : { delta: 5, factor: '' },
    weakness_practice: availableMinutes >= 20 && availableMinutes <= 50
      ? { delta: 15, factor: `Good duration for focused practice` }
      : availableMinutes < 15 ? { delta: -15, factor: 'Too short for effective practice' }
      : { delta: 5, factor: '' },
    exam_simulation: availableMinutes >= 50
      ? { delta: 35, factor: `${availableMinutes}min — full mock exam possible` }
      : availableMinutes >= 30 ? { delta: 15, factor: 'Enough time for a timed section' }
      : { delta: -20, factor: 'Too short for exam simulation' },
    confusion_repair: availableMinutes >= 15 && availableMinutes <= 40
      ? { delta: 15, factor: 'Ideal for targeted confusion repair' }
      : { delta: -5, factor: '' },
    revision_reinforcement: availableMinutes >= 15 && availableMinutes <= 45
      ? { delta: 10, factor: '' }
      : { delta: -5, factor: '' },
    knowledge_revisit: availableMinutes <= 20
      ? { delta: 20, factor: `Quick notes review fits ${availableMinutes}min` }
      : { delta: -5, factor: '' },
  };
}

function streakModifier(profile: UserProfile): { delta: number; factor: string } {
  if (profile.streakDays >= 21) return { delta: 10, factor: '21+ day streak — maintain momentum' };
  if (profile.streakDays >= 7) return { delta: 5, factor: 'One week streak going' };
  if (profile.streakDays === 0) return { delta: 15, factor: 'Streak broken — easy session to rebuild habit' };
  if (profile.streakDays <= 3) return { delta: 10, factor: 'Building streak — consistency matters' };
  return { delta: 0, factor: '' };
}

function recencyPenalty(lastSessionType: SessionType | null, recentSessionTypes: SessionType[]): Record<SessionType, { delta: number; factor: string }> {
  const result = {} as Record<SessionType, { delta: number; factor: string }>;
  for (const st of SESSION_TYPES) {
    let penalty = 0;
    const factors: string[] = [];
    if (lastSessionType === st) {
      penalty -= 20;
      factors.push('Same as last session');
    }
    const recentCount = recentSessionTypes.filter((t) => t === st).length;
    if (recentCount >= 2) {
      penalty -= 15;
      factors.push(`Done ${recentCount} times recently`);
    }
    result[st] = {
      delta: penalty,
      factor: factors.length > 0 ? factors.join('; ') : '',
    };
  }
  return result;
}

function timeOfDayModifier(profile: UserProfile, currentHour: number): Record<SessionType, { delta: number; factor: string }> {
  const preferred = profile.preferredStudyHour;
  const diff = Math.abs(currentHour - preferred);
  const offPeak = diff > 4;

  if (offPeak) {
    return {
      confusion_repair: { delta: -10, factor: 'Heavy cognitive load at non-peak hour' },
      weakness_practice: { delta: -10, factor: 'Non-peak hour — avoid heavy lifting' },
      exam_simulation: { delta: -15, factor: 'Full simulation not recommended now' },
      flashcard_review: { delta: 10, factor: 'Light review suitable for this hour' },
      revision_reinforcement: { delta: 5, factor: '' },
      knowledge_revisit: { delta: 15, factor: 'Passive review fits current energy level' },
    };
  }
  return {
    confusion_repair: { delta: 5, factor: 'Peak hour — good for focused work' },
    weakness_practice: { delta: 5, factor: '' },
    exam_simulation: { delta: 10, factor: '' },
    flashcard_review: { delta: 0, factor: '' },
    revision_reinforcement: { delta: 0, factor: '' },
    knowledge_revisit: { delta: -5, factor: 'Peak hour — use for active study' },
  };
}

function accuracyModifier(profile: UserProfile): { delta: number; factor: string } {
  const acc = profile.averageAccuracy;
  if (acc < 0.4) return { delta: 15, factor: `Low accuracy (${(acc * 100).toFixed(0)}%) — easy wins needed` };
  if (acc > 0.85) return { delta: 10, factor: `High accuracy (${(acc * 100).toFixed(0)}%) — push difficulty` };
  return { delta: 0, factor: '' };
}

function scoreAll(input: OrchestratorInput): ScoredSession[] {
  const { profile, availableMinutes, lastSessionType, recentSessionTypes } = input;
  const currentHour = new Date().getHours();

  const modifiers = {
    confusion_repair: [] as { delta: number; factor: string }[],
    revision_reinforcement: [] as { delta: number; factor: string }[],
    flashcard_review: [] as { delta: number; factor: string }[],
    weakness_practice: [] as { delta: number; factor: string }[],
    exam_simulation: [] as { delta: number; factor: string }[],
    knowledge_revisit: [] as { delta: number; factor: string }[],
  };

  const addMod = (st: SessionType, delta: number, factor: string) => {
    if (factor) modifiers[st].push({ delta, factor });
  };

  if (profile) {
    const cr = confusionRepairModifier(profile);
    addMod('confusion_repair', cr.delta, cr.factor);

    const wm = weaknessModifier(profile);
    addMod('weakness_practice', wm.delta, wm.factor);

    const hm = hesitationModifier(profile);
    addMod('confusion_repair', hm.delta, hm.factor);
    addMod('revision_reinforcement', Math.round(hm.delta / 2), hm.factor);

    const ep = examProximityModifier(profile);
    for (const st of SESSION_TYPES) {
      addMod(st, ep[st].delta, ep[st].factor);
    }

    const sm = streakModifier(profile);
    for (const st of SESSION_TYPES) {
      addMod(st, sm.delta, sm.factor);
    }

    const am = accuracyModifier(profile);
    addMod('weakness_practice', am.delta, am.factor);
  }

  const fu = flashcardUrgencyModifier();
  addMod('flashcard_review', fu.delta, fu.factor);

  const tf = timeFitModifier(availableMinutes);
  for (const st of SESSION_TYPES) {
    addMod(st, tf[st].delta, tf[st].factor);
  }

  const rp = recencyPenalty(lastSessionType, recentSessionTypes);
  for (const st of SESSION_TYPES) {
    addMod(st, rp[st].delta, rp[st].factor);
  }

  if (profile) {
    const tod = timeOfDayModifier(profile, currentHour);
    for (const st of SESSION_TYPES) {
      addMod(st, tod[st].delta, tod[st].factor);
    }
  }

  return SESSION_TYPES.map((sessionType) => {
    const base = BASE_WEIGHTS[sessionType];
    const typeModifiers = modifiers[sessionType] || [];
    const totalDelta = typeModifiers.reduce((sum, m) => sum + m.delta, 0);
    const totalScore = Math.max(0, base + totalDelta);
    return {
      sessionType,
      totalScore,
      breakdown: [
        { factor: `Base weight`, delta: base },
        ...typeModifiers.filter((m) => m.factor),
      ],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

function allocateActivities(
  sessionType: SessionType,
  availableMinutes: number,
  profile: UserProfile | null
): { activities: ActivityItem[]; focusSubjects: string[]; difficultyMix: { easy: number; medium: number; hard: number }; expectedOutcome: string } {
  const primaryMinutes = Math.round(availableMinutes * 0.65);
  const secondaryMinutes = availableMinutes - primaryMinutes;

  const focusSubjects: string[] = [];
  let activities: ActivityItem[] = [];
  let difficultyMix = { easy: 35, medium: 45, hard: 20 };

  const weakCount = profile?.weakSubjects.length ?? 0;

  switch (sessionType) {
    case 'confusion_repair': {
      const pairs = profile?.confusionPairs ?? [];
      const confusedTopics = Array.from(new Set(pairs.flatMap((p) => [p.topicA, p.topicB])));
      const subjects = profile?.weakSubjects?.length ? profile.weakSubjects : confusedTopics;
      focusSubjects.push(...subjects.slice(0, 2));

      const mcqCount = Math.max(3, Math.round(primaryMinutes / 2.5));
      activities = [
        { type: 'mcq', count: mcqCount, durationMinutes: primaryMinutes, focusSubject: focusSubjects[0], difficulty: 'medium' },
        { type: 'review', count: 3, durationMinutes: secondaryMinutes, focusSubject: focusSubjects.length > 1 ? focusSubjects[1] : undefined },
      ];
      difficultyMix = { easy: 20, medium: 60, hard: 20 };
      break;
    }
    case 'revision_reinforcement': {
      if (weakCount > 0) {
        focusSubjects.push(...profile!.weakSubjects.slice(0, 2));
      }
      const mcqCount = Math.max(3, Math.round(primaryMinutes / 2));
      activities = [
        { type: 'mcq', count: mcqCount, durationMinutes: primaryMinutes, difficulty: 'medium' },
        { type: 'flashcard', count: Math.min(10, Math.round(secondaryMinutes / 2)), durationMinutes: secondaryMinutes },
      ];
      difficultyMix = { easy: 30, medium: 50, hard: 20 };
      break;
    }
    case 'flashcard_review': {
      const dueCards = useFlashcardStore.getState().getDueCount();
      const reviewCount = Math.min(dueCards, Math.round(primaryMinutes / 1.5));
      activities = [
        { type: 'flashcard', count: reviewCount, durationMinutes: primaryMinutes },
      ];
      if (secondaryMinutes >= 5) {
        activities.push({ type: 'mcq', count: Math.max(1, Math.round(secondaryMinutes / 3)), durationMinutes: secondaryMinutes, difficulty: 'easy' });
      }
      difficultyMix = { easy: 50, medium: 40, hard: 10 };
      break;
    }
    case 'weakness_practice': {
      const subjects = profile?.weakSubjects?.length ? profile.weakSubjects : ['Kerala History', 'Constitution', 'Geography'];
      focusSubjects.push(...subjects.slice(0, 2));
      const mcqCount = Math.max(3, Math.round(primaryMinutes / 2));
      activities = [
        { type: 'mcq', count: mcqCount, durationMinutes: primaryMinutes, focusSubject: focusSubjects[0], difficulty: 'medium' },
        { type: 'notes', count: Math.round(secondaryMinutes / 3), durationMinutes: secondaryMinutes, focusSubject: focusSubjects.length > 1 ? focusSubjects[1] : undefined },
      ];
      difficultyMix = { easy: 20, medium: 50, hard: 30 };
      break;
    }
    case 'exam_simulation': {
      const mcqCount = Math.max(5, Math.round(availableMinutes / 2.5));
      activities = [
        { type: 'mcq', count: mcqCount, durationMinutes: availableMinutes, difficulty: 'hard' },
      ];
      focusSubjects.push('All subjects (simulation)');
      difficultyMix = { easy: 10, medium: 40, hard: 50 };
      break;
    }
    case 'knowledge_revisit': {
      const subjects = profile?.weakSubjects?.length
        ? profile.weakSubjects
        : ['Kerala History', 'Constitution', 'Geography', 'Renaissance'];
      focusSubjects.push(...subjects.slice(0, 2));
      const noteCount = Math.max(1, Math.round(primaryMinutes / 4));
      activities = [
        { type: 'notes', count: noteCount, durationMinutes: primaryMinutes, focusSubject: focusSubjects[0] },
        { type: 'review', count: Math.round(secondaryMinutes / 3), durationMinutes: secondaryMinutes },
      ];
      difficultyMix = { easy: 60, medium: 30, hard: 10 };
      break;
    }
  }

  return { activities, focusSubjects, difficultyMix, expectedOutcome: outcomeFor(sessionType, focusSubjects) };
}

function outcomeFor(sessionType: SessionType, subjects: string[]): string {
  switch (sessionType) {
    case 'confusion_repair':
      return `Resolve confusion in ${subjects.slice(0, 2).join(' and ')}, strengthening disambiguation speed`;
    case 'revision_reinforcement':
      return `Reinforce ${subjects.length > 0 ? subjects.slice(0, 2).join(' and ') : 'key topics'} before forgetting sets in`;
    case 'flashcard_review':
      return `Clear due flashcards — quick wins that compound into long-term retention`;
    case 'weakness_practice':
      return `Build confidence in ${subjects.slice(0, 2).join(' and ')} through focused practice`;
    case 'exam_simulation':
      return `Build exam temperament and pacing — identify gaps under timed conditions`;
    case 'knowledge_revisit':
      return `Deepen understanding of ${subjects.slice(0, 2).join(' and ')} through structured review`;
  }
}

function buildReasoning(
  sessionType: SessionType,
  scoredSessions: ScoredSession[],
  profile: UserProfile | null,
  availableMinutes: number
): string[] {
  const winner = scoredSessions[0];
  const runnerUp = scoredSessions[1];
  const reasons: string[] = [];

  for (const b of winner.breakdown) {
    if (b.delta >= 15) reasons.push(b.factor);
    else if (b.delta <= -15) reasons.push(`Avoided because: ${b.factor}`);
  }

  if (profile && runnerUp && runnerUp.totalScore >= winner.totalScore * 0.85) {
    reasons.push(`Alternative: ${runnerUp.sessionType.replace(/_/g, ' ')} also scored well (${runnerUp.totalScore} pts)`);
  }

  if (profile && profile.averageAccuracy < 0.5 && availableMinutes <= 20) {
    reasons.push('Short low-stakes session chosen to rebuild confidence');
  }

  if (profile && profile.streakDays <= 3 && profile.streakDays > 0) {
    reasons.push('Early in streak — consistency > intensity');
  }

  return reasons;
}

function buildTitle(sessionType: SessionType, profile: UserProfile | null): string {
  const titles: Record<SessionType, string> = {
    confusion_repair: 'Confusion Repair',
    revision_reinforcement: 'Revision Boost',
    flashcard_review: 'Flashcard Catch-Up',
    weakness_practice: 'Weakness Attack',
    exam_simulation: 'Mock Exam',
    knowledge_revisit: 'Knowledge Deep Dive',
  };
  const base = titles[sessionType];
  if (!profile) return base;
  if (profile.daysToExam <= 7) return `${base} • ${profile.daysToExam}d to exam`;
  if (profile.streakDays >= 21) return `${base} • ${profile.streakDays}d streak 🔥`;
  return base;
}

export function orchestrateSession(input: OrchestratorInput): StudySessionPlan {
  const { profile, availableMinutes, lastSessionType, recentSessionTypes } = input;

  const clampedMinutes = Math.max(5, Math.min(120, availableMinutes));
  const scoredSessions = scoreAll({ profile, availableMinutes: clampedMinutes, lastSessionType, recentSessionTypes });
  const winner = scoredSessions[0];

  const { activities, focusSubjects, difficultyMix, expectedOutcome } = allocateActivities(
    winner.sessionType,
    clampedMinutes,
    profile
  );

  const reasoning = buildReasoning(winner.sessionType, scoredSessions, profile, clampedMinutes);

  return {
    sessionType: winner.sessionType,
    title: buildTitle(winner.sessionType, profile),
    estimatedDuration: clampedMinutes,
    activities,
    reasoning,
    focusSubjects,
    difficultyMix,
    expectedOutcome,
    alternatives: scoredSessions.slice(0, 3).map((s) => ({
      sessionType: s.sessionType,
      score: s.totalScore,
    })),
  };
}

export function logOrchestratedSessionStart(plan: StudySessionPlan): void {
  const perf = usePerformanceStore.getState();
  const now = new Date();
  perf.addSessionSignal({
    date: now.toISOString(),
    startTime: now.getHours(),
    durationMinutes: plan.estimatedDuration,
    questionsAttempted: plan.activities.filter((a) => a.type === 'mcq').reduce((sum, a) => sum + a.count, 0),
    flashcardsReviewed: plan.activities.filter((a) => a.type === 'flashcard').reduce((sum, a) => sum + a.count, 0),
    completedSession: false,
  });
}
