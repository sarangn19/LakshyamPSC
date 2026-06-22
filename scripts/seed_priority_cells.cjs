const SUPABASE_URL = 'https://cycutcqlhpeudmaebwmb.supabase.co';
const ANON_KEY = require('fs').readFileSync('.env', 'utf-8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
if (!ANON_KEY) { console.error('ANON_KEY not found'); process.exit(1); }
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` };

async function fetchJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, data: { error: text.substring(0, 200) } }; }
}

const PRIORITY_CELLS = [
  { subject: 'Renaissance',               topic: 'Literary Renaissance',                       difficulty: 'easy',   need: 4 },
  { subject: 'Constitution',               topic: 'Constitutional Bodies',                      difficulty: 'easy',   need: 4 },
  { subject: 'Indian Constitution',        topic: 'General',                                    difficulty: 'easy',   need: 4 },
  { subject: 'Renaissance',                topic: 'Major Agitations & Structural Protests',     difficulty: 'easy',   need: 2 },
  { subject: 'Constitution',               topic: 'State Executive & Legislature',              difficulty: 'easy',   need: 3 },
  { subject: 'Constitution',               topic: 'Directive Principles & Fundamental Duties',  difficulty: 'easy',   need: 2 },
  { subject: 'Constitution',               topic: 'Judiciary',                                  difficulty: 'easy',   need: 2 },
  { subject: 'Constitution',               topic: 'Union Legislature',                          difficulty: 'easy',   need: 2 },
  { subject: 'Quantitative Aptitude',      topic: 'Algebra & Progressions',                    difficulty: 'easy',   need: 4 },
  { subject: 'Science',                    topic: 'Biology \u2014 Biochemistry, Nutrition & Diseases', difficulty: 'easy',   need: 3 },
  { subject: 'Geography',                  topic: 'General',                                    difficulty: 'hard',   need: 3 },
  { subject: 'Geography',                  topic: 'Geographical Features',                      difficulty: 'medium', need: 3 },
  { subject: 'Quantitative Aptitude',      topic: 'Data Interpretation',                        difficulty: 'medium', need: 3 },
  { subject: 'Quantitative Aptitude',      topic: 'Mensuration',                                difficulty: 'easy',   need: 3 },
  { subject: 'General Science',            topic: 'General',                                    difficulty: 'hard',   need: 2 },
  { subject: 'Science',                    topic: 'Biology \u2014 Plant Physiology & Ecology',         difficulty: 'easy',   need: 2 },
  { subject: 'Science',                    topic: 'Environmental Science & Waste Management',    difficulty: 'easy',   need: 2 },
  { subject: 'Geography',                  topic: 'Geophysical Phenomena',                      difficulty: 'easy',   need: 2 },
  { subject: 'Geography',                  topic: 'Indian River Systems',                       difficulty: 'easy',   need: 2 },
  { subject: 'Mental Ability',             topic: 'Clock, Calendar & Miscellaneous',            difficulty: 'easy',   need: 4 },
];

const totalNeeded = PRIORITY_CELLS.reduce((s, c) => s + c.need, 0);

async function main() {
console.log('=== Priority Cell Seed Run ===');
console.log(`Date: ${new Date().toISOString()}`);
console.log(`Cells: ${PRIORITY_CELLS.length}, Questions needed: ${totalNeeded}`);
console.log('');

async function generateOne(subject, topic, difficulty) {
  const body = {
    subject, topic, difficulty,
    examType: 'LDC', language: 'en',
    focusInstruction: `Generate a ${difficulty} question about "${topic}" in ${subject} for Kerala PSC LDC exam.`,
    topicConstraint: `The question MUST specifically address "${topic}" within subject "${subject}".`,
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { ok, status, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/generate-question`, body);
    if (ok && data && !data.error) return data;
    if (status === 429 || status === 502 || status === 503) {
      console.log(`    retry ${attempt}/3 (HTTP ${status}, wait ${attempt * 5}s)`);
      await new Promise(r => setTimeout(r, attempt * 5000));
    } else {
      return null;
    }
  }
  return null;
}

async function storeOne(q, subject, topic, difficulty) {
  const batch = {
    questions: [{
      questionText: q.question, options: q.options, correctAnswer: q.correctAnswer,
      subject: q.subject || subject, topic: q.topic || topic, subtopic: q.subtopic || null,
      difficulty, examType: 'LDC', language: 'en', explanation: q.explanation || '',
      sourceType: 'ai_generated', tags: [subject, topic],
    }]
  };
  const { ok, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/store-mcq-batch`, batch);
  return ok && data ? data : null;
}

let totalGen = 0, totalFail = 0, totalSkip = 0;
const genLog = [];

for (let i = 0; i < PRIORITY_CELLS.length; i++) {
  const cell = PRIORITY_CELLS[i];
  let generated = 0, failed = 0, skipped = 0;

  console.log(`[${i+1}/${PRIORITY_CELLS.length}] ${cell.subject}/${cell.topic}/${cell.difficulty} (need ${cell.need})`);

  for (let q = 0; q < cell.need; q++) {
    process.stdout.write(`  q${q+1}/${cell.need}... `);
    const question = await generateOne(cell.subject, cell.topic, cell.difficulty);
    if (!question) {
      console.log('GENERATE FAILED');
      failed++;
      continue;
    }
    const stored = await storeOne(question, cell.subject, cell.topic, cell.difficulty);
    if (stored && stored.stored > 0) {
      console.log(`stored (id=${stored.stored})`);
      generated++;
    } else if (stored && stored.duplicates > 0) {
      console.log('duplicate (skipped)');
      skipped++;
    } else {
      console.log('STORE FAILED' + (stored ? JSON.stringify(stored).substring(0,80) : ''));
      failed++;
    }
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
  }

  totalGen += generated;
  totalFail += failed;
  totalSkip += skipped;
  genLog.push({ ...cell, generated, failed, skipped });
  console.log(`  -> total: ${generated} gen, ${failed} fail, ${skipped} skip\n`);
}

console.log('\n=== DONE ===');
console.log(`Total questions generated: ${totalGen}`);
console.log(`Total failures: ${totalFail}`);
console.log(`Total duplicates skipped: ${totalSkip}`);
console.log(`Estimated total repo: ${1260 + totalGen}`);

const fs = require('fs');
const report = `# Coverage Gap Report

**Date:** 2026-06-22
**Analysis:** Repository coverage gaps identified by cross-referencing repository question counts with PSC exam frequency data.

## Summary

| Metric | Value |
|---|---|
| Total repository questions (before) | 1,260 |
| Questions generated this run | ${totalGen} |
| Generation failures | ${totalFail} |
| Duplicates skipped | ${totalSkip} |
| Estimated total (after) | ${1260 + totalGen} |
| High-priority cells seeded | ${genLog.filter(g => g.generated > 0).length} / ${genLog.length} |

## Per-Cell Results

| Subject | Topic | Difficulty | Before | Target | Generated | Failed | Status |
|---|---|---|---|---|---|---|---|
${genLog.map(g => {
  const before = Math.max(0, 5 - g.need);
  const atTarget = before + g.generated >= 5 || g.generated >= g.need ? 'AT TARGET' : g.generated > 0 ? 'PARTIAL' : 'FAILED';
  return `| ${g.subject} | ${g.topic} | ${g.difficulty} | ${before} | 5 | ${g.generated} | ${g.failed} | ${atTarget} |`;
}).join('\n')}

## Methodology

1. **Repository coverage** loaded from \`repository-analytics\` edge function (105 cells, 1,260 questions)
2. **PSC exam frequency** from \`get-psc-frequencies\` edge function
3. **Subject importance** ranked by PSC_SUBJECT_MAP from \`pscFrequencyBoost.ts\`
4. **Priority formula**: \`(100 / subjRank) * ln(PSC_freq + 1) * (5 - repoCount) * 100\`
5. **Top 20 cells** selected for generation, targeting 5 questions per cell

## Current Repository State

Before: 1,260 questions across 105 cells (43 cells @ 5+ questions)
After: ~${1260 + totalGen} questions
`;
fs.writeFileSync('COVERAGE_GAP_REPORT.md', report, 'utf-8');
  console.log('\nCOVERAGE_GAP_REPORT.md written');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
