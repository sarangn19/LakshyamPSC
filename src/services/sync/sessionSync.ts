import { supabase } from '../supabase';
import { usePerformanceStore, SessionOutcome, InteractionSignal } from '../../store/performanceStore';
import { getProfileId, now, isOnline, offlineEnqueue } from './syncShared';

let signalBatch: InteractionSignal[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

export function queueSignalBatch(signal: InteractionSignal): void {
  signalBatch.push(signal);
  if (batchTimer) clearTimeout(batchTimer);
  if (signalBatch.length >= 25) {
    flushSignalBatch();
  } else {
    batchTimer = setTimeout(() => flushSignalBatch(), 5000);
  }
}

async function flushSignalBatch(): Promise<void> {
  if (batchTimer) { clearTimeout(batchTimer); batchTimer = null; }
  if (signalBatch.length === 0) return;
  const batch = signalBatch.splice(0, signalBatch.length);

  if (!isOnline()) { offlineEnqueue('insert', 'interaction_signals', { signals: batch }); return; }

  const profileId = getProfileId();
  if (!profileId) return;

  const rows = batch.map((s) => ({
    profile_id: profileId, signal_type: 'interaction',
    payload: s as unknown as Record<string, unknown>,
    created_at: s.sessionTime || now(),
  }));

  const { error } = await supabase!.from('interaction_signals').insert(rows);
  if (error) offlineEnqueue('insert', 'interaction_signals', { signals: batch });
}

export async function syncSessionOutcome(outcome: SessionOutcome): Promise<void> {
  if (!isOnline()) { offlineEnqueue('upsert', 'session_outcomes', { outcome }); return; }

  const profileId = getProfileId();
  if (!profileId) return;

  const { error } = await supabase!
    .from('session_outcomes')
    .upsert({
      profile_id: profileId, session_id: outcome.sessionId, session_type: outcome.sessionType,
      start_time: new Date(outcome.startTime).toISOString(), end_time: new Date(outcome.endTime).toISOString(),
      duration_minutes: outcome.durationMinutes, total_questions: outcome.totalQuestions,
      correct_answers: outcome.correctAnswers, accuracy: outcome.accuracy,
      subject_scores: outcome.subjectScores as unknown as Record<string, unknown>,
      weakest_subject: outcome.weakestSubject, strongest_subject: outcome.strongestSubject,
      difficulty_mix: outcome.difficultyMix as unknown as Record<string, unknown>,
    }, { onConflict: 'profile_id, session_id' });

  if (error) offlineEnqueue('upsert', 'session_outcomes', { outcome });
}

export async function pullSessionOutcomes(sinceDays = 90): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data } = await supabase!
    .from('session_outcomes')
    .select('*').eq('profile_id', profileId).gte('end_time', since).order('end_time', { ascending: false });

  if (!data) return;

  const perf = usePerformanceStore.getState();
  const existingIds = new Set(perf.sessionOutcomes.map((o) => o.sessionId));
  for (const row of data) {
    if (existingIds.has(row.session_id)) continue;
    perf.addSessionOutcome({
      sessionId: row.session_id, sessionType: row.session_type,
      startTime: new Date(row.start_time).getTime(), endTime: new Date(row.end_time).getTime(),
      durationMinutes: row.duration_minutes, totalQuestions: row.total_questions,
      correctAnswers: row.correct_answers, accuracy: row.accuracy,
      subjectScores: row.subject_scores as Record<string, { correct: number; total: number; accuracy: number }>,
      weakestSubject: row.weakest_subject || '', strongestSubject: row.strongest_subject || '',
      difficultyMix: row.difficulty_mix as { easy: number; medium: number; hard: number },
    });
  }
}

export async function pullInteractionSignals(): Promise<void> {
  if (!isOnline()) return;
  const profileId = getProfileId();
  if (!profileId) return;

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data } = await supabase!
    .from('interaction_signals').select('payload')
    .eq('profile_id', profileId).eq('signal_type', 'interaction').gte('created_at', since);

  if (!data || data.length === 0) return;

  const existing = new Set(usePerformanceStore.getState().interactionSignals.map((s) => `${s.questionId}_${s.sessionTime}`));
  const signals = usePerformanceStore.getState().interactionSignals.slice();
  let added = 0;
  for (const row of data) {
    const signal = row.payload as Record<string, unknown>;
    if (!signal || !signal.questionId) continue;
    const key = `${signal.questionId}_${signal.sessionTime}`;
    if (existing.has(key)) continue;
    existing.add(key);
    signals.push(signal as InteractionSignal);
    added++;
  }
  if (added > 0) usePerformanceStore.setState({ interactionSignals: signals });
}
