import { SessionOutcome } from '../store/performanceStore';

export interface AccuracyDelta {
  overall: number;
  bySubject: Record<string, number>;
}

export interface ImprovementMessage {
  text: string;
  type: 'improvement' | 'decline' | 'steady' | 'insight' | 'weakness';
}

export interface SessionFeedback {
  accuracyChange: AccuracyDelta;
  messages: ImprovementMessage[];
  weakestSubject: string;
  strongestSubject: string;
}

export function computeAccuracyDelta(
  current: SessionOutcome,
  previous: SessionOutcome | null
): AccuracyDelta {
  const overall = previous ? current.accuracy - previous.accuracy : 0;

  const bySubject: Record<string, number> = {};
  if (previous) {
    for (const [subject, data] of Object.entries(current.subjectScores)) {
      const prevData = previous.subjectScores[subject];
      if (prevData && prevData.total > 0) {
        bySubject[subject] = data.accuracy - prevData.accuracy;
      }
    }
  }

  return { overall, bySubject };
}

export function generateImprovementMessages(
  current: SessionOutcome,
  previous: SessionOutcome | null
): ImprovementMessage[] {
  const messages: ImprovementMessage[] = [];
  const delta = computeAccuracyDelta(current, previous);

  if (previous) {
    const overallPct = Math.round(delta.overall * 100);
    if (delta.overall > 0.05) {
      messages.push({ text: `You improved ${overallPct}% overall accuracy.`, type: 'improvement' });
    } else if (delta.overall < -0.05) {
      messages.push({ text: `Accuracy dropped ${Math.abs(overallPct)}% — review weak areas below.`, type: 'decline' });
    } else {
      messages.push({ text: `Accuracy held steady at ${Math.round(current.accuracy * 100)}%.`, type: 'steady' });
    }

    const topGainers: string[] = [];
    const topLosers: string[] = [];
    for (const [subject, diff] of Object.entries(delta.bySubject)) {
      if (diff > 0.1) topGainers.push(subject);
      else if (diff < -0.1) topLosers.push(subject);
    }

    for (const s of topGainers.slice(0, 2)) {
      const diffPct = Math.round(delta.bySubject[s] * 100);
      messages.push({ text: `You improved ${diffPct}% in ${s}.`, type: 'improvement' });
    }
    for (const s of topLosers.slice(0, 2)) {
      const diffPct = Math.round(Math.abs(delta.bySubject[s] * 100));
      messages.push({ text: `${s} needs attention — ${diffPct}% drop this session.`, type: 'decline' });
    }
  }

  const sorted = Object.entries(current.subjectScores)
    .filter(([, d]) => d.total >= 1)
    .sort(([, a], [, b]) => a.accuracy - b.accuracy);

  if (sorted.length > 0) {
    const weakest = sorted[0];
    const weakestPct = Math.round(weakest[1].accuracy * 100);
    messages.push({
      text: `${weakest[0]} remains your weakest area at ${weakestPct}%.`,
      type: 'weakness',
    });
  }

  if (current.totalQuestions >= 3 && current.accuracy >= 0.8) {
    messages.push({ text: 'Strong session — you\'re mastering these topics.', type: 'insight' });
  }

  if (current.durationMinutes <= 3 && current.totalQuestions <= 3) {
    messages.push({ text: 'Short session — even 5 minutes of practice compounds.', type: 'insight' });
  }

  return messages.slice(0, 6);
}

export function buildSessionSummary(
  outcome: SessionOutcome,
  previous: SessionOutcome | null
): { what: string; improvement: string; next: string } {
  const what = describeSessionType(outcome.sessionType);

  const delta = previous ? computeAccuracyDelta(outcome, previous) : null;
  let improvement: string;
  if (!previous) {
    improvement = `First recorded session. You scored ${Math.round(outcome.accuracy * 100)}%.`;
  } else if (delta!.overall > 0.05) {
    improvement = `Yes — ${Math.round(delta!.overall * 100)}% better than your last session.`;
  } else if (delta!.overall < -0.05) {
    improvement = `Not yet — ${Math.round(Math.abs(delta!.overall * 100))}% below your last session. Keep practising.`;
  } else {
    improvement = `Consistent at ${Math.round(outcome.accuracy * 100)}%. Consistency builds mastery.`;
  }

  const nextAction = buildNextActionSuggestion(outcome);

  return { what, improvement, next: nextAction };
}

function describeSessionType(type: string): string {
  const map: Record<string, string> = {
    daily_drill: 'A mixed-topic quick practice session.',
    weakness_practice: 'A targeted session focusing on your weak subjects.',
    exam_simulation: 'A timed mock exam covering all difficulty levels.',
    confusion_repair: 'A session focused on resolving confusing topic pairs.',
    revision_reinforcement: 'A revision session to reinforce recently learned topics.',
    flashcard_review: 'A flashcard review session for spaced repetition.',
    knowledge_revisit: 'A knowledge-building session with notes and review.',
  };
  return map[type] || 'An MCQ practice session.';
}

function buildNextActionSuggestion(outcome: SessionOutcome): string {
  if (outcome.weakestSubject && outcome.subjectScores[outcome.weakestSubject]?.accuracy < 0.5) {
    return `Target ${outcome.weakestSubject} with focused practice.`;
  }
  if (outcome.totalQuestions < 10) {
    return 'Try a longer session (10+ questions) for more meaningful data.';
  }
  if (outcome.accuracy < 0.6) {
    return 'Review notes on weak topics, then retry with flashcards.';
  }
  if (outcome.accuracy >= 0.9) {
    return 'Increase difficulty — you\'re ready for harder questions.';
  }
  return 'Continue your planned study path to maintain momentum.';
}
