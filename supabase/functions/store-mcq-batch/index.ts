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

function sha256(text: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    .then((h) => Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16));
}

function validateQuestion(q: Record<string, unknown>, idx: number): string | null {
  if (!q.questionText) return `Row ${idx}: missing questionText`;
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) return `Row ${idx}: options must be array of 2-6`;
  const unique = new Set(q.options.map((o: string) => o.trim().toLowerCase()));
  if (unique.size !== q.options.length) return `Row ${idx}: duplicate options`;
  if (q.correctAnswer === undefined || q.correctAnswer === null) return `Row ${idx}: missing correctAnswer`;
  const ca = Number(q.correctAnswer);
  if (ca < 0 || ca >= q.options.length || !Number.isInteger(ca)) return `Row ${idx}: invalid correctAnswer`;
  if (!q.subject) return `Row ${idx}: missing subject`;
  if (!q.topic) return `Row ${idx}: missing topic`;
  if (!q.difficulty) return `Row ${idx}: missing difficulty`;
  if (!['easy', 'medium', 'hard'].includes(q.difficulty as string)) return `Row ${idx}: difficulty must be easy/medium/hard`;
  if (!q.examType) return `Row ${idx}: missing examType`;
  if (!q.explanation || (q.explanation as string).trim().length < 5) return `Row ${idx}: explanation too short`;
  return null;
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

    const results = { total: questions.length, stored: 0, failed: 0, duplicates: 0, errors: [] as { index: number; error: string }[] };

    // Validate all questions first
    const valid: Array<{ record: Record<string, unknown>; hash: string }> = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const validationError = validateQuestion(q, i);
      if (validationError) {
        results.failed++;
        results.errors.push({ index: i, error: validationError });
        continue;
      }
      const hash = await sha256(q.questionText + JSON.stringify(q.options));
      valid.push({ record: q, hash });
    }

    // Batch check duplicates: query existing hashes
    const hashes = valid.map((v) => v.hash);
    const { data: existingRows } = await supabase
      .from('question_bank_mcqs')
      .select('question_hash')
      .in('question_hash', hashes);

    const existingSet = new Set((existingRows || []).map((r: { question_hash: string }) => r.question_hash));

    // Filter out duplicates
    const toInsert = valid.filter((v) => !existingSet.has(v.hash));
    results.duplicates = valid.length - toInsert.length;

    if (toInsert.length === 0) {
      return corsResponse({ success: true, ...results });
    }

    // Chunked insert
    const CHUNK_SIZE = 100;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const records = chunk.map(({ record: q, hash }) => ({
        question_text: q.questionText as string,
        options: q.options as string[],
        correct_answer: Number(q.correctAnswer),
        explanation: (q.explanation as string) || null,
        subject: q.subject as string,
        topic: q.topic as string,
        subtopic: (q.subtopic as string) || null,
        difficulty: q.difficulty as string,
        exam_type: q.examType as string,
        exam_types: [q.examType as string],
        language: (q.language as string) || 'en',
        source_type: (q.sourceType as string) || 'admin_uploaded',
        source: (q.sourceType as string) || 'admin_uploaded',
        question_hash: hash,
        generated_by: userId || null,
        tags: (q.tags as string[]) || [],
      }));

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
