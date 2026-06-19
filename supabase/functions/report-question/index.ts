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

    const { questionId, reason, userId } = await req.json();
    if (!questionId || !reason) {
      return corsResponse({ error: 'questionId and reason are required' }, 400);
    }

    const { error } = await supabase.from('flagged_questions').insert({
      question_id: questionId,
      reason,
      reported_by: userId || null,
      status: 'pending',
    });

    if (error) {
      console.error('Error inserting flagged question:', error);
      return corsResponse({ error: 'Failed to report question' }, 500);
    }

    return corsResponse({ success: true });
  } catch (error) {
    console.error('Error in report-question function:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
