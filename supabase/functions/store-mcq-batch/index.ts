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
    const { questions, userId } = await req.json();
    if (!Array.isArray(questions) || questions.length === 0) {
      return corsResponse({ error: 'questions must be a non-empty array' }, 400);
    }
    const CHUNK_SIZE = 100;
    const results = { total: questions.length, stored: 0, failed: 0, errors: [] as { index: number; error: string }[] };
    for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
      const chunk = questions.slice(i, i + CHUNK_SIZE);
      const records = chunk.map((q: Record<string, unknown>, idx: number) => {
        const {
          questionText, options, correctAnswer, explanation, subject, topic,
          subtopic, difficulty, examType, language, sourceType, tags,
        } = q as Record<string, unknown>;
        const missing: string[] = [];
        if (!questionText) missing.push('questionText');
        if (!options) missing.push('options');
        if (correctAnswer === undefined || correctAnswer === null) missing.push('correctAnswer');
        if (!subject) missing.push('subject');
        if (!topic) missing.push('topic');
        if (!difficulty) missing.push('difficulty');
        if (!examType) missing.push('examType');
        if (missing.length > 0) {
          throw new Error(`Row ${i + idx}: missing ${missing.join(', ')}`);
        }
        return {
          question_text: questionText as string,
          options: options as string[],
          correct_answer: Number(correctAnswer),
          explanation: (explanation as string) || null,
          subject: subject as string,
          topic: topic as string,
          subtopic: (subtopic as string) || null,
          difficulty: difficulty as string,
          exam_type: examType as string,
          language: (language as string) || 'en',
          source_type: (sourceType as string) || 'admin_uploaded',
          generated_by: userId || null,
          tags: (tags as string[]) || [],
        };
      });
      const { data, error } = await supabase.from('question_bank_mcqs').insert(records).select('id');
      if (error) {
        results.failed += chunk.length;
        results.errors.push({ index: i, error: error.message });
      } else {
        results.stored += (data || []).length;
      }
    }
    return corsResponse({ success: true, ...results });
  } catch (error) {
    console.error('Error in store-mcq-batch:', error);
    return corsResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
