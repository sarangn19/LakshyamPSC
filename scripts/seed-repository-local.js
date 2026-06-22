const SUPABASE_URL = 'https://cycutcqlhpeudmaebwmb.supabase.co';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || require('fs').readFileSync('.env', 'utf-8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!ANON_KEY) { console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY not found'); process.exit(1); }

const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` };

const COVERAGE_MATRIX = [
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
  // Kerala specific (Malayalam)
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 5 },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'easy', examType: 'LDC', language: 'ml', count: 5 },
];

async function fetchJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, data: { error: text.substring(0, 200) } }; }
}

async function getExistingCount(subject, topic, difficulty) {
  const q = `subject=eq.${encodeURIComponent(subject)}&topic=eq.${encodeURIComponent(topic)}&difficulty=eq.${encodeURIComponent(difficulty)}&status=eq.active&select=count`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/question_bank_mcqs?${q}`, {
    headers: { ...HEADERS, 'Accept': 'application/json' },
  });
  if (!res.ok) return 0;
  const body = await res.json();
  return body.length || 0;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateQuestion(job, attempt = 1) {
  const body = {
    subject: job.subject,
    topic: job.topic,
    difficulty: job.difficulty,
    examType: job.examType,
    language: job.language,
    focusInstruction: `Generate a ${job.difficulty} question about ${job.topic} in ${job.subject}.`,
    topicConstraint: `The question MUST be about "${job.topic}" within subject "${job.subject}". Return a valid JSON object.`,
  };
  const { ok, status, data } = await fetchJson(
    `${SUPABASE_URL}/functions/v1/generate-question`,
    body
  );
  if (!ok) {
    if ((status === 429 || status === 502) && attempt < 3) {
      const delay = 5000 * attempt;
      console.log(`  [${job.subject}/${job.topic}] HTTP ${status}, retry ${attempt}/${3} after ${delay}ms`);
      await sleep(delay);
      return generateQuestion(job, attempt + 1);
    }
    return null;
  }
  if (data.error) {
    console.log(`  [${job.subject}/${job.topic}] API error: ${data.error}`);
    return null;
  }
  return data;
}

async function storeBatch(questions) {
  const batch = {
    questions: questions.map(q => ({
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      subject: q.subject,
      topic: q.topic,
      subtopic: q.subtopic || null,
      difficulty: q.difficulty,
      examType: q.examType || 'LDC',
      language: q.language || 'en',
      explanation: q.explanation || '',
      sourceType: 'ai_generated',
      tags: [q.subject, q.topic],
    }))
  };
  const { ok, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/store-mcq-batch`, batch);
  if (!ok) {
    console.error(`  Batch store failed: ${JSON.stringify(data)}`);
    return false;
  }
  return data;
}

async function run() {
  console.log(`Coverage matrix: ${COVERAGE_MATRIX.length} jobs`);
  let totalGenerated = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let pendingBatch = [];

  async function flushBatch() {
    if (pendingBatch.length === 0) return;
    const result = await storeBatch(pendingBatch);
    if (result) {
      console.log(`  Stored batch: ${result.stored || 0} stored, ${result.duplicates || 0} duplicates, ${result.failed || 0} failed`);
    }
    pendingBatch = [];
  }

  for (let i = 0; i < COVERAGE_MATRIX.length; i++) {
    const job = COVERAGE_MATRIX[i];
    const existing = await getExistingCount(job.subject, job.topic, job.difficulty);
    const needed = Math.max(0, job.count - existing);
    if (needed === 0) {
      console.log(`[${i+1}/${COVERAGE_MATRIX.length}] ${job.subject}/${job.topic}/${job.difficulty} — already has ${existing}, skip`);
      totalSkipped += job.count;
      continue;
    }
    console.log(`[${i+1}/${COVERAGE_MATRIX.length}] ${job.subject}/${job.topic}/${job.difficulty} — need ${needed}, existing ${existing}`);

    let jobGenerated = 0;
    let jobFailed = 0;
    for (let q = 0; q < needed; q++) {
      const question = await generateQuestion(job);
      if (question) {
        pendingBatch.push(question);
        jobGenerated++;
        if (pendingBatch.length >= 5) {
          await flushBatch();
          await sleep(1000);
        }
      } else {
        jobFailed++;
      }
      await sleep(2000 + Math.random() * 1000);
    }

    totalGenerated += jobGenerated;
    totalFailed += jobFailed;
    console.log(`  -> ${jobGenerated} generated, ${jobFailed} failed`);
  }

  await flushBatch();

  console.log(`\nDone. Total: ${totalGenerated} generated, ${totalFailed} failed, ${totalSkipped} skipped`);
}

run().catch(console.error);
