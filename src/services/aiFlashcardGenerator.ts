import { Note, FlashCard } from '../data/mockData';
import { syllabus } from '../data/syllabus';

interface FlashcardRequest {
  note?: Note;
  subject?: string;
  topic?: string;
  count: number;
}

const FACT_TEMPLATES: Record<string, { front: string; back: string }[]> = {
  'Renaissance': [
    { front: 'Who founded SNDP Yogam?', back: 'Sree Narayana Guru and Dr. Padmanabhan Palpu (1903)' },
    { front: 'Year of Temple Entry Proclamation?', back: '1936 by Maharaja Sree Chithira Thirunal' },
    { front: 'Leader of Vaikom Satyagraha?', back: 'K. Kelappan (Kerala Gandhi), 1924-25' },
    { front: 'Sree Narayana Guru\'s birth year?', back: '1855 at Chempazhanthy' },
    { front: 'Sree Narayana Guru\'s famous motto?', back: '"One Caste, One God, One Religion for Mankind"' },
    { front: 'Where did Sree Narayana Guru consecrate first temple?', back: 'Aruvippuram (1888)' },
    { front: 'Chattambi Swamikal\'s real name?', back: 'Ayyappan (1853-1924)' },
    { front: 'Who wrote "Atmopadesa Satakam"?', back: 'Sree Narayana Guru' },
    { front: 'SNDP Yogam founding year?', back: '1903' },
    { front: 'What was the Vaikom Satyagraha demanding?', back: 'Right for lower castes to use the temple road' },
  ],
  'Kerala History': [
    { front: 'First Chief Minister of Kerala?', back: 'E. M. S. Namboodiripad (1957)' },
    { front: 'Kerala formation date?', back: '1 November 1956' },
    { front: 'Act that formed Kerala?', back: 'States Reorganisation Act, 1956' },
    { front: 'Which district was not in original Kerala?', back: 'Kasaragod' },
    { front: 'Roman port in ancient Kerala?', back: 'Muziris (Kodungallur)' },
    { front: 'Chera dynasty emblem?', back: 'Bow and Arrow' },
    { front: 'What is Venad later known as?', back: 'Travancore princely state' },
    { front: 'Capital of Zamorins?', back: 'Calicut (Kozhikode)' },
    { front: 'Portuguese first arrived in Kerala at?', back: 'Kappad, Kozhikode (1498)' },
    { front: 'Who was the last Maharaja of Travancore?', back: 'Sree Chithira Thirunal Balarama Varma' },
  ],
  'Constitution': [
    { front: 'Article 21?', back: 'Right to Life and Personal Liberty' },
    { front: 'Article 14?', back: 'Right to Equality' },
    { front: 'Article 19?', back: 'Right to Freedom (6 freedoms)' },
    { front: 'Article 32?', back: 'Right to Constitutional Remedies' },
    { front: 'How many Fundamental Rights originally?', back: 'Seven (now six after 44th Amendment)' },
    { front: 'DPSPs borrowed from which country?', back: 'Ireland' },
    { front: 'Article 44?', back: 'Uniform Civil Code' },
    { front: '86th Amendment added which Article?', back: '21A - Right to Education (6-14 years)' },
    { front: 'Basic Structure Doctrine case?', back: 'Kesavananda Bharati (1973)' },
    { front: '42nd Amendment (1976) added?', back: 'Fundamental Duties (Part IVA)' },
  ],
  'Geography': [
    { front: 'Number of districts in Kerala?', back: '14' },
    { front: 'Largest district in Kerala?', back: 'Palakkad' },
    { front: 'Smallest district in Kerala?', back: 'Alappuzha' },
    { front: 'Longest river in Kerala?', back: 'Periyar (244 km)' },
    { front: 'River known as "Ganga of Kerala"?', back: 'Pamba' },
    { front: 'Highest peak in Kerala?', back: 'Anamudi (2,695 m)' },
    { front: 'Kerala\'s coastline length?', back: 'Approximately 580 km' },
    { front: 'Western Ghats run through how many states?', back: '6 states (including Kerala)' },
    { front: 'Largest backwater in Kerala?', back: 'Vembanad Lake' },
    { front: 'Kerala lies between which latitudes?', back: '8°N to 12°N' },
  ],
  'Science': [
    { front: 'Most abundant gas in atmosphere?', back: 'Nitrogen (78%)' },
    { front: 'Chemical symbol of Gold?', back: 'Au (Aurum)' },
    { front: 'Largest organ in human body?', back: 'Skin' },
    { front: 'Number of bones in adult human?', back: '206' },
    { front: 'Boiling point of water at sea level?', back: '100°C (212°F)' },
    { front: 'Chemical symbol of Silver?', back: 'Ag (Argentum)' },
    { front: 'Closest planet to the Sun?', back: 'Mercury' },
    { front: 'Largest planet in solar system?', back: 'Jupiter' },
    { front: 'Blood pH range?', back: '7.35 to 7.45' },
    { front: 'Unit of electric current?', back: 'Ampere' },
  ],
  'Malayalam': [
    { front: 'Father of Malayalam literature?', back: 'Thunchaththu Ramanujan Ezhuthachan' },
    { front: 'Adhyatma Ramayana author?', back: 'Thunchaththu Ezhuthachan' },
    { front: '"Mahakavi" title given to?', back: 'Vallathol Narayana Menon' },
    { front: 'Kumaran Asan\'s famous poem?', back: '"Sree Narayana Guru" (dukha samudram)' },
    { front: 'Sahitya Akademi award first Malayalam winner?', back: 'G. Sankara Kurup' },
    { front: 'Jnanpith award first Malayalam winner?', back: 'G. Sankara Kurup (1970)' },
    { front: '"Kerala Panini" is?', back: 'Hermann Gundert (German scholar)' },
    { front: 'First Malayalam novel?', back: '"Kundalatha" by Appu Nedungadi (1887)' },
    { front: 'First Malayalam newspaper?', back: '"Rajya Samacharam" (1847) by Hermann Gundert' },
    { front: 'Malayalam is a classical language since?', back: '2013 (classical language status)' },
  ],
  'Current Affairs': [
    { front: 'India\'s Chief Justice in 2026?', back: 'Justice Surya Kant (52nd CJI)' },
    { front: 'Kerala\'s health insurance scheme coverage?', back: 'Up to Rs. 5 lakh per family' },
    { front: 'KIIFB full form?', back: 'Kerala Infrastructure Investment Fund Board' },
    { front: 'India elected to which UN body in 2026?', back: 'UN Security Council (non-permanent, 2027-28)' },
    { front: 'New Kerala Chief Secretary appointed?', back: 'Senior IAS officer (2026)' },
    { front: 'Union budget education scheme amount?', back: 'Rs. 10,000 crore for digital infrastructure' },
  ],
  'Mental Ability': [
    { front: 'Analogy: Book : Read :: Food : ?', back: 'Eat' },
    { front: 'Analogy: Eye : Vision :: Ear : ?', back: 'Hearing' },
    { front: 'Coding: if CAT = 24, then DOG = ?', back: '26 (C=3, A=1, T=20 → 24; D=4, O=15, G=7 → 26)' },
    { front: 'Which number is odd: 2, 3, 5, 8, 13?', back: '8 (Fibonacci series, 8 should be 7)' },
    { front: 'If Monday = 1, Wednesday = ?', back: '3' },
  ],
  'Quantitative Aptitude': [
    { front: '25% of 200 = ?', back: '50' },
    { front: 'Increase 50 to 60: % change?', back: '20% increase' },
    { front: '20% increase then 10% decrease = ?', back: '8% net increase' },
    { front: 'Average of 10, 20, 30?', back: '20' },
    { front: 'Simple interest on 1000 at 5% for 2 years?', back: 'Rs. 100' },
  ],
};

function extractKeyTerms(content: string, maxPairs: number): { front: string; back: string }[] {
  const pairs: { front: string; back: string }[] = [];
  const lines = content.split('\n').filter((l) => l.trim().length > 10);

  for (const line of lines) {
    if (pairs.length >= maxPairs) break;

    const trimmed = line.trim();

    // Try em-dash separator: "Front — Back"
    const emDash = trimmed.split('—');
    if (emDash.length >= 2) {
      pairs.push({ front: emDash[0].trim(), back: emDash.slice(1).join('—').trim() });
      continue;
    }

    // Try colon separator: "Key Point: Description"
    const colon = trimmed.split(':');
    if (colon.length >= 2 && colon[0].length <= 40) {
      pairs.push({ front: colon[0].trim(), back: colon.slice(1).join(':').trim() });
      continue;
    }

    // Bullet point or hyphen line: use first 40 chars as front, full line as back
    const bulletMatch = trimmed.match(/^[-•]\s*(.+)/);
    if (bulletMatch) {
      const text = bulletMatch[1];
      const front = text.length > 40 ? text.slice(0, 40).trimEnd() + '...' : text;
      pairs.push({ front, back: text });
      continue;
    }
  }
  return pairs;
}

function makeCard(front: string, back: string, subject: string, topic: string): FlashCard {
  return {
    id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    front,
    back,
    subject,
    topic,
    difficulty: front.length < 40 && back.length < 60 ? 'easy' : front.length < 70 ? 'medium' : 'hard',
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: new Date().toISOString(),
    repetitions: 0,
    mastered: false,
  };
}

export function generateFlashcards(request: FlashcardRequest): FlashCard[] {
  const results: FlashCard[] = [];
  const usedPairs = new Set<string>();

  if (request.note) {
    const notePairs = extractKeyTerms(request.note.content, 3);
    for (const pair of notePairs) {
      const key = `${request.note.subject}|${pair.front}`;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);
      results.push(makeCard(pair.front, pair.back, request.note.subject, request.note.tags[0] || 'General'));
    }
  }

  const subjectFilter = request.subject || (request.note?.subject);
  const topicFilter = request.topic;

  for (const [subject, templates] of Object.entries(FACT_TEMPLATES)) {
    if (subjectFilter && subject !== subjectFilter) continue;

    for (const tpl of templates) {
      if (results.length >= request.count) break;
      const key = `${subject}|${tpl.front}`;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);
      results.push(makeCard(tpl.front, tpl.back, subject, topicFilter || subject));
    }
    if (results.length >= request.count) break;
  }

  // If still not enough and no subject filter matched, fill from any subject
  if (results.length < request.count && !subjectFilter) {
    for (const [subject, templates] of Object.entries(FACT_TEMPLATES)) {
      for (const tpl of templates) {
        if (results.length >= request.count) break;
        const key = `${subject}|${tpl.front}`;
        if (usedPairs.has(key)) continue;
        usedPairs.add(key);
        results.push(makeCard(tpl.front, tpl.back, subject, subject));
      }
      if (results.length >= request.count) break;
    }
  }

  // Last resort: if there's a note but nothing matched, use generic cards from note lines
  if (results.length === 0 && request.note) {
    const lines = request.note.content.split('\n').filter((l) => l.trim().length > 15);
    for (const line of lines) {
      if (results.length >= request.count) break;
      const text = line.replace(/^[-•\s]+/, '').trim();
      if (text.length > 10) {
        const front = text.length > 50 ? text.slice(0, 50).trimEnd() + '...' : text;
        results.push(makeCard(front, text, request.note.subject, 'General'));
      }
    }
  }

  return results.slice(0, request.count).sort(() => Math.random() - 0.5);
}

export function generateFlashcardsFromNote(note: Note, count: number = 5): FlashCard[] {
  return generateFlashcards({ note, count });
}

export function generateFlashcardsForSubject(subject: string, count: number = 10): FlashCard[] {
  return generateFlashcards({ subject, count });
}
