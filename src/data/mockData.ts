import { Subject, syllabus } from './syllabus';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'voice' | 'ocr';
  subject: string;
  topicIds: string[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  easeFactor: number;
  interval: number;
  nextReviewDate: string;
  repetitions: number;
  mastered: boolean;
}

export interface DailyGoal {
  date: string;
  targetMCQs: number;
  completedMCQs: number;
  targetFlashcards: number;
  completedFlashcards: number;
  targetRevision: number;
  completedRevision: number;
}

export interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: string;
  dates: string[];
}

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  completionPercent: number;
  accuracyPercent: number;
  confidenceScore: number;
  revisionStatus: 'good' | 'needs_attention' | 'critical';
  lastStudied: string;
}

export interface PreparednessData {
  overallScore: number;
  revisionHealth: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  predictedReadiness: string;
  subjectConfidence: { subject: string; percent: number }[];
}

export interface CurrentAffair {
  id: string;
  title: string;
  summary: string;
  category: 'kerala' | 'national' | 'appointments' | 'schemes' | 'awards';
  date: string;
  source: string;
  isImportant: boolean;
  url?: string;
  image_url?: string;
}

export const mockNotes: Note[] = [
  {
    id: 'n1',
    title: 'Sree Narayana Guru - Key Points',
    content: 'Born 1855 at Chempazhanthy. Consecrated Siva idol at Aruvippuram (1888). "One Caste, One God, One Religion for Mankind". Founded SNDP Yogam with Dr. Palpu (1903).',
    type: 'text',
    subject: 'Renaissance',
    topicIds: ['st9'],
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
    tags: ['SNDP', 'Social Reform'],
  },
  {
    id: 'n2',
    title: 'Constitutional Amendments',
    content: '1st Amendment (1951) - added 9th Schedule. 42nd Amendment (1976) - added Fundamental Duties. 44th Amendment (1978) - removed Right to Property from FRs.',
    type: 'text',
    subject: 'Constitution',
    topicIds: ['st14', 'st15'],
    createdAt: '2026-06-08T14:00:00Z',
    updatedAt: '2026-06-08T14:00:00Z',
    tags: ['Amendments', 'Polity'],
  },
  {
    id: 'n3',
    title: 'Kerala Districts - Notes',
    content: '14 districts. Largest: Palakkad. Smallest: Alappuzha. Most populous: Thiruvananthapuram. Least: Wayanad. Formed: 1956 (4 districts), now 14.',
    type: 'text',
    subject: 'Geography',
    topicIds: ['st25'],
    createdAt: '2026-06-05T09:00:00Z',
    updatedAt: '2026-06-05T09:30:00Z',
    tags: ['Districts', 'Kerala'],
  },
];

export const mockFlashcards: FlashCard[] = [
  {
    id: 'f1',
    front: 'Who founded SNDP Yogam?',
    back: 'Sree Narayana Guru and Dr. Padmanabhan Palpu (1903)',
    subject: 'Renaissance',
    topic: 'SNDP Yogam',
    difficulty: 'easy',
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    repetitions: 0,
    mastered: false,
  },
  {
    id: 'f2',
    front: 'Year of Temple Entry Proclamation?',
    back: '1936 by Maharaja Sree Chithira Thirunal',
    subject: 'Renaissance',
    topic: 'Temple Entry Movement',
    difficulty: 'easy',
    easeFactor: 2.5,
    interval: 1,
    nextReviewDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    repetitions: 1,
    mastered: false,
  },
  {
    id: 'f3',
    front: 'Smallest district in Kerala by area?',
    back: 'Alappuzha (1,414 sq km)',
    subject: 'Geography',
    topic: 'Districts',
    difficulty: 'medium',
    easeFactor: 2.5,
    interval: 7,
    nextReviewDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    repetitions: 2,
    mastered: false,
  },
  {
    id: 'f4',
    front: 'Article 21 deals with?',
    back: 'Right to Life and Personal Liberty',
    subject: 'Constitution',
    topic: 'Fundamental Rights',
    difficulty: 'easy',
    easeFactor: 2.7,
    interval: 15,
    nextReviewDate: new Date(Date.now() + 86400000 * 15).toISOString(),
    repetitions: 3,
    mastered: true,
  },
  {
    id: 'f5',
    front: 'First CM of Kerala?',
    back: 'E. M. S. Namboodiripad (1957)',
    subject: 'Kerala History',
    topic: 'Formation of Kerala State',
    difficulty: 'easy',
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    repetitions: 0,
    mastered: false,
  },
];

export const mockSubjectProgress: SubjectProgress[] = [
  { subjectId: '1', subjectName: 'Kerala History', completionPercent: 75, accuracyPercent: 82, confidenceScore: 78, revisionStatus: 'good', lastStudied: '2026-06-14' },
  { subjectId: '2', subjectName: 'Renaissance', completionPercent: 90, accuracyPercent: 88, confidenceScore: 85, revisionStatus: 'good', lastStudied: '2026-06-15' },
  { subjectId: '3', subjectName: 'Constitution', completionPercent: 60, accuracyPercent: 72, confidenceScore: 65, revisionStatus: 'needs_attention', lastStudied: '2026-06-10' },
  { subjectId: '4', subjectName: 'Geography', completionPercent: 45, accuracyPercent: 60, confidenceScore: 55, revisionStatus: 'needs_attention', lastStudied: '2026-06-08' },
  { subjectId: '5', subjectName: 'Current Affairs', completionPercent: 30, accuracyPercent: 55, confidenceScore: 50, revisionStatus: 'critical', lastStudied: '2026-06-05' },
  { subjectId: '6', subjectName: 'Science', completionPercent: 40, accuracyPercent: 65, confidenceScore: 58, revisionStatus: 'needs_attention', lastStudied: '2026-06-09' },
  { subjectId: '7', subjectName: 'Quantitative Aptitude', completionPercent: 35, accuracyPercent: 50, confidenceScore: 45, revisionStatus: 'critical', lastStudied: '2026-06-06' },
  { subjectId: '8', subjectName: 'Mental Ability', completionPercent: 55, accuracyPercent: 70, confidenceScore: 62, revisionStatus: 'good', lastStudied: '2026-06-12' },
  { subjectId: '9', subjectName: 'Malayalam', completionPercent: 70, accuracyPercent: 85, confidenceScore: 80, revisionStatus: 'good', lastStudied: '2026-06-13' },
];

export const mockPreparedness: PreparednessData = {
  overallScore: 68,
  revisionHealth: 'Needs Attention',
  predictedReadiness: 'Exam Ready in 42 Days',
  subjectConfidence: [
    { subject: 'History', percent: 82 },
    { subject: 'Renaissance', percent: 88 },
    { subject: 'Constitution', percent: 65 },
    { subject: 'Geography', percent: 55 },
    { subject: 'Science', percent: 58 },
    { subject: 'Current Affairs', percent: 50 },
  ],
};

export const mockCurrentAffairs: CurrentAffair[] = [
  {
    id: 'ca1',
    title: 'Kerala launches new health insurance scheme',
    summary: 'Kerala government announced a comprehensive health insurance scheme for all residents, covering up to Rs. 5 lakh per family.',
    category: 'kerala',
    date: '2026-06-15',
    source: 'The Hindu',
    isImportant: true,
    url: 'https://www.thehindu.com/news/national/kerala/health-insurance-scheme',
  },
  {
    id: 'ca2',
    title: 'New Chief Secretary appointed for Kerala',
    summary: 'Senior IAS officer appointed as the new Chief Secretary of Kerala government.',
    category: 'kerala',
    date: '2026-06-14',
    source: 'Mathrubhumi',
    isImportant: false,
    url: 'https://www.mathrubhumi.com/news/kerala/chief-secretary',
  },
  {
    id: 'ca3',
    title: 'India elected to UN Security Council',
    summary: 'India has been elected as a non-permanent member of the UN Security Council for the 2027-28 term.',
    category: 'national',
    date: '2026-06-13',
    source: 'Times of India',
    isImportant: true,
    url: 'https://timesofindia.indiatimes.com/india/un-security-council',
  },
  {
    id: 'ca4',
    title: 'Union Budget: New education scheme announced',
    summary: 'Central government announces Rs. 10,000 crore scheme for digital infrastructure in schools.',
    category: 'national',
    date: '2026-06-12',
    source: 'PIB',
    isImportant: false,
    url: 'https://pib.gov.in/PressReleasePage.aspx?PRID=budget-education',
  },
  {
    id: 'ca5',
    title: 'New Chief Justice of India appointed',
    summary: 'Justice Surya Kant takes oath as the 52nd Chief Justice of India.',
    category: 'appointments',
    date: '2026-06-11',
    source: 'PIB',
    isImportant: true,
    url: 'https://pib.gov.in/PressReleasePage.aspx?PRID=chief-justice',
  },
  {
    id: 'ca6',
    title: 'Kerala: KIIFB approved 5 new infrastructure projects',
    summary: 'Kerala Infrastructure Investment Fund Board approved new road and bridge projects worth Rs. 2,500 crore.',
    category: 'schemes',
    date: '2026-06-10',
    source: 'The New Indian Express',
    isImportant: true,
    url: 'https://www.newindianexpress.com/states/kerala/kiifb-projects',
  },
];

export interface ExamReadiness {
  examName: string;
  readinessPercent: number;
  accuracyPercent: number;
  questionsAnswered: number;
  weakSubjects: string[];
  predictedDate: string;
}

export const mockExamReadiness: ExamReadiness[] = [
  { examName: 'LDC', readinessPercent: 78, accuracyPercent: 82, questionsAnswered: 65, weakSubjects: ['Quantitative Aptitude', 'Current Affairs'], predictedDate: 'Ready in 28 days' },
  { examName: 'Secretariat Assistant', readinessPercent: 62, accuracyPercent: 72, questionsAnswered: 48, weakSubjects: ['Geography', 'Current Affairs', 'English'], predictedDate: 'Ready in 55 days' },
  { examName: 'University Assistant', readinessPercent: 45, accuracyPercent: 65, questionsAnswered: 28, weakSubjects: ['Constitution', 'Geography', 'Reasoning'], predictedDate: 'Ready in 78 days' },
  { examName: 'Police Constable', readinessPercent: 52, accuracyPercent: 68, questionsAnswered: 22, weakSubjects: ['Law/GK', 'Physical'], predictedDate: 'Ready in 60 days' },
  { examName: 'Degree Level', readinessPercent: 31, accuracyPercent: 58, questionsAnswered: 18, weakSubjects: ['Constitution', 'Kerala History', 'Science', 'Aptitude'], predictedDate: 'Ready in 120 days' },
];

export const mockUserGoal = {
  targetExams: ['LDC', 'Secretariat Assistant'],
  primaryExam: 'Secretariat Assistant',
  examDate: '2026-09-15',
  dailyTargetMCQs: 20,
  dailyTargetFlashcards: 15,
  studyStreak: { current: 23, longest: 45, lastStudyDate: '2026-06-15', dates: [] } as StudyStreak,
  masteredTopics: ['Kerala Renaissance', 'Indian Constitution'],
  accuracyImprovement: 12,
};
