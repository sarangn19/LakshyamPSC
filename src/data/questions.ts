export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  examType: string[];
  confidence?: number;
  source?: 'syllabus' | 'notes' | 'current_affairs' | 'previous_paper' | 'ai_generated';
  subtopic?: string;
}

export const examTypes = [
  { id: 'ldc', name: 'LDC', icon: 'clipboard-text' },
  { id: 'secretariat', name: 'Secretariat Assistant', icon: 'office-building' },
  { id: 'degree', name: 'Degree Level', icon: 'school' },
  { id: 'university', name: 'University Assistant', icon: 'university' },
  { id: 'police', name: 'Police Constable', icon: 'shield' },
];

export const EXAM_DIFFICULTY: Record<string, ('easy' | 'medium' | 'hard')[]> = {
  'LDC': ['easy'],
  'Secretariat Assistant': ['easy', 'medium'],
  'University Assistant': ['easy', 'medium', 'hard'],
  'Police Constable': ['easy', 'medium'],
  'Degree Level': ['easy', 'medium', 'hard'],
};
