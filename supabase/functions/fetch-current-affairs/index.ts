import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  kerala: ['kerala', 'thiruvananthapuram', 'kochi', 'kozhikode', 'malayalam'],
  national: ['india', 'parliament', 'supreme court', 'pm ', 'modi', 'central government', 'union budget'],
  appointments: ['appointed', 'chief ', 'director', 'secretary', 'governor', 'judge'],
  schemes: ['scheme', 'yojana', 'mission', 'program', 'fund'],
  awards: ['award', 'prize', 'honour', 'fellowship'],
};

function categorize(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return cat;
  }
  return 'national';
}

serve(async (req) => {
  try {
    if (!NEWS_API_KEY) {
      return new Response(JSON.stringify({ error: 'NEWS_API_KEY not set' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const topics = ['kerala', 'india politics', 'india government schemes', 'india appointments'];
    let allArticles: any[] = [];

    for (const q of topics) {
      try {
        const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&pageSize=20&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
        if (!res.ok) continue;
        const json = await res.json();
        if (json.articles) allArticles = allArticles.concat(json.articles);
      } catch {
        continue;
      }
    }

    // Dedup by URL
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      if (!a.url || seen.has(a.url)) return false;
      seen.add(a.url);
      return a.title && a.description;
    });

    // Get existing URLs from DB to avoid duplicates
    const { data: existing } = await supabase.from('current_affairs').select('url');
    const existingUrls = new Set((existing || []).map((r: any) => r.url));

    let inserted = 0;
    for (const article of unique) {
      if (existingUrls.has(article.url)) continue;

      const category = categorize(article.title, article.description);
      const publishedAt = article.publishedAt ? article.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('current_affairs').insert({
        title: article.title,
        summary: article.description,
        category,
        source: article.source?.name || 'NewsAPI',
        url: article.url,
        image_url: article.urlToImage || null,
        published_at: publishedAt,
      });

      if (!error) inserted++;
    }

    return new Response(JSON.stringify({ success: true, fetched: unique.length, inserted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
