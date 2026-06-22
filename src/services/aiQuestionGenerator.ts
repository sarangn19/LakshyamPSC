import { GeneratedQuestion } from './aiMCQGenerator';
import { RecentAnswer } from './infinityEngine';
import { generationQueue } from './generationQueue';
import { questionCache } from './questionCache';
import { reliabilityTracker } from './reliabilityTracker';

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
  avoidTexts?: string[];
}

// Initialize cache on first import
questionCache.load().catch(() => {});

export async function generateAIQuestion(
  request: AIGenRequest,
  options?: { priority?: 'high' | 'low'; signal?: AbortSignal },
): Promise<{ question: GeneratedQuestion | null; error?: string; fromCache?: boolean }> {
  const skipCache = (request.recentHistory && request.recentHistory.length > 0) ||
    (request.focusInstruction && request.focusInstruction.startsWith('CONTENT-BASED:'));

  if (!skipCache) {
    const cached = await questionCache.get(
      request.subject,
      request.topic,
      request.difficulty,
      request.language,
      request.focusInstruction,
    );
    if (cached) {
      if (request.avoidTexts?.includes(cached.text)) {
        reliabilityTracker.recordCacheMiss();
      } else {
        reliabilityTracker.recordCacheHit();
        return { question: cached, fromCache: true };
      }
    } else {
      reliabilityTracker.recordCacheMiss();
    }
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
    avoidTexts: request.avoidTexts,
  };

  const functionUrl = `${SUPABASE_URL}/functions/v1/generate-question`;

  const dedupKey = options?.priority === 'low' ? undefined :
    `${request.subject}|${request.topic}|${request.difficulty}|${request.language || 'en'}`;

  const execute = async (): Promise<{ question: GeneratedQuestion; fromCache: false }> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const latency = Date.now() - startTime;
      reliabilityTracker.recordLatency(latency);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        reliabilityTracker.recordFailure('edge-function', res.status);
        if (res.status === 429) reliabilityTracker.recordRateLimit();
        throw new Error(`HTTP ${res.status}: ${errText.substring(0, 200)}`);
      }

      const data = await res.json();

      if (data.error) {
        reliabilityTracker.recordFailure('edge-function');
        throw new Error(data.error);
      }

      reliabilityTracker.recordSuccess();

      const actualSubject = data.subject || request.subject;
      const actualTopic = data.topic || request.topic;
      const actualSubtopic = data.subtopic || request.subtopic || '';

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

      if (!skipCache) {
        await questionCache.set(
          question, request.subject, request.topic,
          request.difficulty, request.language, request.focusInstruction,
        );
      }

      return { question, fromCache: false };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    const result = await generationQueue.enqueue(execute, {
      priority: options?.priority ?? 'high',
      dedupKey,
      signal: options?.signal,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { question: null, error: message };
  }
}

export function clearAICache(): void {
  questionCache.clear();
}
