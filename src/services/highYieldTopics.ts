import { supabase } from './supabase';

export interface HighYieldTopic {
  topic: string;
  subject: string;
  totalQuestions: number;
  examCount: number;
  distinctYears: number;
  yearsAppeared: number[];
  duplicateCount: number;
  freqPerYear: number;
  volumeScore: number;
  frequencyScore: number;
  persistenceScore: number;
  repeatScore: number;
  yieldScore: number;
  yieldRank: number;
}

type Trend = 'rising' | 'steady' | 'declining' | 'insufficient';

interface TopicTrend extends HighYieldTopic {
  trend: Trend;
  trendReason: string;
}

let cache: HighYieldTopic[] = [];
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getHighYieldTopics(forceRefresh = false): Promise<HighYieldTopic[]> {
  if (!forceRefresh && cache.length > 0 && Date.now() - cacheTime < CACHE_TTL) {
    return cache;
  }

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('high_yield_topics')
    .select('*')
    .order('yield_score', { ascending: false });

  if (error || !data) {
    console.error('Failed to fetch high yield topics:', error);
    return [];
  }

  cache = data.map((r: any) => ({
    topic: r.topic,
    subject: r.subject,
    totalQuestions: r.total_questions,
    examCount: r.exam_count,
    distinctYears: r.distinct_years,
    yearsAppeared: r.years_appeared || [],
    duplicateCount: r.duplicate_count,
    freqPerYear: r.freq_per_year,
    volumeScore: r.volume_score,
    frequencyScore: r.frequency_score,
    persistenceScore: r.persistence_score,
    repeatScore: r.repeat_score,
    yieldScore: r.yield_score,
    yieldRank: r.yield_rank,
  }));

  cacheTime = Date.now();
  return cache;
}

export function getTopicTrend(topic: HighYieldTopic): TopicTrend {
  const years = topic.yearsAppeared;
  if (years.length < 2) {
    return { ...topic, trend: 'insufficient', trendReason: 'Less than 2 years of data' };
  }

  // Simple trend: check if frequency increased in recent years
  const recentYears = years.filter(y => y >= 2022);
  const olderYears = years.filter(y => y < 2022);

  if (recentYears.length >= 2 && olderYears.length >= 2) {
    const recentCount = recentYears.length;
    const olderCount = olderYears.length;
    const ratio = recentCount / Math.max(olderCount, 1);

    if (ratio > 1.5) {
      return { ...topic, trend: 'rising', trendReason: `${recentCount}x appearances in ${recentYears.length} recent years vs ${olderYears.length} earlier years` };
    } else if (ratio < 0.5) {
      return { ...topic, trend: 'declining', trendReason: 'Appearing less frequently in recent years' };
    }
  }

  if (topic.duplicateCount > topic.totalQuestions * 0.1) {
    return { ...topic, trend: 'rising', trendReason: `High repeat rate (${topic.duplicateCount} duplicates)` };
  }

  return { ...topic, trend: 'steady', trendReason: 'Consistent appearance across years' };
}

export function getHighYieldPracticeMix(
  weakTopics: string[],
  count: number
): { weakCount: number; highYieldCount: number; mixDescription: string } {
  const weakCount = Math.round(count * 0.7);
  const highYieldCount = count - weakCount;
  return {
    weakCount,
    highYieldCount,
    mixDescription: `${weakCount} from your weak areas · ${highYieldCount} from high-yield PSC topics`,
  };
}

export function getTopYieldBySubject(topics: HighYieldTopic[]): Record<string, HighYieldTopic[]> {
  const grouped: Record<string, HighYieldTopic[]> = {};
  for (const t of topics) {
    if (!grouped[t.subject]) grouped[t.subject] = [];
    grouped[t.subject].push(t);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.yieldRank - b.yieldRank);
  }
  return grouped;
}

export function getTrendIcon(trend: Trend): string {
  switch (trend) {
    case 'rising': return '↑';
    case 'declining': return '↓';
    case 'steady': return '→';
    case 'insufficient': return '·';
  }
}
