import { GeneratedQuestion } from './aiMCQGenerator';
import { supabase } from './supabase';
import { searchCorpus, toGeneratedQuestion, getCorpusSubjects } from '../data/pscCorpus';
import { getRepositoryQuestion } from './repositoryService';
import { generateMCQs } from './aiMCQGenerator';
import { generateAIQuestion } from './aiQuestionGenerator';
import { validateQuestionIntegrity } from './questionValidator';
import { useUserStore } from '../store/userStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cycutcqlhpeudmaebwmb.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y3V0Y3FsaHBldWRtYWVid21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzAzNTcsImV4cCI6MjA5NzIwNjM1N30.2s-MMZa-gjJdOBGxOzXKftT-ZA0k6hfj3IoEm0gqaKI';

// ─── Types ───

export interface QuestionCriteria {
  subjects?: string[];
  topics?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  examTypes?: string[];
  count: number;
  language?: 'en' | 'ml';
  avoidIds?: string[];
  avoidTexts?: string[];
}

export interface MockCriteria extends QuestionCriteria {
  mockMode: true;
  timeLimitMinutes?: number;
}

export interface PracticeCriteria extends QuestionCriteria {
  sourceType?: 'chapter' | 'note' | 'paste';
  focusInstruction?: string;
}

export interface SourceResult {
  questions: GeneratedQuestion[];
  source: string;
  latency: number;
  hit: boolean;
}

type SourceEntry = {
  name: string;
  fetch: (criteria: QuestionCriteria, seenTexts: Set<string>) => Promise<SourceResult>;
};

// ─── Source capabilities cache ───

let sourceCCapable: boolean | null = null;

async function probeSourceC(): Promise<boolean> {
  if (sourceCCapable !== null) return sourceCCapable;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/psc-pyq-explorer?action=filters`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    sourceCCapable = res.ok;
  } catch {
    sourceCCapable = false;
  }
  return sourceCCapable;
}

// ─── Source A: Local pscCorpus ───

async function fetchSourceA(criteria: QuestionCriteria, seenTexts: Set<string>): Promise<SourceResult> {
  const start = Date.now();
  const results: GeneratedQuestion[] = [];
  const subjects = criteria.subjects?.length ? criteria.subjects : getCorpusSubjects();
  const depth = ['easy', 'medium', 'hard'] as const;
  const depths = criteria.difficulty === 'hard' ? depth
    : criteria.difficulty === 'medium' ? ['easy', 'medium'] as const
    : ['easy'] as const;

  for (const subject of subjects) {
    if (results.length >= criteria.count) break;
    if (criteria.topics?.length) {
      for (const topic of criteria.topics) {
        for (const diff of depths) {
          if (results.length >= criteria.count) break;
          const hit = searchCorpus(subject, topic, diff);
          if (hit && !seenTexts.has(hit.text)) {
            seenTexts.add(hit.text);
            results.push(toGeneratedQuestion(hit));
          }
        }
      }
    } else {
      for (const diff of depths) {
        if (results.length >= criteria.count) break;
        const hit = searchCorpus(subject, undefined, diff);
        if (hit && !seenTexts.has(hit.text)) {
          seenTexts.add(hit.text);
          results.push(toGeneratedQuestion(hit));
        }
      }
    }
  }

  return { questions: results, source: 'psc_corpus', latency: Date.now() - start, hit: results.length > 0 };
}

// ─── Source B: question_bank_mcqs via get-repository-question edge function ───

async function fetchSourceB(criteria: QuestionCriteria, seenTexts: Set<string>): Promise<SourceResult> {
  const start = Date.now();
  const results: GeneratedQuestion[] = [];
  const subjects = criteria.subjects?.length ? criteria.subjects : [];

  for (const subject of subjects) {
    if (results.length >= criteria.count) break;
    const repoResult = await getRepositoryQuestion({
      subject,
      topic: criteria.topics?.[0],
      difficulty: criteria.difficulty,
      examTypes: criteria.examTypes,
      language: criteria.language || 'en',
      avoidIds: criteria.avoidIds,
    });
    if (repoResult.found && repoResult.question && !seenTexts.has(repoResult.question.text)) {
      seenTexts.add(repoResult.question.text);
      results.push(repoResult.question);
    }
  }

  return { questions: results, source: 'repository', latency: Date.now() - start, hit: results.length > 0 };
}

// ─── Source C: psc_questions via psc-pyq-explorer edge function ───

interface PSCQuestionResponse {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string | null;
  subject: string | null;
  topic: string | null;
  examName: string;
  examCategory: string | null;
  year: number | null;
  language: string;
  isQuizReady: boolean;
  hasAnswer: boolean;
}

async function fetchSourceC(criteria: QuestionCriteria, seenTexts: Set<string>): Promise<SourceResult> {
  const start = Date.now();
  const results: GeneratedQuestion[] = [];

  const capable = await probeSourceC();
  if (!capable) return { questions: [], source: 'psc_questions', latency: Date.now() - start, hit: false };

  const params = new URLSearchParams({ action: 'search', limit: String(Math.min(criteria.count * 3, 200)), offset: '0', quiz_ready: 'true' });
  if (criteria.subjects?.length) params.set('subject', criteria.subjects[0]);
  if (criteria.topics?.length) params.set('topic', criteria.topics[0]);
  if (criteria.language) params.set('language', criteria.language);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/psc-pyq-explorer?${params.toString()}`,
      { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } },
    );
    if (!res.ok) return { questions: [], source: 'psc_questions', latency: Date.now() - start, hit: false };

    const data = await res.json();
    const rawQuestions: PSCQuestionResponse[] = data.questions || [];

    for (const raw of rawQuestions) {
      if (results.length >= criteria.count) break;
      if (!raw.question || !raw.options || raw.options.length < 4) continue;
      if (seenTexts.has(raw.question)) continue;

      const correctIndex = (() => {
        if (raw.correctAnswer === null) return -1;
        if (typeof raw.correctAnswer === 'number') return raw.correctAnswer;
        const letterIdx = 'ABCD'.indexOf(raw.correctAnswer.toUpperCase());
        return letterIdx >= 0 ? letterIdx : -1;
      })();
      if (correctIndex < 0 || correctIndex >= raw.options.length) continue;

      seenTexts.add(raw.question);
      results.push({
        id: `pscq_${raw.id}`,
        text: raw.question,
        options: raw.options,
        correctAnswer: correctIndex,
        subject: raw.subject || criteria.subjects?.[0] || 'General',
        topic: raw.topic || criteria.topics?.[0] || 'General',
        difficulty: criteria.difficulty || 'medium',
        explanation: '',
        examType: [raw.examName || criteria.examTypes?.[0] || 'LDC'],
        confidence: 0.95,
        source: 'previous_paper',
        generatedAt: new Date().toISOString(),
      });
    }
  } catch {
    return { questions: [], source: 'psc_questions', latency: Date.now() - start, hit: false };
  }

  return { questions: results, source: 'psc_questions', latency: Date.now() - start, hit: results.length > 0 };
}

// ─── Source 3: AI generation ───

async function fetchSourceAI(criteria: QuestionCriteria, seenTexts: Set<string>): Promise<SourceResult> {
  const start = Date.now();
  const results: GeneratedQuestion[] = [];
  const subjects = criteria.subjects?.length ? criteria.subjects : [];
  const maxAttempts = Math.min(criteria.count * 2, 10);

  for (let i = 0; i < maxAttempts && results.length < criteria.count; i++) {
    const subject = subjects[i % subjects.length] || 'General';
    const topic = criteria.topics?.[i % criteria.topics.length] || subject;
    const result = await generateAIQuestion({
      subject,
      topic,
      difficulty: criteria.difficulty || 'medium',
      examType: criteria.examTypes?.[0] || 'LDC',
      language: criteria.language || 'en',
      avoidTexts: Array.from(seenTexts),
    });
    if (result.question && !seenTexts.has(result.question.text) && validateQuestionIntegrity(result.question).valid) {
      seenTexts.add(result.question.text);
      results.push(result.question);
    }
  }

  return { questions: results, source: 'ai_generated', latency: Date.now() - start, hit: results.length > 0 };
}

// ─── Source 4: Templates ───

async function fetchSourceTemplates(criteria: QuestionCriteria, seenTexts: Set<string>): Promise<SourceResult> {
  const start = Date.now();
  const pool = generateMCQs({
    subjects: criteria.subjects,
    topics: criteria.topics,
    difficulty: criteria.difficulty || 'medium',
    examType: criteria.examTypes?.[0] || 'LDC',
    count: Math.max(criteria.count * 2, 20),
    language: criteria.language || 'en',
    avoidQuestionIds: criteria.avoidIds,
  });
  const results = pool.filter((q) => !seenTexts.has(q.text) && validateQuestionIntegrity(q).valid);
  results.forEach((q) => seenTexts.add(q.text));
  return { questions: results.slice(0, criteria.count), source: 'templates', latency: Date.now() - start, hit: results.length > 0 };
}

// ─── Source chain definition (priority order) ───

const SOURCES: SourceEntry[] = [
  { name: 'repository', fetch: fetchSourceB },
  { name: 'psc_questions', fetch: fetchSourceC },
  { name: 'ai_generated', fetch: fetchSourceAI },
  { name: 'templates', fetch: fetchSourceTemplates },
];

// ─── Adapter ───

class QuestionSourceAdapterClass {
  private seenTexts = new Set<string>();
  private sourceStats = new Map<string, { hits: number; misses: number; totalLatency: number }>();

  private async collectFromSources(criteria: QuestionCriteria): Promise<GeneratedQuestion[]> {
    const aggregated: GeneratedQuestion[] = [];
    const criteriaCopy = { ...criteria, count: Math.max(criteria.count, 5) };

    for (const source of SOURCES) {
      if (aggregated.length >= criteria.count) break;
      const remaining = criteria.count - aggregated.length;
      const result = await source.fetch({ ...criteriaCopy, count: remaining }, this.seenTexts);
      const stats = this.sourceStats.get(source.name) || { hits: 0, misses: 0, totalLatency: 0 };
      if (result.hit) stats.hits++; else stats.misses++;
      stats.totalLatency += result.latency;
      this.sourceStats.set(source.name, stats);
      aggregated.push(...result.questions);
    }

    return aggregated.slice(0, criteria.count);
  }

  resetSeenTexts(): void {
    this.seenTexts.clear();
  }

  getSourceStats(): Record<string, { hits: number; misses: number; avgLatency: number }> {
    const stats: Record<string, { hits: number; misses: number; avgLatency: number }> = {};
    Array.from(this.sourceStats.entries()).forEach(([name, s]) => {
      const total = s.hits + s.misses;
      stats[name] = { hits: s.hits, misses: s.misses, avgLatency: total > 0 ? Math.round(s.totalLatency / total) : 0 };
    });
    return stats;
  }

  async getQuestions(criteria: QuestionCriteria): Promise<GeneratedQuestion[]> {
    return this.collectFromSources(criteria);
  }

  async getMockQuestions(criteria: MockCriteria): Promise<GeneratedQuestion[]> {
    return this.collectFromSources(criteria);
  }

  async getPracticeQuestions(criteria: PracticeCriteria): Promise<GeneratedQuestion[]> {
    if (criteria.sourceType === 'note' || criteria.sourceType === 'paste') {
      const agg: GeneratedQuestion[] = [];
      const maxNoteAttempts = Math.min(5, criteria.count * 2);
      for (let i = 0; i < maxNoteAttempts && agg.length < criteria.count; i++) {
        const subject = criteria.subjects?.[i % (criteria.subjects?.length || 1)] || 'General';
        const result = await generateAIQuestion({
          subject,
          topic: criteria.topics?.[0] || subject,
          difficulty: criteria.difficulty || 'medium',
          examType: criteria.examTypes?.[0] || 'LDC',
          language: criteria.language || 'en',
          avoidTexts: Array.from(this.seenTexts),
          focusInstruction: criteria.focusInstruction,
        });
        if (result.question && !this.seenTexts.has(result.question.text) && validateQuestionIntegrity(result.question).valid) {
          this.seenTexts.add(result.question.text);
          agg.push(result.question);
        }
      }
      return agg;
    }
    return this.collectFromSources(criteria);
  }

  async getCount(options: { subjects?: string[]; difficulty?: string; quizReadyOnly?: boolean }): Promise<{ total: number; quizReady: number }> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/psc-pyq-explorer?action=filters`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } },
      );
      if (!res.ok) return { total: 17165, quizReady: 1870 };
      return { total: 17165, quizReady: 1870 };
    } catch {
      return { total: 17165, quizReady: 1870 };
    }
  }
}

export const QuestionSourceAdapter = new QuestionSourceAdapterClass();
