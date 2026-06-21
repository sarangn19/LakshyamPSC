import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MCQState } from './mcqTypes';
import { PERSIST_CONFIG } from './mcqHelpers';
import { createSessionSlice } from './mcqSessionSlice';
import { createDifficultySlice } from './mcqDifficultySlice';
import { createQuestionSlice } from './mcqQuestionSlice';
import { createRecommendationSlice } from './mcqRecommendationSlice';
import { createAnalyticsSlice } from './mcqAnalyticsSlice';
import type { SessionSlice } from './mcqSessionSlice';
import type { DifficultySlice } from './mcqDifficultySlice';
import type { QuestionSlice } from './mcqQuestionSlice';
import type { RecommendationSlice } from './mcqRecommendationSlice';
import type { AnalyticsSlice } from './mcqAnalyticsSlice';

export type {
  QuestionReport, IntegrityMetrics, AlignmentMetrics, MCQState,
} from './mcqTypes';

export const useMCQStore = create<MCQState>()(
  persist(
    (...a) => ({
      ...createSessionSlice(...a),
      ...createDifficultySlice(...a),
      ...createQuestionSlice(...a),
      ...createRecommendationSlice(...a),
      ...createAnalyticsSlice(...a),
    }),
    PERSIST_CONFIG,
  ),
);
