import { GeneratedQuestion } from './aiMCQGenerator';
import { RecentAnswer } from './infinityEngine';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';

interface AIGenRequest {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examType?: string;
  focusInstruction?: string;
  recentHistory?: RecentAnswer[];
  syllabusItems?: string[];
  language?: 'en' | 'ml';
  topicConstraint?: string;
}

interface CacheEntry {
  question: GeneratedQuestion;
  generatedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 3600000;

function cacheKey(req: AIGenRequest): string {
  const focusHash = req.focusInstruction ? req.focusInstruction.substring(0, 50) : '';
  return `${req.subject}|${req.topic}|${req.subtopic || ''}|${req.difficulty}|${req.language || 'en'}|${focusHash}`;
}

function getFromCache(key: string): GeneratedQuestion | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.generatedAt > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.question;
}

function addToCache(key: string, question: GeneratedQuestion): void {
  if (cache.size >= 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { question, generatedAt: Date.now() });
}

export async function generateAIQuestion(
  request: AIGenRequest,
): Promise<{ question: GeneratedQuestion | null; error?: string }> {
  // Skip cache when adapting to recent history or using content-based focus (unique per query)
  const skipCache = (request.recentHistory && request.recentHistory.length > 0) ||
    (request.focusInstruction && request.focusInstruction.startsWith('CONTENT-BASED:'));
  const key = cacheKey(request);
  const cached = getFromCache(key);
  if (!skipCache && cached) {
    return { question: cached };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { question: null, error: 'Supabase not configured' };
  }

  const body = {
    subject: request.subject,
    topic: request.topic,
    subtopic: request.subtopic,
    difficulty: request.difficulty,
    examType: request.examType ?? 'LDC',
    focusInstruction: request.focusInstruction,
    recentHistory: request.recentHistory,
    syllabusItems: request.syllabusItems,
    language: request.language,
    topicConstraint: request.topicConstraint,
  };

  const functionUrl = `${SUPABASE_URL}/functions/v1/generate-question`;

  console.log('[AIGEN] request:', JSON.stringify({ subject: request.subject, topic: request.topic, hasFocus: !!request.focusInstruction, focusPrefix: request.focusInstruction?.substring(0, 30) }));

  const MAX_RETRIES = 2;
  let lastError: string | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        lastError = `HTTP ${res.status}: ${errText.substring(0, 200)}`;
        if (attempt < MAX_RETRIES && (res.status === 502 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        return { question: null, error: lastError };
      }

      const data = await res.json();

      if (data.error) {
        return { question: null, error: data.error };
      }

      const actualSubject = data.subject || request.subject;
      const actualTopic = data.topic || request.topic;
      const actualSubtopic = data.subtopic || request.subtopic || '';
      const alignmentWarning = data.alignmentWarning === true;

      console.log(
        '[ALIGNMENT] requested:', request.subject, request.topic, request.subtopic || '',
        '| generated:', actualSubject, actualTopic, actualSubtopic,
        '| aligned:', actualTopic === request.topic && actualSubject === request.subject,
        alignmentWarning ? '| WARNING: edge function reports topic mismatch' : '',
      );

      const question: GeneratedQuestion = {
        id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        subject: actualSubject,
        topic: actualTopic,
        difficulty: request.difficulty,
        explanation: data.explanation,
        examType: [request.examType ?? 'LDC'],
        confidence: data.confidence ?? 80,
        source: 'ai_generated',
        generatedAt: new Date().toISOString(),
      };
      question.subtopic = actualSubtopic;

      if (!skipCache) addToCache(key, question);
      return { question };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error';
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  return { question: null, error: lastError };
}

export function clearAICache(): void {
  cache.clear();
}
