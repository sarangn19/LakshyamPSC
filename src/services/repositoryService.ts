import { GeneratedQuestion } from './aiMCQGenerator';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface RepositoryRequest {
  subject: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  examTypes?: string[];
  language?: 'en' | 'ml';
  avoidIds?: string[];
}

interface RepositoryResponse {
  found: boolean;
  source: 'repository' | 'ai_generated' | 'ai_failed' | 'error';
  question?: GeneratedQuestion;
  repositoryHit: boolean;
  latency: number;
  error?: string;
}

interface RepositoryAnalytics {
  totalQuestions: number;
  subjectsCovered: number;
  topicsCovered: number;
  aiGeneratedCount: number;
  pscPyqCount: number;
  coverageCells: number;
  coverage: Array<{
    subject: string;
    topic: string;
    difficulty: string;
    question_count: number;
    has_psc: boolean;
    has_ai: boolean;
    has_fallback: boolean;
  }>;
  hitRate: {
    last7Days: number;
    repositoryHits: number;
    aiGenerations: number;
    databaseHitRate: string;
    aiGenerationFrequency: string;
  };
}

export async function getRepositoryQuestion(
  request: RepositoryRequest,
): Promise<RepositoryResponse> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/get-repository-question`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(request),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        found: false,
        source: 'error',
        repositoryHit: false,
        error: data.error || `HTTP ${res.status}`,
        latency: data.latency || 0,
      };
    }

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      found: false,
      source: 'error',
      repositoryHit: false,
      error: message,
      latency: 0,
    };
  }
}

export async function getRepositoryAnalytics(
  detail?: boolean,
): Promise<RepositoryAnalytics | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/repository-analytics${detail ? '?detail=true' : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export function needsGeneration(
  analytics: RepositoryAnalytics | null,
  subject: string,
  topic?: string,
  difficulty?: string,
): boolean {
  if (!analytics) return true;
  if (!analytics.coverage) return true;

  return !analytics.coverage.some((c) =>
    c.subject === subject &&
    (!topic || c.topic === topic) &&
    (!difficulty || c.difficulty === difficulty) &&
    c.question_count > 0
  );
}
