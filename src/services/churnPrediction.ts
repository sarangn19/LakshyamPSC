import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePerformanceStore } from '../store/performanceStore';
import { useUserStore } from '../store/userStore';
import { useCognitiveTwinStore } from '../store/cognitiveTwinStore';

const STORAGE_KEY = 'lakshyam-churn-v1';
const CHURN_THRESHOLD_DAYS = 7;
const MIN_SESSIONS_FOR_TRAINING = 3;

interface ChurnFeatures {
  daysSinceLastSession: number;
  totalSessions: number;
  accuracyTrend: number;
  avgSessionDurationMin: number;
  weeklySessionCount: number;
  gapClosureRate: number;
  streak: number;
  totalQuestions: number;
  avgAccuracy: number;
}

interface ChurnRecord {
  computedAt: string;
  features: ChurnFeatures;
  riskScore: number;
  riskLabel: 'low' | 'medium' | 'high' | 'critical';
}

interface PersistedState {
  current: ChurnRecord | null;
  history: ChurnRecord[];
  weights: number[];
}

const DEFAULT_WEIGHTS = [
  -2.5,   0: intercept
  0.35,   1: daysSinceLastSession
  -0.15,  2: totalSessions
  -0.40,  3: accuracyTrend
  -0.10,  4: avgSessionDurationMin
  -0.30,  5: weeklySessionCount
  -0.25,  6: gapClosureRate
  -0.20,  7: streak
  -0.10,  8: totalQuestions
  -0.30,  9: avgAccuracy
];

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function extractFeatures(): ChurnFeatures {
  const perf = usePerformanceStore.getState();
  const user = useUserStore.getState();
  const twin = useCognitiveTwinStore.getState();

  const signals = perf.interactionSignals;
  const sessions = perf.sessionOutcomes;

  const now = Date.now();
  const lastSignal = signals.length > 0 ? new Date(signals[signals.length - 1].sessionTime).getTime() : 0;
  const daysSinceLastSession = lastSignal > 0 ? Math.max(0, (now - lastSignal) / 86400000) : 999;

  const totalSessions = sessions.length;

  const recentSessions = sessions.slice(-5);
  const accuracyTrend = recentSessions.length >= 2
    ? recentSessions[recentSessions.length - 1].accuracy - recentSessions[0].accuracy
    : 0;

  const avgSessionDurationMin = sessions.length > 0
    ? sessions.reduce((s, o) => s + o.durationMinutes, 0) / sessions.length
    : 0;

  const thirtyDaysAgo = now - 30 * 86400000;
  const recentSignals = signals.filter((s) => new Date(s.sessionTime).getTime() >= thirtyDaysAgo);
  const weeklySessionCount = recentSignals.length > 0
    ? Math.round((recentSignals.length / 30) * 7)
    : 0;

  const gapClosureRate = (() => {
    try { return twin.getMetrics().gapClosureRate; } catch { return 0; }
  })();

  const streak = user.streak?.current ?? 0;

  const totalQuestions = signals.length;

  const avgAccuracy = signals.length > 0
    ? signals.filter((s) => s.answeredCorrect).length / signals.length
    : 0;

  return { daysSinceLastSession, totalSessions, accuracyTrend, avgSessionDurationMin, weeklySessionCount, gapClosureRate, streak, totalQuestions, avgAccuracy };
}

function normalizeFeatures(f: ChurnFeatures): number[] {
  return [
    1,
    Math.min(1, f.daysSinceLastSession / 30),
    Math.min(1, f.totalSessions / 100),
    Math.max(-1, Math.min(1, f.accuracyTrend)),
    Math.min(1, f.avgSessionDurationMin / 60),
    Math.min(1, f.weeklySessionCount / 20),
    Math.min(1, f.gapClosureRate / 100),
    Math.min(1, f.streak / 30),
    Math.min(1, f.totalQuestions / 500),
    f.avgAccuracy,
  ];
}

let cache: PersistedState | null = null;

async function load(): Promise<PersistedState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) { cache = JSON.parse(raw); if (cache && cache.weights) return cache; }
  } catch {}
  cache = { current: null, history: [], weights: [...DEFAULT_WEIGHTS] };
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch {}
}

function computeRisk(features: ChurnFeatures, weights: number[]): number {
  const norm = normalizeFeatures(features);
  const logit = norm.reduce((s, x, i) => s + x * (weights[i] || 0), 0);
  return sigmoid(logit);
}

function labelRisk(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score < 0.3) return 'low';
  if (score < 0.5) return 'medium';
  if (score < 0.7) return 'high';
  return 'critical';
}

export async function computeChurnRisk(): Promise<ChurnRecord> {
  const state = await load();
  const features = extractFeatures();
  const riskScore = features.totalSessions < 2
    ? 0.15
    : computeRisk(features, state.weights);
  const record: ChurnRecord = {
    computedAt: new Date().toISOString(),
    features,
    riskScore: Math.round(riskScore * 100) / 100,
    riskLabel: labelRisk(riskScore),
  };
  state.current = record;
  state.history.push(record);
  if (state.history.length > 100) state.history = state.history.slice(-100);
  await persist();
  return record;
}

export async function getChurnRisk(): Promise<ChurnRecord | null> {
  const state = await load();
  return state.current;
}

export async function getChurnHistory(): Promise<ChurnRecord[]> {
  const state = await load();
  return state.history;
}

export async function updateWeights(newWeights: number[]): Promise<void> {
  const state = await load();
  state.weights = newWeights;
  await persist();
}

export function getChurnDashboard(): {
  currentRisk: number;
  riskLabel: string;
  riskTrend: 'improving' | 'stable' | 'declining';
  topFactors: { name: string; value: number; direction: 'good' | 'bad' }[];
  atRiskUsers: number;
} {
  if (!cache || !cache.current) {
    return { currentRisk: 0, riskLabel: 'low', riskTrend: 'stable', topFactors: [], atRiskUsers: 0 };
  }
  const f = cache.current.features;
  const trend = cache.history.length >= 3
    ? (() => {
        const recent = cache.history.slice(-3).map((r) => r.riskScore);
        const slope = recent[2] - recent[0];
        if (slope < -0.05) return 'improving';
        if (slope > 0.05) return 'declining';
        return 'stable';
      })()
    : 'stable';

  const factors: { name: string; value: number; direction: 'good' | 'bad' }[] = [
    { name: 'Days inactive', value: f.daysSinceLastSession, direction: f.daysSinceLastSession > 3 ? 'bad' : 'good' },
    { name: 'Weekly sessions', value: f.weeklySessionCount, direction: f.weeklySessionCount < 2 ? 'bad' : 'good' },
    { name: 'Accuracy trend', value: f.accuracyTrend, direction: f.accuracyTrend < -0.1 ? 'bad' : 'good' },
    { name: 'Streak', value: f.streak, direction: f.streak < 2 ? 'bad' : 'good' },
    { name: 'Gap closure', value: f.gapClosureRate, direction: f.gapClosureRate < 20 ? 'bad' : 'good' },
  ];

  return {
    currentRisk: cache.current.riskScore,
    riskLabel: cache.current.riskLabel,
    riskTrend: trend,
    topFactors: factors,
    atRiskUsers: cache.history.filter((r) => r.riskScore >= 0.5).length,
  };
}

export function getRiskAction(currentRisk: number, features: ChurnFeatures): { message: string; type: 'notification' | 'nudge' | 'none' } {
  if (currentRisk >= 0.7) {
    return {
      message: features.streak > 0
        ? `Don't break your ${features.streak}-day streak! One quick session keeps you on track.`
        : 'Your progress is slipping. A 5-minute session is all it takes to stay ahead.',
      type: 'notification',
    };
  }
  if (currentRisk >= 0.5) {
    return {
      message: features.daysSinceLastSession > 3
        ? 'It has been a few days — 10 quick MCQs will refresh your memory.'
        : 'Stay consistent! A short practice session keeps your retention strong.',
      type: 'nudge',
    };
  }
  if (currentRisk >= 0.3 && features.weeklySessionCount < 2) {
    return {
      message: 'Try to fit in 2-3 sessions this week for steady progress.',
      type: 'nudge',
    };
  }
  return { message: '', type: 'none' };
}
