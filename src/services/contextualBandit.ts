import AsyncStorage from '@react-native-async-storage/async-storage';

const D = 8;
const ALPHA = 0.25;
const STORAGE_KEY = 'lakshyam-bandit-v1';

const ARMS: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];

export interface BanditContext {
  pMastered: number;
  sessionAccuracy: number;
  avgTimeToAnswer: number;
  overallMastery: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  streakDays: number;
}

interface ArmState {
  A: number[][];
  b: number[];
  n: number;
}

interface BanditState {
  arms: Record<string, ArmState>;
  totalTrials: number;
}

function makeArmState(): ArmState {
  const A = Array.from({ length: D }, () => Array(D).fill(0));
  for (let i = 0; i < D; i++) A[i][i] = 1;
  return { A, b: Array(D).fill(0), n: 0 };
}

function matVecMul(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, aij, j) => s + aij * v[j], 0));
}

function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, ai, i) => s + ai * b[i], 0);
}

function vecScale(v: number[], s: number): number[] {
  return v.map((vi) => vi * s);
}

function vecAdd(a: number[], b: number[]): number[] {
  return a.map((ai, i) => ai + b[i]);
}

function outerProd(a: number[], b: number[]): number[][] {
  return a.map((ai) => b.map((bj) => ai * bj));
}

function choleskySolve(A: number[][], b: number[]): number[] {
  const n = A.length;
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(A[i][i] - sum) : (A[i][j] - sum) / L[j][j];
    }
  }
  const y = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
    y[i] = (b[i] - sum) / L[i][i];
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) sum += L[j][i] * x[j];
    x[i] = y[i] - sum;
    if (L[i][i] !== 0) x[i] /= L[i][i];
  }
  return x;
}

function featureVector(ctx: BanditContext): number[] {
  return [
    1.0,
    Math.max(0, Math.min(1, ctx.pMastered)),
    Math.max(0, Math.min(1, ctx.sessionAccuracy)),
    Math.max(0, Math.min(1, ctx.avgTimeToAnswer)),
    Math.max(0, Math.min(1, ctx.overallMastery / 100)),
    Math.max(0, Math.min(1, ctx.consecutiveCorrect / 10)),
    Math.max(0, Math.min(1, ctx.consecutiveIncorrect / 10)),
    Math.max(0, Math.min(1, ctx.streakDays / 365)),
  ];
}

class LinUCBBandit {
  private state: BanditState;
  private loaded: boolean;

  constructor() {
    this.state = {
      arms: { easy: makeArmState(), medium: makeArmState(), hard: makeArmState() },
      totalTrials: 0,
    };
    this.loaded = false;
  }

  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.arms) {
          this.state = parsed;
          this.loaded = true;
          return;
        }
      }
    } catch {}
    this.loaded = true;
  }

  async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  private ensureArms(): void {
    for (const arm of ARMS) {
      if (!this.state.arms[arm]) {
        this.state.arms[arm] = makeArmState();
      }
    }
  }

  predict(ctx: BanditContext): 'easy' | 'medium' | 'hard' {
    this.ensureArms();
    const x = featureVector(ctx);
    let bestArm = 'medium' as 'easy' | 'medium' | 'hard';
    let bestUcb = -Infinity;

    for (const arm of ARMS) {
      const armState = this.state.arms[arm];
      const theta = choleskySolve(armState.A, armState.b);
      const xTheta = vecDot(x, theta);
      const AinvX = choleskySolve(armState.A, x);
      const uncertainty = ALPHA * Math.sqrt(Math.abs(vecDot(x, AinvX)));
      const ucb = xTheta + uncertainty;
      if (ucb > bestUcb) {
        bestUcb = ucb;
        bestArm = arm;
      }
    }

    return bestArm;
  }

  recordReward(ctx: BanditContext, arm: 'easy' | 'medium' | 'hard', reward: number): void {
    this.ensureArms();
    const x = featureVector(ctx);
    const armState = this.state.arms[arm];
    armState.A = matAdd(armState.A, outerProd(x, x));
    armState.b = vecAdd(armState.b, vecScale(x, reward));
    armState.n += 1;
    this.state.totalTrials += 1;
    this.save();
  }

  getStats(): { totalTrials: number; armCounts: Record<string, number> } {
    this.ensureArms();
    return {
      totalTrials: this.state.totalTrials,
      armCounts: {
        easy: this.state.arms.easy.n,
        medium: this.state.arms.medium.n,
        hard: this.state.arms.hard.n,
      },
    };
  }
}

function matAdd(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((aij, j) => aij + B[i][j]));
}

export const bandit = new LinUCBBandit();

export function buildBanditContext(ctx: Partial<BanditContext>): BanditContext {
  return {
    pMastered: ctx.pMastered ?? 0.5,
    sessionAccuracy: ctx.sessionAccuracy ?? 0.5,
    avgTimeToAnswer: ctx.avgTimeToAnswer ?? 0.5,
    overallMastery: ctx.overallMastery ?? 50,
    consecutiveCorrect: ctx.consecutiveCorrect ?? 0,
    consecutiveIncorrect: ctx.consecutiveIncorrect ?? 0,
    streakDays: ctx.streakDays ?? 0,
  };
}

export function selectDifficultyByMastery(overallMastery: number): 'easy' | 'medium' | 'hard' {
  if (overallMastery < 40) return 'easy';
  if (overallMastery > 75) return 'hard';
  return 'medium';
}

export async function selectDifficulty(
  ctx: BanditContext,
  useAdvanced: boolean,
): Promise<'easy' | 'medium' | 'hard'> {
  if (useAdvanced) {
    await bandit.load();
    return bandit.predict(ctx);
  }
  return selectDifficultyByMastery(ctx.overallMastery);
}
