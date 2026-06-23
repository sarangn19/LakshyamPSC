import { GeneratedQuestion } from './aiMCQGenerator';

export interface ValidationFailure {
  rule: string;
  message: string;
}

export interface ValidationResult {
  passed: boolean;
  confidenceScore: number;
  failures: ValidationFailure[];
}

const PLACEHOLDER_PATTERNS = [
  /option\s*[a-d]/i,
  /answer\s*here/i,
  /insert\s+(answer|text|option)/i,
  /^\s*\.\.\.\s*$/,
  /^\s*$/,
  /^todo/i,
  /^example/i,
];

interface QuestionCache {
  question: GeneratedQuestion;
  validatedAt: number;
}

const VALIDATED_CACHE = new Map<string, QuestionCache>();
const CACHE_TTL = 86400000; // 24 hours

function questionCacheKey(question: GeneratedQuestion): string {
  return `${question.subject}|${question.topic}|${question.text.slice(0, 40)}`;
}

export function getCachedValidated(question: GeneratedQuestion): GeneratedQuestion | null {
  const key = questionCacheKey(question);
  const entry = VALIDATED_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.validatedAt > CACHE_TTL) {
    VALIDATED_CACHE.delete(key);
    return null;
  }
  return entry.question;
}

function cacheValidated(question: GeneratedQuestion): void {
  const key = questionCacheKey(question);
  if (VALIDATED_CACHE.size >= 200) {
    const oldest = VALIDATED_CACHE.keys().next().value;
    if (oldest) VALIDATED_CACHE.delete(oldest);
  }
  VALIDATED_CACHE.set(key, { question, validatedAt: Date.now() });
}

function isPlaceholder(text: string): boolean {
  return PLACEHOLDER_PATTERNS.some((p) => p.test(text));
}

export function validateAnswerKey(question: GeneratedQuestion): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const { correctAnswer, options } = question;

  if (typeof correctAnswer === 'undefined' || correctAnswer === null) {
    failures.push({ rule: 'answerKey_exists', message: 'Missing correctAnswer field' });
    return failures;
  }

  const numAnswer = Number(correctAnswer);

  if (!Number.isInteger(numAnswer)) {
    failures.push({ rule: 'answerKey_type', message: `correctAnswer must be an integer, got ${typeof correctAnswer}` });
    return failures;
  }

  if (numAnswer < 0 || numAnswer >= options.length) {
    failures.push({ rule: 'answerKey_in_range', message: `correctAnswer ${numAnswer} out of range (0-${options.length - 1})` });
  }

  return failures;
}

export function validateOptions(question: GeneratedQuestion): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const { options } = question;

  if (!options || options.length < 2) {
    failures.push({ rule: 'options_min', message: `Need at least 2 options, got ${options?.length ?? 0}` });
    return failures;
  }

  if (options.length > 6) {
    failures.push({ rule: 'options_max', message: `Too many options: ${options.length}` });
  }

  const seen = new Set<string>();
  for (let i = 0; i < options.length; i++) {
    const opt = (options[i] ?? '').trim();

    if (opt === '') {
      failures.push({ rule: 'options_empty', message: `Option ${String.fromCharCode(65 + i)} is empty` });
    }

    if (isPlaceholder(opt)) {
      failures.push({ rule: 'options_placeholder', message: `Option ${String.fromCharCode(65 + i)} contains placeholder text` });
    }

    if (seen.has(opt.toLowerCase())) {
      failures.push({ rule: 'options_duplicate', message: `Option ${String.fromCharCode(65 + i)} duplicates another option: "${opt}"` });
    }
    seen.add(opt.toLowerCase());
  }

  return failures;
}

export function validateExplanation(question: GeneratedQuestion): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const { explanation, options, correctAnswer, text } = question;

  if (!explanation || explanation.trim() === '') {
    failures.push({ rule: 'explanation_empty', message: 'Explanation is empty' });
    return failures;
  }

  if (isPlaceholder(explanation)) {
    failures.push({ rule: 'explanation_placeholder', message: 'Explanation contains placeholder text' });
  }

  const answerText = options[Number(correctAnswer)]?.trim().toLowerCase() ?? '';
  const explanationLower = explanation.toLowerCase();
  const questionLower = text.toLowerCase();

  if (answerText && answerText.length > 2) {
    const answerWords = answerText.split(/\s+/).filter((w) => w.length > 3);
    const matchCount = answerWords.filter((w) => explanationLower.includes(w)).length;
    if (answerWords.length > 0 && matchCount < Math.min(1, answerWords.length)) {
      failures.push({ rule: 'explanation_support', message: 'Explanation does not reference the correct answer' });
    }
  }

  const explanationWords = new Set(explanationLower.split(/\s+/).filter((w) => w.length > 3));
  const questionWords = questionLower.split(/\s+/).filter((w) => w.length > 3);
  const contradictQuestion = questionWords.some((w) => {
    if (w === 'not' || w === 'no' || w === 'never') return false;
    if (explanationWords.has(w)) return false;
    return false;
  });

  return failures;
}

export function validateMalformed(question: GeneratedQuestion): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const { text, options, explanation, correctAnswer } = question;

  if (!text || text.trim() === '') {
    failures.push({ rule: 'malformed_text', message: 'Question text is empty' });
  }

  if (isPlaceholder(text)) {
    failures.push({ rule: 'malformed_placeholder', message: 'Question text contains placeholder' });
  }

  if (explanation && explanation.length < 5) {
    failures.push({ rule: 'malformed_explanation_short', message: 'Explanation is too short' });
  }

  if (typeof correctAnswer === 'number' && (correctAnswer < 0 || correctAnswer >= options.length)) {
    failures.push({ rule: 'malformed_answer_mapping', message: `correctAnswer index ${correctAnswer} out of range` });
  }

  return failures;
}

/// Common impossible factual associations to catch hallucinated questions.
/// Each entry: [subject-topic prefix, pattern in question/options to reject, reason]
const FACTUAL_TRAPS: { subjectTopicPrefix: string; rejectPattern: RegExp; reason: string }[] = [
  // Species–location mismatches
  { subjectTopicPrefix: 'Kerala', rejectPattern: /asiatic\s*lion/i, reason: 'Asiatic lions exist only in Gir National Park (Gujarat), not in Kerala' },
  { subjectTopicPrefix: 'Kerala', rejectPattern: /\bone\s*horn(?:ed)?\s*rhin[oc]/i, reason: 'One-horned rhinos exist only in Assam (Kaziranga), not in Kerala' },
  { subjectTopicPrefix: 'Kerala', rejectPattern: /\bbengal\s*tiger\b/i, reason: 'Bengal tigers are found across India but not a specific Kerala conservation subject; avoid vague association' },
  { subjectTopicPrefix: 'Geography', rejectPattern: /\bkerala\s*has\s*(active|live|volcanic|volcano)/i, reason: 'Kerala has no active volcanoes' },
  { subjectTopicPrefix: 'Geography', rejectPattern: /\b(gobi|sahara|thar|kalahari)\s+desert.*kerala/i, reason: 'No major deserts in Kerala' },
  { subjectTopicPrefix: 'Kerala', rejectPattern: /\b(snow|glacier|ice\s*cap)\b.*\b(kerala|munnar)/i, reason: 'Kerala has no snow or glaciers despite Munnar cold weather' },
];

function rejectKnownHallucinations(text: string, options: string[], subject: string, topic: string): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const combined = `${text} ${options.join(' ')}`;
  const prefix = `${subject} ${topic}`;
  for (const trap of FACTUAL_TRAPS) {
    if (prefix.includes(trap.subjectTopicPrefix) && trap.rejectPattern.test(combined)) {
      failures.push({ rule: 'factual_hallucination', message: trap.reason });
    }
  }
  return failures;
}

export function validateQuestion(question: GeneratedQuestion): ValidationResult {
  const allFailures: ValidationFailure[] = [
    ...validateAnswerKey(question),
    ...validateOptions(question),
    ...validateExplanation(question),
    ...validateMalformed(question),
    ...rejectKnownHallucinations(question.text, question.options, question.subject, question.topic),
  ];

  const passed = allFailures.length === 0;

  const severityScore = allFailures.reduce((score, f) => {
    if (f.rule.startsWith('answerKey') || f.rule.startsWith('malformed_answer')) return score + 40;
    if (f.rule.startsWith('options_duplicate') || f.rule.startsWith('options_empty')) return score + 25;
    if (f.rule.startsWith('explanation')) return score + 15;
    return score + 10;
  }, 0);

  const confidenceScore = Math.max(0, Math.min(100, 100 - severityScore));

  if (passed) {
    cacheValidated(question);
  }

  return { passed, confidenceScore, failures: allFailures };
}

export function validateQuestionIntegrity(
  question: GeneratedQuestion,
): { valid: boolean; result: ValidationResult; shouldRetry: boolean } {
  const result = validateQuestion(question);
  const valid = result.passed && result.confidenceScore >= 80;
  const shouldRetry = !valid;

  console.log('[INTEGRITY] validation:', {
    questionId: question.id,
    validationPassed: valid,
    validationFailures: result.failures.length,
    confidenceScore: result.confidenceScore,
    generationSource: question.source,
    failures: result.failures.map((f) => f.message),
  });

  return { valid, result, shouldRetry };
}

export function getValidatedFallback(
  question: GeneratedQuestion,
): GeneratedQuestion | null {
  const cached = getCachedValidated(question);
  if (cached) {
    console.log('[INTEGRITY] using cached validated question for:', question.subject, question.topic);
    return cached;
  }
  return null;
}
