const SUPABASE_URL = 'https://cycutcqlhpeudmaebwmb.supabase.co';
const ANON_KEY = require('fs').readFileSync('.env', 'utf-8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
if (!ANON_KEY) { console.error('ANON_KEY not found'); process.exit(1); }
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` };

const ANALYTICS_FILE = 'C:\\Users\\saran\\AppData\\Local\\Temp\\repo_analytics.json';
const FREQ_FILE = 'C:\\Users\\saran\\AppData\\Local\\Temp\\psc_freq.json';

async function fetchJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, data: { error: text.substring(0, 200) } }; }
}

// ----- 1. Load repository coverage -----
console.log('Loading repository coverage...');
const repoAnalytics = JSON.parse(require('fs').readFileSync(ANALYTICS_FILE, 'utf-8'));
const cells = repoAnalytics.coverage || [];
console.log(`  ${cells.length} coverage cells, ${repoAnalytics.overview?.totalQuestions || 0} total questions`);

// ----- 2. Load PSC frequency data -----
console.log('Loading PSC exam frequency data...');
const freqData = JSON.parse(require('fs').readFileSync(FREQ_FILE, 'utf-8'));
const pscTopics = freqData.topics || [];
console.log(`  ${pscTopics.length} PSC frequency entries`);

// Normalize string for matching
function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

// Build PSC frequency map: topic_key -> { repeat_count, question_count, frequency_rank }
const pscFreqMap = {};
pscTopics.forEach(t => {
  const key = norm(t.topic);
  if (key) {
    if (!pscFreqMap[key] || (t.frequency_rank < pscFreqMap[key].frequency_rank)) {
      pscFreqMap[key] = {
        displayTopic: t.topic,
        displaySubject: t.subject,
        repeat_count: t.repeat_count || 0,
        question_count: t.question_count || 0,
        frequency_rank: t.frequency_rank || 999,
      };
    }
  }
});

// ----- 3. Cross-reference: for each low-coverage repo cell, find PSC frequency -----
console.log('\nAnalyzing coverage gaps...\n');
const priorityCells = [];

cells.forEach(c => {
  const repoCount = c.question_count || 0;
  if (repoCount >= 5) return; // Already covered, skip

  // Try to find PSC frequency match
  const cellKey = norm(c.topic);
  const pscMatch = pscFreqMap[cellKey];

  // Score: higher PSC frequency = higher priority
  const pscRank = pscMatch ? pscMatch.frequency_rank : 999;
  const pscRepeat = pscMatch ? pscMatch.repeat_count : 0;
  const pscQCount = pscMatch ? pscMatch.question_count : 0;

  // Low rank number = high frequency. Invert for priority scoring.
  // Priority = (100 - pscRank) * (pscRepeat + 1) * (5 - repoCount)
  // This weights: high-frequency topics with many exam repeats and fewer repo questions
  const priority = Math.round((100 - Math.min(pscRank, 100)) * (pscRepeat + 1) * (5 - repoCount));

  priorityCells.push({
    subject: c.subject,
    topic: c.topic,
    difficulty: c.difficulty || 'easy',
    repoCount,
    pscFreqRank: pscRank === 999 ? 'N/A' : pscRank,
    pscRepeatCount: pscRepeat,
    pscQuestionCount: pscQCount,
    pscMatchedTopic: pscMatch?.displayTopic || null,
    pscMatchedSubject: pscMatch?.displaySubject || null,
    priority,
    questionsNeeded: 5 - repoCount,
  });
});

// Sort by priority descending
priorityCells.sort((a, b) => b.priority - a.priority);

console.log('=== PRIORITY CELLS (repo < 5, sorted by PSC frequency) ===\n');
console.log(`${'SUBJECT'.padEnd(30)} ${'TOPIC'.padEnd(40)} ${'DIFF'.padEnd(6)} ${'REPO'.padEnd(6)} ${'PSC_RANK'.padEnd(10)} ${'NEEDED'.padEnd(8)} ${'PRIORITY'}`);
console.log('-'.repeat(110));
priorityCells.forEach(c => {
  console.log(`${c.subject.padEnd(30)} ${c.topic.padEnd(40)} ${c.difficulty.padEnd(6)} ${String(c.repoCount).padEnd(6)} ${String(c.pscFreqRank).padEnd(10)} ${String(c.questionsNeeded).padEnd(8)} ${c.priority}`);
});

// Top priority: cells with PSC frequency match (rank <= 50) AND repo < 5
const highPriority = priorityCells.filter(c => c.pscFreqRank !== 'N/A' && c.pscFreqRank <= 50);

console.log(`\n\n=== HIGH-PRIORITY CELLS (PSC rank <= 50) ===`);
console.log(`  Count: ${highPriority.length}`);
console.log(`  Total questions needed: ${highPriority.reduce((s, c) => s + c.questionsNeeded, 0)}`);

const generateThese = highPriority.filter(c => c.pscFreqRank <= 30);

// Preview mode — ask user before continuing
console.log(`\n=== GENERATION PREVIEW ===`);
console.log(`Cells to generate: ${generateThese.length}`);
console.log(`Total questions needed: ${generateThese.reduce((s, c) => s + c.questionsNeeded, 0)}`);
console.log('\nCells:');
generateThese.forEach(c => {
  console.log(`  ${c.subject}/${c.topic}/${c.difficulty}: need ${c.questionsNeeded} (repo: ${c.repoCount}, PSC rank: ${c.pscFreqRank})`);
});

const PROCEED = process.argv.includes('--generate');
if (!PROCEED) {
  console.log('\nPass --generate to run actual generation. Writing analysis-only report.');
  // Write analysis-only report
} else {

// ----- 4. Generate questions for high-priority cells -----
console.log('\n=== GENERATING QUESTIONS ===\n');

async function generateOne(subject, topic, difficulty) {
  const body = {
    subject,
    topic,
    difficulty,
    examType: 'LDC',
    language: 'en',
    focusInstruction: `Generate a ${difficulty} question about ${topic} in ${subject}. This is for a Kerala PSC exam.`,
    topicConstraint: `The question MUST be about "${topic}" within subject "${subject}".`,
  };
  const { ok, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/generate-question`, body);
  if (!ok || data.error) return null;
  return data;
}

async function storeQuestion(q, subject, topic, difficulty) {
  const batch = {
    questions: [{
      questionText: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      subject: q.subject || subject,
      topic: q.topic || topic,
      subtopic: q.subtopic || null,
      difficulty: difficulty,
      examType: 'LDC',
      language: 'en',
      explanation: q.explanation || '',
      sourceType: 'ai_generated',
      tags: [subject, topic],
    }]
  };
  const { ok, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/store-mcq-batch`, batch);
  if (!ok) return null;
  return data;
}

let totalGenerated = 0;
let totalFailed = 0;
const genResults = [];

// Only generate for truly high-priority cells: PSC rank <= 30 AND repo < 5
const generateThese = highPriority.filter(c => c.pscFreqRank <= 30);

for (let i = 0; i < generateThese.length; i++) {
  const cell = generateThese[i];
  const needed = cell.questionsNeeded;
  let generated = 0;
  let failed = 0;

  process.stdout.write(`  [${i+1}/${generateThese.length}] ${cell.subject}/${cell.topic}/${cell.difficulty} (need ${needed})... `);

  for (let q = 0; q < needed; q++) {
    const question = await generateOne(cell.subject, cell.topic, cell.difficulty);
    if (question) {
      const stored = await storeQuestion(question, cell.subject, cell.topic, cell.difficulty);
      if (stored && stored.stored > 0) {
        generated++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
    await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
  }

  totalGenerated += generated;
  totalFailed += failed;
  genResults.push({ subject: cell.subject, topic: cell.topic, difficulty: cell.difficulty, needed, generated, failed });
  console.log(`${generated} generated, ${failed} failed`);
}

console.log(`\n=== GENERATION COMPLETE ===`);
console.log(`  Total generated: ${totalGenerated}`);
console.log(`  Total failed: ${totalFailed}`);

let report = `# Coverage Gap Report

**Date:** 2026-06-22
**Analysis:** Repository coverage per subject-topic-difficulty cell with PSC exam frequency as recommendation proxy.

## Summary

| Metric | Value |
|---|---|
| Total repository questions | ${repoAnalytics.overview?.totalQuestions || 0} |
| Total coverage cells | ${cells.length} |
| Cells with < 5 questions | ${priorityCells.length} |
| High-priority cells (frequent PSC topic) | ${highPriority.length} |
| Questions generated this run | ${totalGenerated} |
| Questions failed | ${totalFailed} |
| Current total after generation | ${(repoAnalytics.overview?.totalQuestions || 0) + totalGenerated} |

## Priority Cells Generated

| Subject | Topic | Difficulty | Previous Count | Target Count | Added | Status |
|---|---|---|---|---|---|---|
`;

genResults.forEach(r => {
  const status = r.generated >= r.needed ? 'FULL' : r.generated > 0 ? 'PARTIAL' : 'FAILED';
  report += `| ${r.subject} | ${r.topic} | ${r.difficulty} | ${r.needed > 5 ? 5 - r.needed : '?'} | 5 | ${r.generated} | ${status} |\n`;
});

report += `\n## All Undercovered Cells (repo < 5)\n\n`;
report += `| Subject | Topic | Difficulty | Count | PSC Rank | Needed |\n|---|---|---|---|---|---|\n`;
priorityCells.forEach(c => {
  report += `| ${c.subject} | ${c.topic} | ${c.difficulty} | ${c.repoCount} | ${c.pscFreqRank} | ${c.questionsNeeded} |\n`;
});

report += `\n## PSC Frequency Data Used (top 20 topics)\n\n`;
report += `| Topic | Subject | Question Count | Repeat Count | Frequency Rank |\n|---|---|---|---|---|\n`;
pscTopics.slice(0, 20).forEach(t => {
  report += `| ${t.topic || 'N/A'} | ${t.subject || 'N/A'} | ${t.question_count} | ${t.repeat_count} | ${t.frequency_rank} |\n`;
});

require('fs').writeFileSync('COVERAGE_GAP_REPORT.md', report, 'utf-8');
console.log('Written to COVERAGE_GAP_REPORT.md');
