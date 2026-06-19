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
  language?: 'en' | 'ml';
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
  source: 'syllabus' | 'notes' | 'current_affairs' | 'previous_paper' | 'ai_generated';
  generatedAt: string;
  subtopic?: string;
}

interface QuestionTemplate {
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'ml';
  build: () => { text: string; options: string[]; correctAnswer: number; explanation: string };
}

const TEMPLATES: QuestionTemplate[] = [];

function register(subject: string, topic: string, difficulty: 'easy' | 'medium' | 'hard', build: () => { text: string; options: string[]; correctAnswer: number; explanation: string }, language: 'en' | 'ml' = 'en') {
  TEMPLATES.push({ subject, topic, difficulty, language, build });
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

// ─── MALAYALAM TEMPLATE QUESTIONS ───

register('Kerala History', 'Ancient Kerala', 'easy', () => {
  const qs = [
    { t: 'പുരാതന കേരളത്തിന്റെ "സുവർണ്ണ കാലഘട്ടം" എന്നറിയപ്പെടുന്നത് ഏത് സംഘകാലമാണ്?', o: ['സംഘ കാലഘട്ടം', 'പ്രീ-സംഘം', 'പോസ്റ്റ്-സംഘം', 'മധ്യകാല'], c: 0, e: 'സംഘകാലം (ക്രി.മു. 300 – ക്രി.ശേ. 300) വ്യാപാരത്തിന്റെയും സാഹിത്യത്തിന്റെയും അഭിവൃദ്ധിയോടെ പുരാതന കേരളത്തിന്റെ സുവർണ്ണ കാലഘട്ടമായി കണക്കാക്കപ്പെടുന്നു.' },
    { t: 'ചേര രാജവംശത്തിന്റെ ചിഹ്നം എന്തായിരുന്നു?', o: ['വില്ലും അമ്പും', 'മത്സ്യം', 'കടുവ', 'ആന'], c: 0, e: 'ചേരന്മാർ അവരുടെ രാജകീയ ചിഹ്നമായി വില്ലും അമ്പും ഉപയോഗിച്ചു, അവരുടെ നാണയങ്ങളിൽ കാണപ്പെടുന്നു.' },
    { t: 'സംഘകാലത്ത് കേരളത്തിലെ പ്രധാന റോമൻ വ്യാപാര കേന്ദ്രം ഏതായിരുന്നു?', o: ['മുസിരിസ്', 'കോഴിക്കോട്', 'കൊല്ലം', 'കൊച്ചി'], c: 0, e: 'മുസിരിസ് (ഇന്നത്തെ കൊടുങ്ങല്ലൂർ) കേരളത്തിലെ ഏറ്റവും പ്രധാനപ്പെട്ട റോമൻ വ്യാപാര തുറമുഖമായിരുന്നു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Kerala History', 'Modern Kerala', 'easy', () => {
  const qs = [
    { t: 'കേരള സംസ്ഥാനം രൂപീകരിച്ചത് എന്ന്?', o: ['1956 നവംബർ 1', '1947 ഓഗസ്റ്റ് 15', '1950 ജനുവരി 26', '1955 ജൂലൈ 1'], c: 0, e: '1956 നവംബർ 1-ന് സംസ്ഥാന പുനഃസംഘടനാ നിയമപ്രകാരം കേരളം രൂപീകരിക്കപ്പെട്ടു.' },
    { t: 'കേരളത്തിലെ ആദ്യ മുഖ്യമന്ത്രി ആരായിരുന്നു?', o: ['ഇ.എം.എസ്. നമ്പൂതിരിപ്പാട്', 'പട്ടം എ. താണുപിള്ള', 'ആർ. ശങ്കർ', 'സി. അച്യുതമേനോൻ'], c: 0, e: 'ഇ.എം.എസ്. നമ്പൂതിരിപ്പാട് 1957-ൽ കേരളത്തിലെ ആദ്യ മുഖ്യമന്ത്രിയായി.' },
    { t: 'ഏത് നിയമമാണ് കേരളത്തിന്റെ രൂപീകരണത്തിലേക്ക് നയിച്ചത്?', o: ['സംസ്ഥാന പുനഃസംഘടനാ നിയമം, 1956', 'ഇന്ത്യൻ സ്വാതന്ത്ര്യ നിയമം, 1947', 'ഇന്ത്യാ ഗവൺമെന്റ് നിയമം, 1935', 'കേരള രൂപീകരണ നിയമം, 1956'], c: 0, e: 'സംസ്ഥാന പുനഃസംഘടനാ നിയമം, 1956 ഭാഷാടിസ്ഥാനത്തിൽ സംസ്ഥാനങ്ങളെ പുനഃസംഘടിപ്പിച്ചു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Constitution', 'Fundamental Rights', 'easy', () => {
  const qs = [
    { t: 'ഇന്ത്യൻ ഭരണഘടനയിലെ ആർട്ടിക്കിൾ 21 ഇതുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു?', o: ['ജീവിക്കാനും വ്യക്തിസ്വാതന്ത്ര്യത്തിനുമുള്ള അവകാശം', 'സമത്വത്തിനുള്ള അവകാശം', 'സ്വാതന്ത്ര്യത്തിനുള്ള അവകാശം', 'ചൂഷണത്തിനെതിരായ അവകാശം'], c: 0, e: 'ആർട്ടിക്കിൾ 21 ജീവിക്കാനും വ്യക്തിസ്വാതന്ത്ര്യത്തിനുമുള്ള അവകാശം ഉറപ്പുനൽകുന്നു.' },
    { t: 'ഇന്ത്യൻ ഭരണഘടനയിൽ എത്ര മൗലികാവകാശങ്ങൾ ഉണ്ടായിരുന്നു?', o: ['ഏഴ്', 'ആറ്', 'എട്ട്', 'ഒൻപത്'], c: 0, e: 'തുടക്കത്തിൽ ഏഴ് മൗലികാവകാശങ്ങൾ ഉണ്ടായിരുന്നു (ആർട്ടിക്കിൾ 12-35).' },
    { t: 'വിദ്യാഭ്യാസ അവകാശം (ആർട്ടിക്കിൾ 21A) ഏത് ഭേദഗതിയിലൂടെയാണ് ചേർത്തത്?', o: ['86-ാം ഭേദഗതി, 2002', '93-ാം ഭേദഗതി, 2005', '42-ാം ഭേദഗതി, 1976', '44-ാം ഭേദഗതി, 1978'], c: 0, e: '86-ാം ഭേദഗതി (2002) 6-14 വയസ്സുള്ള കുട്ടികൾക്ക് വിദ്യാഭ്യാസത്തെ മൗലികാവകാശമാക്കി.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Geography', 'Districts', 'easy', () => {
  const qs = [
    { t: 'കേരളത്തിൽ എത്ര ജില്ലകളുണ്ട്?', o: ['14', '12', '16', '13'], c: 0, e: '2026 ലെ കണക്കനുസരിച്ച് കേരളത്തിൽ 14 ജില്ലകളുണ്ട്.' },
    { t: 'വിസ്തീർണ്ണത്തിൽ ഏറ്റവും വലിയ കേരള ജില്ല ഏത്?', o: ['പാലക്കാട്', 'കാസർഗോഡ്', 'വയനാട്', 'ഇടുക്കി'], c: 0, e: 'പാലക്കാട് ജില്ലയാണ് വിസ്തീർണ്ണത്തിൽ ഏറ്റവും വലുത് (4,480 ച.കി.മീ).' },
    { t: 'ഏറ്റവും ചെറിയ കേരള ജില്ല ഏത്?', o: ['ആലപ്പുഴ', 'കാസർഗോഡ്', 'തിരുവനന്തപുരം', 'കൊച്ചി'], c: 0, e: 'ആലപ്പുഴയാണ് ഏറ്റവും ചെറിയ ജില്ല (1,414 ച.കി.മീ).' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Renaissance', 'Sree Narayana Guru', 'easy', () => {
  const qs = [
    { t: 'ശ്രീ നാരായണ ഗുരു ജനിച്ച വർഷം ഏത്?', o: ['1855', '1856', '1854', '1860'], c: 0, e: 'ശ്രീ നാരായണ ഗുരു 1855-ൽ തിരുവനന്തപുരം ചെമ്പഴന്തിയിലാണ് ജനിച്ചത്.' },
    { t: 'ശ്രീ നാരായണ ഗുരുവിന്റെ പ്രശസ്തമായ മുദ്രാവാക്യം ഏത്?', o: ['ഒരു ജാതി, ഒരു മതം, ഒരു ദൈവം മനുഷ്യന്', 'അദ്ധ്വാനമാണ് ആരാധന', 'അറിവാണ് ശക്തി', 'മനുഷ്യ സേവയാണ് മാധവ സേവ'], c: 0, e: 'അദ്ദേഹത്തിന്റെ "ഒരു ജാതി, ഒരു മതം, ഒരു ദൈവം മനുഷ്യന്" എന്ന മുദ്രാവാക്യം സാർവത്രിക സാഹോദര്യം പ്രോത്സാഹിപ്പിച്ചു.' },
    { t: 'ശ്രീ നാരായണ ഗുരുവും ഡോ. പൽപ്പുവും ചേർന്ന് സ്ഥാപിച്ച സംഘടന ഏത്?', o: ['ശ്രീ നാരായണ ധർമ്മ പരിപാലന യോഗം (എസ്.എൻ.ഡി.പി)', 'ശിവഗിരി മഠം', 'അരുവിപ്പുറം ക്ഷേത്രം', 'അദ്വൈതാശ്രമം'], c: 0, e: 'എസ്.എൻ.ഡി.പി. യോഗം 1903-ൽ ശ്രീ നാരായണ ഗുരുവും ഡോ. പത്മനാഭൻ പൽപ്പുവും ചേർന്ന് സ്ഥാപിച്ചു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Science', 'Chemistry', 'easy', () => {
  const qs = [
    { t: 'ഭൂമിയുടെ അന്തരീക്ഷത്തിൽ ഏറ്റവും കൂടുതലുള്ള വാതകം ഏത്?', o: ['നൈട്രജൻ', 'ഓക്സിജൻ', 'കാർബൺ ഡൈ ഓക്സൈഡ്', 'ആർഗോൺ'], c: 0, e: 'നൈട്രജൻ (78%) ഭൂമിയുടെ അന്തരീക്ഷത്തിലെ ഏറ്റവും സമൃദ്ധമായ വാതകമാണ്.' },
    { t: 'സ്വർണ്ണത്തിന്റെ രാസ ചിഹ്നം ഏത്?', o: ['Au', 'Ag', 'Fe', 'Cu'], c: 0, e: 'Au (ലാറ്റിൻ "Aurum" ൽ നിന്ന്) സ്വർണ്ണത്തിന്റെ രാസ ചിഹ്നമാണ്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Renaissance', 'Temple Entry Movement', 'easy', () => {
  const qs = [
    { t: 'ക്ഷേത്രപ്രവേശന വിളംബരം പുറപ്പെടുവിച്ച വർഷം ഏത്?', o: ['1936', '1924', '1947', '1931'], c: 0, e: '1936 നവംബർ 12-ന് ശ്രീ ചിത്തിര തിരുനാൾ മഹാരാജാവാണ് ഇത് പുറപ്പെടുവിച്ചത്.' },
    { t: 'വൈക്കം സത്യാഗ്രഹം നടന്നത് ഏത് ജില്ലയിൽ?', o: ['കോട്ടയം', 'എറണാകുളം', 'ആലപ്പുഴ', 'തൃശ്ശൂർ'], c: 0, e: 'വൈക്കം സത്യാഗ്രഹം (1924-25) കോട്ടയം ജില്ലയിലെ വൈക്കം മഹാദേവ ക്ഷേത്രത്തിലാണ് നടന്നത്.' },
    { t: 'വൈക്കം സത്യാഗ്രഹത്തിന് നേതൃത്വം നൽകിയത് ആര്?', o: ['കെ. കേളപ്പൻ', 'മഹാത്മാഗാന്ധി', 'ശ്രീ നാരായണ ഗുരു', 'അയ്യങ്കാളി'], c: 0, e: '"കേരള ഗാന്ധി" എന്നറിയപ്പെടുന്ന കെ. കേളപ്പനാണ് വൈക്കം സത്യാഗ്രഹത്തിന് നേതൃത്വം നൽകിയത്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

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

export function generateFromNote(note: Note, language?: 'en' | 'ml'): GeneratedQuestion | null {
  if (!note.content || note.content.length < 20) return null;

  const words = note.content.split(/\s+/);
  const keyTerms = words.filter((w) => w.length > 4 && /[A-Z]/.test(w[0]));
  if (keyTerms.length < 2) return null;

  const term = keyTerms[Math.floor(Math.random() * keyTerms.length)];
  const wrongOptions = keyTerms.filter((t) => t !== term).slice(0, 3);
  while (wrongOptions.length < 3) wrongOptions.push('Other');

  const s = shuffleOpts(term, wrongOptions.slice(0, 3), 0);
  const isML = language === 'ml';
  return {
    id: `gen_note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: isML
      ? `നിങ്ങളുടെ കുറിപ്പുകളെ അടിസ്ഥാനമാക്കി: "${note.title}" എന്നതിൽ പരാമർശിച്ചിരിക്കുന്നത് ഇനിപ്പറയുന്നവയിൽ ഏത്?`
      : `Based on your notes: Which of the following is mentioned in "${note.title}"?`,
    options: s.options,
    correctAnswer: s.correctAnswer,
    subject: note.subject,
    topic: note.tags[0] || 'General',
    difficulty: 'medium',
    explanation: isML
      ? `"${note.title}" എന്ന നിങ്ങളുടെ കുറിപ്പിൽ നിന്ന്: "${note.content.substring(0, 120)}..."`
      : `From your note "${note.title}": "${note.content.substring(0, 120)}..."`,
    examType: ['LDC', 'Secretariat Assistant', 'Degree Level'],
    confidence: 60,
    source: 'notes',
    generatedAt: new Date().toISOString(),
  };
}

// ─── CURRENT AFFAIRS GENERATION ───

function generateFromCurrentAffair(ca: CurrentAffair, language?: 'en' | 'ml'): GeneratedQuestion {
  const options = [
    ca.title,
    `New ${ca.category} policy announced`,
    `Amendment to ${ca.category} rules`,
    `Budget allocation for ${ca.category}`,
  ];
  const s = shuffleOpts(ca.title, options.filter((_, i) => i !== 0).slice(0, 3), 0);
  const isML = language === 'ml';
  return {
    id: `gen_ca_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: isML
      ? `കറന്റ് അഫയേഴ്സ്: ഇനിപ്പറയുന്നവയിൽ ഏതാണ് കേരളത്തിലെ സമീപകാല വികസനം?`
      : `Current Affairs: Which of the following is a recent development in Kerala?`,
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

// ─── MORE MALAYALAM TEMPLATES ───

register('Kerala History', 'Medieval Kerala', 'easy', () => {
  const qs = [
    { t: 'സാമൂതിരിമാർ ഏത് നഗരത്തിൽ നിന്നാണ് ഭരിച്ചത്?', o: ['കോഴിക്കോട്', 'കൊച്ചി', 'കൊല്ലം', 'കണ്ണൂർ'], c: 0, e: 'സാമൂതിരിമാർ കോഴിക്കോട് നിന്ന് ഭരിച്ചു, ഇത് ഒരു പ്രധാന വ്യാപാര കേന്ദ്രമായിരുന്നു.' },
    { t: 'പോർച്ചുഗീസുകാരുടെ വരവിന് മുമ്പ് കൊച്ചി രാജ്യം ഏത് സാമ്രാജ്യത്തിന്റെ കീഴിലായിരുന്നു?', o: ['വിജയനഗര സാമ്രാജ്യം', 'സാമൂതിരി', 'ചോള സാമ്രാജ്യം', 'പാണ്ഡ്യ സാമ്രാജ്യം'], c: 0, e: 'പോർച്ചുഗീസ് വരവിന് മുമ്പ് കൊച്ചി വിജയനഗര സാമ്രാജ്യത്തിന്റെ കീഴിലായിരുന്നു.' },
    { t: 'വേണാട് പിന്നീട് ഏത് നാട്ടുരാജ്യമായി അറിയപ്പെട്ടു?', o: ['തിരുവിതാംകൂർ', 'കൊച്ചി', 'മലബാർ', 'മദ്രാസ് പ്രസിഡൻസി'], c: 0, e: 'വേണാട് രാജ്യം തിരുവിതാംകൂർ നാട്ടുരാജ്യമായി പരിണമിച്ചു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Renaissance', 'Social Reform Movements', 'easy', () => {
  const qs = [
    { t: 'ചട്ടമ്പി സ്വാമികളുടെ യഥാർത്ഥ പേര് എന്ത്?', o: ['അയ്യപ്പൻ', 'കുമാരൻ ആശാൻ', 'ശ്രീനാരായണൻ', 'കുഞ്ഞൻ പിള്ള'], c: 0, e: 'ചട്ടമ്പി സ്വാമികളുടെ യഥാർത്ഥ പേര് അയ്യപ്പൻ എന്നായിരുന്നു.' },
    { t: 'എസ്.എൻ.ഡി.പി. യോഗം എന്ന സംഘടന സ്ഥാപിച്ച വർഷം ഏത്?', o: ['1903', '1888', '1895', '1915'], c: 0, e: 'എസ്.എൻ.ഡി.പി. യോഗം 1903-ൽ ശ്രീ നാരായണ ഗുരുവും ഡോ. പൽപ്പുവും ചേർന്ന് സ്ഥാപിച്ചു.' },
    { t: 'അയ്യങ്കാളി ഏത് സമുദായത്തിന്റെ ഉന്നമനത്തിനായി പ്രവർത്തിച്ചു?', o: ['ദളിത്', 'ഈഴവ', 'മുസ്ലീം', 'ക്രിസ്ത്യൻ'], c: 0, e: 'അയ്യങ്കാളി ദളിത് സമുദായത്തിന്റെ ഉന്നമനത്തിനായി പ്രവർത്തിച്ച സാമൂഹിക പരിഷ്കർത്താവായിരുന്നു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Constitution', 'Directive Principles', 'easy', () => {
  const qs = [
    { t: 'ഇന്ത്യൻ ഭരണഘടനയിലെ നിർദ്ദേശക തത്വങ്ങൾ ഏത് രാജ്യത്തിൽ നിന്ന് കടമെടുത്തതാണ്?', o: ['അയർലണ്ട്', 'ബ്രിട്ടൻ', 'യു.എസ്.എ.', 'കാനഡ'], c: 0, e: 'നിർദ്ദേശക തത്വങ്ങൾ അയർലണ്ട് ഭരണഘടനയിൽ നിന്ന് കടമെടുത്തതാണ്.' },
    { t: 'ഇന്ത്യൻ ഭരണഘടനയിലെ ഏത് ഭാഗത്താണ് നിർദ്ദേശക തത്വങ്ങൾ ഉൾപ്പെടുത്തിയിരിക്കുന്നത്?', o: ['ഭാഗം IV', 'ഭാഗം III', 'ഭാഗം V', 'ഭാഗം II'], c: 0, e: 'ആർട്ടിക്കിൾ 36-51-ൽ ഉൾപ്പെടുന്ന ഭാഗം IV-ലാണ് നിർദ്ദേശക തത്വങ്ങൾ.' },
    { t: 'തുല്യ ജോലിക്ക് തുല്യ വേതനം ഏത് ആർട്ടിക്കിളിൽ പറയുന്നു?', o: ['ആർട്ടിക്കിൾ 39', 'ആർട്ടിക്കിൾ 41', 'ആർട്ടിക്കിൾ 45', 'ആർട്ടിക്കിൾ 48'], c: 0, e: 'ആർട്ടിക്കിൾ 39(ഡി) പുരുഷന്മാർക്കും സ്ത്രീകൾക്കും തുല്യ ജോലിക്ക് തുല്യ വേതനം വകുപ്പ് ചെയ്യുന്നു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Constitution', 'Union Executive', 'easy', () => {
  const qs = [
    { t: 'ഇന്ത്യൻ രാഷ്ട്രപതിയുടെ ഔദ്യോഗിക വസതി ഏത്?', o: ['രാഷ്ട്രപതി ഭവൻ', 'ലോക് കല്യാൺ മാർഗ്', 'സൗത്ത് ബ്ലോക്ക്', 'നോർത്ത് ബ്ലോക്ക്'], c: 0, e: 'രാഷ്ട്രപതി ഭവൻ ഡൽഹിയിൽ സ്ഥിതി ചെയ്യുന്ന ഇന്ത്യൻ രാഷ്ട്രപതിയുടെ ഔദ്യോഗിക വസതിയാണ്.' },
    { t: 'ഇന്ത്യയിലെ ആദ്യ രാഷ്ട്രപതി ആരായിരുന്നു?', o: ['ഡോ. രാജേന്ദ്ര പ്രസാദ്', 'ഡോ. എസ്. രാധാകൃഷ്ണൻ', 'ഡോ. ബി.ആർ. അംബേദ്കർ', 'ജവഹർലാൽ നെഹ്റു'], c: 0, e: 'ഡോ. രാജേന്ദ്ര പ്രസാദ് 1950 മുതൽ 1962 വരെ ഇന്ത്യയുടെ ആദ്യ രാഷ്ട്രപതിയായിരുന്നു.' },
    { t: 'ഇന്ത്യൻ രാഷ്ട്രപതിയെ തിരഞ്ഞെടുക്കുന്നത് ആര്?', o: ['ഇലക്ടറൽ കോളേജ്', 'പാർലമെന്റ്', 'രാജ്യസഭ', 'ജനങ്ങൾ'], c: 0, e: 'രാഷ്ട്രപതിയെ ഇലക്ടറൽ കോളേജ് വഴിയാണ് തിരഞ്ഞെടുക്കുന്നത്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Science', 'Physics', 'easy', () => {
  const qs = [
    { t: 'പ്രകാശത്തിന്റെ വേഗത ഏകദേശം എത്ര?', o: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s', '3×10⁵ m/s'], c: 0, e: 'ശൂന്യതയിൽ പ്രകാശത്തിന്റെ വേഗത ഏകദേശം 3×10⁸ m/s (സെക്കൻഡിൽ 300,000 കി.മീ) ആണ്.' },
    { t: 'ഏത് ഉപകരണമാണ് വൈദ്യുത പ്രവാഹം അളക്കുന്നത്?', o: ['അമ്മീറ്റർ', 'വോൾട്ട്മീറ്റർ', 'ഗാൽവനോമീറ്റർ', 'ഓഹ്മീറ്റർ'], c: 0, e: 'അമ്മീറ്റർ ഒരു സർക്യൂട്ടിലെ വൈദ്യുത പ്രവാഹം അളക്കുന്നു.' },
    { t: 'ന്യൂട്ടന്റെ ചലനത്തിന്റെ രണ്ടാം നിയമം ഇതുമായി ബന്ധപ്പെട്ടിരിക്കുന്നു?', o: ['ബലവും ത്വരണവും', 'ജഡത്വം', 'പ്രവർത്തനവും പ്രതിപ്രവർത്തനവും', 'ഊർജ്ജ സംരക്ഷണം'], c: 0, e: 'ന്യൂട്ടന്റെ രണ്ടാം നിയമം F=ma, ബലവും ത്വരണവും തമ്മിലുള്ള ബന്ധം വിവരിക്കുന്നു.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Science', 'Biology', 'easy', () => {
  const qs = [
    { t: 'മനുഷ്യ ശരീരത്തിലെ ഏറ്റവും വലിയ അവയവം ഏത്?', o: ['ചർമ്മം', 'കരൾ', 'ഹൃദയം', 'മസ്തിഷ്കം'], c: 0, e: 'ചർമ്മം മനുഷ്യ ശരീരത്തിലെ ഏറ്റവും വലിയ അവയവമാണ്, ഏകദേശം 1.5-2 m² വിസ്തീർണ്ണമുണ്ട്.' },
    { t: 'ഹൃദയത്തിൽ എത്ര അറകളുണ്ട്?', o: ['4', '2', '3', '5'], c: 0, e: 'മനുഷ്യ ഹൃദയത്തിൽ 4 അറകളുണ്ട്: 2 ഏട്രിയയും 2 വെൻട്രിക്കിളുകളും.' },
    { t: 'പ്രകാശസംശ്ലേഷണത്തിന് ആവശ്യമായ പ്രധാന വാതകം ഏത്?', o: ['കാർബൺ ഡൈ ഓക്സൈഡ്', 'ഓക്സിജൻ', 'നൈട്രജൻ', 'ഹൈഡ്രജൻ'], c: 0, e: 'പ്രകാശസംശ്ലേഷണത്തിന് സസ്യങ്ങൾക്ക് കാർബൺ ഡൈ ഓക്സൈഡ് ആവശ്യമാണ്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Mental Ability', 'Logical Reasoning', 'easy', () => {
  const qs = [
    { t: 'സീരീസ് പൂർത്തിയാക്കുക: 2, 6, 12, 20, ?', o: ['30', '28', '32', '24'], c: 0, e: 'ക്രമം: 1×2, 2×3, 3×4, 4×5, അതിനാൽ അടുത്തത് 5×6=30.' },
    { t: '14, 21, 28, 35 എന്ന സീരീസിലെ അടുത്ത സംഖ്യ ഏത്?', o: ['42', '40', '45', '38'], c: 0, e: 'ഓരോ സംഖ്യയും 7 കൊണ്ട് വർദ്ധിക്കുന്നു, അതിനാൽ 35+7=42.' },
    { t: 'കോഡ് ബ്രേക്ക് ചെയ്യുക: APPLE എന്നത് DNROH ആണെങ്കിൽ, MANGO എന്നത് എന്ത്?', o: ['PDQJR', 'PBQIR', 'NANJQ', 'QERKT'], c: 0, e: 'ഓരോ അക്ഷരവും 3 സ്ഥാനം മുന്നോട്ട് നീക്കുന്നു: M→P, A→D, N→Q, G→J, O→R.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Geography', 'Physical Geography', 'easy', () => {
  const qs = [
    { t: 'ഭൂമിയുടെ ഏറ്റവും അടുത്തുള്ള അന്തരീക്ഷ പാളി ഏത്?', o: ['ട്രോപോസ്ഫിയർ', 'സ്ട്രാറ്റോസ്ഫിയർ', 'മെസോസ്ഫിയർ', 'തെർമോസ്ഫിയർ'], c: 0, e: 'ട്രോപോസ്ഫിയർ ഭൂമിയോട് ഏറ്റവും അടുത്തുള്ള പാളിയാണ് (8-15 കി.മീ ഉയരം).' },
    { t: 'പസിഫിക് മഹാസമുദ്രത്തിലെ ഏറ്റവും ആഴമേറിയ ഭാഗം ഏത്?', o: ['മരിയാന ട്രെഞ്ച്', 'പ്യൂർട്ടോ റിക്കോ ട്രെഞ്ച്', 'ടോംഗ ട്രെഞ്ച്', 'ജാവ ട്രെഞ്ച്'], c: 0, e: 'മരിയാന ട്രെഞ്ച് (ഏക. 11,034 മീ) ലോകത്തിലെ ഏറ്റവും ആഴമേറിയ ഭാഗമാണ്.' },
    { t: 'ഏത് നദിയാണ് ഏറ്റവും നീളമുള്ളത്?', o: ['നൈൽ', 'ആമസോൺ', 'മിസിസിപ്പി', 'യാങ്സി'], c: 0, e: 'നൈൽ നദി (ഏക. 6,650 കി.മീ) ലോകത്തിലെ ഏറ്റവും നീളമുള്ള നദിയാണ്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Kerala History', 'Kerala Geography', 'easy', () => {
  const qs = [
    { t: 'കേരളത്തിലെ ഏറ്റവും ഉയരമുള്ള കൊടുമുടി ഏത്?', o: ['ആനമുടി', 'അഗസ്ത്യകൂടം', 'ഇലവിഴ പൂഞ്ചിറ', 'പൊന്മുടി'], c: 0, e: 'ആനമുടി (2,695 മീറ്റർ) കേരളത്തിലെ ഏറ്റവും ഉയരമുള്ള കൊടുമുടിയാണ്.' },
    { t: 'കേരളത്തിലെ ഏറ്റവും നീളമുള്ള നദി ഏത്?', o: ['പെരിയാർ', 'ഭാരതപ്പുഴ', 'പമ്പാ', 'ചാലിയാർ'], c: 0, e: 'പെരിയാർ (244 കി.മീ) കേരളത്തിലെ ഏറ്റവും നീളമുള്ള നദിയാണ്.' },
    { t: 'കേരളത്തിന് എത്ര കി.മീ തീരപ്രദേശമുണ്ട്?', o: ['580 കി.മീ', '450 കി.മീ', '600 കി.മീ', '500 കി.മീ'], c: 0, e: 'കേരളത്തിന് ഏകദേശം 580 കി.മീ തീരപ്രദേശമുണ്ട്.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Quantitative Aptitude', 'Arithmetic', 'easy', () => {
  const qs = [
    { t: '12-ന്റെയും 18-ന്റെയും ല.സാ.ഗു. എത്ര?', o: ['36', '24', '72', '48'], c: 0, e: '12, 18 എന്നിവയുടെ ല.സാ.ഗു. 36 ആണ് (12=2²×3, 18=2×3², LCM=2²×3²=36).' },
    { t: 'ഒരു കടയുടമ 20% ലാഭത്തിൽ ഒരു വസ്തു ₹600-ന് വിൽക്കുന്നു. വാങ്ങിയ വില എത്ര?', o: ['₹500', '₹480', '₹520', '₹550'], c: 0, e: 'CP=SP/(1+20/100)=600/1.20=500.' },
    { t: 'ഒരു ട്രെയിൻ 60 km/h വേഗതയിൽ 2 മണിക്കൂർ സഞ്ചരിച്ചാൽ എത്ര ദൂരം?', o: ['120 കി.മീ', '100 കി.മീ', '140 കി.മീ', '80 കി.മീ'], c: 0, e: 'ദൂരം = വേഗത × സമയം = 60 × 2 = 120 കി.മീ.' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

register('Malayalam', 'Grammar', 'easy', () => {
  const qs = [
    { t: 'മലയാളത്തിലെ ആദ്യ വ്യാകരണ ഗ്രന്ഥം ഏത്?', o: ['കേരളപാണിനീയം', 'ലീലാതിലകം', 'വ്യാകരണമാലിക', 'കേരള വ്യാകരണം'], c: 0, e: 'കേരളപാണിനീയം - എ.ആർ. രാജരാജവർമ്മ രചിച്ച മലയാളത്തിലെ ആദ്യ വ്യാകരണ ഗ്രന്ഥം.' },
    { t: 'കേരളപാണിനീയത്തിന്റെ കർത്താവ് ആര്?', o: ['എ.ആർ. രാജരാജവർമ്മ', 'ഹെർമൻ ഗുണ്ടർട്ട്', 'വി. നാഗം അയ്യ', 'സി.പി. അച്യുതമേനോൻ'], c: 0, e: 'എ.ആർ. രാജരാജവർമ്മയാണ് കേരളപാണിനീയത്തിന്റെ കർത്താവ്.' },
    { t: 'മലയാള അക്ഷരമാലയിൽ എത്ര അക്ഷരങ്ങളുണ്ട്?', o: ['51', '45', '56', '48'], c: 0, e: 'മലയാള അക്ഷരമാലയിൽ 51 അക്ഷരങ്ങളുണ്ട് (13 സ്വരങ്ങളും 38 വ്യഞ്ജനങ്ങളും).' },
  ];
  const q = qs[Math.floor(Math.random() * qs.length)];
  const s = shuffleOpts(q.o[q.c], q.o.filter((_, i) => i !== q.c), q.c);
  return { text: q.t, options: s.options, correctAnswer: s.correctAnswer, explanation: q.e };
}, 'ml');

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

    // Language filter: prefer requested language, fall back to English
    const langFiltered = request.language === 'ml' ? pool.filter((t) => t.language === 'ml') : [];
    if (langFiltered.length > 0) pool = langFiltered;

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
      const q = generateFromNote(note, request.language);
      if (q && !request.avoidQuestionIds?.includes(q.id)) {
        results.push(q);
      }
    }
  }

  // Supplement with current affairs if provided
  if (request.sourceCurrentAffairs && results.length < request.count) {
    for (const ca of request.sourceCurrentAffairs) {
      if (results.length >= request.count) break;
      const q = generateFromCurrentAffair(ca, request.language);
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
