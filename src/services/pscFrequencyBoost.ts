import { TopicScore } from './infinityScorer';

// Maps PSC corpus topic names to infinity scorer subject::topic keys
const PSC_TOPIC_MAP: Record<string, string[]> = {
  'Indian Constitution::Constitutional Framework': ['Indian Constitution'],
  'Indian Constitution::Fundamental Rights': ['Fundamental Rights'],
  'Indian Constitution::Directive Principles & Fundamental Duties': ['Directive Principles'],
  'Constitution::Constitutional Bodies': ['Indian Constitution'],
  'Geography::Kerala Geography': ['Kerala Geography'],
  'Geography::Physical Geography (World)': ['Physical Geography', 'Solar System'],
  'Geography::Physiography of India': ['Indian Geography'],
  'Geography::Indian River Systems': ['Indian Geography'],
  'Science::Environmental Science & Waste Management': ['Science and Technology'],
  'Science::Biology — Human Physiology': ['Biology', 'Blood Circulation'],
  'Science::Biology — Plant Physiology & Ecology': ['Biology'],
  'Science::Chemistry — Atomic Structure & Periodicity': ['Science and Technology'],
  'Science::Physics — Mechanics & Properties of Matter': ['Science and Technology'],
  'Renaissance::Social Reform Movements': ['Kerala Renaissance'],
  'Renaissance::Temple Entry Movement': ['Kerala Renaissance'],
  'Kerala History::Modern Kerala': ['Modern Kerala'],
  'Kerala History::Ancient Kerala': ['Ancient Kerala'],
  'Kerala History::Cultural History': ['Kerala Renaissance'],
  'Quantitative Aptitude::Arithmetic': ['Profit and Loss', 'Arithmetic'],
  'Mental Ability::Analogy & Classification': ['Mental Ability'],
  'Mental Ability::Series & Patterns': ['Mental Ability'],
  'Malayalam::Grammar (വ്യാകരണം)': ['Malayalam Grammar'],
  'Malayalam::Literature (സാഹിത്യം)': ['Malayalam Literature'],
};

// Subject-level fallback
const PSC_SUBJECT_MAP: Record<string, string[]> = {
  'Kerala History': ['Kerala History'],
  'Renaissance': ['Kerala Renaissance'],
  'Constitution': ['Indian Constitution'],
  'Geography': ['Kerala Geography', 'Physical Geography', 'Indian Geography'],
  'Science': ['Science and Technology', 'Biology', 'Physics', 'Chemistry'],
  'Quantitative Aptitude': ['Profit and Loss', 'Arithmetic'],
  'Mental Ability': ['Mental Ability'],
  'Malayalam': ['Malayalam Grammar', 'Malayalam Literature'],
};

let topicFrequencyCache: Record<string, number> = {};
let lastFetch = 0;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function lookupFrequency(subject: string, topic: string): number {
  const key = `${subject}::${topic}`;
  const pscKeys = PSC_TOPIC_MAP[key] || PSC_SUBJECT_MAP[subject] || [];
  let total = 0;
  for (const pscKey of pscKeys) {
    const normKey = normalize(pscKey);
    for (const [cacheKey, count] of Object.entries(topicFrequencyCache)) {
      if (normalize(cacheKey) === normKey || normalize(cacheKey).includes(normKey) || normKey.includes(normalize(cacheKey))) {
        total += count;
      }
    }
  }
  return total;
}

function getMaxFrequency(): number {
  const values = Object.values(topicFrequencyCache);
  return values.length > 0 ? Math.max(...values) : 1;
}

export async function loadPSCFrequency(): Promise<void> {
  try {
    const { supabase } = require('./supabase');
    if (!supabase) return;
    const { data } = await supabase.functions.invoke('psc-pyq-explorer?action=topics&limit=50');
    if (data?.success && Array.isArray(data.topics)) {
      const map: Record<string, number> = {};
      for (const t of data.topics) {
        const name = t.topic || t.subject || '';
        map[name] = t.question_count || 0;
      }
      topicFrequencyCache = map;
      lastFetch = Date.now();
    }
  } catch {
    // Use cached or empty
  }
}

export function boostWithPSCFrequency(scores: TopicScore[]): TopicScore[] {
  const LEARNING_WEIGHT = 0.8;
  const PSC_WEIGHT = 0.2;
  const maxFreq = getMaxFrequency();

  return scores.map(score => {
    const freq = lookupFrequency(score.subject, score.topic);
    const pscScore = maxFreq > 0 ? freq / maxFreq : 0;

    // Weighted blend: 80% learning need, 20% PSC historical frequency
    // This prevents any topic from being recommended purely because it's "popular"
    // while still giving a meaningful boost to frequently-tested topics
    const blendedScore = LEARNING_WEIGHT * score.finalScore + PSC_WEIGHT * pscScore * 100;

    return {
      ...score,
      finalScore: blendedScore,
      pscFrequencyWeight: pscScore,
      scoreBeforePscBoost: score.finalScore,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

// Call this on app startup to seed frequency data
let seedPromise: Promise<void> | null = null;
export function seedPSCFrequency(): void {
  if (!seedPromise) seedPromise = loadPSCFrequency().catch(() => {});
}
