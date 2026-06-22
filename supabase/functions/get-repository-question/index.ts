import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, serviceKey || anonKey);

  try {
    const { subject, topic, difficulty, examTypes, language, avoidIds, count = 1 } = await req.json();

    if (!subject) {
      return corsResponse({ error: 'Missing required field: subject' }, 400);
    }

    // Phase 1: Query repository for matching questions
    let query = supabase
      .from('question_bank_mcqs')
      .select('*')
      .eq('subject', subject)
      .eq('status', 'active')
      .order('usage_count', { ascending: true })
      .limit(count);

    if (topic) {
      query = query.eq('topic', topic);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (language) {
      query = query.eq('language', language);
    }
    if (examTypes && examTypes.length > 0) {
      query = query.overlaps('exam_types', examTypes);
    }
    if (avoidIds && avoidIds.length > 0) {
      query = query.not('id', 'in', `(${avoidIds.map((id: string) => `'${id}'`).join(',')})`);
    }

    const { data: questions, error: queryError } = await query;

    if (queryError) {
      console.error('[ERROR] Repository query error:', JSON.stringify(queryError));
      console.error('[ERROR] Error details:', queryError.message, queryError.code, queryError.hint);
      // Fall through to AI generation
    }

    if (questions && questions.length > 0) {
      // Repository hit — record metadata and return
      const latency = Date.now() - startTime;
      try { await supabase.from('generation_metadata').insert({
        subject,
        topic: topic || null,
        difficulty: difficulty || null,
        language: language || 'en',
        source: questions[0].source || 'ai_generated',
        result: 'repository_hit',
        latency_ms: latency,
        question_id: questions[0].id,
      }); } catch {}

      try { await supabase.rpc('increment_question_usage', { p_question_id: questions[0].id }); } catch {}

      return corsResponse({
        found: true,
        source: 'repository',
        question: {
          id: questions[0].id,
          text: questions[0].question_text,
          options: questions[0].options,
          correctAnswer: questions[0].correct_answer,
          subject: questions[0].subject,
          topic: questions[0].topic,
          subtopic: questions[0].subtopic,
          difficulty: questions[0].difficulty,
          explanation: questions[0].explanation,
          examType: questions[0].exam_types || [questions[0].exam_type],
          source: questions[0].source,
          confidence: questions[0].quality_score || 1.0,
          generatedAt: questions[0].created_at,
        },
        repositoryHit: true,
        latency,
      });
    }

    // Phase 2: Repository miss — return miss
    // Client-side resolveValidQuestion handles AI generation and fallback chain
    return corsResponse({
      found: false,
      source: 'miss',
      repositoryHit: false,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in get-repository-question:', msg);
    return corsResponse({
      found: false,
      source: 'error',
      repositoryHit: false,
      error: msg,
      latency: Date.now() - startTime,
    }, 500);
  }
});
