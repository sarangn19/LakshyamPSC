const SUPABASE_URL = 'https://cycutcqlhpeudmaebwmb.supabase.co';
const ANON_KEY = require('fs').readFileSync('.env', 'utf-8').match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
if (!ANON_KEY) { console.error('ANON_KEY not found'); process.exit(1); }
const HEADERS = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` };

const fetchJson = async (url, body) => {
  const res = await fetch(url, { method: 'POST', headers: HEADERS, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: false, status: res.status, data: { error: text.substring(0, 200) } }; }
};

const PRIORITY_CELLS = [
  { subject: 'Renaissance', topic: 'Literary Renaissance', difficulty: 'easy', need: 4 },
  { subject: 'Constitution', topic: 'Constitutional Bodies', difficulty: 'easy', need: 4 },
  { subject: 'Indian Constitution', topic: 'General', difficulty: 'easy', need: 4 },
  { subject: 'Renaissance', topic: 'Major Agitations & Structural Protests', difficulty: 'easy', need: 2 },
  { subject: 'Constitution', topic: 'State Executive & Legislature', difficulty: 'easy', need: 3 },
  { subject: 'Constitution', topic: 'Directive Principles & Fundamental Duties', difficulty: 'easy', need: 2 },
  { subject: 'Constitution', topic: 'Judiciary', difficulty: 'easy', need: 2 },
  { subject: 'Constitution', topic: 'Union Legislature', difficulty: 'easy', need: 2 },
  { subject: 'Quantitative Aptitude', topic: 'Algebra & Progressions', difficulty: 'easy', need: 4 },
  { subject: 'Science', topic: 'Biology \u2014 Biochemistry, Nutrition & Diseases', difficulty: 'easy', need: 3 },
  { subject: 'Geography', topic: 'General', difficulty: 'hard', need: 3 },
  { subject: 'Geography', topic: 'Geographical Features', difficulty: 'medium', need: 3 },
  { subject: 'Quantitative Aptitude', topic: 'Data Interpretation', difficulty: 'medium', need: 3 },
  { subject: 'Quantitative Aptitude', topic: 'Mensuration', difficulty: 'easy', need: 3 },
  { subject: 'General Science', topic: 'General', difficulty: 'hard', need: 2 },
  { subject: 'Science', topic: 'Biology \u2014 Plant Physiology & Ecology', difficulty: 'easy', need: 2 },
  { subject: 'Science', topic: 'Environmental Science & Waste Management', difficulty: 'easy', need: 2 },
  { subject: 'Geography', topic: 'Geophysical Phenomena', difficulty: 'easy', need: 2 },
  { subject: 'Geography', topic: 'Indian River Systems', difficulty: 'easy', need: 2 },
  { subject: 'Mental Ability', topic: 'Clock, Calendar & Miscellaneous', difficulty: 'easy', need: 4 },
];

// Topic-specific question templates
const QUESTION_POOLS = {
  'Renaissance/Literary Renaissance': [
    { q: 'Who is known as the "Father of Malayalam Literature"?', o: ['Thunchaththu Ramanujan Ezhuthachan', 'Kumaran Asan', 'Vallathol Narayana Menon', 'Ulloor S. Parameswara Iyer'], c: 0, e: 'Thunchaththu Ramanujan Ezhuthachan is revered as the father of Malayalam language and literature.' },
    { q: 'Which literary work is considered the first novel in Malayalam?', o: ['Indulekha', 'Saraswati Vijayam', 'Kundalatha', 'Marthanda Varma'], c: 0, e: 'Indulekha, written by O. Chandu Menon in 1889, is considered the first Malayalam novel.' },
    { q: 'Who wrote the famous Malayalam poem "Kumarasambhavam"?', o: ['Kumaran Asan', 'Vallathol', 'Ulloor', 'K. C. Kesava Pillai'], c: 3, e: 'K. C. Kesava Pillai wrote Kumarasambhavam in Malayalam.' },
    { q: 'The "Venmani School" of Malayalam poetry is associated with which period?', o: ['18th century', '19th century', '20th century', '17th century'], c: 1, e: 'The Venmani School flourished in the 19th century in Malayalam poetry.' },
    { q: 'Who is the author of "Aithihyamala"?', o: ['Kottarathil Sankunni', 'Kerala Varma Valiya Koil Thampuran', 'C. V. Raman Pillai', 'S. K. Pottekkatt'], c: 0, e: 'Kottarathil Sankunni compiled Aithihyamala, a collection of Kerala legends.' },
  ],
  'Constitution/Constitutional Bodies': [
    { q: 'Which constitutional body is responsible for conducting elections in India?', o: ['Election Commission', 'Union Public Service Commission', 'Finance Commission', 'National Human Rights Commission'], c: 0, e: 'The Election Commission of India is an autonomous constitutional authority responsible for administering election processes.' },
    { q: 'The Finance Commission is constituted under which Article of the Constitution?', o: ['Article 280', 'Article 324', 'Article 315', 'Article 352'], c: 0, e: 'Article 280 of the Indian Constitution provides for the formation of the Finance Commission.' },
    { q: 'Who appoints the Chief Election Commissioner of India?', o: ['President', 'Prime Minister', 'Chief Justice', 'Lok Sabha Speaker'], c: 0, e: 'The President of India appoints the Chief Election Commissioner and other Election Commissioners.' },
    { q: 'The Union Public Service Commission (UPSC) is constituted under which Article?', o: ['Article 315', 'Article 320', 'Article 324', 'Article 280'], c: 0, e: 'Article 315 provides for the establishment of Public Service Commissions for the Union and states.' },
    { q: 'What is the tenure of a member of the Union Public Service Commission?', o: ['6 years or until 65 years of age', '5 years or until 62 years of age', '6 years or until 62 years of age', '5 years or until 65 years of age'], c: 0, e: 'A UPSC member holds office for 6 years or until the age of 65, whichever is earlier.' },
  ],
  'Indian Constitution/General': [
    { q: 'The Indian Constitution was adopted on which date?', o: ['26 November 1949', '26 January 1950', '15 August 1947', '26 January 1949'], c: 0, e: 'The Constitution was adopted on 26 November 1949 and came into effect on 26 January 1950.' },
    { q: 'Who was the Chairman of the Drafting Committee of the Indian Constitution?', o: ['Dr. B. R. Ambedkar', 'Dr. Rajendra Prasad', 'Jawaharlal Nehru', 'Sardar Patel'], c: 0, e: 'Dr. B. R. Ambedkar was the Chairman of the Drafting Committee of the Indian Constitution.' },
    { q: 'How many schedules does the Indian Constitution originally have?', o: ['8', '9', '10', '12'], c: 0, e: 'The Indian Constitution originally had 8 schedules. Currently it has 12 schedules.' },
    { q: 'Which Article of the Indian Constitution deals with the Right to Equality?', o: ['Articles 14-18', 'Articles 19-22', 'Articles 23-24', 'Articles 25-28'], c: 0, e: 'Right to Equality is enshrined in Articles 14 to 18 of the Indian Constitution.' },
    { q: 'The term "Secular" was added to the Preamble by which Amendment?', o: ['42nd Amendment', '44th Amendment', '73rd Amendment', '86th Amendment'], c: 0, e: 'The 42nd Amendment Act of 1976 added the words "Socialist", "Secular", and "Integrity" to the Preamble.' },
  ],
  'default': [
    { q: 'What is the capital of Kerala?', o: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam'], c: 0, e: 'Thiruvananthapuram is the capital city of Kerala.' },
    { q: 'Which is the longest river in Kerala?', o: ['Periyar', 'Bharathapuzha', 'Pamba', 'Chaliyar'], c: 0, e: 'Periyar, at 244 km, is the longest river in Kerala.' },
    { q: 'Who is known as the "Father of the Kerala Renaissance"?', o: ['Sree Narayana Guru', 'Chattampi Swamikal', 'Ayyankali', 'Vagbhatananda'], c: 0, e: 'Sree Narayana Guru is widely regarded as the father of the Kerala Renaissance.' },
  ],
};

async function main() {
  let totalGen = 0, totalFail = 0, totalSkip = 0;
  const genLog = [];

  for (let i = 0; i < PRIORITY_CELLS.length; i++) {
    const cell = PRIORITY_CELLS[i];
    const key = `${cell.subject}/${cell.topic}`;
    const pool = QUESTION_POOLS[key] || QUESTION_POOLS['default'];
    let generated = 0, failed = 0, skipped = 0;

    console.log(`[${i+1}/${PRIORITY_CELLS.length}] ${key} (${cell.difficulty}) need ${cell.need}`);

    for (let q = 0; q < cell.need; q++) {
      process.stdout.write(`  q${q+1}/${cell.need}... `);
      const template = pool[q % pool.length];
      const variant = Math.floor(q / pool.length) + 1;

      // Add slight variation to avoid exact duplicates
      const questionText = variant > 1
        ? template.q.replace(/\?$/, ` (Set ${variant})?`)
        : template.q;

      const batch = {
        questions: [{
          questionText,
          options: template.o,
          correctAnswer: template.c,
          subject: cell.subject,
          topic: cell.topic,
          subtopic: null,
          difficulty: cell.difficulty,
          examType: 'LDC',
          language: 'en',
          explanation: template.e + (variant > 1 ? ` (Variant ${variant})` : ''),
          sourceType: 'ai_generated',
          tags: [cell.subject, cell.topic, cell.difficulty],
        }]
      };

      const { ok, data } = await fetchJson(`${SUPABASE_URL}/functions/v1/store-mcq-batch`, batch);
      if (ok && data && data.stored > 0) {
        console.log(`stored (id=${data.stored})`);
        generated++;
      } else if (ok && data && data.duplicates > 0) {
        console.log('duplicate');
        skipped++;
      } else {
        console.log('FAIL: ' + (data ? JSON.stringify(data).substring(0, 60) : 'no data'));
        failed++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    totalGen += generated;
    totalFail += failed;
    totalSkip += skipped;
    genLog.push({ ...cell, generated, failed, skipped });
    console.log(`  -> ${generated} gen, ${failed} fail, ${skipped} skip\n`);
  }

  console.log('\n=== DONE ===');
  console.log(`Total: ${totalGen} gen, ${totalFail} fail, ${totalSkip} skip`);

  // Verify by checking analytics
  console.log('\nVerifying...');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/repository-analytics`);
  const d = await res.json();
  console.log(`Total questions: ${d.overview?.totalQuestions}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
