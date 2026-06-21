import { supabase } from '../supabase';
import { useSyncQueue } from '../syncQueue';
import { usePerformanceStore, InteractionSignal, SessionOutcome, RecommendationRecord, FlashcardSignal } from '../../store/performanceStore';
import { useKnowledgeStore } from '../../store/knowledgeStore';
import { getProfileId, now, isOnline } from './syncShared';
import { pullProfile } from './profileSync';
import { pullSessionOutcomes, pullInteractionSignals } from './sessionSync';
import { pullRecommendations, pullStudyStreak, pullSubjectProgress, pullGoals, pullCognitiveTwin, syncProfile, syncStudyStreak, syncSubjectProgress, syncGoals, syncCognitiveTwin } from './learningSync';

export async function flushOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const queue = useSyncQueue.getState();
  if (queue.processing || queue.queue.length === 0 || !isOnline()) return { processed: 0, failed: 0 };

  useSyncQueue.setState({ processing: true });

  let processed = 0;
  let failed = 0;
  const items = [...queue.queue].filter((q) => q.retries < q.maxRetries);

  for (const item of items) {
    try {
      await processQueueItem(item);
      queue.dequeue(item.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queue.markFailed(item.id, msg);
      failed++;
    }
  }

  queue.clearProcessed();
  useSyncQueue.setState({ processing: false });
  return { processed, failed };
}

async function processQueueItem(item: { operation: string; table: string; data: Record<string, unknown>; entityId?: string }): Promise<void> {
  const profileId = getProfileId();
  if (!profileId) throw new Error('No profile ID');

  switch (item.table) {
    case 'profiles':
      await supabase!.from('profiles').update(item.data).eq('id', profileId);
      break;

    case 'interaction_signals': {
      const signals = item.data.signals as InteractionSignal[];
      if (signals) {
        const rows = signals.map((s) => ({ profile_id: profileId, signal_type: 'interaction', payload: s as unknown as Record<string, unknown>, created_at: s.sessionTime || now() }));
        await supabase!.from('interaction_signals').insert(rows);
      }
      break;
    }

    case 'session_outcomes': {
      const outcome = item.data.outcome as SessionOutcome;
      if (outcome) {
        await supabase!.from('session_outcomes').upsert({
          profile_id: profileId, session_id: outcome.sessionId, session_type: outcome.sessionType,
          start_time: new Date(outcome.startTime).toISOString(), end_time: new Date(outcome.endTime).toISOString(),
          duration_minutes: outcome.durationMinutes, total_questions: outcome.totalQuestions,
          correct_answers: outcome.correctAnswers, accuracy: outcome.accuracy,
          subject_scores: outcome.subjectScores, weakest_subject: outcome.weakestSubject,
          strongest_subject: outcome.strongestSubject, difficulty_mix: outcome.difficultyMix,
        }, { onConflict: 'profile_id, session_id' });
      }
      break;
    }

    case 'recommendations': {
      const rec = item.data.recommendation as RecommendationRecord;
      if (rec) {
        await supabase!.from('recommendations').upsert({
          profile_id: profileId, recommendation_id: rec.id, session_type: rec.sessionType,
          title: rec.title, rationale: rec.reasonFactors.join('; '), recommended_action: rec.sessionType,
          status: rec.status, reason_factors: rec.reasonFactors,
          generated_at: new Date(rec.timestamp).toISOString(),
          responded_at: rec.status !== 'pending' ? now() : null,
        }, { onConflict: 'profile_id, recommendation_id' });
      } else if (item.data.status) {
        await supabase!.from('recommendations').update({ status: item.data.status as string, responded_at: now() }).eq('profile_id', profileId).eq('recommendation_id', item.data.id as string);
      }
      break;
    }

    case 'flashcard_reviews': {
      const flashcardSignals = item.data.signals as FlashcardSignal[];
      if (flashcardSignals) {
        const rows = flashcardSignals.map((s) => ({
          profile_id: profileId, flashcard_id: s.cardId, front_text: '', back_text: '',
          subject: s.subject, difficulty: s.smRating === 'hard' ? 2 : s.smRating === 'good' ? 3 : 4,
          is_recalled: s.smRating !== 'hard',
          next_review_at: new Date(Date.now() + s.intervalDays * 86400000).toISOString(),
          created_at: s.timestamp || now(),
        }));
        await supabase!.from('flashcard_reviews').insert(rows);
      }
      break;
    }
  }
}

export async function pullNotes(): Promise<void> {
  if (!isOnline()) return;
  try { await useKnowledgeStore.getState().loadNotes(); }
  catch (err) { console.warn('[Sync] pullNotes failed:', err); }
}

export async function restoreFromRemote(): Promise<void> {
  if (!isOnline()) return;
  try {
    await pullProfile();
    await Promise.all([
      pullSessionOutcomes(90), pullInteractionSignals(), pullRecommendations(50),
      pullStudyStreak(), pullSubjectProgress(), pullGoals(), pullCognitiveTwin(), pullNotes(),
    ]);
    await flushOfflineQueue();
  } catch (err) { console.warn('[Sync] Restore failed:', err); }
}

let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMs = 60000): void {
  stopPeriodicSync();
  syncInterval = setInterval(async () => {
    if (!isOnline()) return;
    try {
      await syncProfile(); await syncStudyStreak(); await syncSubjectProgress();
      await syncGoals(); await syncCognitiveTwin(); await pullNotes();
      await flushOfflineQueue();
    } catch { /* silence periodic sync errors */ }
  }, intervalMs);
}

export function stopPeriodicSync(): void {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
}
