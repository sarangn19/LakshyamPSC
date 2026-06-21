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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'search';

    const examCategory = url.searchParams.get('exam_category');
    const yearFrom = url.searchParams.get('year_from') ? parseInt(url.searchParams.get('year_from')!) : null;
    const yearTo = url.searchParams.get('year_to') ? parseInt(url.searchParams.get('year_to')!) : null;
    const subject = url.searchParams.get('subject');
    const topic = url.searchParams.get('topic');
    const language = url.searchParams.get('language');
    const onlyQuizReady = url.searchParams.get('quiz_ready') === 'true';
    const onlyAnswered = url.searchParams.get('answered') === 'true';
    const search = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (action === 'topics') {
      // Most Repeated Topics
      const topLimit = parseInt(url.searchParams.get('limit') || '30');
      const { data, error } = await supabase.rpc('get_psc_top_topics', { p_limit: topLimit });
      if (error) return corsResponse({ error: error.message }, 500);
      return corsResponse({ success: true, topics: data });

    } else if (action === 'filters') {
      // Get available filter options
      const [subjects, categories, years] = await Promise.all([
        supabase.from('psc_questions').select('subject', { count: 'exact', head: false }).not('subject', 'is', null),
        supabase.from('psc_exams').select('category', { count: 'exact', head: false }).not('category', 'is', null),
        supabase.from('psc_exams').select('year', { count: 'exact', head: false }).not('year', 'is', null).order('year', { ascending: false }),
      ]);

      const { data: subjData } = await supabase.rpc('get_distinct_values', { table_name: 'psc_questions', column_name: 'subject' }).maybeSingle();
      const { data: catData } = await supabase.rpc('get_distinct_values', { table_name: 'psc_exams', column_name: 'category' }).maybeSingle();
      const { data: yearData } = await supabase.rpc('get_distinct_values', { table_name: 'psc_exams', column_name: 'year' }).maybeSingle();

      // Fallback: query distinct values directly
      const { data: subjects2 } = await supabase.from('psc_questions').select('subject').not('subject', 'is', null).limit(100);
      const { data: categories2 } = await supabase.from('psc_exams').select('category').not('category', 'is', null).limit(50);
      const { data: years2 } = await supabase.from('psc_exams').select('year').not('year', 'is', null).order('year', { ascending: false }).limit(30);

      const uniqueSubjects = [...new Set((subjects2 || []).map(s => s.subject).filter(Boolean))].sort();
      const uniqueCategories = [...new Set((categories2 || []).map(c => c.category).filter(Boolean))].sort();
      const uniqueYears = [...new Set((years2 || []).map(y => y.year).filter(y => y !== null))].sort((a, b) => b - a);

      return corsResponse({
        success: true,
        filters: {
          subjects: uniqueSubjects,
          categories: uniqueCategories,
          years: uniqueYears,
        }
      });

    } else if (action === 'session') {
      // Generate practice session from PSC corpus
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return corsResponse({ error: 'Unauthorized' }, 401);

      supabase.auth.setAuth(authHeader.replace('Bearer ', ''));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401);

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      const count = parseInt(url.searchParams.get('count') || '10');
      const includeAnswers = url.searchParams.get('reveal_answers') !== 'false';

      const { data, error } = await supabase.rpc('generate_psc_session', {
        p_profile_id: profile?.id || '00000000-0000-0000-0000-000000000000',
        p_subject: subject,
        p_topic: topic,
        p_exam_category: examCategory,
        p_count: Math.min(count, 50),
        p_include_answers: includeAnswers,
      });

      if (error) return corsResponse({ error: error.message }, 500);
      return corsResponse({ success: true, questions: data, sessionType: 'psc_pyq' });

    } else {
      // Default: search/filter questions
      const { data, error } = await supabase.rpc('get_psc_questions', {
        p_exam_category: examCategory,
        p_year_from: yearFrom,
        p_year_to: yearTo,
        p_subject: subject,
        p_topic: topic,
        p_language: language,
        p_only_quiz_ready: onlyQuizReady,
        p_only_answered: onlyAnswered,
        p_search: search,
        p_limit: Math.min(limit, 200),
        p_offset: offset,
      });

      if (error) return corsResponse({ error: error.message }, 500);

      const totalCount = data && data.length > 0 ? data[0].total_count : 0;

      return corsResponse({
        success: true,
        questions: (data || []).map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
          subject: q.subject,
          topic: q.topic,
          examName: q.exam_name,
          examCategory: q.exam_category,
          year: q.year,
          language: q.language,
          isQuizReady: q.is_quiz_ready,
          hasAnswer: q.has_answer,
        })),
        pagination: {
          total: Number(totalCount),
          limit,
          offset,
          hasMore: offset + limit < Number(totalCount),
        }
      });
    }
  } catch (error) {
    console.error('Error in psc-pyq-explorer:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
