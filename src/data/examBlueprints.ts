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
      { subjectId: 'subj_kerala_history', subjectName: 'Kerala History', weight: 14, topicWeights: [{ topicName: 'Ancient Kerala', weight: 2 }, { topicName: 'Medieval Kerala', weight: 2 }, { topicName: 'Modern & Post-Independence Kerala', weight: 3 }, { topicName: 'Arrival of Europeans & Early Resistance', weight: 4 }, { topicName: 'Cultural History', weight: 3 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 10, topicWeights: [{ topicName: 'Social Reform Movements', weight: 4 }, { topicName: 'Temple Entry Movement', weight: 3 }, { topicName: 'Major Agitations', weight: 2 }, { topicName: 'Literary Renaissance', weight: 1 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 12, topicWeights: [{ topicName: 'Constitutional Framework', weight: 2 }, { topicName: 'Fundamental Rights', weight: 2 }, { topicName: 'Directive Principles & Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 1.5 }, { topicName: 'Union Legislature', weight: 1.5 }, { topicName: 'Judiciary', weight: 1.5 }, { topicName: 'State Executive & Legislature', weight: 1 }, { topicName: 'Federal System & Local Government', weight: 1 }, { topicName: 'Constitutional Bodies', weight: 0.5 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 10, topicWeights: [{ topicName: 'Physical Geography (World)', weight: 2 }, { topicName: 'Geophysical Phenomena', weight: 1 }, { topicName: 'Physiography of India', weight: 2 }, { topicName: 'Indian River Systems', weight: 1 }, { topicName: 'Climate of India', weight: 1 }, { topicName: 'Kerala Geography', weight: 3 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 10, topicWeights: [{ topicName: 'Physics — Mechanics & Properties of Matter', weight: 2 }, { topicName: 'Physics — Light, Sound, Heat & Electronics', weight: 1.5 }, { topicName: 'Chemistry — Atomic Structure & Periodicity', weight: 1.5 }, { topicName: 'Chemistry — Acids, Bases & Chemical Reactions', weight: 1 }, { topicName: 'Biology — Human Physiology', weight: 1.5 }, { topicName: 'Biology — Biochemistry, Nutrition & Diseases', weight: 1 }, { topicName: 'Biology — Plant Physiology & Ecology', weight: 1 }, { topicName: 'Environmental Science & Waste Management', weight: 0.5 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 8, topicWeights: [{ topicName: 'Kerala News', weight: 2.5 }, { topicName: 'National News', weight: 2.5 }, { topicName: 'International News', weight: 1 }, { topicName: 'Science & Technology', weight: 1 }, { topicName: 'Sports', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 5, topicWeights: [{ topicName: 'Number System & Basic Operations', weight: 1 }, { topicName: 'Arithmetic', weight: 1.5 }, { topicName: 'Time, Speed, Distance & Work', weight: 1 }, { topicName: 'Mensuration', weight: 0.5 }, { topicName: 'Algebra & Progressions', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 0.5 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series & Patterns', weight: 1 }, { topicName: 'Analogy & Classification', weight: 0.5 }, { topicName: 'Coding & Decoding', weight: 0.5 }, { topicName: 'Blood Relations & Direction Sense', weight: 1 }, { topicName: 'Syllogisms & Venn Diagrams', weight: 0.5 }, { topicName: 'Clock, Calendar & Miscellaneous', weight: 1 }, { topicName: 'Puzzles', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 5, topicWeights: [{ topicName: 'Grammar (വ്യാകരണം)', weight: 2 }, { topicName: 'Literature (സാഹിത്യം)', weight: 1.5 }, { topicName: 'Poetry (കവിത)', weight: 0.5 }, { topicName: 'Prose & Drama (ഗദ്യവും നാടകവും)', weight: 1 }] },
      { subjectId: 'subj_indian_history', subjectName: 'Indian History & National Movement', weight: 6, topicWeights: [{ topicName: 'Ancient India', weight: 1.5 }, { topicName: 'Medieval India', weight: 1.5 }, { topicName: 'British Rule & Early Struggles', weight: 1 }, { topicName: 'Indian National Movement', weight: 2 }] },
      { subjectId: 'subj_world_history', subjectName: 'World History', weight: 3, topicWeights: [{ topicName: 'Great Revolutions', weight: 2 }, { topicName: 'World Wars & International Alliances', weight: 1 }] },
      { subjectId: 'subj_civics', subjectName: 'Civics & Public Administration', weight: 3, topicWeights: [{ topicName: 'Bureaucracy & Administrative Machinery', weight: 1 }, { topicName: 'Digital Governance & E-Governance', weight: 1 }, { topicName: 'Social Welfare & Public Policy', weight: 1 }] },
      { subjectId: 'subj_economy', subjectName: 'Indian Economy', weight: 5, topicWeights: [{ topicName: 'National Income & Macroeconomic Indicators', weight: 1 }, { topicName: 'Banking & Monetary Policy', weight: 1 }, { topicName: 'Public Finance & Fiscal System', weight: 1 }, { topicName: 'Sectors of Indian Economy', weight: 1.5 }, { topicName: 'Planning & Development', weight: 0.5 }] },
      { subjectId: 'subj_kerala_economy', subjectName: 'Kerala Economy', weight: 3, topicWeights: [{ topicName: 'Kerala Model of Development', weight: 1 }, { topicName: 'Socio-Economic Safety Networks', weight: 1 }, { topicName: 'Kerala Fiscal & Industrial Landscape', weight: 1 }] },
      { subjectId: 'subj_it', subjectName: 'Information Technology & Cyber Laws', weight: 4, topicWeights: [{ topicName: 'Computer Hardware & Architecture', weight: 0.5 }, { topicName: 'Software & Operating Systems', weight: 0.5 }, { topicName: 'Networks & Internet', weight: 1 }, { topicName: 'Web Technologies & Languages', weight: 0.5 }, { topicName: 'Cyber Security & Threats', weight: 1 }, { topicName: 'IT Act & Legal Frameworks', weight: 0.5 }] },
      { subjectId: 'subj_english', subjectName: 'English', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2.5 }, { topicName: 'Vocabulary', weight: 1.5 }, { topicName: 'Reading Comprehension & Writing', weight: 1 }] },
      { subjectId: 'subj_arts', subjectName: 'Arts, Sports & Culture', weight: 3, topicWeights: [{ topicName: 'Classical & Ritualistic Art Forms', weight: 1 }, { topicName: 'Folk & Traditional Arts', weight: 0.5 }, { topicName: 'Malayalam Cinema', weight: 0.5 }, { topicName: 'Sports & Athletics', weight: 1 }] },
      { subjectId: 'subj_acts', subjectName: 'Special Acts & Social Welfare', weight: 4, topicWeights: [{ topicName: 'Human Rights & Civil Rights', weight: 1 }, { topicName: 'Gender & Child Welfare', weight: 1.5 }, { topicName: 'Transparency & Anti-Corruption', weight: 1.5 }] },
    ],
  },
  'Secretariat Assistant': {
    examName: 'Secretariat Assistant',
    subjectWeights: [
      { subjectId: 'subj_kerala_history', subjectName: 'Kerala History', weight: 10, topicWeights: [{ topicName: 'Ancient Kerala', weight: 2 }, { topicName: 'Medieval Kerala', weight: 2 }, { topicName: 'Modern & Post-Independence Kerala', weight: 2 }, { topicName: 'Arrival of Europeans & Early Resistance', weight: 2.5 }, { topicName: 'Cultural History', weight: 1.5 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 7, topicWeights: [{ topicName: 'Social Reform Movements', weight: 2.5 }, { topicName: 'Temple Entry Movement', weight: 2 }, { topicName: 'Major Agitations', weight: 1.5 }, { topicName: 'Literary Renaissance', weight: 1 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 14, topicWeights: [{ topicName: 'Constitutional Framework', weight: 2 }, { topicName: 'Fundamental Rights', weight: 2 }, { topicName: 'Directive Principles & Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 2 }, { topicName: 'Union Legislature', weight: 2 }, { topicName: 'Judiciary', weight: 1.5 }, { topicName: 'State Executive & Legislature', weight: 1.5 }, { topicName: 'Federal System & Local Government', weight: 1.5 }, { topicName: 'Constitutional Bodies', weight: 0.5 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 8, topicWeights: [{ topicName: 'Physical Geography (World)', weight: 1 }, { topicName: 'Geophysical Phenomena', weight: 1 }, { topicName: 'Physiography of India', weight: 1.5 }, { topicName: 'Indian River Systems', weight: 1 }, { topicName: 'Climate of India', weight: 1 }, { topicName: 'Kerala Geography', weight: 2.5 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 8, topicWeights: [{ topicName: 'Physics — Mechanics & Properties of Matter', weight: 1.5 }, { topicName: 'Physics — Light, Sound, Heat & Electronics', weight: 1 }, { topicName: 'Chemistry — Atomic Structure & Periodicity', weight: 1.5 }, { topicName: 'Chemistry — Acids, Bases & Chemical Reactions', weight: 1 }, { topicName: 'Biology — Human Physiology', weight: 1.5 }, { topicName: 'Biology — Biochemistry, Nutrition & Diseases', weight: 0.5 }, { topicName: 'Biology — Plant Physiology & Ecology', weight: 0.5 }, { topicName: 'Environmental Science & Waste Management', weight: 0.5 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 12, topicWeights: [{ topicName: 'Kerala News', weight: 4 }, { topicName: 'National News', weight: 3 }, { topicName: 'International News', weight: 2 }, { topicName: 'Science & Technology', weight: 2 }, { topicName: 'Sports', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 8, topicWeights: [{ topicName: 'Number System & Basic Operations', weight: 1 }, { topicName: 'Arithmetic', weight: 2 }, { topicName: 'Time, Speed, Distance & Work', weight: 2 }, { topicName: 'Mensuration', weight: 1 }, { topicName: 'Algebra & Progressions', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 1.5 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series & Patterns', weight: 0.5 }, { topicName: 'Analogy & Classification', weight: 0.5 }, { topicName: 'Coding & Decoding', weight: 0.5 }, { topicName: 'Blood Relations & Direction Sense', weight: 1 }, { topicName: 'Syllogisms & Venn Diagrams', weight: 0.5 }, { topicName: 'Clock, Calendar & Miscellaneous', weight: 1.5 }, { topicName: 'Puzzles', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 5, topicWeights: [{ topicName: 'Grammar (വ്യാകരണം)', weight: 2 }, { topicName: 'Literature (സാഹിത്യം)', weight: 1.5 }, { topicName: 'Poetry (കവിത)', weight: 0.5 }, { topicName: 'Prose & Drama (ഗദ്യവും നാടകവും)', weight: 1 }] },
      { subjectId: 'subj_indian_history', subjectName: 'Indian History & National Movement', weight: 5, topicWeights: [{ topicName: 'Ancient India', weight: 1 }, { topicName: 'Medieval India', weight: 1 }, { topicName: 'British Rule & Early Struggles', weight: 1 }, { topicName: 'Indian National Movement', weight: 2 }] },
      { subjectId: 'subj_world_history', subjectName: 'World History', weight: 2, topicWeights: [{ topicName: 'Great Revolutions', weight: 1 }, { topicName: 'World Wars & International Alliances', weight: 1 }] },
      { subjectId: 'subj_civics', subjectName: 'Civics & Public Administration', weight: 4, topicWeights: [{ topicName: 'Bureaucracy & Administrative Machinery', weight: 1.5 }, { topicName: 'Digital Governance & E-Governance', weight: 1.5 }, { topicName: 'Social Welfare & Public Policy', weight: 1 }] },
      { subjectId: 'subj_economy', subjectName: 'Indian Economy', weight: 5, topicWeights: [{ topicName: 'National Income & Macroeconomic Indicators', weight: 1 }, { topicName: 'Banking & Monetary Policy', weight: 1 }, { topicName: 'Public Finance & Fiscal System', weight: 1.5 }, { topicName: 'Sectors of Indian Economy', weight: 1 }, { topicName: 'Planning & Development', weight: 0.5 }] },
      { subjectId: 'subj_kerala_economy', subjectName: 'Kerala Economy', weight: 3, topicWeights: [{ topicName: 'Kerala Model of Development', weight: 1 }, { topicName: 'Socio-Economic Safety Networks', weight: 1 }, { topicName: 'Kerala Fiscal & Industrial Landscape', weight: 1 }] },
      { subjectId: 'subj_it', subjectName: 'Information Technology & Cyber Laws', weight: 4, topicWeights: [{ topicName: 'Computer Hardware & Architecture', weight: 0.5 }, { topicName: 'Software & Operating Systems', weight: 0.5 }, { topicName: 'Networks & Internet', weight: 1 }, { topicName: 'Web Technologies & Languages', weight: 0.5 }, { topicName: 'Cyber Security & Threats', weight: 1 }, { topicName: 'IT Act & Legal Frameworks', weight: 0.5 }] },
      { subjectId: 'subj_english', subjectName: 'English', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2.5 }, { topicName: 'Vocabulary', weight: 1.5 }, { topicName: 'Reading Comprehension & Writing', weight: 1 }] },
      { subjectId: 'subj_arts', subjectName: 'Arts, Sports & Culture', weight: 2, topicWeights: [{ topicName: 'Classical & Ritualistic Art Forms', weight: 0.5 }, { topicName: 'Folk & Traditional Arts', weight: 0.5 }, { topicName: 'Malayalam Cinema', weight: 0.5 }, { topicName: 'Sports & Athletics', weight: 0.5 }] },
      { subjectId: 'subj_acts', subjectName: 'Special Acts & Social Welfare', weight: 3, topicWeights: [{ topicName: 'Human Rights & Civil Rights', weight: 1 }, { topicName: 'Gender & Child Welfare', weight: 1 }, { topicName: 'Transparency & Anti-Corruption', weight: 1 }] },
    ],
  },
  'Degree Level': {
    examName: 'Degree Level',
    subjectWeights: [
      { subjectId: 'subj_kerala_history', subjectName: 'Kerala History', weight: 8, topicWeights: [{ topicName: 'Ancient Kerala', weight: 1.5 }, { topicName: 'Medieval Kerala', weight: 1.5 }, { topicName: 'Modern & Post-Independence Kerala', weight: 2 }, { topicName: 'Arrival of Europeans & Early Resistance', weight: 2 }, { topicName: 'Cultural History', weight: 1 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 6, topicWeights: [{ topicName: 'Social Reform Movements', weight: 2 }, { topicName: 'Temple Entry Movement', weight: 1.5 }, { topicName: 'Major Agitations', weight: 1.5 }, { topicName: 'Literary Renaissance', weight: 1 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 12, topicWeights: [{ topicName: 'Constitutional Framework', weight: 2 }, { topicName: 'Fundamental Rights', weight: 2 }, { topicName: 'Directive Principles & Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 1.5 }, { topicName: 'Union Legislature', weight: 1 }, { topicName: 'Judiciary', weight: 2 }, { topicName: 'State Executive & Legislature', weight: 1 }, { topicName: 'Federal System & Local Government', weight: 1 }, { topicName: 'Constitutional Bodies', weight: 0.5 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 10, topicWeights: [{ topicName: 'Physical Geography (World)', weight: 2 }, { topicName: 'Geophysical Phenomena', weight: 1 }, { topicName: 'Physiography of India', weight: 2 }, { topicName: 'Indian River Systems', weight: 1.5 }, { topicName: 'Climate of India', weight: 1 }, { topicName: 'Kerala Geography', weight: 2.5 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 10, topicWeights: [{ topicName: 'Physics — Mechanics & Properties of Matter', weight: 2 }, { topicName: 'Physics — Light, Sound, Heat & Electronics', weight: 1.5 }, { topicName: 'Chemistry — Atomic Structure & Periodicity', weight: 1.5 }, { topicName: 'Chemistry — Acids, Bases & Chemical Reactions', weight: 1 }, { topicName: 'Biology — Human Physiology', weight: 1.5 }, { topicName: 'Biology — Biochemistry, Nutrition & Diseases', weight: 1 }, { topicName: 'Biology — Plant Physiology & Ecology', weight: 1 }, { topicName: 'Environmental Science & Waste Management', weight: 0.5 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 8, topicWeights: [{ topicName: 'Kerala News', weight: 2 }, { topicName: 'National News', weight: 2.5 }, { topicName: 'International News', weight: 1.5 }, { topicName: 'Science & Technology', weight: 1 }, { topicName: 'Sports', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 7, topicWeights: [{ topicName: 'Number System & Basic Operations', weight: 1 }, { topicName: 'Arithmetic', weight: 2 }, { topicName: 'Time, Speed, Distance & Work', weight: 1.5 }, { topicName: 'Mensuration', weight: 1 }, { topicName: 'Algebra & Progressions', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 1 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series & Patterns', weight: 0.5 }, { topicName: 'Analogy & Classification', weight: 0.5 }, { topicName: 'Coding & Decoding', weight: 0.5 }, { topicName: 'Blood Relations & Direction Sense', weight: 1 }, { topicName: 'Syllogisms & Venn Diagrams', weight: 0.5 }, { topicName: 'Clock, Calendar & Miscellaneous', weight: 1.5 }, { topicName: 'Puzzles', weight: 0.5 }] },
      { subjectId: 'subj_indian_history', subjectName: 'Indian History & National Movement', weight: 10, topicWeights: [{ topicName: 'Ancient India', weight: 2.5 }, { topicName: 'Medieval India', weight: 2.5 }, { topicName: 'British Rule & Early Struggles', weight: 2 }, { topicName: 'Indian National Movement', weight: 3 }] },
      { subjectId: 'subj_world_history', subjectName: 'World History', weight: 5, topicWeights: [{ topicName: 'Great Revolutions', weight: 2.5 }, { topicName: 'World Wars & International Alliances', weight: 2.5 }] },
      { subjectId: 'subj_civics', subjectName: 'Civics & Public Administration', weight: 5, topicWeights: [{ topicName: 'Bureaucracy & Administrative Machinery', weight: 2 }, { topicName: 'Digital Governance & E-Governance', weight: 1.5 }, { topicName: 'Social Welfare & Public Policy', weight: 1.5 }] },
      { subjectId: 'subj_economy', subjectName: 'Indian Economy', weight: 8, topicWeights: [{ topicName: 'National Income & Macroeconomic Indicators', weight: 1.5 }, { topicName: 'Banking & Monetary Policy', weight: 1.5 }, { topicName: 'Public Finance & Fiscal System', weight: 1.5 }, { topicName: 'Sectors of Indian Economy', weight: 2.5 }, { topicName: 'Planning & Development', weight: 1 }] },
      { subjectId: 'subj_kerala_economy', subjectName: 'Kerala Economy', weight: 4, topicWeights: [{ topicName: 'Kerala Model of Development', weight: 1.5 }, { topicName: 'Socio-Economic Safety Networks', weight: 1.5 }, { topicName: 'Kerala Fiscal & Industrial Landscape', weight: 1 }] },
      { subjectId: 'subj_it', subjectName: 'Information Technology & Cyber Laws', weight: 5, topicWeights: [{ topicName: 'Computer Hardware & Architecture', weight: 0.5 }, { topicName: 'Software & Operating Systems', weight: 0.5 }, { topicName: 'Networks & Internet', weight: 1.5 }, { topicName: 'Web Technologies & Languages', weight: 0.5 }, { topicName: 'Cyber Security & Threats', weight: 1.5 }, { topicName: 'IT Act & Legal Frameworks', weight: 0.5 }] },
      { subjectId: 'subj_english', subjectName: 'English', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2 }, { topicName: 'Vocabulary', weight: 1.5 }, { topicName: 'Reading Comprehension & Writing', weight: 1.5 }] },
      { subjectId: 'subj_arts', subjectName: 'Arts, Sports & Culture', weight: 3, topicWeights: [{ topicName: 'Classical & Ritualistic Art Forms', weight: 1 }, { topicName: 'Folk & Traditional Arts', weight: 0.5 }, { topicName: 'Malayalam Cinema', weight: 0.5 }, { topicName: 'Sports & Athletics', weight: 1 }] },
      { subjectId: 'subj_acts', subjectName: 'Special Acts & Social Welfare', weight: 4, topicWeights: [{ topicName: 'Human Rights & Civil Rights', weight: 1 }, { topicName: 'Gender & Child Welfare', weight: 1.5 }, { topicName: 'Transparency & Anti-Corruption', weight: 1.5 }] },
    ],
  },
  'University Assistant': {
    examName: 'University Assistant',
    subjectWeights: [
      { subjectId: 'subj_kerala_history', subjectName: 'Kerala History', weight: 10, topicWeights: [{ topicName: 'Ancient Kerala', weight: 2 }, { topicName: 'Medieval Kerala', weight: 2 }, { topicName: 'Modern & Post-Independence Kerala', weight: 2.5 }, { topicName: 'Arrival of Europeans & Early Resistance', weight: 2.5 }, { topicName: 'Cultural History', weight: 1 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 7, topicWeights: [{ topicName: 'Social Reform Movements', weight: 2 }, { topicName: 'Temple Entry Movement', weight: 2 }, { topicName: 'Major Agitations', weight: 1.5 }, { topicName: 'Literary Renaissance', weight: 1.5 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 14, topicWeights: [{ topicName: 'Constitutional Framework', weight: 2 }, { topicName: 'Fundamental Rights', weight: 2 }, { topicName: 'Directive Principles & Fundamental Duties', weight: 1 }, { topicName: 'Union Executive', weight: 2 }, { topicName: 'Union Legislature', weight: 1.5 }, { topicName: 'Judiciary', weight: 2 }, { topicName: 'State Executive & Legislature', weight: 1.5 }, { topicName: 'Federal System & Local Government', weight: 1.5 }, { topicName: 'Constitutional Bodies', weight: 0.5 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 8, topicWeights: [{ topicName: 'Physical Geography (World)', weight: 1.5 }, { topicName: 'Geophysical Phenomena', weight: 0.5 }, { topicName: 'Physiography of India', weight: 2 }, { topicName: 'Indian River Systems', weight: 1 }, { topicName: 'Climate of India', weight: 1 }, { topicName: 'Kerala Geography', weight: 2 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 8, topicWeights: [{ topicName: 'Physics — Mechanics & Properties of Matter', weight: 1.5 }, { topicName: 'Physics — Light, Sound, Heat & Electronics', weight: 1 }, { topicName: 'Chemistry — Atomic Structure & Periodicity', weight: 1.5 }, { topicName: 'Chemistry — Acids, Bases & Chemical Reactions', weight: 1 }, { topicName: 'Biology — Human Physiology', weight: 1.5 }, { topicName: 'Biology — Biochemistry, Nutrition & Diseases', weight: 0.5 }, { topicName: 'Biology — Plant Physiology & Ecology', weight: 0.5 }, { topicName: 'Environmental Science & Waste Management', weight: 0.5 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 8, topicWeights: [{ topicName: 'Kerala News', weight: 2.5 }, { topicName: 'National News', weight: 2.5 }, { topicName: 'International News', weight: 1 }, { topicName: 'Science & Technology', weight: 1 }, { topicName: 'Sports', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 8, topicWeights: [{ topicName: 'Number System & Basic Operations', weight: 1 }, { topicName: 'Arithmetic', weight: 2 }, { topicName: 'Time, Speed, Distance & Work', weight: 1.5 }, { topicName: 'Mensuration', weight: 1.5 }, { topicName: 'Algebra & Progressions', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 1.5 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 5, topicWeights: [{ topicName: 'Series & Patterns', weight: 0.5 }, { topicName: 'Analogy & Classification', weight: 0.5 }, { topicName: 'Coding & Decoding', weight: 0.5 }, { topicName: 'Blood Relations & Direction Sense', weight: 1 }, { topicName: 'Syllogisms & Venn Diagrams', weight: 0.5 }, { topicName: 'Clock, Calendar & Miscellaneous', weight: 1.5 }, { topicName: 'Puzzles', weight: 0.5 }] },
      { subjectId: 'subj_malayalam', subjectName: 'Malayalam', weight: 8, topicWeights: [{ topicName: 'Grammar (വ്യാകരണം)', weight: 3 }, { topicName: 'Literature (സാഹിത്യം)', weight: 2.5 }, { topicName: 'Poetry (കവിത)', weight: 1 }, { topicName: 'Prose & Drama (ഗദ്യവും നാടകവും)', weight: 1.5 }] },
      { subjectId: 'subj_indian_history', subjectName: 'Indian History & National Movement', weight: 6, topicWeights: [{ topicName: 'Ancient India', weight: 1.5 }, { topicName: 'Medieval India', weight: 1.5 }, { topicName: 'British Rule & Early Struggles', weight: 1 }, { topicName: 'Indian National Movement', weight: 2 }] },
      { subjectId: 'subj_world_history', subjectName: 'World History', weight: 2, topicWeights: [{ topicName: 'Great Revolutions', weight: 1 }, { topicName: 'World Wars & International Alliances', weight: 1 }] },
      { subjectId: 'subj_civics', subjectName: 'Civics & Public Administration', weight: 3, topicWeights: [{ topicName: 'Bureaucracy & Administrative Machinery', weight: 1 }, { topicName: 'Digital Governance & E-Governance', weight: 1 }, { topicName: 'Social Welfare & Public Policy', weight: 1 }] },
      { subjectId: 'subj_economy', subjectName: 'Indian Economy', weight: 5, topicWeights: [{ topicName: 'National Income & Macroeconomic Indicators', weight: 1 }, { topicName: 'Banking & Monetary Policy', weight: 1 }, { topicName: 'Public Finance & Fiscal System', weight: 1 }, { topicName: 'Sectors of Indian Economy', weight: 1.5 }, { topicName: 'Planning & Development', weight: 0.5 }] },
      { subjectId: 'subj_kerala_economy', subjectName: 'Kerala Economy', weight: 3, topicWeights: [{ topicName: 'Kerala Model of Development', weight: 1 }, { topicName: 'Socio-Economic Safety Networks', weight: 1 }, { topicName: 'Kerala Fiscal & Industrial Landscape', weight: 1 }] },
      { subjectId: 'subj_it', subjectName: 'Information Technology & Cyber Laws', weight: 4, topicWeights: [{ topicName: 'Computer Hardware & Architecture', weight: 0.5 }, { topicName: 'Software & Operating Systems', weight: 0.5 }, { topicName: 'Networks & Internet', weight: 1 }, { topicName: 'Web Technologies & Languages', weight: 0.5 }, { topicName: 'Cyber Security & Threats', weight: 1 }, { topicName: 'IT Act & Legal Frameworks', weight: 0.5 }] },
      { subjectId: 'subj_english', subjectName: 'English', weight: 5, topicWeights: [{ topicName: 'Grammar', weight: 2 }, { topicName: 'Vocabulary', weight: 1.5 }, { topicName: 'Reading Comprehension & Writing', weight: 1.5 }] },
      { subjectId: 'subj_arts', subjectName: 'Arts, Sports & Culture', weight: 2, topicWeights: [{ topicName: 'Classical & Ritualistic Art Forms', weight: 0.5 }, { topicName: 'Folk & Traditional Arts', weight: 0.5 }, { topicName: 'Malayalam Cinema', weight: 0.5 }, { topicName: 'Sports & Athletics', weight: 0.5 }] },
      { subjectId: 'subj_acts', subjectName: 'Special Acts & Social Welfare', weight: 4, topicWeights: [{ topicName: 'Human Rights & Civil Rights', weight: 1.5 }, { topicName: 'Gender & Child Welfare', weight: 1.5 }, { topicName: 'Transparency & Anti-Corruption', weight: 1 }] },
    ],
  },
  'Police Constable': {
    examName: 'Police Constable',
    subjectWeights: [
      { subjectId: 'subj_kerala_history', subjectName: 'Kerala History', weight: 10, topicWeights: [{ topicName: 'Ancient Kerala', weight: 2 }, { topicName: 'Medieval Kerala', weight: 2 }, { topicName: 'Modern & Post-Independence Kerala', weight: 2.5 }, { topicName: 'Arrival of Europeans & Early Resistance', weight: 2.5 }, { topicName: 'Cultural History', weight: 1 }] },
      { subjectId: 'subj_renaissance', subjectName: 'Renaissance', weight: 8, topicWeights: [{ topicName: 'Social Reform Movements', weight: 3 }, { topicName: 'Temple Entry Movement', weight: 2.5 }, { topicName: 'Major Agitations', weight: 1.5 }, { topicName: 'Literary Renaissance', weight: 1 }] },
      { subjectId: 'subj_constitution', subjectName: 'Constitution', weight: 14, topicWeights: [{ topicName: 'Constitutional Framework', weight: 2 }, { topicName: 'Fundamental Rights', weight: 2.5 }, { topicName: 'Directive Principles & Fundamental Duties', weight: 1.5 }, { topicName: 'Union Executive', weight: 1.5 }, { topicName: 'Union Legislature', weight: 1.5 }, { topicName: 'Judiciary', weight: 2 }, { topicName: 'State Executive & Legislature', weight: 1 }, { topicName: 'Federal System & Local Government', weight: 1.5 }, { topicName: 'Constitutional Bodies', weight: 0.5 }] },
      { subjectId: 'subj_geography', subjectName: 'Geography', weight: 10, topicWeights: [{ topicName: 'Physical Geography (World)', weight: 2 }, { topicName: 'Geophysical Phenomena', weight: 1 }, { topicName: 'Physiography of India', weight: 2 }, { topicName: 'Indian River Systems', weight: 1 }, { topicName: 'Climate of India', weight: 1.5 }, { topicName: 'Kerala Geography', weight: 2.5 }] },
      { subjectId: 'subj_science', subjectName: 'Science', weight: 12, topicWeights: [{ topicName: 'Physics — Mechanics & Properties of Matter', weight: 2.5 }, { topicName: 'Physics — Light, Sound, Heat & Electronics', weight: 2 }, { topicName: 'Chemistry — Atomic Structure & Periodicity', weight: 2 }, { topicName: 'Chemistry — Acids, Bases & Chemical Reactions', weight: 1.5 }, { topicName: 'Biology — Human Physiology', weight: 2 }, { topicName: 'Biology — Biochemistry, Nutrition & Diseases', weight: 1 }, { topicName: 'Biology — Plant Physiology & Ecology', weight: 0.5 }, { topicName: 'Environmental Science & Waste Management', weight: 0.5 }] },
      { subjectId: 'subj_current', subjectName: 'Current Affairs', weight: 8, topicWeights: [{ topicName: 'Kerala News', weight: 2.5 }, { topicName: 'National News', weight: 2.5 }, { topicName: 'International News', weight: 1 }, { topicName: 'Science & Technology', weight: 1 }, { topicName: 'Sports', weight: 1 }] },
      { subjectId: 'subj_aptitude', subjectName: 'Quantitative Aptitude', weight: 5, topicWeights: [{ topicName: 'Number System & Basic Operations', weight: 0.5 }, { topicName: 'Arithmetic', weight: 1.5 }, { topicName: 'Time, Speed, Distance & Work', weight: 1.5 }, { topicName: 'Mensuration', weight: 0.5 }, { topicName: 'Algebra & Progressions', weight: 0.5 }, { topicName: 'Data Interpretation', weight: 0.5 }] },
      { subjectId: 'subj_mental', subjectName: 'Mental Ability', weight: 8, topicWeights: [{ topicName: 'Series & Patterns', weight: 1 }, { topicName: 'Analogy & Classification', weight: 1 }, { topicName: 'Coding & Decoding', weight: 1 }, { topicName: 'Blood Relations & Direction Sense', weight: 1.5 }, { topicName: 'Syllogisms & Venn Diagrams', weight: 1 }, { topicName: 'Clock, Calendar & Miscellaneous', weight: 1.5 }, { topicName: 'Puzzles', weight: 1 }] },
      { subjectId: 'subj_indian_history', subjectName: 'Indian History & National Movement', weight: 6, topicWeights: [{ topicName: 'Ancient India', weight: 1.5 }, { topicName: 'Medieval India', weight: 1.5 }, { topicName: 'British Rule & Early Struggles', weight: 1 }, { topicName: 'Indian National Movement', weight: 2 }] },
      { subjectId: 'subj_world_history', subjectName: 'World History', weight: 2, topicWeights: [{ topicName: 'Great Revolutions', weight: 1 }, { topicName: 'World Wars & International Alliances', weight: 1 }] },
      { subjectId: 'subj_civics', subjectName: 'Civics & Public Administration', weight: 3, topicWeights: [{ topicName: 'Bureaucracy & Administrative Machinery', weight: 1 }, { topicName: 'Digital Governance & E-Governance', weight: 1 }, { topicName: 'Social Welfare & Public Policy', weight: 1 }] },
      { subjectId: 'subj_economy', subjectName: 'Indian Economy', weight: 5, topicWeights: [{ topicName: 'National Income & Macroeconomic Indicators', weight: 1 }, { topicName: 'Banking & Monetary Policy', weight: 1 }, { topicName: 'Public Finance & Fiscal System', weight: 1 }, { topicName: 'Sectors of Indian Economy', weight: 1.5 }, { topicName: 'Planning & Development', weight: 0.5 }] },
      { subjectId: 'subj_kerala_economy', subjectName: 'Kerala Economy', weight: 2, topicWeights: [{ topicName: 'Kerala Model of Development', weight: 0.5 }, { topicName: 'Socio-Economic Safety Networks', weight: 1 }, { topicName: 'Kerala Fiscal & Industrial Landscape', weight: 0.5 }] },
      { subjectId: 'subj_it', subjectName: 'Information Technology & Cyber Laws', weight: 4, topicWeights: [{ topicName: 'Computer Hardware & Architecture', weight: 0.5 }, { topicName: 'Software & Operating Systems', weight: 0.5 }, { topicName: 'Networks & Internet', weight: 1 }, { topicName: 'Web Technologies & Languages', weight: 0.5 }, { topicName: 'Cyber Security & Threats', weight: 1 }, { topicName: 'IT Act & Legal Frameworks', weight: 0.5 }] },
      { subjectId: 'subj_english', subjectName: 'English', weight: 3, topicWeights: [{ topicName: 'Grammar', weight: 1.5 }, { topicName: 'Vocabulary', weight: 1 }, { topicName: 'Reading Comprehension & Writing', weight: 0.5 }] },
      { subjectId: 'subj_arts', subjectName: 'Arts, Sports & Culture', weight: 3, topicWeights: [{ topicName: 'Classical & Ritualistic Art Forms', weight: 1 }, { topicName: 'Folk & Traditional Arts', weight: 0.5 }, { topicName: 'Malayalam Cinema', weight: 0.5 }, { topicName: 'Sports & Athletics', weight: 1 }] },
      { subjectId: 'subj_acts', subjectName: 'Special Acts & Social Welfare', weight: 5, topicWeights: [{ topicName: 'Human Rights & Civil Rights', weight: 2 }, { topicName: 'Gender & Child Welfare', weight: 1.5 }, { topicName: 'Transparency & Anti-Corruption', weight: 1.5 }] },
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
  if (!Array.isArray(examNames) || examNames.length === 0) return 5;
  const total = examNames.reduce((sum, name) => {
    return sum + getWeightedPriority(name, subjectName, topicName);
  }, 0);
  return examNames.length > 0 ? Math.round(total / examNames.length) : 0;
}

export function getAllBlueprintNames(): string[] {
  return Object.keys(BLUEPRINTS);
}
