import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const AI_API_KEY = Deno.env.get('AI_API_KEY') || '';
const AI_API_URL = Deno.env.get('AI_API_URL') || 'https://api.groq.com/openai/v1/chat/completions';
const AI_MODEL = Deno.env.get('AI_MODEL') || 'llama-3.1-8b-instant';

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
      + `Keep answers concise but thorough (2-5 paragraphs). `
      + `Use simple language and bullet points where helpful. `
      + `If the user asks in Malayalam, respond in Malayalam. `
      + `If the user asks for MCQs, generate 4 options with the correct answer marked. `
      + `Never mention you are an AI. Just answer naturally as a tutor.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role === 'ai' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    console.log('[ASK-AI] sending to model:', AI_MODEL);

    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return corsResponse({ error: `AI API error: ${response.status} ${errText}` }, 502);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return corsResponse({ reply });
  } catch (err) {
    return corsResponse({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
