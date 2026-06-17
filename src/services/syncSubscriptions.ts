import { useEffect, useRef } from 'react';
import { usePerformanceStore, SessionOutcome } from '../store/performanceStore';
import {
  queueSignalBatch,
  syncSessionOutcome,
  syncRecommendation,
  syncRecommendationStatus,
  syncProfile,
  flushOfflineQueue,
} from './syncService';

let profileSyncDebounce: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribe to performance store changes and sync to Supabase.
 * Call once in App.tsx after authentication.
 */
export function useSyncSubscriptions(): void {
  const prevRef = useRef<{
    signalCount: number;
    outcomeCount: number;
    recCount: number;
  }>({ signalCount: 0, outcomeCount: 0, recCount: 0 });

  useEffect(() => {
    const unsub = usePerformanceStore.subscribe((state, prevState) => {
      const prev = prevRef.current;

      // 1. Sync new interaction signals (batched)
      if (state.interactionSignals.length > prev.signalCount) {
        const newSignals = state.interactionSignals.slice(prev.signalCount);
        for (const s of newSignals) {
          queueSignalBatch(s);
        }
        prevRef.current.signalCount = state.interactionSignals.length;
      }

      // 2. Sync new session outcomes
      if (state.sessionOutcomes.length > prev.outcomeCount) {
        const newOutcomes = state.sessionOutcomes.slice(prev.outcomeCount);
        for (const o of newOutcomes) {
          syncSessionOutcome(o);
        }
        prevRef.current.outcomeCount = state.sessionOutcomes.length;
      }

      // 3. Sync new recommendations
      if (state.recommendations.length > prev.recCount) {
        const newRecs = state.recommendations.slice(prev.recCount);
        for (const r of newRecs) {
          syncRecommendation(r);
        }
        prevRef.current.recCount = state.recommendations.length;
      }

      // 4. Sync profile on changes (debounced)
      if (state.profile !== prevState.profile || state.lastProfileBuild !== prevState.lastProfileBuild) {
        if (profileSyncDebounce) clearTimeout(profileSyncDebounce);
        profileSyncDebounce = setTimeout(() => {
          syncProfile();
        }, 3000);
      }

      // 5. Sync recommendation status changes
      for (const rec of state.recommendations) {
        const prevRec = prevState.recommendations.find((r) => r.id === rec.id);
        if (prevRec && prevRec.status !== rec.status) {
          syncRecommendationStatus(rec.id, rec.status as 'accepted' | 'skipped');
        }
      }
    });

    return () => {
      unsub();
      if (profileSyncDebounce) clearTimeout(profileSyncDebounce);
    };
  }, []);
}

/**
 * Periodically flush the offline queue.
 */
export function useOfflineQueueFlush(intervalMs = 30000): void {
  useEffect(() => {
    const timer = setInterval(() => {
      flushOfflineQueue();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}
