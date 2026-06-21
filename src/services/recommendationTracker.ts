import { supabase } from './supabase';

export type RecommendationSource = 'weakness_only' | 'frequency_boosted' | 'hybrid';

export interface ImpactRecord {
  id: string;
  recommendationId: string;
  recommendationType: string;
  topic: string;
  subject: string;
  source: RecommendationSource;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracyBefore: number | null;
  accuracyAfter: number | null;
  masteryBefore: number | null;
  masteryAfter: number | null;
  knowledgeGapClosed: boolean;
  sessionDurationSec: number;
  createdAt: string;
}

export interface RecommendationStats {
  type: string;
  count: number;
  avgAccuracyImprovement: number;
  avgMasteryImprovement: number;
  gapClosureRate: number;
}

export interface TopicImprovement {
  topic: string;
  subject: string;
  sessions: number;
  accuracyChange: number;
  masteryChange: number;
}

let currentRecommendationId: string | null = null;
let currentSessionSource: RecommendationSource = 'hybrid';
let currentTopic: string | null = null;
let currentSubject: string | null = null;

export function startTracking(
  recommenderType: RecommendationSource,
  topic: string,
  subject: string
): string {
  currentRecommendationId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  currentSessionSource = recommenderType;
  currentTopic = topic;
  currentSubject = subject;
  return currentRecommendationId;
}

export async function recordSessionImpact(
  questionsAttempted: number,
  questionsCorrect: number,
  accuracyBefore: number | null,
  accuracyAfter: number | null,
  masteryBefore: number | null,
  masteryAfter: number | null,
  knowledgeGapClosed: boolean,
  sessionDurationSec: number
): Promise<string | null> {
  if (!currentRecommendationId || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return null;

  const { data, error } = await supabase.rpc('record_recommendation_impact', {
    p_profile_id: profile.id,
    p_recommendation_id: currentRecommendationId,
    p_recommendation_type: currentSessionSource,
    p_topic: currentTopic || 'general',
    p_subject: currentSubject || 'General',
    p_source: currentSessionSource,
    p_questions_attempted: questionsAttempted,
    p_questions_correct: questionsCorrect,
    p_accuracy_before: accuracyBefore,
    p_accuracy_after: accuracyAfter,
    p_mastery_before: masteryBefore,
    p_mastery_after: masteryAfter,
    p_knowledge_gap_closed: knowledgeGapClosed,
    p_session_duration_sec: sessionDurationSec,
  });

  if (error) {
    console.error('Failed to record impact:', error);
    return null;
  }

  currentRecommendationId = null;
  return data as string;
}

export async function getRecommendationStats(): Promise<RecommendationStats[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('recommendation_impact')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const byType: Record<string, ImpactRecord[]> = {};
  for (const r of data) {
    const key = r.recommendation_type;
    if (!byType[key]) byType[key] = [];
    byType[key].push(r);
  }

  return Object.entries(byType).map(([type, records]) => {
    const withAccuracy = records.filter(r => r.accuracy_before != null && r.accuracy_after != null);
    const withMastery = records.filter(r => r.mastery_before != null && r.mastery_after != null);

    const avgAccImprovement = withAccuracy.length > 0
      ? withAccuracy.reduce((s, r) => s + (r.accuracy_after! - r.accuracy_before!), 0) / withAccuracy.length
      : 0;

    const avgMastImprovement = withMastery.length > 0
      ? withMastery.reduce((s, r) => s + (r.mastery_after! - r.mastery_before!), 0) / withMastery.length
      : 0;

    const gapClosureRate = records.length > 0
      ? records.filter(r => r.knowledge_gap_closed).length / records.length
      : 0;

    return {
      type,
      count: records.length,
      avgAccuracyImprovement: Math.round(avgAccImprovement * 100) / 100,
      avgMasteryImprovement: Math.round(avgMastImprovement * 100) / 100,
      gapClosureRate: Math.round(gapClosureRate * 100),
    };
  }).sort((a, b) => b.avgAccuracyImprovement - a.avgAccuracyImprovement);
}

export async function getTopicImprovements(): Promise<TopicImprovement[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('recommendation_impact')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const byTopic: Record<string, ImpactRecord[]> = {};
  for (const r of data) {
    const key = `${r.subject}::${r.topic}`;
    if (!byTopic[key]) byTopic[key] = [];
    byTopic[key].push(r);
  }

  return Object.entries(byTopic).map(([key, records]) => {
    const [subject, topic] = key.split('::');
    const withChange = records.filter(r => r.accuracy_before != null && r.accuracy_after != null);
    const avgChange = withChange.length > 0
      ? withChange.reduce((s, r) => s + (r.accuracy_after! - r.accuracy_before!), 0) / withChange.length
      : 0;

    return {
      topic,
      subject,
      sessions: records.length,
      accuracyChange: Math.round(avgChange * 100) / 100,
      masteryChange: 0,
    };
  }).sort((a, b) => b.accuracyChange - a.accuracyChange);
}
