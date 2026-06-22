const COVERAGE_FILE = 'C:\\Users\\saran\\AppData\\Local\\Temp\\cells_clean.json';
const FREQ_FILE = 'C:\\Users\\saran\\AppData\\Local\\Temp\\psc_freq.json';

const cells = JSON.parse(require('fs').readFileSync(COVERAGE_FILE, 'utf-8'));
const freqData = JSON.parse(require('fs').readFileSync(FREQ_FILE, 'utf-8'));
const pscTopics = freqData.topics || [];

// Subject importance from PSC_SUBJECT_MAP (pscFrequencyBoost.ts)
const SUBJECT_IMPORTANCE = {
  'Kerala History': 1,
  'Constitution': 2,
  'Geography': 3,
  'Science': 4,
  'Quantitative Aptitude': 5,
  'Mental Ability': 6,
  'Renaissance': 7,
  'Malayalam': 8,
  'Current Affairs': 9,
  'Indian Constitution': 10,
  'Indian History & National Movement': 11,
  'General Science': 12,
  'English': 13,
  'World History': 14,
  'Arts, Sports & Culture': 15,
  'Civics & Public Administration': 16,
  'Information Technology & Cyber Laws': 17,
};

// PSC exam frequency by subject: aggregate question_count per PSC subject
const pscSubjectFreq = {};
pscTopics.forEach(t => {
  const subj = t.subject || 'Unknown';
  pscSubjectFreq[subj] = (pscSubjectFreq[subj] || 0) + (t.question_count || 0);
});

console.log('=== PSC Exam Frequency by Subject ===');
Object.entries(pscSubjectFreq).sort((a,b) => b[1]-a[1]).forEach(([s, c]) => {
  console.log(`  ${s.padEnd(30)} ${c} questions in PYQs`);
});

// Map subject names between PSC and repo
const SUBJECT_MAP = {
  'Constitution': ['Constitution', 'Indian Constitution'],
  'Renaissance': ['Renaissance', 'Kerala History'],
  'Kerala History': ['Kerala History', 'Renaissance'],
  'Geography': ['Geography'],
  'Science': ['Science', 'General Science'],
  'Quantitative Aptitude': ['Quantitative Aptitude'],
  'Mental Ability': ['Mental Ability'],
  'Malayalam': ['Malayalam'],
  'Current Affairs': ['Current Affairs'],
  'Indian Constitution': ['Indian Constitution', 'Constitution'],
  'Indian History & National Movement': ['Indian History & National Movement'],
  'General Science': ['General Science', 'Science'],
  'English': ['English'],
  'Arts, Sports & Culture': ['Arts, Sports & Culture'],
  'World History': ['World History'],
  'Information Technology & Cyber Laws': ['Information Technology & Cyber Laws'],
  'Civics & Public Administration': ['Civics & Public Administration'],
};

// Build priority list
const priorityCells = [];
const skipCount = {};
let totalLow = 0;

cells.forEach(c => {
  const repoCount = c.count || 0;
  if (repoCount >= 5) return;
  totalLow++;

  // Find PSC frequency score for this subject
  let bestFreq = 0;
  for (const [pscSubj, repoSubjs] of Object.entries(SUBJECT_MAP)) {
    if (repoSubjs.includes(c.subject)) {
      bestFreq = Math.max(bestFreq, pscSubjectFreq[pscSubj] || 0);
    }
  }

  // Subject importance rank
  let subjRank = 999;
  if (c.subject in SUBJECT_IMPORTANCE) subjRank = SUBJECT_IMPORTANCE[c.subject];
  // Also check reverse map
  for (const [pscSubj, repoSubjs] of Object.entries(SUBJECT_MAP)) {
    if (repoSubjs.includes(c.subject) && pscSubj in SUBJECT_IMPORTANCE) {
      subjRank = Math.min(subjRank, SUBJECT_IMPORTANCE[pscSubj]);
    }
  }

  // Priority = f(subj importance, PSC frequency, questions needed)
  const priority = Math.round((100 / subjRank) * Math.log(bestFreq + 1) * (5 - repoCount) * 100);

  priorityCells.push({
    subject: c.subject,
    topic: c.topic,
    difficulty: c.difficulty,
    repoCount,
    pscFreq: bestFreq,
    subjRank: subjRank === 999 ? 'N/A' : subjRank,
    priority,
    questionsNeeded: 5 - repoCount,
  });
});

priorityCells.sort((a, b) => b.priority - a.priority);

console.log(`\n=== UNDERCOVERED CELLS (repo < 5): ${totalLow} total ===\n`);
console.log('SUBJECT/TOPIC/DIFF'.padEnd(75), 'REPO', 'SUBJ_RANK', 'PSC_FREQ', 'NEED', 'PRIORITY');
console.log('-'.repeat(115));
priorityCells.forEach(c => {
  const line = `${c.subject}/${c.topic}/${c.difficulty}`.padEnd(70);
  console.log(`${line} ${String(c.repoCount).padEnd(6)} ${String(c.subjRank).padEnd(10)} ${String(c.pscFreq).padEnd(9)} ${String(c.questionsNeeded).padEnd(6)} ${c.priority}`);
});

// Top priority: first N cells (highest priority)
const topN = Math.min(20, priorityCells.filter(c => c.priority > 0).length);
const generateThese = priorityCells.slice(0, topN);

console.log(`\n\n=== TOP ${topN} PRIORITY CELLS TO SEED ===`);
console.log(`Total questions needed: ${generateThese.reduce((s,c)=>s+c.questionsNeeded,0)}`);
console.log('\nSubject distribution:');
const subjCount = {};
generateThese.forEach(c => {
  subjCount[c.subject] = (subjCount[c.subject] || 0) + 1;
});
Object.entries(subjCount).sort((a,b) => b[1]-a[1]).forEach(([s, cnt]) => {
  const qs = generateThese.filter(c => c.subject === s).reduce((sum, c) => sum + c.questionsNeeded, 0);
  console.log(`  ${s.padEnd(30)} ${cnt} cells, ${qs} questions needed`);
});

console.log('\nDetail:');
generateThese.forEach(c => {
  console.log(`  ${c.subject.padEnd(30)} ${c.topic.padEnd(45)} ${c.difficulty.padEnd(8)} repo=${c.repoCount} need=${c.questionsNeeded}`);
});

// Also show how many already-covered cells we're skipping
const covered = cells.filter(c => (c.count || 0) >= 5);
console.log(`\n=== ALREADY COVERED CELLS (repo >= 5): ${covered.length} ===`);
console.log(`Total questions in covered cells: ${covered.reduce((s,c)=>s + (c.count||0), 0)}`);
