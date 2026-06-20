import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBlueprint, getCompositeExamWeight } from '../data/examBlueprints';
import { useUserStore } from '../store/userStore';

const STORAGE_KEY = 'lakshyam-blueprint-cov-v1';
const MIN_RECORDS_BOOST = 3;

interface CoverageCount {
  subject: string;
  topic: string;
  count: number;
}

interface PersistedState {
  coverage: CoverageCount[];
  totalGenerated: number;
}

let cache: PersistedState | null = null;

async function load(): Promise<PersistedState> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
      if (cache && cache.coverage) return cache;
    }
  } catch {}
  cache = { coverage: [], totalGenerated: 0 };
  return cache;
}

async function persist(): Promise<void> {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

function getTargetWeights(targetExams: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  if (targetExams.length === 0) return weights;
  for (const exam of targetExams) {
    const bp = getBlueprint(exam);
    if (!bp) continue;
    for (const sw of bp.subjectWeights) {
      const key = sw.subjectName;
      weights[key] = (weights[key] || 0) + sw.weight;
      if (sw.topicWeights) {
        for (const tw of sw.topicWeights) {
          const tKey = `${sw.subjectName}::${tw.topicName}`;
          weights[tKey] = (weights[tKey] || 0) + tw.weight;
        }
      }
    }
  }
  if (targetExams.length > 1) {
    for (const key of Object.keys(weights)) {
      weights[key] = weights[key] / targetExams.length;
    }
  }
  return weights;
}

function getActualPercentages(coverage: CoverageCount[], total: number): Record<string, number> {
  if (total === 0) return {};
  const pct: Record<string, number> = {};
  for (const c of coverage) {
    pct[c.subject] = ((pct[c.subject] || 0) + c.count / total) * 100;
  }
  for (const c of coverage) {
    const tKey = `${c.subject}::${c.topic}`;
    pct[tKey] = ((pct[tKey] || 0) + c.count / total) * 100;
  }
  return pct;
}

export async function recordBlueprintGeneration(
  subject: string,
  topic: string,
): Promise<void> {
  const state = await load();
  state.totalGenerated += 1;
  const existing = state.coverage.find((c) => c.subject === subject && c.topic === topic);
  if (existing) {
    existing.count += 1;
  } else {
    state.coverage.push({ subject, topic, count: 1 });
  }
  await persist();
}

export function getBlueprintBoost(
  subject: string,
  topic: string | undefined,
): number {
  if (!cache || cache.totalGenerated < MIN_RECORDS_BOOST) return 1.5;

  const targetExams = useUserStore.getState().targetExams || ['LDC'];
  const targetWeights = getTargetWeights(targetExams);
  if (Object.keys(targetWeights).length === 0) return 1.0;

  const total = cache.totalGenerated;
  const actual = getActualPercentages(cache.coverage, total);

  const targetSubjPct = (targetWeights[subject] || 5) / 100;
  const actualSubjPct = (actual[subject] || 0) / 100;

  let gap = targetSubjPct - actualSubjPct;
  if (topic) {
    const tKey = `${subject}::${topic}`;
    const targetTopicPct = (targetWeights[tKey] || targetSubjPct / 5) / 100;
    const actualTopicPct = (actual[tKey] || 0) / 100;
    gap = Math.max(gap, targetTopicPct - actualTopicPct);
  }

  if (gap <= 0) return 0.8;
  return Math.min(3.0, 1.0 + gap * 10);
}

export function getBlueprintAlignmentReport(): {
  overallScore: number;
  subjectGaps: { subject: string; targetPct: number; actualPct: number; gap: number }[];
  boostMap: Record<string, number>;
} {
  if (!cache || cache.totalGenerated === 0) {
    return { overallScore: 0, subjectGaps: [], boostMap: {} };
  }

  const targetExams = useUserStore.getState().targetExams || ['LDC'];
  const targetWeights = getTargetWeights(targetExams);
  const totalTargetPct = Object.entries(targetWeights)
    .filter(([k]) => !k.includes('::'))
    .reduce((s, [, v]) => s + v, 0);
  if (totalTargetPct === 0) return { overallScore: 50, subjectGaps: [], boostMap: {} };

  const actual = getActualPercentages(cache.coverage, cache.totalGenerated);
  const subjectGaps: { subject: string; targetPct: number; actualPct: number; gap: number }[] = [];
  const boostMap: Record<string, number> = {};
  let totalDeviation = 0;
  let subjectCount = 0;

  for (const [key, targetRaw] of Object.entries(targetWeights)) {
    if (key.includes('::')) continue;
    const targetPct = (targetRaw / totalTargetPct) * 100;
    const actualPct = actual[key] || 0;
    const gap = targetPct - actualPct;
    totalDeviation += Math.abs(gap);
    subjectCount++;
    subjectGaps.push({ subject: key, targetPct: Math.round(targetPct), actualPct: Math.round(actualPct), gap: Math.round(gap) });
    boostMap[key] = gap > 0 ? Math.min(3.0, 1.0 + (gap / targetPct) * 2) : 0.8;
  }

  const avgDeviation = subjectCount > 0 ? totalDeviation / subjectCount : 0;
  const overallScore = Math.max(0, Math.min(100, Math.round(100 - avgDeviation)));

  subjectGaps.sort((a, b) => b.gap - a.gap);

  return { overallScore, subjectGaps, boostMap };
}

export function seedBlueprintColdStart(): void {
  if (cache) return;
  cache = { coverage: [], totalGenerated: 0 };
}
