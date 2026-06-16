import { syllabus, Subject, Topic, Subtopic } from '../data/syllabus';
import { Note } from '../data/mockData';
import { CurrentAffair } from '../data/mockData';

export interface GenerationRequest {
  subjects?: string[];
  topics?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  examType: string;
  count: number;
  sourceNotes?: Note[];
  sourceCurrentAffairs?: CurrentAffair[];
  avoidQuestionIds?: string[];
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  examType: string[];
  confidence: number;
  source: 'syllabus' | 'notes' | 'current_affairs' | 'previous_paper';
  generatedAt: string;
}

interface QuestionTemplate {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  build: () => { text: string; options: string[]; correctAnswer: number; explanation: string };
}

const TEMPLATES: QuestionTemplate[] = [];

function register(subject: string, topic: string, difficulty: 'easy' | 'medium' | 'hard', build: () => { text: string; options: string[]; correctAnswer: number; explanation: string }) {
  TEMPLATES.push({ subject, topic, difficulty, build });
}

function shuffleOpts(correct: string, wrong: string[], correctIdx: number): { options: string[]; correctAnswer: number } {
  const opts = [correct, ...wrong];
  const idx = Math.floor(Math.random() * opts.length);
  const final = [...opts];
  [final[0], final[idx]] = [final[idx], final[0]];
  const newCorrect = final.indexOf(correct);
  return { options: final, correctAnswer: newCorrect };
}

// ─── KERALA HISTORY ───

register('Kerala History', 'Ancient Kerala', 'easy', () => {
  const qs = [
    { t: 'Which Sangam age is known as the "Golden Age" of ancient Kerala?', o: ['Sangam Period', 'Pre-Sangam', 'Post-Sangam', 'Medieval'], c: 0, e: 'The Sangam period (c. 300 BCE – 300 CE) is considered the golden age of ancient Kerala with flourishing trade and literature.' },
    { t: 'The Chera dynasty\'s emblem was?', o: ['Bow and Arrow', 'Fish', 'Tiger', 'Elephant'], c: 0, e: 'The Cheras used the bow and arrow as their royal emblem, seen on their coins.' },
    { t: 'Which Roman port in Kerala was a major trade center during the Sangam age?', o: ['Muziris', 'Kozhikode', 'Kollam', 'Kochi'], c: 0, e: 'Muziris (modern-day Kodungallur) was the most important Roman trade port in Kerala.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Kerala History', 'Ancient Kerala', 'medium', () => {
  const qs = [
    { t: 'The Tamil-Brahmi inscriptions found in Kerala belong to which period?', o: ['Sangam period', 'Chera period', 'Pandya period', 'Vijayanagara period'], c: 0, e: 'Tamil-Brahmi inscriptions (c. 1st century BCE to 4th century CE) found in places like Edakkal and Muziris date to the Sangam period.' },
    { t: 'Which spice was Kerala most famous for in ancient trade with the Romans?', o: ['Black pepper', 'Cardamom', 'Cinnamon', 'Turmeric'], c: 0, e: 'Black pepper (called "black gold") was Kerala\'s most prized export, with Muziris as the hub.' },
    { t: 'The Pathinenkilokan (18 hells) concept appears in which ancient Kerala text?', o: ['Silappadikaram', 'Tolkappiyam', 'Purananuru', 'Manimekalai'], c: 0, e: 'Silappadikaram, the Tamil epic by Ilango Adigal, mentions the Pathinenkilokan.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Kerala History', 'Medieval Kerala', 'easy', () => {
  const qs = [
    { t: 'The Zamorins ruled from which city?', o: ['Calicut', 'Kochi', 'Kollam', 'Kannur'], c: 0, e: 'The Zamorins ruled from Calicut (Kozhikode), which became a major trading port.' },
    { t: 'The Kingdom of Kochi was a vassal of which empire before the Portuguese arrival?', o: ['Vijayanagara Empire', 'Zamorins of Calicut', 'Chola Empire', 'Pandya Empire'], c: 0, e: 'The Kingdom of Kochi was a vassal of the Vijayanagara Empire before Portuguese influence.' },
    { t: 'Venad was later known as which princely state?', o: ['Travancore', 'Cochin', 'Malabar', 'Madras Presidency'], c: 0, e: 'The Kingdom of Venad evolved into the princely state of Travancore under the Venad rulers.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Kerala History', 'Modern Kerala', 'easy', () => {
  const qs = [
    { t: 'When was the state of Kerala formed?', o: ['1 November 1956', '15 August 1947', '26 January 1950', '1 July 1955'], c: 0, e: 'Kerala was formed on 1 November 1956 under the States Reorganisation Act.' },
    { t: 'The first Chief Minister of Kerala was?', o: ['E. M. S. Namboodiripad', 'Pattom A. Thanu Pillai', 'R. Sankar', 'C. Achutha Menon'], c: 0, e: 'E. M. S. Namboodiripad became the first Chief Minister of Kerala in 1957.' },
    { t: 'Which act led to the formation of Kerala?', o: ['States Reorganisation Act, 1956', 'Indian Independence Act, 1947', 'Government of India Act, 1935', 'Kerala Formation Act, 1956'], c: 0, e: 'The States Reorganisation Act, 1956 reorganized states on linguistic lines, forming Kerala.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Kerala History', 'Modern Kerala', 'medium', () => {
  const qs = [
    { t: 'The Malayalam Linguistic Committee recommended the formation of Kerala in which year?', o: ['1956', '1953', '1951', '1955'], c: 0, e: 'The Linguistic Committee (1955-56) recommended merging Travancore, Cochin, and Malabar.' },
    { t: 'Which district was NOT part of the original Kerala formed in 1956?', o: ['Kasaragod', 'Palakkad', 'Kollam', 'Thiruvananthapuram'], c: 0, e: 'Kasaragod was added to Kerala later in 1956 through the States Reorganisation Act amendments.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── RENAISSANCE ───

register('Renaissance', 'Sree Narayana Guru', 'easy', () => {
  const qs = [
    { t: 'Sree Narayana Guru was born in which year?', o: ['1855', '1856', '1854', '1860'], c: 0, e: 'Sree Narayana Guru was born in 1855 in Chempazhanthy, Thiruvananthapuram.' },
    { t: 'The famous motto of Sree Narayana Guru is?', o: ['One Caste, One God, One Religion for Mankind', 'Work is Worship', 'Knowledge is Power', 'Service to Man is Service to God'], c: 0, e: 'His motto "One Caste, One God, One Religion for Mankind" promoted universal brotherhood.' },
    { t: 'Which organization was founded by Sree Narayana Guru and Dr. Palpu?', o: ['SNDP Yogam', 'Sivagiri Mutt', 'Aruvippuram Temple', 'Advaita Ashramam'], c: 0, e: 'SNDP Yogam was founded in 1903 by Sree Narayana Guru and Dr. Padmanabhan Palpu.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Renaissance', 'Sree Narayana Guru', 'hard', () => {
  const qs = [
    { t: 'Sree Narayana Guru\'s "Jathi Nischayam" (1888) was primarily a statement against?', o: ['Caste-based discrimination in temple entry', 'British colonial rule', 'Feudal land ownership', 'Sanskrit dominance'], c: 0, e: '"Jathi Nischayam" was Guru\'s declaration that caste is determined by character, not birth.' },
    { t: 'Sree Narayana Guru\'s "Atmopadesa Satakam" is a work of?', o: ['100 spiritual verses in Malayalam', 'A philosophical treatise in Sanskrit', 'A Tamil poetic work', 'A critique of the caste system'], c: 0, e: 'Atmopadesa Satakam is a collection of 100 spiritual verses written by the Guru in Malayalam.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Renaissance', 'Temple Entry Movement', 'easy', () => {
  const qs = [
    { t: 'The Temple Entry Proclamation was issued in which year?', o: ['1936', '1924', '1947', '1931'], c: 0, e: 'It was issued on November 12, 1936 by Maharaja Sree Chithira Thirunal.' },
    { t: 'Vaikom Satyagraha took place in which district?', o: ['Kottayam', 'Ernakulam', 'Alappuzha', 'Thrissur'], c: 0, e: 'Vaikom Satyagraha (1924-25) took place in Kottayam district at the Vaikom Mahadeva Temple.' },
    { t: 'Who led the Vaikom Satyagraha?', o: ['K. Kelappan', 'Mahatma Gandhi', 'Sree Narayana Guru', 'Ayyankali'], c: 0, e: 'K. Kelappan, known as "Kerala Gandhi", led the Vaikom Satyagraha.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Renaissance', 'Temple Entry Movement', 'medium', () => {
  const qs = [
    { t: 'The Vaikom Satyagraha was primarily a movement for?', o: ['The right of lower castes to use the temple road', 'Entry into the Vaikom temple', 'Abolition of untouchability', 'The right to worship'], c: 0, e: 'The Satyagraha demanded the right for lower castes to use the road surrounding the Vaikom temple.' },
    { t: 'Who was the Diwan of Travancore during the Temple Entry Proclamation?', o: ['Sir C. P. Ramaswami Iyer', 'P. G. N. Unnithan', 'Sir V. S. Subramanya Iyer', 'E. Ikkanda Warrier'], c: 0, e: 'Sir C. P. Ramaswami Iyer was the Diwan who advised the Maharaja on the Proclamation.' },
    { t: 'The Temple Entry Proclamation was first read out at which temple?', o: ['Sri Padmanabhaswamy Temple', 'Vaikom Mahadeva Temple', 'Sree Moolam Thirunal Temple', 'Sivagiri Mutt'], c: 0, e: 'It was first proclaimed at the Sri Padmanabhaswamy Temple in Thiruvananthapuram.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── CONSTITUTION ───

register('Constitution', 'Fundamental Rights', 'easy', () => {
  const qs = [
    { t: 'Article 21 of the Indian Constitution deals with?', o: ['Right to Life and Personal Liberty', 'Right to Equality', 'Right to Freedom of Speech', 'Right against Exploitation'], c: 0, e: 'Article 21 guarantees the Right to Life and Personal Liberty.' },
    { t: 'How many Fundamental Rights were originally in the Constitution?', o: ['Seven', 'Six', 'Eight', 'Nine'], c: 0, e: 'Originally there were seven Fundamental Rights (Article 12-35), including the Right to Property (later removed).' },
    { t: 'Right to Education (Article 21A) was added by which amendment?', o: ['86th Amendment, 2002', '93rd Amendment, 2005', '42nd Amendment, 1976', '44th Amendment, 1978'], c: 0, e: 'The 86th Amendment (2002) made education a Fundamental Right for ages 6-14.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Constitution', 'Directive Principles', 'medium', () => {
  const qs = [
    { t: 'Directive Principles of State Policy are borrowed from which country\'s constitution?', o: ['Ireland', 'USA', 'UK', 'Canada'], c: 0, e: 'The concept of DPSP was borrowed from the Irish Constitution of 1937.' },
    { t: 'Article 44 of the Constitution deals with?', o: ['Uniform Civil Code', 'Free Legal Aid', 'Right to Work', 'Environmental Protection'], c: 0, e: 'Article 44 directs the state to secure a Uniform Civil Code for citizens.' },
    { t: 'Which of the following is a Gandhian Directive Principle?', o: ['Promotion of cottage industries', 'Equal pay for equal work', 'Free legal aid', 'Protection of monuments'], c: 0, e: 'Promotion of cottage industries (Article 43) is a Gandhian principle.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── GEOGRAPHY ───

register('Geography', 'Districts', 'easy', () => {
  const qs = [
    { t: 'How many districts does Kerala have?', o: ['14', '12', '16', '13'], c: 0, e: 'Kerala has 14 districts as of 2026.' },
    { t: 'Which is the largest district in Kerala by area?', o: ['Palakkad', 'Kasaragod', 'Wayanad', 'Idukki'], c: 0, e: 'Palakkad is the largest district in Kerala by area (4,480 sq km).' },
    { t: 'Which is the smallest district in Kerala by area?', o: ['Alappuzha', 'Kasaragod', 'Thiruvananthapuram', 'Kochi'], c: 0, e: 'Alappuzha is the smallest district in Kerala by area (1,414 sq km).' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Geography', 'Rivers', 'medium', () => {
  const qs = [
    { t: 'Which is the longest river in Kerala?', o: ['Periyar', 'Bharathapuzha', 'Pamba', 'Chaliyar'], c: 0, e: 'Periyar (244 km) is the longest river in Kerala.' },
    { t: 'Which river is known as the "Ganga of Kerala"?', o: ['Pamba', 'Periyar', 'Bharathapuzha', 'Kallada'], c: 0, e: 'Pamba is known as the Ganga of Kerala due to its religious significance.' },
    { t: 'The Kallada River flows through which district?', o: ['Kollam', 'Pathanamthitta', 'Alappuzha', 'Thiruvananthapuram'], c: 0, e: 'Kallada River flows through Kollam district.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── SCIENCE ───

register('Science', 'Chemistry', 'easy', () => {
  const qs = [
    { t: 'Which gas is most abundant in the Earth\'s atmosphere?', o: ['Nitrogen', 'Oxygen', 'Carbon Dioxide', 'Argon'], c: 0, e: 'Nitrogen (78%) is the most abundant gas in Earth\'s atmosphere.' },
    { t: 'The chemical symbol for Gold is?', o: ['Au', 'Ag', 'Fe', 'Cu'], c: 0, e: 'Au (from Latin "Aurum") is the chemical symbol for Gold.' },
    { t: 'Water boils at 100°C at which pressure level?', o: ['Sea level (1 atm)', 'High altitude', 'Deep sea', 'Vacuum'], c: 0, e: 'Water boils at 100°C at standard atmospheric pressure (sea level).' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Science', 'Human Body', 'medium', () => {
  const qs = [
    { t: 'Which is the largest organ in the human body?', o: ['Skin', 'Liver', 'Heart', 'Lungs'], c: 0, e: 'Skin is the largest organ, covering approximately 1.5-2 sq m in adults.' },
    { t: 'How many bones are there in the adult human body?', o: ['206', '201', '212', '208'], c: 0, e: 'An adult human has 206 bones (babies have around 270 that fuse over time).' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── MALAYALAM ───

register('Malayalam', 'Ancient Poets', 'easy', () => {
  const qs = [
    { t: 'Who is known as the father of Malayalam literature?', o: ['Thunchaththu Ramanujan Ezhuthachan', 'Vallathol Narayana Menon', 'Kumaran Asan', 'Ulloor S. Parameswara Iyer'], c: 0, e: 'Thunchaththu Ramanujan Ezhuthachan is considered the father of Malayalam literature.' },
    { t: '"Adhyatma Ramayana" was written by?', o: ['Thunchaththu Ezhuthachan', 'Poonthanam', 'Melpathur Narayana Bhattathiri', 'Kumaran Asan'], c: 0, e: 'Thunchaththu Ramanujan Ezhuthachan wrote the Adhyatma Ramayana in Malayalam.' },
    { t: 'Which poet is known as "Mahakavi"?', o: ['Vallathol Narayana Menon', 'Kumaran Asan', 'Ulloor S. Parameswara Iyer', 'G. Sankara Kurup'], c: 0, e: 'Vallathol Narayana Menon was honored as "Mahakavi" for his epic poems.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── CURRENT AFFAIRS ───

register('Current Affairs', 'Kerala News', 'easy', () => {
  const qs = [
    { t: 'Kerala\'s new health insurance scheme covers up to how much per family?', o: ['Rs. 5 lakh', 'Rs. 3 lakh', 'Rs. 2 lakh', 'Rs. 10 lakh'], c: 0, e: 'The scheme announced in 2026 covers up to Rs. 5 lakh per family.' },
    { t: 'KIIFB stands for?', o: ['Kerala Infrastructure Investment Fund Board', 'Kerala Industrial Infrastructure Finance Board', 'Kerala Investment and Infrastructure Fund Board', 'Kerala Infrastructure and Industrial Finance Board'], c: 0, e: 'KIIFB is the Kerala Infrastructure Investment Fund Board.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── QUANTITATIVE APTITUDE ───

register('Quantitative Aptitude', 'Percentages', 'easy', () => {
  const qs = [
    { t: 'What is 25% of 200?', o: ['50', '25', '75', '100'], c: 0, e: '25% of 200 = (25/100) × 200 = 50.' },
    { t: 'If a number increases from 50 to 60, what is the percentage increase?', o: ['20%', '10%', '15%', '25%'], c: 0, e: 'Increase = 10, so (10/50) × 100 = 20%.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Quantitative Aptitude', 'Percentages', 'medium', () => {
  const qs = [
    { t: 'If the price of an item increases by 20% and then decreases by 10%, the net change is?', o: ['8% increase', '10% increase', '10% decrease', '8% decrease'], c: 0, e: 'Let price = 100. After 20% increase = 120. After 10% decrease = 108. Net = 8% increase.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── MENTAL ABILITY ───

register('Mental Ability', 'Analogies', 'easy', () => {
  const qs = [
    { t: 'Book : Read :: Food : ?', o: ['Eat', 'Cook', 'Buy', 'Store'], c: 0, e: 'Book is for reading, just as Food is for eating.' },
    { t: 'Eye : Vision :: Ear : ?', o: ['Hearing', 'Sound', 'Balance', 'Speech'], c: 0, e: 'Eye is the organ for vision, Ear is the organ for hearing.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── DEGREE-LEVEL (HARD) ───

register('Constitution', 'Fundamental Rights', 'hard', () => {
  const qs = [
    { t: 'In which case did the Supreme Court hold that Article 21 cannot be suspended even during Emergency?', o: ['ADM Jabalpur v. Shivkant Shukla', 'Kesavananda Bharati v. State of Kerala', 'Minerva Mills v. Union of India', 'Maneka Gandhi v. Union of India'], c: 0, e: 'Justice H.R. Khanna\'s dissent in ADM Jabalpur (1976) held that Article 21 is beyond suspension.' },
    { t: 'The "Basic Structure Doctrine" was established in which case?', o: ['Kesavananda Bharati (1973)', 'Golaknath (1967)', 'Minerva Mills (1980)', 'Shankari Prasad (1951)'], c: 0, e: 'Kesavananda Bharati v. State of Kerala (1973) established the Basic Structure Doctrine.' },
    { t: 'Article 15 prohibits discrimination on grounds of?', o: ['Religion, race, caste, sex, place of birth', 'Religion, language, caste, sex', 'Caste, creed, sex, property', 'All of the above'], c: 0, e: 'Article 15(1) specifically lists religion, race, caste, sex, and place of birth.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

register('Renaissance', 'Social Reform Movements', 'hard', () => {
  const qs = [
    { t: 'Critically, Sree Narayana Guru\'s "Lanka Prabhu" (1901) was a poem that?', o: ['Critiqued the caste hierarchy through the story of Hanuman', 'Praised British colonial rule', 'Called for violent revolution', 'Rejected all religious beliefs'], c: 0, e: 'Lanka Prabhu used the Hanuman story as an allegory to critique caste hierarchy.' },
    { t: 'The SNDP Yogam\'s 1910 memorandum to the Travancore government demanded?', o: ['Educational scholarships for Ezhavas', 'Temple entry rights', 'Political representation', 'Land reforms'], c: 0, e: 'The 1910 memorandum primarily demanded educational scholarships for Ezhava students.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
});

// ─── NOTE-BASED GENERATION ───

function generateFromNote(note: Note): GeneratedQuestion | null {
  if (!note.content || note.content.length < 20) return null;

  const words = note.content.split(/\s+/);
  const keyTerms = words.filter((w) => w.length > 4 && /[A-Z]/.test(w[0]));
  if (keyTerms.length < 2) return null;

  const term = keyTerms[Math.floor(Math.random() * keyTerms.length)];
  const wrongOptions = keyTerms.filter((t) => t !== term).slice(0, 3);
  while (wrongOptions.length < 3) wrongOptions.push('Other');

  const s = shuffleOpts(term, wrongOptions.slice(0, 3), 0);
  return {
    id: `gen_note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: `Based on your notes: Which of the following is mentioned in "${note.title}"?`,
    options: s.options,
    correctAnswer: s.correctAnswer,
    subject: note.subject,
    topic: note.tags[0] || 'General',
    difficulty: 'medium',
    explanation: `From your note "${note.title}": "${note.content.substring(0, 120)}..."`,
    examType: ['LDC', 'Secretariat Assistant', 'Degree Level'],
    confidence: 60,
    source: 'notes',
    generatedAt: new Date().toISOString(),
  };
}

// ─── CURRENT AFFAIRS GENERATION ───

function generateFromCurrentAffair(ca: CurrentAffair): GeneratedQuestion {
  const options = [
    ca.title,
    `New ${ca.category} policy announced`,
    `Amendment to ${ca.category} rules`,
    `Budget allocation for ${ca.category}`,
  ];
  const s = shuffleOpts(ca.title, options.filter((_, i) => i !== 0).slice(0, 3), 0);
  return {
    id: `gen_ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: `Current Affairs: Which of the following is a recent development in Kerala?`,
    options: s.options,
    correctAnswer: s.correctAnswer,
    subject: 'Current Affairs',
    topic: ca.category === 'kerala' ? 'Kerala News' : ca.category === 'national' ? 'National News' : 'Appointments',
    difficulty: 'medium',
    explanation: ca.summary,
    examType: ['LDC', 'Secretariat Assistant', 'Degree Level', 'Police Constable'],
    confidence: 75,
    source: 'current_affairs',
    generatedAt: new Date().toISOString(),
  };
}

// ─── MAIN GENERATOR ───

export function generateMCQs(request: GenerationRequest): GeneratedQuestion[] {
  const results: GeneratedQuestion[] = [];
  const attemptedSubtopics = new Set<string>();

  const subjectFilter = request.subjects || [];
  const topicFilter = request.topics || [];

  for (let attempt = 0; attempt < 50 && results.length < request.count; attempt++) {
    let pool = TEMPLATES;

    if (subjectFilter.length > 0) {
      pool = pool.filter((t) => subjectFilter.includes(t.subject));
    }
    if (topicFilter.length > 0) {
      pool = pool.filter((t) => topicFilter.includes(t.topic));
    }

    const depths = request.difficulty === 'easy'
      ? ['easy']
      : request.difficulty === 'medium'
        ? ['easy', 'medium']
        : ['easy', 'medium', 'hard'];

    pool = pool.filter((t) => depths.includes(t.difficulty));

    if (pool.length === 0) break;

    const template = pool[Math.floor(Math.random() * pool.length)];
    const key = `${template.subject}|${template.topic}|${template.difficulty}`;

    if (attemptedSubtopics.has(key) && Math.random() > 0.3) continue;
    attemptedSubtopics.add(key);

    const { text, options, correctAnswer, explanation } = template.build();

    if (request.avoidQuestionIds?.some((id) => text === id)) continue;

    results.push({
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      options,
      correctAnswer,
      subject: template.subject,
      topic: template.topic,
      difficulty: template.difficulty,
      explanation,
      examType: [request.examType],
      confidence: template.difficulty === 'easy' ? 95 : template.difficulty === 'medium' ? 85 : 70,
      source: 'syllabus',
      generatedAt: new Date().toISOString(),
    });
  }

  // Supplement with note-based questions if notes provided
  if (request.sourceNotes && results.length < request.count) {
    for (const note of request.sourceNotes) {
      if (results.length >= request.count) break;
      const q = generateFromNote(note);
      if (q && !request.avoidQuestionIds?.includes(q.id)) {
        results.push(q);
      }
    }
  }

  // Supplement with current affairs if provided
  if (request.sourceCurrentAffairs && results.length < request.count) {
    for (const ca of request.sourceCurrentAffairs) {
      if (results.length >= request.count) break;
      const q = generateFromCurrentAffair(ca);
      if (!request.avoidQuestionIds?.includes(q.id)) {
        results.push(q);
      }
    }
  }

  return results.sort(() => Math.random() - 0.5).slice(0, request.count);
}

export function getQuestionPoolSize(): number {
  return TEMPLATES.length;
}
