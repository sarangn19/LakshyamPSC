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

const CANONICAL = new Map<string, Set<string>>([
  ['Kerala History', new Set(['Ancient Kerala', 'Medieval Kerala', 'Arrival of Europeans & Early Resistance', 'Modern Kerala', 'Cultural History'])],
  ['Renaissance', new Set(['Social Reform Movements', 'Temple Entry Movement', 'Major Agitations & Structural Protests', 'Literary Renaissance'])],
  ['Constitution', new Set(['Constitutional Framework', 'Fundamental Rights', 'Directive Principles & Fundamental Duties', 'Union Executive', 'Union Legislature', 'Judiciary', 'State Executive & Legislature', 'Federal System & Local Government', 'Constitutional Bodies'])],
  ['Geography', new Set(['Physical Geography (World)', 'Geophysical Phenomena', 'Physiography of India', 'Indian River Systems', 'Climate of India', 'Kerala Geography'])],
  ['Current Affairs', new Set(['Kerala News', 'National News', 'International News', 'Science & Technology', 'Sports'])],
  ['Science', new Set(['Physics \u2014 Mechanics & Properties of Matter', 'Physics \u2014 Light, Sound, Heat & Electronics', 'Chemistry \u2014 Atomic Structure & Periodicity', 'Chemistry \u2014 Acids, Bases & Chemical Reactions', 'Biology \u2014 Human Physiology', 'Biology \u2014 Biochemistry, Nutrition & Diseases', 'Biology \u2014 Plant Physiology & Ecology', 'Environmental Science & Waste Management'])],
  ['Quantitative Aptitude', new Set(['Number System & Basic Operations', 'Arithmetic', 'Time, Speed, Distance & Work', 'Mensuration', 'Algebra & Progressions', 'Data Interpretation'])],
  ['Mental Ability', new Set(['Series & Patterns', 'Analogy & Classification', 'Coding & Decoding', 'Blood Relations & Direction Sense', 'Syllogisms & Venn Diagrams', 'Clock, Calendar & Miscellaneous'])],
  ['Malayalam', new Set(['Grammar (\u0d35\u0d4d\u0d2f\u0d3e\u0d15\u0d30\u0d23\u0d02)', 'Literature (\u0d38\u0d3e\u0d39\u0d3f\u0d24\u0d4d\u0d2f\u0d02)', 'Poetry (\u0d15\u0d35\u0d3f\u0d24)', 'Prose & Drama (\u0d17\u0d26\u0d4d\u0d2f\u0d35\u0d41\u0d02 \u0d28\u0d3e\u0d1f\u0d15\u0d35\u0d41\u0d02)'])],
  ['Indian History & National Movement', new Set(['Ancient India', 'Medieval India', 'British Rule & Early Struggles', 'Indian National Movement'])],
  ['World History', new Set(['Great Revolutions', 'World Wars & International Alliances'])],
  ['Civics & Public Administration', new Set(['Bureaucracy & Administrative Machinery', 'Digital Governance & E-Governance', 'Social Welfare & Public Policy'])],
  ['Indian Economy', new Set(['National Income & Macroeconomic Indicators', 'Banking & Monetary Policy', 'Public Finance & Fiscal System', 'Sectors of Indian Economy', 'Planning & Development'])],
  ['Kerala Economy', new Set(['Kerala Model of Development', 'Socio-Economic Safety Networks', 'Kerala Fiscal & Industrial Landscape'])],
  ['Information Technology & Cyber Laws', new Set(['Computer Hardware & Architecture', 'Software & Operating Systems', 'Networks & Internet', 'Web Technologies & Languages', 'Cyber Security & Threats', 'IT Act & Legal Frameworks'])],
  ['English', new Set(['Grammar', 'Vocabulary', 'Reading Comprehension & Writing'])],
  ['Arts, Sports & Culture', new Set(['Classical & Ritualistic Art Forms', 'Folk & Traditional Arts', 'Malayalam Cinema', 'Sports & Athletics'])],
  ['Special Acts & Social Welfare', new Set(['Human Rights & Civil Rights', 'Gender & Child Welfare', 'Transparency & Anti-Corruption'])],
]);

const SUBJECT_SYNONYMS = new Map<string, string>([
  ['Polity', 'Constitution'],
  ['Indian History', 'Indian History & National Movement'],
  ['Social Science', 'Civics & Public Administration'],
  ['General Science', 'Science'],
  ['Indian Constitution', 'Constitution'],
  ['Mathematics', 'Quantitative Aptitude'],
  ['General Knowledge', 'Current Affairs'],
]);

const TOPIC_SYNONYMS = new Map<string, string>([
  ['Constitution', 'Constitutional Framework'],
  ['Directive Principles', 'Directive Principles & Fundamental Duties'],
  ['Parliament', 'Union Legislature'],
  ['President', 'Union Executive'],
  ['Freedom Movement', 'Indian National Movement'],
  ['Modern India', 'British Rule & Early Struggles'],
  ['General', 'General'],
]);

const REJECTED_SUBJECTS = new Set<string>(['Test']);

interface ValidateResult {
  error?: string;
  subject?: string;
  topic?: string;
}

function validateTaxonomy(q: Record<string, unknown>): ValidateResult {
  const rawSubject = (q.subject as string || '').trim();
  const rawTopic = (q.topic as string || '').trim();

  if (REJECTED_SUBJECTS.has(rawSubject)) {
    return { error: `Rejected subject "${rawSubject}" is not a valid PSC category` };
  }

  const subject = SUBJECT_SYNONYMS.get(rawSubject) || rawSubject;
  const topic = rawSubject === rawSubject
    ? (TOPIC_SYNONYMS.get(rawTopic) || rawTopic)
    : rawTopic;

  const validTopics = CANONICAL.get(subject);
  if (!validTopics) {
    return { error: `Unknown subject "${rawSubject}" (not found in canonical syllabus). Use one of: ${[...CANONICAL.keys()].join(', ')}` };
  }

  if (!validTopics.has(topic)) {
    return { error: `Unknown topic "${rawTopic}" for subject "${subject}". Valid topics: ${[...validTopics].join(', ')}` };
  }

  return { subject, topic };
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

  const taxResult = validateTaxonomy(q);
  if (taxResult.error) return `Row ${idx}: ${taxResult.error}`;

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

    // Validate all questions first (includes taxonomy validation)
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
      // Canonicalize subject/topic
      const rawSubject = (q.subject as string || '').trim();
      const rawTopic = (q.topic as string || '').trim();
      q.subject = SUBJECT_SYNONYMS.get(rawSubject) || rawSubject;
      q.topic = TOPIC_SYNONYMS.get(rawTopic) || rawTopic;
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
        source: (q.sourceType as string) === 'admin_uploaded' ? 'ai_generated' : ((q.sourceType as string) || 'ai_generated'),
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

    // Refresh materialized view
    try { await supabase.rpc('refresh_repository_coverage'); } catch {} // fire-and-forget

    return corsResponse({ success: true, ...results });
  } catch (error) {
    console.error('Error in store-mcq-batch:', error);
    return corsResponse({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});
