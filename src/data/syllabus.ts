export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  subtopics: Subtopic[];
}

export interface Subtopic {
  id: string;
  name: string;
}

export const syllabus: Subject[] = [
  {
    id: '1',
    name: 'Kerala History',
    icon: 'book',
    color: '#6BCB77',
    topics: [
      {
        id: 't1',
        name: 'Ancient Kerala',
        subtopics: [
          { id: 'st1', name: 'Pre-historic Kerala' },
          { id: 'st2', name: 'Sangam Period' },
          { id: 'st3', name: 'Chera Dynasty' },
        ],
      },
      {
        id: 't2',
        name: 'Medieval Kerala',
        subtopics: [
          { id: 'st4', name: 'Venad Kingdom' },
          { id: 'st5', name: 'Zamorins of Calicut' },
          { id: 'st6', name: 'Kochi Kingdom' },
        ],
      },
      {
        id: 't3',
        name: 'Modern Kerala',
        subtopics: [
          { id: 'st7', name: 'British Rule' },
          { id: 'st8', name: 'Formation of Kerala State' },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Renaissance',
    icon: 'lightbulb',
    color: '#4D96FF',
    topics: [
      {
        id: 't4',
        name: 'Social Reform Movements',
        subtopics: [
          { id: 'st9', name: 'Sree Narayana Guru' },
          { id: 'st10', name: 'SNDP Yogam' },
          { id: 'st11', name: 'Chattambi Swamikal' },
        ],
      },
      {
        id: 't5',
        name: 'Temple Entry Movement',
        subtopics: [
          { id: 'st12', name: 'Vaikom Satyagraha' },
          { id: 'st13', name: 'Temple Entry Proclamation' },
        ],
      },
    ],
  },
  {
    id: '3',
    name: 'Constitution',
    icon: 'scale-balance',
    color: '#FF6B6B',
    topics: [
      {
        id: 't6',
        name: 'Fundamental Rights',
        subtopics: [
          { id: 'st14', name: 'Right to Equality' },
          { id: 'st15', name: 'Right to Freedom' },
          { id: 'st16', name: 'Right to Constitutional Remedies' },
        ],
      },
      {
        id: 't7',
        name: 'Directive Principles',
        subtopics: [
          { id: 'st17', name: 'Socialistic Principles' },
          { id: 'st18', name: 'Gandhian Principles' },
        ],
      },
      {
        id: 't8',
        name: 'Union Executive',
        subtopics: [
          { id: 'st19', name: 'President' },
          { id: 'st20', name: 'Prime Minister' },
          { id: 'st21', name: 'Council of Ministers' },
        ],
      },
    ],
  },
  {
    id: '4',
    name: 'Geography',
    icon: 'globe',
    color: '#FFD93D',
    topics: [
      {
        id: 't9',
        name: 'Physical Geography',
        subtopics: [
          { id: 'st22', name: 'Climate' },
          { id: 'st23', name: 'Rivers' },
          { id: 'st24', name: 'Soil Types' },
        ],
      },
      {
        id: 't10',
        name: 'Kerala Geography',
        subtopics: [
          { id: 'st25', name: 'Districts' },
          { id: 'st26', name: 'Western Ghats' },
          { id: 'st27', name: 'Backwaters' },
        ],
      },
    ],
  },
  {
    id: '5',
    name: 'Current Affairs',
    icon: 'newspaper',
    color: '#FF8C42',
    topics: [
      {
        id: 't11',
        name: 'Kerala News',
        subtopics: [
          { id: 'st28', name: 'Government Schemes' },
          { id: 'st29', name: 'Infrastructure' },
        ],
      },
      {
        id: 't12',
        name: 'National News',
        subtopics: [
          { id: 'st30', name: 'Appointments' },
          { id: 'st31', name: 'Awards' },
        ],
      },
    ],
  },
  {
    id: '6',
    name: 'Science',
    icon: 'flask',
    color: '#A66CFF',
    topics: [
      {
        id: 't13',
        name: 'Physics',
        subtopics: [
          { id: 'st32', name: 'Motion' },
          { id: 'st33', name: 'Energy' },
        ],
      },
      {
        id: 't14',
        name: 'Chemistry',
        subtopics: [
          { id: 'st34', name: 'Periodic Table' },
          { id: 'st35', name: 'Chemical Reactions' },
        ],
      },
      {
        id: 't15',
        name: 'Biology',
        subtopics: [
          { id: 'st36', name: 'Human Body' },
          { id: 'st37', name: 'Ecology' },
        ],
      },
    ],
  },
  {
    id: '7',
    name: 'Quantitative Aptitude',
    icon: 'calculator',
    color: '#FF6B9D',
    topics: [
      {
        id: 't16',
        name: 'Arithmetic',
        subtopics: [
          { id: 'st38', name: 'Percentages' },
          { id: 'st39', name: 'Ratios' },
        ],
      },
      {
        id: 't17',
        name: 'Data Interpretation',
        subtopics: [
          { id: 'st40', name: 'Charts' },
          { id: 'st41', name: 'Tables' },
        ],
      },
    ],
  },
  {
    id: '8',
    name: 'Mental Ability',
    icon: 'brain',
    color: '#00D2FF',
    topics: [
      {
        id: 't18',
        name: 'Logical Reasoning',
        subtopics: [
          { id: 'st42', name: 'Analogies' },
          { id: 'st43', name: 'Coding-Decoding' },
        ],
      },
    ],
  },
  {
    id: '9',
    name: 'Malayalam',
    icon: 'text',
    color: '#FFB347',
    topics: [
      {
        id: 't19',
        name: 'Grammar',
        subtopics: [
          { id: 'st44', name: 'Sandhi' },
          { id: 'st45', name: 'Samasa' },
        ],
      },
      {
        id: 't20',
        name: 'Literature',
        subtopics: [
          { id: 'st46', name: 'Ancient Poets' },
          { id: 'st47', name: 'Modern Literature' },
        ],
      },
    ],
  },
];
