const WINDOW_SIZE = 5;
const STREAK_UP_THRESHOLD = 3;
const STREAK_DOWN_THRESHOLD = 2;
const BASE_DIFFICULTY: 'easy' | 'medium' | 'hard' = 'medium';

export interface DifficultySessionState {
  recentAnswers: boolean[];
  currentDifficulty: 'easy' | 'medium' | 'hard';
  totalInSession: number;
}

export function makeInitialDifficultyState(): DifficultySessionState {
  return {
    recentAnswers: [],
    currentDifficulty: BASE_DIFFICULTY,
    totalInSession: 0,
  };
}

const DIFFICULTY_ORDER: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

function clampDifficulty(d: 'easy' | 'medium' | 'hard', delta: number): 'easy' | 'medium' | 'hard' {
  const idx = DIFFICULTY_ORDER.indexOf(d);
  const newIdx = Math.max(0, Math.min(2, idx + delta));
  return DIFFICULTY_ORDER[newIdx];
}

function computeDifficultyAdjustment(state: DifficultySessionState): number {
  const { recentAnswers } = state;

  // Need minimum answers before adjusting
  if (recentAnswers.length < 2) return 0;

  // Check for consecutive correct answers (performance increasing → increase difficulty)
  const recentWindow = recentAnswers.slice(-STREAK_UP_THRESHOLD);
  if (recentWindow.length === STREAK_UP_THRESHOLD && recentWindow.every(Boolean)) {
    return 1;
  }

  // Check for consecutive incorrect answers (struggling → decrease difficulty)
  const recentErrors = recentAnswers.slice(-STREAK_DOWN_THRESHOLD);
  if (recentErrors.length === STREAK_DOWN_THRESHOLD && recentErrors.every((a) => !a)) {
    return -1;
  }

  // Check majority accuracy in window
  if (recentAnswers.length >= WINDOW_SIZE) {
    const window = recentAnswers.slice(-WINDOW_SIZE);
    const correctCount = window.filter(Boolean).length;
    if (correctCount >= Math.ceil(WINDOW_SIZE * 0.8)) return 1;
    if (correctCount <= Math.floor(WINDOW_SIZE * 0.2)) return -1;
  }

  return 0;
}

export function recordSessionAnswer(
  state: DifficultySessionState,
  correct: boolean,
): DifficultySessionState {
  const recentAnswers = [...state.recentAnswers, correct].slice(-WINDOW_SIZE);
  const totalInSession = state.totalInSession + 1;

  // Compute adjustment only after recording the answer
  const adjustment = computeDifficultyAdjustment({ ...state, recentAnswers, totalInSession });

  const currentDifficulty = clampDifficulty(state.currentDifficulty, adjustment);

  return { recentAnswers, currentDifficulty, totalInSession };
}

export function getDifficultyLabel(state: DifficultySessionState): string {
  return state.currentDifficulty.charAt(0).toUpperCase() + state.currentDifficulty.slice(1);
}
