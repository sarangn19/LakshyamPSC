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

    // Validate required fields
    if (!questionText || !options || correctAnswer === undefined || !subject || !topic || !difficulty || !examType) {
      return corsResponse({ error: 'Missing required fields' }, 400);
    }

    // Store the MCQ in the database
    const { data, error } = await supabase
      .from('question_bank_mcqs')
      .insert({
        question_text: questionText,
        options: options,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        subject: subject,
        topic: topic,
        subtopic: subtopic || null,
        difficulty: difficulty,
        exam_type: examType,
        language: language || 'en',
        source_type: sourceType || 'ai_generated',
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

    return corsResponse({ success: true, data });
  } catch (error) {
    console.error('Error in store-mcq function:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
