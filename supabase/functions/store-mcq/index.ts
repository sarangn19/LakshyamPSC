import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/// Canonical taxonomy derived from syllabus.ts (18 subjects with topic sets)
const CANONICAL: Record<string, Set<string>> = {
  'Arts, Sports & Culture': new Set(['Classical & Ritualistic Art Forms', 'Folk & Traditional Arts', 'Malayalam Cinema', 'Sports & Athletics']),
  'Civics & Public Administration': new Set(['Bureaucracy & Administrative Machinery', 'Digital Governance & E-Governance', 'Social Welfare & Public Policy']),
  'Constitution': new Set(['Constitutional Framework', 'Fundamental Rights', 'Directive Principles & Fundamental Duties', 'Union Executive', 'Union Legislature', 'Judiciary', 'State Executive & Legislature', 'Federal System & Local Government', 'Constitutional Bodies']),
  'Current Affairs': new Set(['Kerala News', 'National News', 'International News', 'Science & Technology', 'Sports']),
  'English': new Set(['Grammar', 'Vocabulary', 'Reading Comprehension & Writing']),
  'Geography': new Set(['Physical Geography (World)', 'Geophysical Phenomena', 'Physiography of India', 'Indian River Systems', 'Climate of India', 'Kerala Geography']),
  'Indian Economy': new Set(['National Income & Macroeconomic Indicators', 'Banking & Monetary Policy', 'Public Finance & Fiscal System', 'Sectors of Indian Economy', 'Planning & Development']),
  'Indian History & National Movement': new Set(['Ancient India', 'Medieval India', 'British Rule & Early Struggles', 'Indian National Movement']),
  'Information Technology & Cyber Laws': new Set(['Computer Hardware & Architecture', 'Software & Operating Systems', 'Networks & Internet', 'Web Technologies & Languages', 'Cyber Security & Threats', 'IT Act & Legal Frameworks']),
  'Kerala Economy': new Set(['Kerala Model of Development', 'Socio-Economic Safety Networks', 'Kerala Fiscal & Industrial Landscape']),
  'Kerala History': new Set(['Ancient Kerala', 'Medieval Kerala', 'Arrival of Europeans & Early Resistance', 'Modern Kerala', 'Cultural History']),
  'Malayalam': new Set(['Grammar (വ്യാകരണം)', 'Literature (സാഹിത്യം)', 'Poetry (കവിത)', 'Prose & Drama (ഗദ്യവും നാടകവും)']),
  'Mental Ability': new Set(['Series & Patterns', 'Analogy & Classification', 'Coding & Decoding', 'Blood Relations & Direction Sense', 'Syllogisms & Venn Diagrams', 'Clock, Calendar & Miscellaneous']),
  'Quantitative Aptitude': new Set(['Number System & Basic Operations', 'Arithmetic', 'Time, Speed, Distance & Work', 'Mensuration', 'Algebra & Progressions', 'Data Interpretation']),
  'Renaissance': new Set(['Social Reform Movements', 'Temple Entry Movement', 'Major Agitations & Structural Protests', 'Literary Renaissance']),
  'Science': new Set(['Physics — Mechanics & Properties of Matter', 'Physics — Light, Sound, Heat & Electronics', 'Chemistry — Atomic Structure & Periodicity', 'Chemistry — Acids, Bases & Chemical Reactions', 'Biology — Human Physiology', 'Biology — Biochemistry, Nutrition & Diseases', 'Biology — Plant Physiology & Ecology', 'Environmental Science & Waste Management']),
  'Special Acts & Social Welfare': new Set(['Human Rights & Civil Rights', 'Gender & Child Welfare', 'Transparency & Anti-Corruption']),
  'World History': new Set(['Great Revolutions', 'World Wars & International Alliances']),
};

const SUBJECT_SYNONYMS = new Map([
  ['Polity', 'Constitution'],
  ['Indian History', 'Indian History & National Movement'],
  ['Social Science', 'Civics & Public Administration'],
  ['General Science', 'Science'],
  ['Indian Constitution', 'Constitution'],
  ['Mathematics', 'Quantitative Aptitude'],
  ['General Knowledge', 'Current Affairs'],
  ['GK', 'Current Affairs'],
]);

const TOPIC_SYNONYMS = new Map<string, string>([
  // Polity -> Constitution
  ['Constitution', 'Constitutional Framework'],
  ['Directive Principles', 'Directive Principles & Fundamental Duties'],
  ['Parliament', 'Union Legislature'],
  ['President', 'Union Executive'],
  // Indian History -> Indian History & National Movement
  ['Modern India', 'British Rule & Early Struggles'],
  ['Freedom Movement', 'Indian National Movement'],
  // Geography
  ['Continents and Oceans', 'Physical Geography (World)'],
  ['World Geography', 'Physical Geography (World)'],
  ['Geographical Features', 'Physical Geography (World)'],
  ['Physical Geography', 'Physical Geography (World)'],
  // Indian Constitution
  ['General', 'Constitutional Framework'], // default mapping for general/generic topics
  // Science
  ['General', 'Environmental Science & Waste Management'],
  ['Physics', 'Physics — Mechanics & Properties of Matter'],
  ['Chemistry', 'Chemistry — Atomic Structure & Periodicity'],
  ['Biology', 'Biology — Human Physiology'],
  // Mental Ability
  ['Logical Reasoning', 'Analogy & Classification'],
  // Quantitative Aptitude
  ['General', 'Number System & Basic Operations'],
  // Current Affairs
  ['General', 'Kerala News'],
  // Malayalam
  ['Grammar', 'Grammar (വ്യാകരണം)'],
  ['Literature', 'Literature (സാഹിത്യം)'],
]);

const REJECTED_SUBJECTS = new Set(['Test', 'Test Subject', 'Unknown']);

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

    const { questionText, options, correctAnswer, explanation, subject, topic, subtopic, difficulty, examType, language, sourceType, sourceNoteId, tags, userId } = await req.json();

    if (!questionText || !options || correctAnswer === undefined || !subject || !topic || !difficulty || !examType) {
      return corsResponse({ error: 'Missing required fields' }, 400);
    }

    // Quality checks
    if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
      return corsResponse({ error: 'Options must be an array of 2-6 items' }, 400);
    }
    const uniqueOptions = new Set(options.map((o: string) => o.trim().toLowerCase()));
    if (uniqueOptions.size !== options.length) {
      return corsResponse({ error: 'Duplicate options detected' }, 400);
    }
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return corsResponse({ error: 'Invalid correctAnswer index' }, 400);
    }
    if (!explanation || explanation.trim().length < 5) {
      return corsResponse({ error: 'Explanation too short or missing' }, 400);
    }

    // Taxonomy validation
    const rawSubject = (subject as string || '').trim();
    const rawTopic = (topic as string || '').trim();

    if (REJECTED_SUBJECTS.has(rawSubject)) {
      return corsResponse({ error: `Rejected subject "${rawSubject}" is not a valid PSC category` }, 400);
    }

    const mappedSubject = SUBJECT_SYNONYMS.get(rawSubject) || rawSubject;
    const validTopics = CANONICAL[mappedSubject];
    if (!validTopics) {
      return corsResponse({ error: `Unknown subject "${rawSubject}". Must be one of: ${Object.keys(CANONICAL).sort().join(', ')}` }, 400);
    }

    // First try exact topic match before applying synonyms
    const mappedTopic = validTopics.has(rawTopic) ? rawTopic : (TOPIC_SYNONYMS.get(rawTopic) || rawTopic);
    if (!validTopics.has(mappedTopic)) {
      return corsResponse({
        error: `Unknown topic "${rawTopic}" for subject "${mappedSubject}". Valid topics: ${[...validTopics].sort().join(', ')}`,
      }, 400);
    }

    // Compute hash for dedup
    const hashBytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(questionText + JSON.stringify(options)),
    );
    const hash = Array.from(new Uint8Array(hashBytes))
      .map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);

    // Check for duplicate
    const { data: existing } = await supabase
      .from('question_bank_mcqs')
      .select('id')
      .eq('question_hash', hash)
      .maybeSingle();

    if (existing) {
      return corsResponse({ success: true, data: { id: existing.id }, duplicate: true });
    }

    const ALLOWED_SOURCE_TYPES = ['ai_generated', 'user_created', 'admin_uploaded'];
    const safeSourceType = ALLOWED_SOURCE_TYPES.includes(sourceType) ? sourceType : 'ai_generated';

    const { data, error } = await supabase
      .from('question_bank_mcqs')
      .insert({
        question_text: questionText,
        options: options,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        subject: mappedSubject,
        topic: mappedTopic,
        subtopic: subtopic || null,
        difficulty,
        exam_type: examType,
        exam_types: [examType],
        language: language || 'en',
        source_type: safeSourceType,
        source: sourceType === 'admin_uploaded' ? 'ai_generated' : (sourceType || 'ai_generated'),
        question_hash: hash,
        generated_by: userId || null,
        source_note_id: sourceNoteId || null,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing MCQ:', error);
      return corsResponse({ error: 'Failed to store MCQ' }, 500);
    }

    // Fire-and-forget coverage refresh
    try { await supabase.rpc('refresh_repository_coverage'); } catch {}

    return corsResponse({ success: true, data, duplicate: false });
  } catch (error) {
    console.error('Error in store-mcq function:', error);
    return corsResponse({ error: 'Internal server error' }, 500);
  }
});
