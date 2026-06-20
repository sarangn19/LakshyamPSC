export interface SubjectBlueprint {
  id: string;
  name: string;
  weight: number;
  category: 'Kerala Specific' | 'History' | 'Polity' | 'Geography' | 'Science' | 'Economy' | 'Current Affairs' | 'Language' | 'IT' | 'Arts' | 'Legal';
  topicWeights: Record<string, number>;
}

const DEFAULT_BLUEPRINT: SubjectBlueprint[] = [
  { id: 'kerala_history', name: 'Kerala History', weight: 12, category: 'Kerala Specific',
    topicWeights: { 'Ancient Kerala': 4, 'Medieval Kerala': 3, 'Arrival of Europeans & Early Resistance': 4, 'Modern Kerala': 5, 'Cultural History': 3 } },
  { id: 'renaissance', name: 'Renaissance', weight: 10, category: 'Kerala Specific',
    topicWeights: { 'Social Reform Movements': 5, 'Temple Entry Movement': 4, 'Major Agitations & Structural Protests': 3, 'Literary Renaissance': 2 } },
  { id: 'constitution', name: 'Constitution', weight: 10, category: 'Polity',
    topicWeights: { 'Constitutional Framework': 3, 'Fundamental Rights': 4, 'Directive Principles & Fundamental Duties': 2, 'Union Executive': 3, 'Union Legislature': 2, 'Judiciary': 3, 'State Executive & Legislature': 2, 'Federal System & Local Government': 2, 'Constitutional Bodies': 1 } },
  { id: 'geography', name: 'Geography', weight: 8, category: 'Geography',
    topicWeights: { 'Physical Geography (World)': 3, 'Geophysical Phenomena': 2, 'Physiography of India': 3, 'Indian River Systems': 2, 'Climate of India': 2, 'Kerala Geography': 4 } },
  { id: 'current_affairs', name: 'Current Affairs', weight: 8, category: 'Current Affairs',
    topicWeights: { 'Kerala News': 4, 'National News': 3, 'International News': 2, 'Science & Technology': 2, 'Sports': 1 } },
  { id: 'science', name: 'Science', weight: 7, category: 'Science',
    topicWeights: { 'Physics — Mechanics & Properties of Matter': 2, 'Physics — Light, Sound, Heat & Electronics': 2, 'Chemistry — Atomic Structure & Periodicity': 2, 'Chemistry — Acids, Bases & Chemical Reactions': 1, 'Biology — Human Physiology': 2, 'Biology — Biochemistry, Nutrition & Diseases': 1, 'Biology — Plant Physiology & Ecology': 1, 'Environmental Science & Waste Management': 1 } },
  { id: 'quantitative_aptitude', name: 'Quantitative Aptitude', weight: 5, category: 'Economy',
    topicWeights: { 'Number System & Basic Operations': 2, 'Arithmetic': 3, 'Time, Speed, Distance & Work': 2, 'Mensuration': 1, 'Algebra & Progressions': 1, 'Data Interpretation': 2 } },
  { id: 'mental_ability', name: 'Mental Ability', weight: 5, category: 'Science',
    topicWeights: { 'Series & Patterns': 2, 'Analogy & Classification': 1, 'Coding & Decoding': 1, 'Blood Relations & Direction Sense': 2, 'Syllogisms & Venn Diagrams': 1, 'Clock, Calendar & Miscellaneous': 2 } },
  { id: 'malayalam', name: 'Malayalam', weight: 5, category: 'Kerala Specific',
    topicWeights: { 'Grammar (വ്യാകരണം)': 3, 'Literature (സാഹിത്യം)': 3, 'Poetry (കവിത)': 2, 'Prose & Drama (ഗദ്യവും നാടകവും)': 1 } },
  { id: 'indian_history', name: 'Indian History & National Movement', weight: 6, category: 'History',
    topicWeights: { 'Ancient India': 3, 'Medieval India': 3, 'British Rule & Early Struggles': 3, 'Indian National Movement': 4 } },
  { id: 'world_history', name: 'World History', weight: 4, category: 'History',
    topicWeights: { 'Great Revolutions': 3, 'World Wars & International Alliances': 3 } },
  { id: 'civics_admin', name: 'Civics & Public Administration', weight: 3, category: 'Polity',
    topicWeights: { 'Bureaucracy & Administrative Machinery': 2, 'Digital Governance & E-Governance': 2, 'Social Welfare & Public Policy': 1 } },
  { id: 'indian_economy', name: 'Indian Economy', weight: 5, category: 'Economy',
    topicWeights: { 'National Income & Macroeconomic Indicators': 2, 'Banking & Monetary Policy': 2, 'Public Finance & Fiscal System': 2, 'Sectors of Indian Economy': 3, 'Planning & Development': 1 } },
  { id: 'kerala_economy', name: 'Kerala Economy', weight: 3, category: 'Economy',
    topicWeights: { 'Kerala Model of Development': 2, 'Socio-Economic Safety Networks': 2, 'Kerala Fiscal & Industrial Landscape': 1 } },
  { id: 'it_cyber', name: 'Information Technology & Cyber Laws', weight: 4, category: 'IT',
    topicWeights: { 'Computer Hardware & Architecture': 1, 'Software & Operating Systems': 1, 'Networks & Internet': 2, 'Web Technologies & Languages': 1, 'Cyber Security & Threats': 2, 'IT Act & Legal Frameworks': 1 } },
  { id: 'english', name: 'English', weight: 4, category: 'Language',
    topicWeights: { 'Grammar': 3, 'Vocabulary': 2, 'Reading Comprehension & Writing': 2 } },
  { id: 'arts_sports', name: 'Arts, Sports & Culture', weight: 3, category: 'Arts',
    topicWeights: { 'Classical & Ritualistic Art Forms': 2, 'Folk & Traditional Arts': 1, 'Malayalam Cinema': 1, 'Sports & Athletics': 2 } },
  { id: 'special_acts', name: 'Special Acts & Social Welfare', weight: 4, category: 'Legal',
    topicWeights: { 'Human Rights & Civil Rights': 2, 'Gender & Child Welfare': 2, 'Transparency & Anti-Corruption': 2 } },
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  'Kerala Specific': 1.2,
  'History': 1.0,
  'Polity': 1.0,
  'Geography': 0.9,
  'Science': 0.8,
  'Economy': 0.7,
  'Current Affairs': 1.1,
  'Language': 0.8,
  'IT': 0.9,
  'Arts': 0.7,
  'Legal': 1.0,
};

let blueprint = [...DEFAULT_BLUEPRINT];

export function getBlueprint(): SubjectBlueprint[] {
  return blueprint;
}

export function getTopicWeight(subjectName: string, topicName: string): number {
  const sub = blueprint.find((s) => s.name === subjectName);
  if (!sub) return 1;
  return sub.topicWeights[topicName] ?? 1;
}

export function getSubjectWeight(subjectName: string): number {
  const sub = blueprint.find((s) => s.name === subjectName);
  if (!sub) return 1;
  const catMul = CATEGORY_WEIGHTS[sub.category] ?? 1;
  return sub.weight * catMul;
}

export function getCategoryBoost(subjectName: string): number {
  const sub = blueprint.find((s) => s.name === subjectName);
  if (!sub) return 1;
  return CATEGORY_WEIGHTS[sub.category] ?? 1;
}

export function updateBlueprint(overrides: Partial<SubjectBlueprint>[]): void {
  blueprint = DEFAULT_BLUEPRINT.map((sub) => {
    const override = overrides.find((o) => o.id === sub.id);
    return override ? { ...sub, ...override } : sub;
  });
}

export function resetBlueprint(): void {
  blueprint = [...DEFAULT_BLUEPRINT];
}
