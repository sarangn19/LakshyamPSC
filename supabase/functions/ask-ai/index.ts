import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const AI_API_KEY = Deno.env.get('AI_API_KEY') || '';
const AI_API_URL = Deno.env.get('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
const AI_MODEL = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';

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
    return corsResponse({ error: 'AI_API_KEY not configured' }, 500);
  }

  try {
    const body = await req.json();
    const { message, history, examType } = body;

    if (!message || typeof message !== 'string') {
      return corsResponse({ error: 'message is required' }, 400);
    }

    const examContext = examType || 'Kerala PSC LDC';

    const systemPrompt =
      `You are Lakshyam AI Tutor — a Kerala PSC exam preparation assistant. `
      + `You help students understand topics, answer doubts, generate practice questions, and explain concepts. `
      + `Calibrate your explanations to ${examContext} level. `
      + `Use simple language and bullet points where helpful. `
      + `If the user asks in Malayalam, respond in Malayalam. `
      + `Never mention you are an AI. Just answer naturally as a tutor. `
      + `Always structure your answers for PSC exam preparation using these sections as applicable:\n\n`
      + `## Concept\nBrief explanation of the topic.\n\n`
      + `## PSC Exam Focus\nWhat aspect is most relevant for ${examContext} exams, how questions are typically framed.\n\n`
      + `## Memory Trick\nA mnemonic or trick to remember the key point.\n\n`
      + `## Key Facts\nBullet list of essential facts to remember.\n\n`
      + `## Common Confusions\nCommon mistakes or confusions about this topic.\n\n`
      + `## Practice MCQ\nA multiple choice question with 4 options, answer, and explanation.\n\n`
      + `## Related Topics\nRelated syllabus topics the student should study next.\n\n`
      + `Only include sections that are relevant. Use "## Section Name" as heading format. `
      + `Keep the response comprehensive but exam-focused.`;

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const isOpenRouter = AI_API_URL.includes('openrouter.ai');

    const tryProvider = async (url: string, key: string, model: string, extraHeaders?: Record<string, string>): Promise<string | null> => {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...extraHeaders,
      };
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: chatMessages,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      } catch { return null; }
    };

    const primaryHeaders = isOpenRouter ? { 'HTTP-Referer': 'https://lakshyam.app', 'X-Title': 'Lakshyam' } : undefined;

    // Try 1: Primary provider
    let reply = await tryProvider(AI_API_URL, AI_API_KEY, AI_MODEL, primaryHeaders);
    if (reply) return corsResponse({ reply });

    // Try 2: Alt models on same provider
    if (isOpenRouter) {
      const altModels = ['google/gemini-2.0-flash-lite-001', 'meta-llama/llama-3.1-8b-instruct'];
      for (const model of altModels) {
        reply = await tryProvider(AI_API_URL, AI_API_KEY, model, primaryHeaders);
        if (reply) return corsResponse({ reply });
      }
    }

    // Try 3: Fallback provider
    const FB_KEY = Deno.env.get('FALLBACK_API_KEY') || '';
    const FB_URL = Deno.env.get('FALLBACK_API_URL') || '';
    const FB_MODEL = Deno.env.get('FALLBACK_MODEL') || 'meta-llama/llama-3.1-8b-instruct:free';
    if (FB_KEY && FB_URL) {
      reply = await tryProvider(FB_URL, FB_KEY, FB_MODEL);
      if (reply) return corsResponse({ reply });
    }

    // Try 4: Gemini direct
    const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';
    if (GEMINI_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;
      try {
        const geminiBody = { contents: [{ parts: [{ text: `${systemPrompt}\n\n${chatMessages.map(m => `${m.role}: ${m.content}`).join('\n\n')}\n\nReturn a clear, helpful response.` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } };
        const res = await fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) });
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) return corsResponse({ reply: text });
        }
      } catch {}
    }

    return corsResponse({ error: 'All models failed' }, 502);
  } catch (err) {
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
