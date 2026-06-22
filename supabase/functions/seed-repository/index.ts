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

interface SeedJob {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examType: string;
  language: 'en' | 'ml';
  count: number;
}

// NOTE: COVERAGE_MATRIX uses pre-migration taxonomy names (Polity, Indian History, etc.).
// generate-question now validates against canonical taxonomy (18 subjects), so running this
// with outdated names will fail. Update matrix to canonical names before running.
// AI API keys also expired — this function requires working AI generation.
const COVERAGE_MATRIX: SeedJob[] = [
  // Kerala History
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Medieval Kerala', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Medieval Kerala', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'hard', examType: 'Degree Level', language: 'en', count: 5 },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Indian History
  { subject: 'Indian History', topic: 'Ancient India', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Ancient India', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Medieval India', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Medieval India', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Modern India', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Modern India', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Freedom Movement', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Indian History', topic: 'Freedom Movement', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Polity
  { subject: 'Polity', topic: 'Constitution', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Constitution', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Constitution', difficulty: 'hard', examType: 'Degree Level', language: 'en', count: 5 },
  { subject: 'Polity', topic: 'Fundamental Rights', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Fundamental Rights', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Directive Principles', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Parliament', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Parliament', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'President', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'President', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Judiciary', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Polity', topic: 'Judiciary', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Geography
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Geography', topic: 'Kerala Geography', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Geography', topic: 'Kerala Geography', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Geography', topic: 'World Geography', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Geography', topic: 'World Geography', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Science
  { subject: 'Science', topic: 'Physics', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Physics', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Biology', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Biology', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Science', topic: 'Biology', difficulty: 'hard', examType: 'Degree Level', language: 'en', count: 5 },
  // Social Science
  { subject: 'Social Science', topic: 'Economics', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Social Science', topic: 'Economics', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Social Science', topic: 'Civics', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Social Science', topic: 'Civics', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Malayalam
  { subject: 'Malayalam', topic: 'Grammar', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 10 },
  { subject: 'Malayalam', topic: 'Grammar', difficulty: 'medium', examType: 'LDC', language: 'ml', count: 10 },
  { subject: 'Malayalam', topic: 'Literature', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 10 },
  { subject: 'Malayalam', topic: 'Literature', difficulty: 'medium', examType: 'LDC', language: 'ml', count: 10 },
  // English
  { subject: 'English', topic: 'Grammar', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'English', topic: 'Grammar', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'English', topic: 'Vocabulary', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  // Mental Ability
  { subject: 'Mental Ability', topic: 'Analogy', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mental Ability', topic: 'Analogy', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mental Ability', topic: 'Blood Relations', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mental Ability', topic: 'Blood Relations', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mental Ability', topic: 'Logical Reasoning', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mental Ability', topic: 'Logical Reasoning', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Mathematics
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'hard', examType: 'LDC', language: 'en', count: 5 },
  { subject: 'Mathematics', topic: 'Geometry', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Mathematics', topic: 'Geometry', difficulty: 'medium', examType: 'LDC', language: 'en', count: 10 },
  // Current Affairs
  { subject: 'Current Affairs', topic: 'Kerala News', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'Current Affairs', topic: 'National News', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  // General Knowledge
  { subject: 'General Knowledge', topic: 'Books and Authors', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'General Knowledge', topic: 'Books and Authors', difficulty: 'medium', examType: 'LDC', language: 'en', count: 5 },
  { subject: 'General Knowledge', topic: 'Awards and Honours', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'General Knowledge', topic: 'Awards and Honours', difficulty: 'medium', examType: 'LDC', language: 'en', count: 5 },
  { subject: 'General Knowledge', topic: 'Sports', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'General Knowledge', topic: 'Sports', difficulty: 'medium', examType: 'LDC', language: 'en', count: 5 },
  { subject: 'General Knowledge', topic: 'First in India', difficulty: 'easy', examType: 'LDC', language: 'en', count: 10 },
  { subject: 'General Knowledge', topic: 'First in India', difficulty: 'medium', examType: 'LDC', language: 'en', count: 5 },
  // Kerala specific
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 5 },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 5 },
];

async function generateJob(
  supabase: ReturnType<typeof createClient>,
  job: SeedJob,
): Promise<{ generated: number; failed: number; skipped: number }> {
  let generated = 0;
  let failed = 0;
  let skipped = 0;

  // Check existing count for this cell
  const { count: existingCount } = await supabase
    .from('question_bank_mcqs')
    .select('*', { count: 'exact', head: true })
    .eq('subject', job.subject)
    .eq('topic', job.topic)
    .eq('difficulty', job.difficulty)
    .eq('status', 'active');

  if (existingCount && existingCount >= job.count) {
    return { generated: 0, failed: 0, skipped: job.count };
  }

  const needed = Math.max(1, job.count - (existingCount || 0));

  for (let i = 0; i < needed; i++) {
    try {
      // Rate limit: one request per 1.5s
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1500));
      }

      const genRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-question`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            subject: job.subject,
            topic: job.topic,
            difficulty: job.difficulty,
            examType: job.examType,
            language: job.language,
            focusInstruction: `Generate a ${job.difficulty} question about ${job.topic} in ${job.subject}.`,
            topicConstraint: `The question MUST be about "${job.topic}" within subject "${job.subject}". Return a valid JSON object.`,
          }),
        },
      );

      if (!genRes.ok) {
        const errText = await genRes.text().catch(() => '');
        console.error(`Seed generation failed for ${job.subject}/${job.topic}: HTTP ${genRes.status} ${errText.substring(0, 200)}`);
        failed++;
        continue;
      }

      const data = await genRes.json();
      if (data.error) {
        failed++;
        continue;
      }

      // Compute hash for dedup
      const hashBytes = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(data.question + JSON.stringify(data.options || [])),
      );
      const hash = Array.from(new Uint8Array(hashBytes))
        .map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

      // Check duplicate
      const { data: existing } = await supabase
        .from('question_bank_mcqs')
        .select('id')
        .eq('question_hash', hash)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('question_bank_mcqs')
        .insert({
          question_text: data.question,
          options: data.options || [],
          correct_answer: data.correctAnswer,
          explanation: data.explanation || '',
          subject: data.subject || job.subject,
          topic: data.topic || job.topic,
          subtopic: data.subtopic || null,
          difficulty: job.difficulty,
          exam_type: job.examType,
          exam_types: [job.examType, 'LDC'],
          language: job.language,
          source_type: 'ai_generated',
          source: 'ai_generated',
          question_hash: hash,
          quality_score: data.confidence || 80,
          tags: [job.subject, job.topic],
        });

      if (insertError) {
        console.error(`Insert error: ${insertError.message}`);
        failed++;
      } else {
        generated++;
      }
    } catch (err) {
      console.error(`Seed job error for ${job.subject}/${job.topic}:`, err);
      failed++;
    }
  }

  return { generated, failed, skipped };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return corsResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.json().catch(() => ({}));
  const jobs = body.jobs || COVERAGE_MATRIX;
  const parallel = Math.min(body.parallel || 3, 5);

  console.log(`Seed repository: ${jobs.length} jobs, parallelism=${parallel}`);

  const results: Array<{ job: SeedJob; generated: number; failed: number; skipped: number }> = [];

  // Process jobs sequentially with interleaved parallelism
  for (let i = 0; i < jobs.length; i += parallel) {
    const batch = jobs.slice(i, i + parallel);
    const batchResults = await Promise.all(
      batch.map(async (job: SeedJob) => {
        const r = await generateJob(supabase, job);
        return { job, ...r };
      }),
    );
    results.push(...batchResults);

    const totalSoFar = results.reduce((s, r) => s + r.generated, 0);
    console.log(`Progress: ${Math.min(i + parallel, jobs.length)}/${jobs.length} jobs, ${totalSoFar} questions generated`);
  }

  const totals = results.reduce(
    (s, r) => ({
      generated: s.generated + r.generated,
      failed: s.failed + r.failed,
      skipped: s.skipped + r.skipped,
    }),
    { generated: 0, failed: 0, skipped: 0 },
  );

  return corsResponse({
    success: true,
    totals,
    jobsCompleted: results.length,
    results: results.map((r) => ({
      subject: r.job.subject,
      topic: r.job.topic,
      difficulty: r.job.difficulty,
      generated: r.generated,
      failed: r.failed,
      skipped: r.skipped,
    })),
  });
});
