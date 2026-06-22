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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const detail = url.searchParams.get('detail') === 'true';

    // Total stats
    const { data: stats } = await supabase.rpc('get_repository_stats').single().catch(() => ({ data: null }));

    // Coverage by subject+topic+difficulty
    const { data: coverage } = await supabase.rpc('get_repository_coverage').catch(() => ({ data: null }));

    // Topics breakdown
    const { data: topics } = await supabase.rpc('get_repository_topics').catch(() => ({ data: null }));

    // Recent generation activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentGen } = await supabase
      .from('generation_metadata')
      .select('result, count')
      .gte('created_at', sevenDaysAgo)
      .catch(() => ({ data: null }));

    // Compute AI generation frequency
    const { count: totalGenLast7d } = await supabase
      .from('generation_metadata')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)
      .catch(() => ({ count: 0 }));

    const { count: repoHitsLast7d } = await supabase
      .from('generation_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'repository_hit')
      .gte('created_at', sevenDaysAgo)
      .catch(() => ({ count: 0 }));

    const { count: aiGenLast7d } = await supabase
      .from('generation_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('result', 'ai_generated')
      .gte('created_at', sevenDaysAgo)
      .catch(() => ({ count: 0 }));

    const totalLast7d = totalGenLast7d || 0;
    const hitRate = totalLast7d > 0 ? ((repoHitsLast7d || 0) / totalLast7d) * 100 : 0;
    const aiFreq = totalLast7d > 0 ? ((aiGenLast7d || 0) / totalLast7d) * 100 : 0;

    // Build response
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
        last7Days: totalLast7d,
        repositoryHits: repoHitsLast7d || 0,
        aiGenerations: aiGenLast7d || 0,
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
