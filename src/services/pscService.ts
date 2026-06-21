import { supabase } from './supabase';

const EDGE_FUNCTION = 'psc-pyq-explorer';

type PSCFilters = {
  examCategory?: string | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  subject?: string | null;
  topic?: string | null;
  language?: string | null;
  onlyQuizReady?: boolean;
  onlyAnswered?: boolean;
  search?: string | null;
  limit?: number;
  offset?: number;
};

type PSCQuestion = {
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
};

type PSCPagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

type FilterOptions = {
  subjects: string[];
  categories: string[];
  years: number[];
};

type TopicFrequency = {
  subject: string;
  topic: string;
  question_count: number;
  repeat_count: number;
  frequency_rank: number;
  sample_question: string;
};

async function callEdgeFunction<T>(params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const { data, error } = await supabase!.functions.invoke(`${EDGE_FUNCTION}?${query}`, {
    method: 'GET',
    body: undefined,
  });
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getPSCQuestions(filters: PSCFilters): Promise<{ questions: PSCQuestion[]; pagination: PSCPagination }> {
  const params: Record<string, string> = { action: 'search' };
  if (filters.examCategory) params.exam_category = filters.examCategory;
  if (filters.yearFrom) params.year_from = String(filters.yearFrom);
  if (filters.yearTo) params.year_to = String(filters.yearTo);
  if (filters.subject) params.subject = filters.subject;
  if (filters.topic) params.topic = filters.topic;
  if (filters.language) params.language = filters.language;
  if (filters.onlyQuizReady) params.quiz_ready = 'true';
  if (filters.onlyAnswered) params.answered = 'true';
  if (filters.search) params.q = filters.search;
  params.limit = String(filters.limit || 50);
  params.offset = String(filters.offset || 0);

  const data = await callEdgeFunction<{ success: boolean; questions: PSCQuestion[]; pagination: PSCPagination }>(params);
  return { questions: data.questions, pagination: data.pagination };
}

export async function getPSCFilters(): Promise<FilterOptions> {
  const data = await callEdgeFunction<{ success: boolean; filters: FilterOptions }>({ action: 'filters' });
  return data.filters;
}

export async function getTopTopics(limit = 30): Promise<TopicFrequency[]> {
  const data = await callEdgeFunction<{ success: boolean; topics: TopicFrequency[] }>({ action: 'topics', limit: String(limit) });
  return data.topics;
}

export async function generatePSCSession(
  count = 10,
  subject?: string,
  topic?: string,
  examCategory?: string,
  revealAnswers = true
): Promise<PSCQuestion[]> {
  const params: Record<string, string> = {
    action: 'session',
    count: String(count),
    reveal_answers: String(revealAnswers),
  };
  if (subject) params.subject = subject;
  if (topic) params.topic = topic;
  if (examCategory) params.exam_category = examCategory;

  const data = await callEdgeFunction<{ success: boolean; questions: PSCQuestion[] }>(params);
  return data.questions;
}
