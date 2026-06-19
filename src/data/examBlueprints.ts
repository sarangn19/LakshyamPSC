export interface SubjectWeight {
  subjectId: string;
  subjectName: string;
  weight: number;
  topicWeights?: { topicName: string; weight: number }[];
}

export interface ExamBlueprint {
  examName: string;
  subjectWeights: SubjectWeight[];
}

const BLUEPRINTS: Record<string, ExamBlueprint> = {
  'LDC': {
    examName: 'LDC',
    subjectWeights: [
      { subjectId: 'subj_history', subjectName: 'Kerala History', weight: 20, topicWeights: [{ topicName: 'Ancient Kerala', weight: 4 }, { topicName: 'Medieval Kerala', weight: 4 }, { topicName: 'Modern Kerala', weight: 5 }, { topicName: 'Cultural History', weight: 3 }, { topicName: 'Freedom Struggle', weight: 4 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 15, topicWeights: [{ topicName: 'Social Reform Movements', weight: 5 }, { topicName: 'Temple Entry Movement', weight: 4 }, { topicName: 'Literary Renaissance', weight: 3 }, { topicName: 'Women Empowerment', weight: 3 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 15, topicWeights: [{ topicName: 'Fundamental Rights', weight: 3 }, { topicName: 'Directive Principles', weight: 2 }, { topicName: 'Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 2 }, { topicName: 'Union Legislature', weight: 2 }, { topicName: 'Judiciary', weight: 2 }, { topicName: 'State Executive', weight: 1 }, { topicName: 'State Legislature', weight: 1 }, { topicName: 'Federal System', weight: 1 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 15, topicWeights: [{ topicName: 'Physical Geography', weight: 4 }, { topicName: 'Indian Geography', weight: 4 }, { topicName: 'World Geography', weight: 2 }, { topicName: 'Kerala Geography', weight: 3 }, { topicName: 'Environment & Ecology', weight: 2 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 10, topicWeights: [{ topicName: 'Physics', weight: 3 }, { topicName: 'Chemistry', weight: 3 }, { topicName: 'Biology', weight: 3 }, { topicName: 'Environmental Science', weight: 1 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 10, topicWeights: [{ topicName: 'Kerala News', weight: 3 }, { topicName: 'National News', weight: 3 }, { topicName: 'International News', weight: 1 }, { topicName: 'Sports', weight: 1 }, { topicName: 'Science & Technology', weight: 2 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 5, topicWeights: [{ topicName: 'Number System', weight: 1 }, { topicName: 'Arithmetic', weight: 2 }, { topicName: 'Algebra', weight: 1 }, { topicName: 'Geometry & Mensuration', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 0.5 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series Completion', weight: 1 }, { topicName: 'Analogy & Classification', weight: 1 }, { topicName: 'Coding-Decoding', weight: 1 }, { topicName: 'Blood Relations', weight: 0.5 }, { topicName: 'Direction Sense', weight: 0.5 }, { topicName: 'Syllogisms', weight: 0.5 }, { topicName: 'Venn Diagrams', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2 }, { topicName: 'Literature', weight: 1.5 }, { topicName: 'Poetry', weight: 1 }, { topicName: 'Prose & Drama', weight: 0.5 }] },
    ],
  },
  'Secretariat Assistant': {
    examName: 'Secretariat Assistant',
    subjectWeights: [
      { subjectId: 'subj_history', subjectName: 'Kerala History', weight: 15, topicWeights: [{ topicName: 'Ancient Kerala', weight: 3 }, { topicName: 'Medieval Kerala', weight: 3 }, { topicName: 'Modern Kerala', weight: 4 }, { topicName: 'Cultural History', weight: 2 }, { topicName: 'Freedom Struggle', weight: 3 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 10, topicWeights: [{ topicName: 'Social Reform Movements', weight: 3 }, { topicName: 'Temple Entry Movement', weight: 3 }, { topicName: 'Literary Renaissance', weight: 2 }, { topicName: 'Women Empowerment', weight: 2 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 20, topicWeights: [{ topicName: 'Fundamental Rights', weight: 3 }, { topicName: 'Directive Principles', weight: 2 }, { topicName: 'Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 3 }, { topicName: 'Union Legislature', weight: 3 }, { topicName: 'Judiciary', weight: 2 }, { topicName: 'State Executive', weight: 2 }, { topicName: 'State Legislature', weight: 2 }, { topicName: 'Federal System', weight: 2 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 10, topicWeights: [{ topicName: 'Physical Geography', weight: 2 }, { topicName: 'Indian Geography', weight: 3 }, { topicName: 'World Geography', weight: 1 }, { topicName: 'Kerala Geography', weight: 2 }, { topicName: 'Environment & Ecology', weight: 2 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 10, topicWeights: [{ topicName: 'Physics', weight: 3 }, { topicName: 'Chemistry', weight: 3 }, { topicName: 'Biology', weight: 3 }, { topicName: 'Environmental Science', weight: 1 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 15, topicWeights: [{ topicName: 'Kerala News', weight: 5 }, { topicName: 'National News', weight: 4 }, { topicName: 'International News', weight: 2 }, { topicName: 'Sports', weight: 1 }, { topicName: 'Science & Technology', weight: 3 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 10, topicWeights: [{ topicName: 'Number System', weight: 2 }, { topicName: 'Arithmetic', weight: 4 }, { topicName: 'Algebra', weight: 1 }, { topicName: 'Geometry & Mensuration', weight: 1 }, { topicName: 'Data Interpretation', weight: 2 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series Completion', weight: 1 }, { topicName: 'Analogy & Classification', weight: 1 }, { topicName: 'Coding-Decoding', weight: 1 }, { topicName: 'Blood Relations', weight: 0.5 }, { topicName: 'Direction Sense', weight: 0.5 }, { topicName: 'Syllogisms', weight: 0.5 }, { topicName: 'Venn Diagrams', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2 }, { topicName: 'Literature', weight: 1 }, { topicName: 'Poetry', weight: 1 }, { topicName: 'Prose & Drama', weight: 1 }] },
    ],
  },
  'Degree Level': {
    examName: 'Degree Level',
    subjectWeights: [
      { subjectId: 'subj_history', subjectName: 'Kerala History', weight: 15, topicWeights: [{ topicName: 'Ancient Kerala', weight: 3 }, { topicName: 'Medieval Kerala', weight: 3 }, { topicName: 'Modern Kerala', weight: 4 }, { topicName: 'Cultural History', weight: 3 }, { topicName: 'Freedom Struggle', weight: 2 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 10, topicWeights: [{ topicName: 'Social Reform Movements', weight: 4 }, { topicName: 'Temple Entry Movement', weight: 2 }, { topicName: 'Literary Renaissance', weight: 2 }, { topicName: 'Women Empowerment', weight: 2 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 20, topicWeights: [{ topicName: 'Fundamental Rights', weight: 3 }, { topicName: 'Directive Principles', weight: 2 }, { topicName: 'Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 3 }, { topicName: 'Union Legislature', weight: 2 }, { topicName: 'Judiciary', weight: 3 }, { topicName: 'State Executive', weight: 2 }, { topicName: 'State Legislature', weight: 1 }, { topicName: 'Federal System', weight: 2 }, { topicName: 'Constitutional Amendments', weight: 1 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 15, topicWeights: [{ topicName: 'Physical Geography', weight: 3 }, { topicName: 'Indian Geography', weight: 4 }, { topicName: 'World Geography', weight: 2 }, { topicName: 'Kerala Geography', weight: 3 }, { topicName: 'Environment & Ecology', weight: 2 }, { topicName: 'Disaster Management', weight: 1 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 15, topicWeights: [{ topicName: 'Physics', weight: 4 }, { topicName: 'Chemistry', weight: 4 }, { topicName: 'Biology', weight: 5 }, { topicName: 'Environmental Science', weight: 2 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 10, topicWeights: [{ topicName: 'Kerala News', weight: 3 }, { topicName: 'National News', weight: 3 }, { topicName: 'International News', weight: 2 }, { topicName: 'Sports', weight: 1 }, { topicName: 'Science & Technology', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 10, topicWeights: [{ topicName: 'Number System', weight: 2 }, { topicName: 'Arithmetic', weight: 3 }, { topicName: 'Algebra', weight: 1 }, { topicName: 'Geometry & Mensuration', weight: 2 }, { topicName: 'Data Interpretation', weight: 2 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series Completion', weight: 1 }, { topicName: 'Analogy & Classification', weight: 1 }, { topicName: 'Coding-Decoding', weight: 0.5 }, { topicName: 'Blood Relations', weight: 0.5 }, { topicName: 'Direction Sense', weight: 0.5 }, { topicName: 'Syllogisms', weight: 0.5 }, { topicName: 'Venn Diagrams', weight: 0.5 }, { topicName: 'Puzzles', weight: 0.5 }] },
    ],
  },
  'University Assistant': {
    examName: 'University Assistant',
    subjectWeights: [
      { subjectId: 'subj_history', subjectName: 'Kerala History', weight: 15, topicWeights: [{ topicName: 'Ancient Kerala', weight: 3 }, { topicName: 'Medieval Kerala', weight: 3 }, { topicName: 'Modern Kerala', weight: 4 }, { topicName: 'Cultural History', weight: 3 }, { topicName: 'Freedom Struggle', weight: 2 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 10, topicWeights: [{ topicName: 'Social Reform Movements', weight: 3 }, { topicName: 'Temple Entry Movement', weight: 3 }, { topicName: 'Literary Renaissance', weight: 2 }, { topicName: 'Women Empowerment', weight: 2 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 20, topicWeights: [{ topicName: 'Fundamental Rights', weight: 3 }, { topicName: 'Directive Principles', weight: 2 }, { topicName: 'Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 3 }, { topicName: 'Union Legislature', weight: 2 }, { topicName: 'Judiciary', weight: 3 }, { topicName: 'State Executive', weight: 2 }, { topicName: 'State Legislature', weight: 1 }, { topicName: 'Federal System', weight: 2 }, { topicName: 'Constitutional Bodies', weight: 1 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 10, topicWeights: [{ topicName: 'Physical Geography', weight: 2 }, { topicName: 'Indian Geography', weight: 3 }, { topicName: 'World Geography', weight: 1 }, { topicName: 'Kerala Geography', weight: 2 }, { topicName: 'Environment & Ecology', weight: 2 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 10, topicWeights: [{ topicName: 'Physics', weight: 3 }, { topicName: 'Chemistry', weight: 3 }, { topicName: 'Biology', weight: 3 }, { topicName: 'Environmental Science', weight: 1 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 10, topicWeights: [{ topicName: 'Kerala News', weight: 3 }, { topicName: 'National News', weight: 3 }, { topicName: 'International News', weight: 2 }, { topicName: 'Sports', weight: 1 }, { topicName: 'Science & Technology', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 10, topicWeights: [{ topicName: 'Number System', weight: 2 }, { topicName: 'Arithmetic', weight: 3 }, { topicName: 'Algebra', weight: 1 }, { topicName: 'Geometry & Mensuration', weight: 2 }, { topicName: 'Data Interpretation', weight: 2 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series Completion', weight: 1 }, { topicName: 'Analogy & Classification', weight: 1 }, { topicName: 'Coding-Decoding', weight: 0.5 }, { topicName: 'Blood Relations', weight: 0.5 }, { topicName: 'Direction Sense', weight: 0.5 }, { topicName: 'Syllogisms', weight: 0.5 }, { topicName: 'Venn Diagrams', weight: 0.5 }, { topicName: 'Puzzles', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 10, topicWeights: [{ topicName: 'Grammar', weight: 3 }, { topicName: 'Literature', weight: 3 }, { topicName: 'Poetry', weight: 2 }, { topicName: 'Prose & Drama', weight: 2 }] },
    ],
  },
  'Police Constable': {
    examName: 'Police Constable',
    subjectWeights: [
      { subjectId: 'subj_history', subjectName: 'Kerala History', weight: 15, topicWeights: [{ topicName: 'Ancient Kerala', weight: 3 }, { topicName: 'Medieval Kerala', weight: 3 }, { topicName: 'Modern Kerala', weight: 4 }, { topicName: 'Cultural History', weight: 2 }, { topicName: 'Freedom Struggle', weight: 3 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 15, topicWeights: [{ topicName: 'Social Reform Movements', weight: 5 }, { topicName: 'Temple Entry Movement', weight: 4 }, { topicName: 'Literary Renaissance', weight: 3 }, { topicName: 'Women Empowerment', weight: 3 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 20, topicWeights: [{ topicName: 'Fundamental Rights', weight: 4 }, { topicName: 'Directive Principles', weight: 2 }, { topicName: 'Fundamental Duties', weight: 2 }, { topicName: 'Union Executive', weight: 2 }, { topicName: 'Union Legislature', weight: 2 }, { topicName: 'Judiciary', weight: 3 }, { topicName: 'State Executive', weight: 2 }, { topicName: 'State Legislature', weight: 1 }, { topicName: 'Federal System', weight: 2 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 15, topicWeights: [{ topicName: 'Physical Geography', weight: 4 }, { topicName: 'Indian Geography', weight: 4 }, { topicName: 'World Geography', weight: 2 }, { topicName: 'Kerala Geography', weight: 3 }, { topicName: 'Environment & Ecology', weight: 2 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 15, topicWeights: [{ topicName: 'Physics', weight: 4 }, { topicName: 'Chemistry', weight: 3 }, { topicName: 'Biology', weight: 5 }, { topicName: 'Environmental Science', weight: 3 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 10, topicWeights: [{ topicName: 'Kerala News', weight: 3 }, { topicName: 'National News', weight: 3 }, { topicName: 'International News', weight: 1 }, { topicName: 'Sports', weight: 1 }, { topicName: 'Science & Technology', weight: 2 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 10, topicWeights: [{ topicName: 'Series Completion', weight: 2 }, { topicName: 'Analogy & Classification', weight: 2 }, { topicName: 'Coding-Decoding', weight: 1 }, { topicName: 'Blood Relations', weight: 1 }, { topicName: 'Direction Sense', weight: 1 }, { topicName: 'Syllogisms', weight: 1 }, { topicName: 'Venn Diagrams', weight: 1 }, { topicName: 'Puzzles', weight: 1 }] },
    ],
  },
};

export function getBlueprint(examName: string): ExamBlueprint | undefined {
  return BLUEPRINTS[examName];
}

export function getSubjectWeight(examName: string, subjectName: string): number {
  const bp = BLUEPRINTS[examName];
  if (!bp) return 0;
  const sw = bp.subjectWeights.find((s) => s.subjectName === subjectName);
  return sw?.weight ?? 0;
}

export function getTopicWeight(examName: string, subjectName: string, topicName: string): number {
  const bp = BLUEPRINTS[examName];
  if (!bp) return 0;
  const sw = bp.subjectWeights.find((s) => s.subjectName === subjectName);
  if (!sw?.topicWeights) return sw?.weight ?? 0;
  const tw = sw.topicWeights.find((t) => t.topicName === topicName);
  return tw?.weight ?? 0;
}

export function getWeightedPriority(
  examName: string,
  subjectName: string,
  topicName: string | undefined,
): number {
  const subjectWeight = getSubjectWeight(examName, subjectName);
  if (!topicName) return subjectWeight;
  const topicWeight = getTopicWeight(examName, subjectName, topicName);
  return topicWeight > 0 ? topicWeight : subjectWeight;
}

export function getCompositeExamWeight(
  examNames: string[],
  subjectName: string,
  topicName?: string,
): number {
  if (examNames.length === 0) return 5;
  const total = examNames.reduce((sum, name) => {
    return sum + getWeightedPriority(name, subjectName, topicName);
  }, 0);
  return examNames.length > 0 ? Math.round(total / examNames.length) : 0;
}

export function getAllBlueprintNames(): string[] {
  return Object.keys(BLUEPRINTS);
}
