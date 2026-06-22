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

    const prompt = buildPrompt(subject, topic, difficulty ?? 'medium', examType ?? 'LDC', focusInstruction, recentHistory, syllabusItems, subtopic, language, topicConstraint, body.avoidTexts);

    const isContentBased = focusInstruction && focusInstruction.startsWith('CONTENT-BASED:');
    const systemMessage = isContentBased
      ? 'You generate multiple-choice questions from provided content. Read the content carefully and create a question about a fact, concept, or term mentioned in it. Never generate questions about topics not present in the content.'
      : 'You are a Kerala PSC exam question generator. You MUST identify the subject, topic, and subtopic of every question you generate and return them in the JSON response.';

    console.log('[GENERATE] requested:', JSON.stringify({ subject, topic, subtopic: subtopic || '', isContentBased }));

    // Model fallback chain: try primary, then fallback models
    const primaryModel = AI_MODEL;
    const fallbackModels: string[] = [];
    if (AI_API_URL.includes('openrouter.ai')) {
      fallbackModels.push(
        'google/gemini-2.0-flash-lite-001',
        'meta-llama/llama-3.1-8b-instruct',
      );
    }
    const modelsToTry = [primaryModel, ...fallbackModels];

    const fetchHeaders: Record<string, string> = {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    };
    const isOpenRouter = AI_API_URL.includes('openrouter.ai');
    if (isOpenRouter) {
      fetchHeaders['HTTP-Referer'] = 'https://lakshyam.app';
      fetchHeaders['X-Title'] = 'Lakshyam';
    }

    let lastError: string | null = null;
    for (let mi = 0; mi < modelsToTry.length; mi++) {
      const model = modelsToTry[mi];
      console.log('[GENERATE] trying model:', model);
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: isContentBased ? 1024 : 800,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `AI API error (${model}): ${response.status} ${errText}`;
        console.log('[GENERATE] model failed:', model, response.status);
        const backoffMs = response.status === 429 ? Math.min(2000 * Math.pow(2, mi), 8000) : 500;
        console.log('[GENERATE] backing off', backoffMs, 'ms before next model');
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      const parsed = parseResponse(content);

      if (!parsed) {
        lastError = `Failed to parse AI response from ${model}`;
        console.log('[GENERATE] parse failed for model:', model);
        continue;
      }

      const alignmentWarning = parsed.topic !== topic || parsed.subject !== subject;
      const confidence = difficulty === 'easy' ? 88 : difficulty === 'medium' ? 82 : 75;

      console.log('[GENERATE] response:', JSON.stringify({
        requestedSubject: subject,
        requestedTopic: topic,
        requestedSubtopic: subtopic || '',
        generatedSubject: parsed.subject,
        generatedTopic: parsed.topic,
        generatedSubtopic: parsed.subtopic,
        aligned: !alignmentWarning,
        model,
      }));

      const responseBody: Record<string, unknown> = {
        subject: parsed.subject,
        topic: parsed.topic,
        subtopic: parsed.subtopic,
        question: parsed.question,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.explanation,
        difficulty,
        examType: [examType],
        confidence,
        source: 'ai_generated',
        alignmentWarning,
      };
      return corsResponse(responseBody);
    }

    // Backoff before fallback provider
    await new Promise((r) => setTimeout(r, 1000));

    // Fallback provider (e.g., Groq) if all primary models failed
    if (FALLBACK_API_KEY && FALLBACK_API_URL) {
      const fallbackModel = FALLBACK_MODEL || 'llama-3.1-8b-instant';
      console.log('[GENERATE] trying fallback provider:', FALLBACK_API_URL, fallbackModel);
      const fallbackResponse = await fetch(FALLBACK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FALLBACK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: fallbackModel,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: isContentBased ? 1024 : 800,
        }),
      });

      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const parsed = parseResponse(content);
        if (parsed) {
          const alignmentWarning = parsed.topic !== topic || parsed.subject !== subject;
          const confidence = difficulty === 'easy' ? 88 : difficulty === 'medium' ? 82 : 75;
          console.log('[GENERATE] fallback provider succeeded');
          return corsResponse({
            subject: parsed.subject,
            topic: parsed.topic,
            subtopic: parsed.subtopic,
            question: parsed.question,
            options: parsed.options,
            correctAnswer: parsed.correctAnswer,
            explanation: parsed.explanation,
            difficulty,
            examType: [examType],
            confidence,
            source: 'ai_generated',
            alignmentWarning,
          });
        }
      }
      const errText = await fallbackResponse.text().catch(() => '');
      lastError = `All providers failed. Last error: ${errText.substring(0, 200)}`;
    }

    // Backoff before Gemini
    await new Promise((r) => setTimeout(r, 1000));

    // Gemini provider (Google AI Studio free tier: 1,500 req/day)
    if (GEMINI_API_KEY) {
      const geminiModel = 'gemini-2.0-flash';
      console.log('[GENERATE] trying Gemini:', geminiModel);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`;
      const geminiBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemMessage + '\n\n' + prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: isContentBased ? 1024 : 800,
        },
      };
      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = content.replace(/```(?:json)?\s*/gi, '').trim();
        const parsed = parseResponse(cleaned);
        if (parsed) {
          const alignmentWarning = parsed.topic !== topic || parsed.subject !== subject;
          const confidence = difficulty === 'easy' ? 88 : difficulty === 'medium' ? 82 : 75;
          console.log('[GENERATE] Gemini succeeded');
          return corsResponse({
            subject: parsed.subject,
            topic: parsed.topic,
            subtopic: parsed.subtopic,
            question: parsed.question,
            options: parsed.options,
            correctAnswer: parsed.correctAnswer,
            explanation: parsed.explanation,
            difficulty,
            examType: [examType],
            confidence,
            source: 'ai_generated',
            alignmentWarning,
          });
        }
      }
      const errText = await geminiResponse.text().catch(() => '');
      lastError = `All providers failed. Last error: ${errText.substring(0, 200)}`;
    }

    return corsResponse({ error: lastError || 'All models failed' }, 502);
  } catch (err) {
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
