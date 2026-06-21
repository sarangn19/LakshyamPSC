import { supabase } from '../supabase';
import { FlashcardSignal } from '../../store/performanceStore';
import { getProfileId, now } from './syncShared';

let flashcardBatch: FlashcardSignal[] = [];
let flashcardBatchTimer: ReturnType<typeof setTimeout> | null = null;

function queueFlashcardBatch(signal: FlashcardSignal): void {
  flashcardBatch.push(signal);
  if (flashcardBatchTimer) clearTimeout(flashcardBatchTimer);
  if (flashcardBatch.length >= 25) {
    flushFlashcardBatch();
  } else {
    flashcardBatchTimer = setTimeout(() => flushFlashcardBatch(), 5000);
  }
}

async function flushFlashcardBatch(): Promise<void> {
  if (flashcardBatchTimer) { clearTimeout(flashcardBatchTimer); flashcardBatchTimer = null; }
  if (flashcardBatch.length === 0) return;

  const batch = flashcardBatch.splice(0, flashcardBatch.length);
  const profileId = getProfileId();
  if (!profileId) return;

  const rows = batch.map((s) => ({
    profile_id: profileId, flashcard_id: s.cardId, front_text: '', back_text: '',
    subject: s.subject, difficulty: s.smRating === 'hard' ? 2 : s.smRating === 'good' ? 3 : 4,
    is_recalled: s.smRating !== 'hard',
    next_review_at: new Date(Date.now() + s.intervalDays * 86400000).toISOString(),
    created_at: s.timestamp || now(),
  }));

  const { error } = await supabase!.from('flashcard_reviews').insert(rows);
  if (error) console.warn('[Sync] flushFlashcardBatch failed:', error.message);
}

export function enqueueFlashcardSignal(signal: FlashcardSignal): void {
  queueFlashcardBatch(signal);
}
