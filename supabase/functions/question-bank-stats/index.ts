import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get MCQ count
    const { count: mcqCount, error: mcqError } = await supabase
      .from('question_bank_mcqs')
      .select('*', { count: 'exact', head: true });

    // Get flashcard count
    const { count: flashcardCount, error: flashcardError } = await supabase
      .from('question_bank_flashcards')
      .select('*', { count: 'exact', head: true });

    if (mcqError || flashcardError) {
      console.error('Error fetching question bank stats:', mcqError || flashcardError);
      return corsResponse({ error: 'Failed to fetch question bank stats' }, 500);
    }

    return corsResponse({ 
      success: true, 
      mcqCount: mcqCount || 0, 
      flashcardCount: flashcardCount || 0,
      totalQuestions: (mcqCount || 0) + (flashcardCount || 0)
    });
  } catch (error) {
    console.error('Error in question-bank-stats function:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
