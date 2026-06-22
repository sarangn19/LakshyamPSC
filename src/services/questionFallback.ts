import { searchCorpus, toGeneratedQuestion } from '../data/pscCorpus';
import { generateMCQs, GeneratedQuestion } from './aiMCQGenerator';
import { validateQuestionIntegrity } from './questionValidator';
import { usePerformanceStore } from '../store/performanceStore';

export type FallbackSource = 'psc_corpus' | 'template_topic' | 'template_subject';

export interface FallbackResult {
  question: GeneratedQuestion;
  source: FallbackSource;
}

function recordFallback(source: FallbackSource, subject: string, topic?: string) {
  try {
    usePerformanceStore.getState().addFallbackEvent({
      source,
      subject,
      topic,
      timestamp: Date.now(),
    });
  } catch {}
}

function tryTopicTemplate(
  subjects: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  targetExam: string,
  locale: 'en' | 'ml',
  activeSubject: string,
  activeTopic?: string,
): GeneratedQuestion | null {
  // Force English for all subjects
  const pool = generateMCQs({
    subjects: [activeSubject],
    topics: activeTopic ? [activeTopic] : undefined,
    difficulty: difficulty === 'hard' ? 'medium' : difficulty,
    examType: targetExam || 'LDC',
    count: 5,
    language: 'en',
  });
  for (const q of pool) {
    if (validateQuestionIntegrity(q).valid) {
      return { ...q, source: 'template_topic' as const };
    }
  }
  return null;
}

function trySubjectTemplate(
  subjects: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  targetExam: string,
  locale: 'en' | 'ml',
): GeneratedQuestion | null {
  // Force English for all subjects
  const pool = generateMCQs({
    subjects,
    difficulty: 'easy',
    examType: targetExam || 'LDC',
    count: 10,
    language: 'en',
  });
  for (const q of pool) {
    if (validateQuestionIntegrity(q).valid) {
      return { ...q, source: 'template_subject' as const };
    }
  }
  return null;
}

export function getFallbackQuestion(
  weakSubjects: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  targetExams: string[],
  locale: 'en' | 'ml',
  activeSubject?: string,
  activeTopic?: string,
): FallbackResult {
  const targetExam = targetExams[0] || 'LDC';
  const subjects = weakSubjects.length > 0 ? weakSubjects : ['General'];

  // Level A: PSC Corpus
  if (activeSubject) {
    const corpusHit = searchCorpus(activeSubject, activeTopic, difficulty);
    if (corpusHit) {
      recordFallback('psc_corpus', activeSubject, activeTopic);
      return { question: toGeneratedQuestion(corpusHit), source: 'psc_corpus' };
    }
  }
  for (const sub of subjects) {
    const corpusHit = searchCorpus(sub, undefined, difficulty);
    if (corpusHit) {
      recordFallback('psc_corpus', sub);
      return { question: toGeneratedQuestion(corpusHit), source: 'psc_corpus' };
    }
  }

  // Level B: Topic Template
  if (activeSubject) {
    const topicQ = tryTopicTemplate(subjects, difficulty, targetExam, locale, activeSubject, activeTopic);
    if (topicQ) {
      recordFallback('template_topic', activeSubject, activeTopic);
      return { question: topicQ, source: 'template_topic' };
    }
  }
  for (const sub of subjects) {
    const topicQ = tryTopicTemplate([sub], difficulty, targetExam, locale, sub);
    if (topicQ) {
      recordFallback('template_topic', sub);
      return { question: topicQ, source: 'template_topic' };
    }
  }

  // Level C: Subject Template (broadest)
  const subjQ = trySubjectTemplate(subjects, difficulty, targetExam, locale);
  if (subjQ) {
    recordFallback('template_subject', subjects[0] || 'General');
    return { question: subjQ, source: 'template_subject' };
  }

  // Absolute last resort — hardcoded emergency question (always English)
  const lastResort: GeneratedQuestion = {
    id: `emergency_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: 'What is the national bird of India?',
    options: ['Peacock', 'Crow', 'Dove', 'Sparrow'],
    correctAnswer: 0,
    subject: 'General',
    topic: 'General Knowledge',
    difficulty: 'easy',
    explanation: 'The peacock (Pavo cristatus) is the national bird of India.',
    examType: ['LDC', 'Secretariat Assistant', 'Degree Level', 'University Assistant'],
    confidence: 1.0,
    source: 'template_subject',
    generatedAt: new Date().toISOString(),
  };
  recordFallback('template_subject', 'General');
  return { question: lastResort, source: 'template_subject' };
}
