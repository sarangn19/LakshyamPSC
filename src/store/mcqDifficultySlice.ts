import type { StateCreator } from 'zustand';
import type { MCQState } from './mcqTypes';
import { makeInitialDifficultyState } from '../services/sessionDifficultyAdapter';
import { makeAdaptiveState } from '../services/infinityEngine';

export interface DifficultySlice {
  currentDifficulty: 'easy' | 'medium' | 'hard';
  difficultySessionState: any;
  generatingNext: boolean;
  adaptiveState: any;
}

export const createDifficultySlice: StateCreator<MCQState, [], [], DifficultySlice> = () => ({
  currentDifficulty: 'easy',
  difficultySessionState: makeInitialDifficultyState(),
  generatingNext: false,
  adaptiveState: makeAdaptiveState(),
});
