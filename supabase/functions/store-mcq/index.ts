import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { questionText, options, correctAnswer, explanation, subject, topic, subtopic, difficulty, examType, language, sourceType, sourceNoteId, tags, userId } = await req.json();

    if (!questionText || !options || correctAnswer === undefined || !subject || !topic || !difficulty || !examType) {
      return corsResponse({ error: 'Missing required fields' }, 400);
    }

    // Quality checks
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return corsResponse({ error: 'Options must be an array of 2-6 items' }, 400);
    }
    const uniqueOptions = new Set(options.map((o: string) => o.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      return corsResponse({ error: 'Duplicate options detected' }, 400);
    }
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return corsResponse({ error: 'Invalid correctAnswer index' }, 400);
    }
    if (!explanation || explanation.trim().length < 5) {
      return corsResponse({ error: 'Explanation too short or missing' }, 400);
    }

    // Compute hash for dedup
    const hashBytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(questionText + JSON.stringify(options)),
    );
    const hash = Array.from(new Uint8Array(hashBytes))
      .map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

    // Check for duplicate
    const { data: existing } = await supabase
      .from('question_bank_mcqs')
      .select('id')
      .eq('question_hash', hash)
      .maybeSingle();

    if (existing) {
      return corsResponse({ success: true, data: { id: existing.id }, duplicate: true });
    }

    const { data, error } = await supabase
      .from('question_bank_mcqs')
      .insert({
        question_text: questionText,
        options: options,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        subject,
        topic,
        subtopic: subtopic || null,
        difficulty,
        exam_type: examType,
        exam_types: [examType],
        language: language || 'en',
        source_type: sourceType || 'ai_generated',
        source: sourceType || 'ai_generated',
        question_hash: hash,
        generated_by: userId || null,
        source_note_id: sourceNoteId || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing MCQ:', error);
      return corsResponse({ error: 'Failed to store MCQ' }, 500);
    }

    return corsResponse({ success: true, data, duplicate: false });
  } catch (error) {
    console.error('Error in store-mcq function:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
