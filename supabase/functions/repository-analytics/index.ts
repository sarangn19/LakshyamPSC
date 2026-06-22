import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
  if (req.method !== 'GET') {
    return corsResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const detail = url.searchParams.get('detail') === 'true';

    let stats = null;
    let coverage = null;
    let topics = null;
    let totalGenLast7d = 0;
    let repoHitsLast7d = 0;
    let aiGenLast7d = 0;

    try { const r = await supabase.rpc('get_repository_stats').single(); stats = r.data; } catch {}
    try { const r = await supabase.rpc('get_repository_coverage'); coverage = r.data; } catch {}
    try { const r = await supabase.rpc('get_repository_topics'); topics = r.data; } catch {}

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    try {
      const r = await supabase
        .from('generation_metadata')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);
      totalGenLast7d = (r as Record<string, unknown>).count as number || 0;
    } catch {}

    try {
      const r = await supabase
        .from('generation_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'repository_hit')
        .gte('created_at', sevenDaysAgo);
      repoHitsLast7d = (r as Record<string, unknown>).count as number || 0;
    } catch {}

    try {
      const r = await supabase
        .from('generation_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'ai_generated')
        .gte('created_at', sevenDaysAgo);
      aiGenLast7d = (r as Record<string, unknown>).count as number || 0;
    } catch {}

    const hitRate = totalGenLast7d > 0 ? (repoHitsLast7d / totalGenLast7d) * 100 : 0;
    const aiFreq = totalGenLast7d > 0 ? (aiGenLast7d / totalGenLast7d) * 100 : 0;

    const response: Record<string, unknown> = {
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalQuestions: stats?.total_questions || 0,
        subjectsCovered: stats?.subjects_covered || 0,
        topicsCovered: stats?.topics_covered || 0,
        aiGeneratedCount: stats?.ai_generated_count || 0,
        pscPyqCount: stats?.psc_pyq_count || 0,
        coverageCells: stats?.coverage_cells || 0,
      },
      coverage: coverage || [],
      hitRate: {
        last7Days: totalGenLast7d,
        repositoryHits: repoHitsLast7d,
        aiGenerations: aiGenLast7d,
        databaseHitRate: `${hitRate.toFixed(1)}%`,
        aiGenerationFrequency: `${aiFreq.toFixed(1)}%`,
      },
    };

    if (detail && topics) {
      response.topics = topics;
    }

    return corsResponse(response);
  } catch (error) {
    console.error('Error in repository-analytics:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});