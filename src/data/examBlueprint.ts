export interface SubjectBlueprint {
  id: string;
  name: string;
  weight: number;
  category: 'Kerala Specific' | 'History' | 'Polity' | 'Geography' | 'Science' | 'Economy' | 'Current Affairs';
  topicWeights: Record<string, number>;
}

const DEFAULT_BLUEPRINT: SubjectBlueprint[] = [
  {
    id: 'kerala_history', name: 'Kerala History', weight: 12, category: 'Kerala Specific',
    topicWeights: { 'Ancient Kerala': 4, 'Medieval Kerala': 3, 'Modern Kerala': 5 },
  },
  {
    id: 'renaissance', name: 'Renaissance', weight: 10, category: 'Kerala Specific',
    topicWeights: { 'Social Reform Movements': 6, 'Temple Entry Movement': 4 },
  },
  {
    id: 'constitution', name: 'Constitution', weight: 10, category: 'Polity',
    topicWeights: { 'Fundamental Rights': 4, 'Directive Principles': 3, 'Union Executive': 3 },
  },
  {
    id: 'geography', name: 'Geography', weight: 8, category: 'Geography',
    topicWeights: { 'Physical Geography': 4, 'Kerala Geography': 4 },
  },
  {
    id: 'current_affairs', name: 'Current Affairs', weight: 8, category: 'Current Affairs',
    topicWeights: { 'Kerala News': 5, 'National News': 3 },
  },
  {
    id: 'science', name: 'Science', weight: 7, category: 'Science',
    topicWeights: { 'Physics': 2, 'Chemistry': 3, 'Biology': 2 },
  },
  {
    id: 'quantitative_aptitude', name: 'Quantitative Aptitude', weight: 5, category: 'Economy',
    topicWeights: { 'Arithmetic': 3, 'Data Interpretation': 2 },
  },
  {
    id: 'mental_ability', name: 'Mental Ability', weight: 5, category: 'Science',
    topicWeights: { 'Logical Reasoning': 5 },
  },
  {
    id: 'malayalam', name: 'Malayalam', weight: 5, category: 'Kerala Specific',
    topicWeights: { 'Grammar': 2, 'Literature': 3 },
  },
];

const CATEGORY_WEIGHTS: Record<string, number> = {
  'Kerala Specific': 1.2,
  'History': 1.0,
  'Polity': 1.0,
  'Geography': 0.9,
  'Science': 0.8,
  'Economy': 0.7,
  'Current Affairs': 1.1,
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
