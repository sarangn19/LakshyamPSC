import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MasterySlice } from './cognitiveTwinMasterySlice';
import { createMasterySlice } from './cognitiveTwinMasterySlice';
import type { GapSlice } from './cognitiveTwinGapSlice';
import { createGapSlice } from './cognitiveTwinGapSlice';
import type { AnalyticsSlice } from './cognitiveTwinAnalyticsSlice';
import { createAnalyticsSlice } from './cognitiveTwinAnalyticsSlice';
import type { RetentionSlice } from './cognitiveTwinRetentionSlice';
import { createRetentionSlice } from './cognitiveTwinRetentionSlice';

export type CognitiveTwinState = MasterySlice & GapSlice & AnalyticsSlice & RetentionSlice;

export type {
  KnowledgeMastery, GapRecord, GapLifecycle,
  RetentionRecord, GapScore, KnowledgeTwinMetrics, GapStatus,
} from './cognitiveTwinTypes';

export const useCognitiveTwinStore = create<CognitiveTwinState>()(
  persist(
    (...a) => ({
      ...createMasterySlice(...a),
      ...createGapSlice(...a),
      ...createAnalyticsSlice(...a),
      ...createRetentionSlice(...a),
    }),
    {
      name: 'lakshyam-cognitive-twin-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        masteryMap: state.masteryMap,
        gapRecords: state.gapRecords,
        gapLifecycles: state.gapLifecycles,
        retentionRecords: state.retentionRecords,
        retentionAssessments: state.retentionAssessments,
      }),
    }
  )
);
