import { useEffect, useRef } from 'react';
import { usePerformanceStore, SessionOutcome, FlashcardSignal } from '../store/performanceStore';
import { useUserStore } from '../store/userStore';
import { useMCQStore } from '../store/mcqStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';
import {
  queueSignalBatch,
  syncSessionOutcome,
  syncRecommendation,
  syncRecommendationStatus,
  syncProfile,
  syncStudyStreak,
  syncSubjectProgress,
  syncGoals,
  enqueueFlashcardSignal,
  syncCognitiveTwin,
  flushOfflineQueue,
} from './syncService';

let profileSyncDebounce: ReturnType<typeof setTimeout> | null = null;
let twinSyncDebounce: ReturnType<typeof setTimeout> | null = null;

export function useSyncSubscriptions(): void {
  const prevRef = useRef<{
    signalCount: number;
    outcomeCount: number;
    recCount: number;
    flashcardCount: number;
    streakKey: string;
    goalKey: string;
    twinKey: string;
  }>({
    signalCount: 0,
    outcomeCount: 0,
    recCount: 0,
    flashcardCount: 0,
    streakKey: '',
    goalKey: '',
    twinKey: '',
  });

  useEffect(() => {
    const unsubPerf = usePerformanceStore.subscribe((state, prevState) => {
      const prev = prevRef.current;

      if (state.interactionSignals.length > prev.signalCount) {
        const newSignals = state.interactionSignals.slice(prev.signalCount);
        for (const s of newSignals) {
          queueSignalBatch(s);
        }
        prevRef.current.signalCount = state.interactionSignals.length;
      }

      if (state.sessionOutcomes.length > prev.outcomeCount) {
        const newOutcomes = state.sessionOutcomes.slice(prev.outcomeCount);
        for (const o of newOutcomes) {
          syncSessionOutcome(o);
        }
        prevRef.current.outcomeCount = state.sessionOutcomes.length;
      }

      if (state.recommendations.length > prev.recCount) {
        const newRecs = state.recommendations.slice(prev.recCount);
        for (const r of newRecs) {
          syncRecommendation(r);
        }
        prevRef.current.recCount = state.recommendations.length;
      }

      if (state.flashcardSignals.length > prev.flashcardCount) {
        const newSignals = state.flashcardSignals.slice(prev.flashcardCount);
        for (const s of newSignals) {
          enqueueFlashcardSignal(s);
        }
        prevRef.current.flashcardCount = state.flashcardSignals.length;
      }

      if (state.profile !== prevState.profile || state.lastProfileBuild !== prevState.lastProfileBuild) {
        if (profileSyncDebounce) clearTimeout(profileSyncDebounce);
        profileSyncDebounce = setTimeout(() => {
          syncProfile();
        }, 3000);
      }

      for (const rec of state.recommendations) {
        const prevRec = prevState.recommendations.find((r) => r.id === rec.id);
        if (prevRec && prevRec.status !== rec.status) {
          syncRecommendationStatus(rec.id, rec.status as 'accepted' | 'skipped');
        }
      }
    });

    const unsubUser = useUserStore.subscribe((state, prevState) => {
      const streakKey = `${state.streak.current}-${state.streak.longest}-${state.streak.lastStudyDate}`;
      if (streakKey !== prevRef.current.streakKey) {
        prevRef.current.streakKey = streakKey;
        syncStudyStreak();
      }

      const goalKey = state.dailyGoal
        ? `${state.dailyGoal.completedMCQs}/${state.dailyGoal.targetMCQs}`
        : 'null';
      if (goalKey !== prevRef.current.goalKey) {
        prevRef.current.goalKey = goalKey;
        syncGoals();
      }
    });

    const unsubMCQ = useMCQStore.subscribe((state, prevState) => {
      if (state.subjectProgress !== prevState.subjectProgress) {
        syncSubjectProgress();
      }
    });

    const unsubTwin = useCognitiveTwinStore.subscribe((state) => {
      const twinKey = `${state.gapRecords.length}-${state.masteryMap.size}`;
      if (twinKey !== prevRef.current.twinKey) {
        prevRef.current.twinKey = twinKey;
        if (twinSyncDebounce) clearTimeout(twinSyncDebounce);
        twinSyncDebounce = setTimeout(() => {
          syncCognitiveTwin();
        }, 5000);
      }
    });

    return () => {
      unsubPerf();
      unsubUser();
      unsubMCQ();
      unsubTwin();
      if (profileSyncDebounce) clearTimeout(profileSyncDebounce);
      if (twinSyncDebounce) clearTimeout(twinSyncDebounce);
    };
  }, []);
}

export function useOfflineQueueFlush(intervalMs = 30000): void {
  useEffect(() => {
    const timer = setInterval(() => {
      flushOfflineQueue();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}
