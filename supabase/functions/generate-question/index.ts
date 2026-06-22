import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const AI_API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENAI_API_KEY') || '';
const AI_API_URL = Deno.env.get('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';
const FALLBACK_API_KEY = Deno.env.get('FALLBACK_API_KEY') || '';
const FALLBACK_API_URL = Deno.env.get('FALLBACK_API_URL') || '';
const FALLBACK_MODEL = Deno.env.get('FALLBACK_MODEL') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || '';

interface RequestBody {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examType: string;
  focusInstruction?: string;
  recentHistory?: { text: string; correct: boolean }[];
  syllabusItems?: string[];
  language?: 'en' | 'ml';
  topicConstraint?: string;
  avoidTexts?: string[];
}

interface ParsedQuestion {
  subject: string;
  topic: string;
  subtopic: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: '10th-level Kerala PSC exam (LDC level). Questions should be factual, direct, and test basic recall of key facts.',
  medium: '12th-level Kerala PSC exam (Secretariat Assistant level). Questions should require moderate understanding and connect related concepts.',
  hard: 'Degree-level Kerala PSC exam. Questions should require analytical thinking, comparison, and deep conceptual understanding.',
};

function buildPrompt(
  subject: string, topic: string, difficulty: string, examType: string,
  focusInstruction?: string, recentHistory?: { text: string; correct: boolean }[],
  syllabusItems?: string[], subtopic?: string, language?: 'en' | 'ml',
  topicConstraint?: string, avoidTexts?: string[],
): string {
  let instructionBlock = '';

  const isContentBased = focusInstruction && (
    focusInstruction.startsWith('CONTENT-BASED:')
  );

  if (isContentBased) {
    // Extract the actual content from the focusInstruction
    const contentText = focusInstruction.replace(/^CONTENT-BASED:\s*/, '');
    const languageBlock = language === 'ml'
      ? '\n\nIMPORTANT: Generate the ENTIRE question, options, and explanation in Malayalam (മലയാളം).'
      : '';
    // Add random variation to prevent duplicate questions
    const randomVariation = Math.random() > 0.5 ? 'Focus on a DIFFERENT aspect than usual' : 'Pick a less obvious detail';
    const variationInstruction = `\nVARIATION INSTRUCTION: ${randomVariation}. Each time you generate a question, pick a DIFFERENT fact, concept, person, or date from the content. Do NOT repeat the same question topic.`;

    return `Generate a multiple-choice question based STRICTLY on the content provided below. The ONLY source for the question is the content below.

CONTENT TO BASE THE QUESTION ON:
"""
${contentText}
"""

The question MUST test understanding of a specific fact, concept, person, date, or idea mentioned in THIS content. Do NOT generate a general question. Do NOT use any external knowledge beyond the content.

Steps:
1. Read the content carefully
2. Pick one key fact, concept, person, date, or term from it
3. Create a question that tests knowledge of that specific item — the answer MUST be directly in the content
4. Generate 4 options where exactly one is correct
5. Write an explanation referencing the exact content that supports the answer
6. Determine the appropriate subject and topic from the content itself — what domain does this content belong to?

Rules:
- The question must be answerable ONLY from the content above — do not rely on external knowledge
- Provide 4 options (A, B, C, D)
- Exactly one option must be correct
- Provide a concise explanation (2-3 sentences)
- Determine the subject and topic from the content itself (e.g., if content is about Indian independence, use "History" and "Indian Independence Movement")
${variationInstruction}
${languageBlock}

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "subject": "determine the subject from the content, e.g. History, Science, Polity",
  "topic": "determine the specific topic from the content",
  "subtopic": "",
  "question": "question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "explanation text here"
}

The correctAnswer field must be the 0-based index of the correct option in the options array.`;
}

  if (subtopic) {
    instructionBlock += `\nTarget the specific subtopic: "${subtopic}". The question must be about this exact subtopic.`;
  }
  if (focusInstruction) {
    instructionBlock += `\nFocus: ${focusInstruction}`;
  }
  if (topicConstraint) {
    instructionBlock += `\n\n${topicConstraint}`;
  }

  if (recentHistory && recentHistory.length > 0) {
    instructionBlock += `\n\nThe student has previously attempted the following questions on this topic:\n`;
    for (const r of recentHistory) {
      instructionBlock += `- [${r.correct ? 'CORRECT' : 'WRONG'}] ${r.text}\n`;
    }
    const wrongCount = recentHistory.filter((r) => !r.correct).length;
    if (wrongCount > 0) {
      instructionBlock += `\nThe student got ${wrongCount} of these wrong. Target the SAME concept from a different angle to reinforce understanding.`;
    }
  }

  if (syllabusItems && syllabusItems.length > 0) {
    instructionBlock += `\n\nThis topic covers the following Kerala PSC syllabus subtopics:\n`;
    for (const item of syllabusItems) {
      instructionBlock += `- ${item}\n`;
    }
    instructionBlock += `\nEnsure the question is strictly within these subtopics.`;
  }

  if (language === 'ml') {
    instructionBlock += `\n\nIMPORTANT: Generate the ENTIRE question, options, and explanation in Malayalam (മലയാളം). The question text, all 4 options, and the explanation must be in Malayalam. Use standard Malayalam script.`;
  }

  if (avoidTexts && avoidTexts.length > 0) {
    instructionBlock += `\n\nThe following question texts have been used before — do NOT generate any question with the same or very similar content:\n`;
    for (const t of avoidTexts.slice(-20)) {
      instructionBlock += `- ${t}\n`;
    }
    instructionBlock += `\nPick a completely different subtopic, fact, or angle that is NOT covered by any of the above.`;
  }

  return `Generate a high-quality multiple-choice question for Kerala PSC examination.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${DIFFICULTY_PROMPTS[difficulty] ?? DIFFICULTY_PROMPTS['medium']}
Exam Type: ${examType}${instructionBlock}

STRICT RULES:
- You MUST generate a question about subject "${subject}" AND topic "${topic}".
- Do NOT change the subject. Do NOT change the topic.
- The question MUST be specifically about "${topic}" — not a related topic, not a broader topic.
- Always generate a question — never return empty.

Rules:
- The question must be factually accurate for Kerala PSC syllabus
- Provide 4 options (A, B, C, D)
- Exactly one option must be correct
- Provide a concise explanation (2-3 sentences) explaining why the correct answer is right
- The explanation must reference the source/factual basis
- Pick a different subtopic or angle than the most obvious/common one to ensure diversity

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "subject": "${subject}",
  "topic": "${topic}",
  "subtopic": "the specific subtopic this question covers",
  "question": "question text here",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": 0,
  "explanation": "explanation text here"
}

The correctAnswer field must be the 0-based index of the correct option in the options array.
The subject field MUST be "${subject}". The topic field MUST be "${topic}".`;
}

function parseResponse(text: string): ParsedQuestion | null {
  // First, try to extract content from OpenAI-style response
  try {
    const apiResponse = JSON.parse(text);
    if (apiResponse.choices && apiResponse.choices[0]?.message?.content) {
      text = apiResponse.choices[0].message.content;
    }
  } catch {
    // Not an API response, treat as direct content
  }

  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.subject === 'string' &&
      typeof parsed.topic === 'string' &&
      typeof parsed.question === 'string' &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 4 &&
      typeof parsed.correctAnswer === 'number' &&
      parsed.correctAnswer >= 0 &&
      parsed.correctAnswer <= 3 &&
      typeof parsed.explanation === 'string'
    ) {
      return {
        subject: parsed.subject,
        topic: parsed.topic,
        subtopic: parsed.subtopic || '',
        question: parsed.question,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
      };
    }
    return null;
  } catch {
    const match = cleaned.match(/\{[\s\S]*"question"[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (typeof parsed.subject === 'string' && typeof parsed.topic === 'string') {
          return {
            subject: parsed.subject,
            topic: parsed.topic,
            subtopic: parsed.subtopic || '',
            question: parsed.question,
            options: parsed.options,
            correctAnswer: parsed.correctAnswer,
            explanation: parsed.explanation,
          };
        }
      } catch {
        return null;
      }
    }
    return null;
  }
}

/// Canonical taxonomy derived from syllabus.ts (18 subjects with topic sets)
const CANONICAL: Record<string, Set<string>> = {
  'Arts, Sports & Culture': new Set(['Classical & Ritualistic Art Forms', 'Folk & Traditional Arts', 'Malayalam Cinema', 'Sports & Athletics']),
  'Civics & Public Administration': new Set(['Bureaucracy & Administrative Machinery', 'Digital Governance & E-Governance', 'Social Welfare & Public Policy']),
  'Constitution': new Set(['Constitutional Framework', 'Fundamental Rights', 'Directive Principles & Fundamental Duties', 'Union Executive', 'Union Legislature', 'Judiciary', 'State Executive & Legislature', 'Federal System & Local Government', 'Constitutional Bodies']),
  'Current Affairs': new Set(['Kerala News', 'National News', 'International News', 'Science & Technology', 'Sports']),
  'English': new Set(['Grammar', 'Vocabulary', 'Reading Comprehension & Writing']),
  'Geography': new Set(['Physical Geography (World)', 'Geophysical Phenomena', 'Physiography of India', 'Indian River Systems', 'Climate of India', 'Kerala Geography']),
  'Indian Economy': new Set(['National Income & Macroeconomic Indicators', 'Banking & Monetary Policy', 'Public Finance & Fiscal System', 'Sectors of Indian Economy', 'Planning & Development']),
  'Indian History & National Movement': new Set(['Ancient India', 'Medieval India', 'British Rule & Early Struggles', 'Indian National Movement']),
  'Information Technology & Cyber Laws': new Set(['Computer Hardware & Architecture', 'Software & Operating Systems', 'Networks & Internet', 'Web Technologies & Languages', 'Cyber Security & Threats', 'IT Act & Legal Frameworks']),
  'Kerala Economy': new Set(['Kerala Model of Development', 'Socio-Economic Safety Networks', 'Kerala Fiscal & Industrial Landscape']),
  'Kerala History': new Set(['Ancient Kerala', 'Medieval Kerala', 'Arrival of Europeans & Early Resistance', 'Modern Kerala', 'Cultural History']),
  'Malayalam': new Set(['Grammar (\u0d35\u0d4d\u0d2f\u0d3e\u0d15\u0d30\u0d23\u0d02)', 'Literature (\u0d38\u0d3e\u0d39\u0d3f\u0d24\u0d4d\u0d2f\u0d02)', 'Poetry (\u0d15\u0d35\u0d3f\u0d24)', 'Prose & Drama (\u0d17\u0d26\u0d4d\u0d2f\u0d35\u0d41\u0d02 \u0d28\u0d3e\u0d1f\u0d15\u0d35\u0d41\u0d02)']),
  'Mental Ability': new Set(['Series & Patterns', 'Analogy & Classification', 'Coding & Decoding', 'Blood Relations & Direction Sense', 'Syllogisms & Venn Diagrams', 'Clock, Calendar & Miscellaneous']),
  'Quantitative Aptitude': new Set(['Number System & Basic Operations', 'Arithmetic', 'Time, Speed, Distance & Work', 'Mensuration', 'Algebra & Progressions', 'Data Interpretation']),
  'Renaissance': new Set(['Social Reform Movements', 'Temple Entry Movement', 'Major Agitations & Structural Protests', 'Literary Renaissance']),
  'Science': new Set(['Physics \u2014 Mechanics & Properties of Matter', 'Physics \u2014 Light, Sound, Heat & Electronics', 'Chemistry \u2014 Atomic Structure & Periodicity', 'Chemistry \u2014 Acids, Bases & Chemical Reactions', 'Biology \u2014 Human Physiology', 'Biology \u2014 Biochemistry, Nutrition & Diseases', 'Biology \u2014 Plant Physiology & Ecology', 'Environmental Science & Waste Management']),
  'Special Acts & Social Welfare': new Set(['Human Rights & Civil Rights', 'Gender & Child Welfare', 'Transparency & Anti-Corruption']),
  'World History': new Set(['Great Revolutions', 'World Wars & International Alliances']),
};

const SUBJECT_SYNONYMS = new Map([
  ['Polity', 'Constitution'],
  ['Indian History', 'Indian History & National Movement'],
  ['Social Science', 'Civics & Public Administration'],
  ['General Science', 'Science'],
  ['Indian Constitution', 'Constitution'],
  ['Mathematics', 'Quantitative Aptitude'],
  ['General Knowledge', 'Current Affairs'],
  ['GK', 'Current Affairs'],
]);

const TOPIC_SYNONYMS = new Map<string, string>([
  ['Constitution', 'Constitutional Framework'],
  ['Directive Principles', 'Directive Principles & Fundamental Duties'],
  ['Parliament', 'Union Legislature'],
  ['President', 'Union Executive'],
  ['Modern India', 'British Rule & Early Struggles'],
  ['Freedom Movement', 'Indian National Movement'],
  ['Continents and Oceans', 'Physical Geography (World)'],
  ['World Geography', 'Physical Geography (World)'],
  ['Geographical Features', 'Physical Geography (World)'],
  ['Physical Geography', 'Physical Geography (World)'],
  ['General', 'General'],
  ['Grammar', 'Grammar (\u0d35\u0d4d\u0d2f\u0d3e\u0d15\u0d30\u0d23\u0d02)'],
  ['Literature', 'Literature (\u0d38\u0d3e\u0d39\u0d3f\u0d24\u0d4d\u0d2f\u0d02)'],
]);

const REJECTED_SUBJECTS = new Set(['Test', 'Test Subject', 'Unknown']);

function validateTaxonomy(rawSubject: string, rawTopic: string): { error?: string; subject?: string; topic?: string } {
  if (REJECTED_SUBJECTS.has(rawSubject)) {
    return { error: `Rejected subject "${rawSubject}"` };
  }

  const subject = SUBJECT_SYNONYMS.get(rawSubject) || rawSubject;

  const validTopics = CANONICAL[subject];
  if (!validTopics) {
    return { error: `Unknown subject "${rawSubject}"` };
  }

  // First try the exact topic before applying synonyms
  if (validTopics.has(rawTopic)) {
    return { subject, topic: rawTopic };
  }

  // Fall through to synonym-mapped topic (e.g., 'Grammar' -> Malayalam 'Grammar (വ്യാകരണം)')
  const topic = TOPIC_SYNONYMS.get(rawTopic) || rawTopic;
  if (!validTopics.has(topic)) {
    return { error: `Unknown topic "${rawTopic}" for subject "${subject}"` };
  }

  return { subject, topic };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, apikey',
};

function corsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return corsResponse({ error: 'Method not allowed' }, 405);
  }

  if (!AI_API_KEY) {
    return corsResponse(
      { error: 'AI_API_KEY not configured. Set AI_API_KEY (or OPENAI_API_KEY for legacy) via supabase secrets set.' },
      500,
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { subject, topic, subtopic, difficulty, examType, focusInstruction, recentHistory, syllabusItems, language, topicConstraint } = body;

    if (!subject || !topic) {
      return corsResponse({ error: 'subject and topic are required' }, 400);
    }

    // Validate input taxonomy before calling AI
    const inputTax = validateTaxonomy(subject, topic);
    if (inputTax.error) {
      return corsResponse({ error: `Invalid taxonomy: ${inputTax.error}` }, 400);
    }

    const prompt = buildPrompt(subject, topic, difficulty ?? 'medium', examType ?? 'LDC', focusInstruction, recentHistory, syllabusItems, subtopic, language, topicConstraint, body.avoidTexts);

    const isContentBased = focusInstruction && focusInstruction.startsWith('CONTENT-BASED:');
    const systemMessage = isContentBased
      ? 'You generate multiple-choice questions from provided content. Read the content carefully and create a question about a fact, concept, or term mentioned in it. Never generate questions about topics not present in the content.'
      : 'You are a Kerala PSC exam question generator. You MUST identify the subject, topic, and subtopic of every question you generate and return them in the JSON response.';

    const isOpenRouter = AI_API_URL.includes('openrouter.ai');

    const tryProvider = async (url: string, key: string, model: string, extraHeaders?: Record<string, string>): Promise<ParsedQuestion | null> => {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      };
      try {
        const body = { model, messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: isContentBased ? 1024 : 800 };
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) {
          return null;
        }
        const text = await res.text();
        const parsed = parseResponse(text);
        return parsed;
      } catch (e) {
        return null;
      }
    };

    const returnQuestion = (parsed: ParsedQuestion): Response => {
      const taxResult = validateTaxonomy(parsed.subject, parsed.topic);
      if (taxResult.error) {
        return corsResponse({ error: `AI generated question has invalid taxonomy: ${taxResult.error}. Regenerate.` }, 422);
      }
      return corsResponse({ subject: taxResult.subject, topic: taxResult.topic, subtopic: parsed.subtopic, question: parsed.question, options: parsed.options, correctAnswer: parsed.correctAnswer, explanation: parsed.explanation, difficulty, examType: [examType], confidence: difficulty === 'easy' ? 88 : difficulty === 'medium' ? 82 : 75, source: 'ai_generated', alignmentWarning: taxResult.topic !== topic || taxResult.subject !== subject });
    };

    // Try 1: Primary provider (AI_API_KEY + AI_API_URL + AI_MODEL)
    const primaryHeaders = isOpenRouter ? { 'HTTP-Referer': 'https://lakshyam.app', 'X-Title': 'Lakshyam' } : undefined;
    let result = await tryProvider(AI_API_URL, AI_API_KEY, AI_MODEL, primaryHeaders);
    if (result) return returnQuestion(result);

    // Try 2: If primary is OpenRouter, try alternate models on same URL
    if (isOpenRouter) {
      const altModels = ['google/gemini-2.0-flash-lite-001', 'meta-llama/llama-3.1-8b-instruct'];
      for (const model of altModels) {
        result = await tryProvider(AI_API_URL, AI_API_KEY, model, primaryHeaders);
        if (result) return returnQuestion(result);
      }
    }

    // Try 3: Fallback provider (FALLBACK_API_KEY + FALLBACK_API_URL + FALLBACK_MODEL)
    const FB_KEY = Deno.env.get('FALLBACK_API_KEY') || '';
    const FB_URL = Deno.env.get('FALLBACK_API_URL') || '';
    const FB_MODEL = Deno.env.get('FALLBACK_MODEL') || 'meta-llama/llama-3.1-8b-instruct:free';
    if (FB_KEY && FB_URL) {
      result = await tryProvider(FB_URL, FB_KEY, FB_MODEL);
      if (result) return returnQuestion(result);
    }

    // Try 4: Gemini direct
    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
    if (GEMINI_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;
      try {
        const geminiBody = { contents: [{ parts: [{ text: `${systemMessage}\n\n${prompt}\n\nReturn ONLY valid JSON. No markdown, no code fences.` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } };
        const res = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            const parsed = parseResponse(text);
            if (parsed) return returnQuestion(parsed);
          }
        }
      } catch (e) { }
    }
    return corsResponse({ error: 'All models failed' }, 502);
  } catch (err) {
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
