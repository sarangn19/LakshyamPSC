import type { GeneratedQuestion } from '../services/aiMCQGenerator';

type CorpusEntry = Omit<GeneratedQuestion, 'id' | 'generatedAt' | 'confidence' | 'source'> & {
  id?: string;
  confidence?: number;
  source?: string;
};

const ENTRIES: CorpusEntry[] = [
  // ─── KERALA HISTORY ───
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy', text: 'Which Sangam age is known as the "Golden Age" of ancient Kerala?', options: ['Sangam Period', 'Pre-Sangam', 'Post-Sangam', 'Medieval'], correctAnswer: 0, explanation: 'The Sangam period (c. 300 BCE – 300 CE) is considered the golden age of ancient Kerala with flourishing trade and literature.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'easy', text: 'The Chera dynasty\'s emblem was?', options: ['Bow and Arrow', 'Fish', 'Tiger', 'Elephant'], correctAnswer: 0, explanation: 'The Cheras used the bow and arrow as their royal emblem, seen on their coins.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Kerala History', topic: 'Ancient Kerala', difficulty: 'medium', text: 'Which Roman port in Kerala was a major trade center during the Sangam age?', options: ['Muziris', 'Kozhikode', 'Kollam', 'Kochi'], correctAnswer: 0, explanation: 'Muziris (modern-day Kodungallur) was the most important Roman trade port in Kerala.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Medieval Kerala', difficulty: 'easy', text: 'The Zamorins ruled from which city?', options: ['Calicut', 'Kochi', 'Kollam', 'Kannur'], correctAnswer: 0, explanation: 'The Zamorins ruled from Calicut (Kozhikode), which became a major trading port.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Kerala History', topic: 'Medieval Kerala', difficulty: 'medium', text: 'Venad was later known as which princely state?', options: ['Travancore', 'Cochin', 'Malabar', 'Madras Presidency'], correctAnswer: 0, explanation: 'The Kingdom of Venad evolved into the princely state of Travancore.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'easy', text: 'When was the state of Kerala formed?', options: ['1 November 1956', '15 August 1947', '26 January 1950', '1 July 1955'], correctAnswer: 0, explanation: 'Kerala was formed on 1 November 1956 under the States Reorganisation Act.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level', 'University Assistant'] },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'easy', text: 'The first Chief Minister of Kerala was?', options: ['E. M. S. Namboodiripad', 'Pattom A. Thanu Pillai', 'R. Sankar', 'C. Achutha Menon'], correctAnswer: 0, explanation: 'E. M. S. Namboodiripad became the first Chief Minister of Kerala in 1957.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Modern Kerala', difficulty: 'medium', text: 'The Kerala Land Reforms Act was enacted in which year?', options: ['1963', '1957', '1969', '1971'], correctAnswer: 0, explanation: 'The Kerala Land Reforms Act, 1963 was a landmark legislation that abolished landlordism.', examType: ['Degree Level', 'University Assistant'] },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'easy', text: 'Sree Narayana Guru\'s famous slogan was?', options: ['One Caste, One Religion, One God for Man', 'Work is Worship', 'Educate to Liberate', 'Unity is Strength'], correctAnswer: 0, explanation: '"One Caste, One Religion, One God for Man" (Oru Jathi, Oru Matham, Oru Daivam, Manushyanu) was Sree Narayana Guru\'s message.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'easy', text: 'Ayyankali founded which organization?', options: ['Sadhu Jana Paripalana Sangham', 'SNDP Yogam', 'Nair Service Society', 'Pulaya Maha Sabha'], correctAnswer: 0, explanation: 'Ayyankali founded the Sadhu Jana Paripalana Sangham (SJPS) in 1907 to fight for Dalit rights.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'medium', text: 'The Temple Entry Proclamation was issued in which year?', options: ['1936', '1924', '1947', '1931'], correctAnswer: 0, explanation: 'The Temple Entry Proclamation was issued on November 12, 1936 by Maharaja Sree Chithira Thirunal.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'medium', text: 'Who was the Dewan of Travancore during the Temple Entry Proclamation?', options: ['Sir C.P. Ramaswami Iyer', 'Colonel Munro', 'Velu Thampi Dalawa', 'P.G.N. Unnithan'], correctAnswer: 0, explanation: 'Sir C.P. Ramaswami Iyer was the Dewan who advised the Maharaja on this historic proclamation.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level', 'University Assistant'] },
  { subject: 'Kerala History', topic: 'Renaissance', difficulty: 'hard', text: 'Which social reformer is associated with the "Mishra Bhojanam" (inter-dining) movement in Kerala?', options: ['Sahodaran Ayyappan', 'Sree Narayana Guru', 'Ayyankali', 'V.T. Bhattathiripad'], correctAnswer: 0, explanation: 'Sahodaran Ayyappan organized the historic inter-dining event at Cherthala in 1917.', examType: ['Degree Level', 'University Assistant'] },

  // ─── INDIAN POLITY ───
  { subject: 'Polity', topic: 'Constitution', difficulty: 'easy', text: 'The Constitution of India was adopted on?', options: ['26 November 1949', '15 August 1947', '26 January 1950', '26 November 1950'], correctAnswer: 0, explanation: 'The Constitution was adopted on 26 November 1949 and came into effect on 26 January 1950.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'Constitution', difficulty: 'easy', text: 'Who was the Chairman of the Drafting Committee of the Indian Constitution?', options: ['Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Rajendra Prasad', 'Sardar Patel'], correctAnswer: 0, explanation: 'Dr. B.R. Ambedkar was the Chairman of the Drafting Committee.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'Constitution', difficulty: 'medium', text: 'How many schedules does the Indian Constitution have?', options: ['12', '8', '10', '14'], correctAnswer: 0, explanation: 'The Indian Constitution originally had 8 schedules; now it has 12 schedules.', examType: ['Secretariat Assistant', 'Degree Level', 'University Assistant'] },
  { subject: 'Polity', topic: 'Fundamental Rights', difficulty: 'easy', text: 'Right to Equality is guaranteed under which Article?', options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'], correctAnswer: 0, explanation: 'Article 14 guarantees equality before law and equal protection of laws.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'Fundamental Rights', difficulty: 'medium', text: 'Which Article of the Indian Constitution abolishes untouchability?', options: ['Article 17', 'Article 15', 'Article 14', 'Article 18'], correctAnswer: 0, explanation: 'Article 17 abolishes untouchability and its practice in any form is forbidden.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'Directive Principles', difficulty: 'easy', text: 'Directive Principles of State Policy are borrowed from which country\'s constitution?', options: ['Ireland', 'USA', 'UK', 'Canada'], correctAnswer: 0, explanation: 'The Directive Principles were borrowed from the Irish Constitution of 1937.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'Directive Principles', difficulty: 'medium', text: 'Which amendment added the words "Socialist" and "Secular" to the Preamble?', options: ['42nd Amendment', '44th Amendment', '24th Amendment', '1st Amendment'], correctAnswer: 0, explanation: 'The 42nd Amendment (1976) added Socialist, Secular and Integrity to the Preamble.', examType: ['Degree Level', 'University Assistant'] },
  { subject: 'Polity', topic: 'Parliament', difficulty: 'easy', text: 'The Lok Sabha is also known as?', options: ['House of the People', 'Council of States', 'Upper House', 'Rajya Sabha'], correctAnswer: 0, explanation: 'Lok Sabha is the House of the People, the lower house of Parliament.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Polity', topic: 'Parliament', difficulty: 'medium', text: 'What is the maximum strength of the Lok Sabha?', options: ['552', '545', '543', '550'], correctAnswer: 0, explanation: 'The maximum strength of Lok Sabha is 552 (530 states + 20 UTs + 2 nominated).', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'President', difficulty: 'easy', text: 'Who is the Supreme Commander of the Indian Armed Forces?', options: ['President', 'Prime Minister', 'Defence Minister', 'Chief of Army Staff'], correctAnswer: 0, explanation: 'The President of India is the Supreme Commander of the Armed Forces.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Polity', topic: 'President', difficulty: 'medium', text: 'The President of India can be removed by?', options: ['Impeachment', 'No Confidence Motion', 'Censure Motion', 'Supreme Court Order'], correctAnswer: 0, explanation: 'The President can be removed through impeachment for violation of the Constitution.', examType: ['Degree Level', 'University Assistant'] },

  // ─── GEOGRAPHY ───
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'easy', text: 'Which is the longest river in Kerala?', options: ['Periyar', 'Bharathapuzha', 'Pamba', 'Chaliyar'], correctAnswer: 0, explanation: 'Periyar (244 km) is the longest river in Kerala.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'easy', text: 'Which is the highest peak in Kerala?', options: ['Anamudi', 'Agastya Mala', 'Chembra', 'Meesapulimala'], correctAnswer: 0, explanation: 'Anamudi (2,695m) is the highest peak in Kerala, located in Idukki.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'medium', text: 'Which district in Kerala has the longest coastline?', options: ['Alappuzha', 'Kozhikode', 'Kannur', 'Kasaragod'], correctAnswer: 0, explanation: 'Alappuzha has the longest coastline (82 km) among Kerala districts.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'medium', text: 'The backwaters of Kerala are known as?', options: ['Kayals', 'Kuttanad', 'Vembanad', 'Ashtamudi'], correctAnswer: 0, explanation: 'The backwaters of Kerala are called Kayals (e.g., Vembanad Kayal, Ashtamudi Kayal).', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Geography', topic: 'Physical Geography', difficulty: 'hard', text: 'Which pass connects Kerala to Tamil Nadu?', options: ['Palakkad Gap', 'Thalassery Gap', 'Kambam Gap', 'Shencottah Gap'], correctAnswer: 0, explanation: 'Palakkad Gap is the major pass connecting Kerala to Tamil Nadu.', examType: ['Degree Level', 'University Assistant'] },
  { subject: 'Geography', topic: 'Kerala Geography', difficulty: 'easy', text: 'How many districts are there in Kerala?', options: ['14', '12', '16', '10'], correctAnswer: 0, explanation: 'Kerala has 14 districts as of 2024.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Geography', topic: 'Kerala Geography', difficulty: 'medium', text: 'Which is the largest district in Kerala by area?', options: ['Palakkad', 'Idukki', 'Wayanad', 'Kasaragod'], correctAnswer: 0, explanation: 'Palakkad is the largest district in Kerala with an area of 4,480 sq km.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Geography', topic: 'World Geography', difficulty: 'easy', text: 'Which is the largest continent by area?', options: ['Asia', 'Africa', 'North America', 'Europe'], correctAnswer: 0, explanation: 'Asia is the largest continent, covering about 30% of Earth\'s land area.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Geography', topic: 'World Geography', difficulty: 'medium', text: 'The Amazon River flows through which country?', options: ['Brazil', 'Peru', 'Colombia', 'Argentina'], correctAnswer: 0, explanation: 'The Amazon River flows primarily through Brazil, though its source is in Peru.', examType: ['Degree Level', 'University Assistant'] },

  // ─── SCIENCE ───
  { subject: 'Science', topic: 'Physics', difficulty: 'easy', text: 'What is the SI unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correctAnswer: 0, explanation: 'The SI unit of force is Newton (N), named after Sir Isaac Newton.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Science', topic: 'Physics', difficulty: 'easy', text: 'What is the speed of light in vacuum?', options: ['3 × 10^8 m/s', '3 × 10^6 m/s', '3 × 10^10 m/s', '3 × 10^5 m/s'], correctAnswer: 0, explanation: 'The speed of light in vacuum is approximately 3 × 10^8 meters per second.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Science', topic: 'Physics', difficulty: 'medium', text: 'Ohm\'s law relates which two quantities?', options: ['Voltage and Current', 'Current and Resistance', 'Voltage and Resistance', 'Power and Voltage'], correctAnswer: 0, explanation: 'Ohm\'s law states that V = IR, relating voltage (V) and current (I).', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'easy', text: 'What is the chemical symbol for gold?', options: ['Au', 'Ag', 'Fe', 'Cu'], correctAnswer: 0, explanation: 'Au (from Latin Aurum) is the chemical symbol for gold.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'easy', text: 'Water is composed of which two elements?', options: ['Hydrogen and Oxygen', 'Hydrogen and Carbon', 'Oxygen and Carbon', 'Nitrogen and Oxygen'], correctAnswer: 0, explanation: 'Water (H2O) is composed of two hydrogen atoms and one oxygen atom.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Science', topic: 'Chemistry', difficulty: 'medium', text: 'What is the pH value of pure water?', options: ['7', '0', '14', '1'], correctAnswer: 0, explanation: 'Pure water has a pH of 7, which is neutral on the pH scale.', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Science', topic: 'Biology', difficulty: 'easy', text: 'What is the largest organ in the human body?', options: ['Skin', 'Liver', 'Brain', 'Heart'], correctAnswer: 0, explanation: 'The skin is the largest organ, covering an area of about 1.5-2 square meters.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Science', topic: 'Biology', difficulty: 'easy', text: 'How many bones are there in an adult human body?', options: ['206', '207', '205', '208'], correctAnswer: 0, explanation: 'An adult human body has 206 bones, while a baby has around 270.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Science', topic: 'Biology', difficulty: 'medium', text: 'Which vitamin is produced by the human body when exposed to sunlight?', options: ['Vitamin D', 'Vitamin C', 'Vitamin B12', 'Vitamin A'], correctAnswer: 0, explanation: 'Vitamin D is synthesized in the skin upon exposure to UVB rays from sunlight.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Science', topic: 'Biology', difficulty: 'medium', text: 'What is the powerhouse of the cell?', options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Endoplasmic Reticulum'], correctAnswer: 0, explanation: 'Mitochondria are called the powerhouse of the cell as they produce ATP.', examType: ['Degree Level', 'University Assistant'] },

  // ─── INDIAN HISTORY ───
  { subject: 'Indian History', topic: 'Ancient India', difficulty: 'easy', text: 'The Indus Valley Civilization was discovered in which year?', options: ['1921', '1901', '1947', '1857'], correctAnswer: 0, explanation: 'The Indus Valley Civilization was discovered in 1921 by Dayaram Sahni.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Indian History', topic: 'Ancient India', difficulty: 'easy', text: 'Who was the founder of the Maurya Empire?', options: ['Chandragupta Maurya', 'Ashoka', 'Bindusara', 'Chanakya'], correctAnswer: 0, explanation: 'Chandragupta Maurya founded the Maurya Empire in 322 BCE with guidance from Chanakya.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Indian History', topic: 'Medieval India', difficulty: 'easy', text: 'The Mughal Empire was founded by?', options: ['Babur', 'Akbar', 'Shah Jahan', 'Humayun'], correctAnswer: 0, explanation: 'Babur founded the Mughal Empire in 1526 after winning the First Battle of Panipat.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Indian History', topic: 'Medieval India', difficulty: 'medium', text: 'The Battle of Plassey was fought in which year?', options: ['1757', '1764', '1756', '1760'], correctAnswer: 0, explanation: 'The Battle of Plassey (1757) marked the beginning of British rule in India.', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Indian History', topic: 'Modern India', difficulty: 'easy', text: 'The Indian National Congress was founded in which year?', options: ['1885', '1884', '1886', '1890'], correctAnswer: 0, explanation: 'The Indian National Congress was founded in 1885 by A.O. Hume.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Indian History', topic: 'Modern India', difficulty: 'medium', text: 'The Jallianwala Bagh massacre occurred in?', options: ['1919', '1917', '1920', '1921'], correctAnswer: 0, explanation: 'The Jallianwala Bagh massacre occurred on April 13, 1919 in Amritsar.', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Indian History', topic: 'Freedom Movement', difficulty: 'easy', text: 'Who gave the "Quit India" speech in 1942?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'Subhash Chandra Bose', 'Sardar Patel'], correctAnswer: 0, explanation: 'Mahatma Gandhi gave the Quit India speech at the Gowalia Tank Maidan in Mumbai.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Indian History', topic: 'Freedom Movement', difficulty: 'medium', text: 'The Simon Commission came to India in which year?', options: ['1928', '1927', '1930', '1929'], correctAnswer: 0, explanation: 'The Simon Commission arrived in India in 1928 and was met with the slogan "Simon Go Back".', examType: ['Degree Level', 'University Assistant'] },

  // ─── MALAYALAM ───
  { subject: 'Malayalam', topic: 'Grammar', difficulty: 'easy', text: '"പര്യായം" എന്നാൽ എന്ത്?', options: ['ഒരേ അർത്ഥമുള്ള വാക്ക്', 'എതിർ അർത്ഥമുള്ള വാക്ക്', 'സമാനമായ വാക്ക്', 'വ്യത്യസ്ഥമായ വാക്ക്'], correctAnswer: 0, explanation: 'പര്യായം എന്നാൽ ഒരേ അർത്ഥമുള്ള വാക്ക് (synonym).', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Malayalam', topic: 'Grammar', difficulty: 'medium', text: 'മലയാളത്തിലെ ആദ്യ വ്യാകരണ ഗ്രന്ഥം ഏത്?', options: ['കേരള പാണിനീയം', 'ലീലാതിലകം', 'വ്യാകരണമാല', 'കേരള വ്യാകരണം'], correctAnswer: 0, explanation: 'കേരള പാണിനീയം എഴുതിയത് എ.ആർ. രാജരാജവർമ്മയാണ്.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Malayalam', topic: 'Literature', difficulty: 'easy', text: 'മലയാളത്തിലെ ആദ്യ കവി ആര്?', options: ['തുഞ്ചത്ത് രാമാനുജൻ എഴുത്തച്ഛൻ', 'ചെറുശ്ശേരി', 'കുഞ്ചൻ നമ്പ്യാർ', 'വള്ളത്തോൾ'], correctAnswer: 0, explanation: 'തുഞ്ചത്ത് രാമാനുജൻ എഴുത്തച്ഛനെ മലയാള ഭാഷയുടെ പിതാവായി കണക്കാക്കുന്നു.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Malayalam', topic: 'Literature', difficulty: 'medium', text: 'കേരളത്തിന്റെ ദേശീയ ഗാനം ഏത്?', options: ['കേരള കേരളം', 'കേരള വർണ്ണം', 'കേരള ഗാനം', 'കേരള സ്മൃതി'], correctAnswer: 0, explanation: 'കേരള കേരളം എന്ന ഗാനത്തിന്റെ രചയിതാവ് എം.ഇ. ചെറിയാനാണ്.', examType: ['Degree Level', 'University Assistant'] },

  // ─── ENGLISH ───
  { subject: 'English', topic: 'Grammar', difficulty: 'easy', text: 'Choose the correct article: "She is ___ university student."', options: ['a', 'an', 'the', 'no article'], correctAnswer: 0, explanation: '"University" begins with a consonant sound (you-niversity), so "a" is used.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'English', topic: 'Grammar', difficulty: 'medium', text: 'Which of the following is a collective noun?', options: ['Fleet', 'Courage', 'Beauty', 'Wisdom'], correctAnswer: 0, explanation: 'Fleet is a collective noun (a group of ships or vehicles).', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'English', topic: 'Grammar', difficulty: 'hard', text: 'Identify the tense: "She has been studying for two hours."', options: ['Present Perfect Continuous', 'Present Perfect', 'Present Continuous', 'Past Perfect Continuous'], correctAnswer: 0, explanation: '"Has been + studying" indicates Present Perfect Continuous tense.', examType: ['Degree Level', 'University Assistant'] },
  { subject: 'English', topic: 'Vocabulary', difficulty: 'easy', text: 'What is the synonym of "abundant"?', options: ['Plentiful', 'Scarce', 'Rare', 'Limited'], correctAnswer: 0, explanation: 'Abundant means plentiful or existing in large quantities.', examType: ['LDC', 'Secretariat Assistant'] },

  // ─── MENTAL ABILITY ───
  { subject: 'Mental Ability', topic: 'Analogy', difficulty: 'easy', text: 'Book : Author :: Painting : ?', options: ['Artist', 'Canvas', 'Brush', 'Museum'], correctAnswer: 0, explanation: 'A book is created by an author; a painting is created by an artist.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Mental Ability', topic: 'Analogy', difficulty: 'medium', text: 'Circle : Circumference :: Square : ?', options: ['Perimeter', 'Area', 'Diagonal', 'Volume'], correctAnswer: 0, explanation: 'Circumference is the boundary of a circle; perimeter is the boundary of a square.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Mental Ability', topic: 'Blood Relations', difficulty: 'easy', text: 'A man says, "This girl is the daughter of my mother\'s only daughter." How is he related to the girl?', options: ['Uncle', 'Father', 'Brother', 'Grandfather'], correctAnswer: 0, explanation: 'The mother\'s only daughter is the man\'s sister. Her daughter is his niece — so he is the uncle.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },

  // ─── CURRENT AFFAIRS ───
  { subject: 'Current Affairs', topic: 'Kerala News', difficulty: 'easy', text: 'The capital of Kerala is?', options: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam'], correctAnswer: 0, explanation: 'Thiruvananthapuram is the capital city of Kerala.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Current Affairs', topic: 'Kerala News', difficulty: 'medium', text: 'Which Kerala district has the highest population density?', options: ['Thiruvananthapuram', 'Kochi (Ernakulam)', 'Kozhikode', 'Alappuzha'], correctAnswer: 1, explanation: 'Ernakulam district has the highest population density in Kerala.', examType: ['Secretariat Assistant', 'Degree Level'] },
  { subject: 'Current Affairs', topic: 'National News', difficulty: 'easy', text: 'The currency of India is?', options: ['Rupee', 'Dollar', 'Euro', 'Yen'], correctAnswer: 0, explanation: 'The Indian Rupee (INR) is the official currency of India.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Current Affairs', topic: 'National News', difficulty: 'medium', text: 'Which is the largest state in India by area?', options: ['Rajasthan', 'Madhya Pradesh', 'Maharashtra', 'Uttar Pradesh'], correctAnswer: 0, explanation: 'Rajasthan is the largest state in India by area (342,239 sq km).', examType: ['Degree Level', 'University Assistant'] },

  // ─── MATHEMATICS ───
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'easy', text: 'What is 15% of 200?', options: ['30', '25', '35', '20'], correctAnswer: 0, explanation: '15% of 200 = (15/100) × 200 = 30.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'medium', text: 'If a train travels 120 km in 2 hours, what is its speed?', options: ['60 km/h', '50 km/h', '70 km/h', '40 km/h'], correctAnswer: 0, explanation: 'Speed = Distance/Time = 120/2 = 60 km/h.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Mathematics', topic: 'Arithmetic', difficulty: 'hard', text: 'The compound interest on ₹5000 at 10% per annum for 2 years is?', options: ['₹1050', '₹1000', '₹1100', '₹950'], correctAnswer: 0, explanation: 'CI = P(1+r/100)^n - P = 5000(1.1)^2 - 5000 = 5000(1.21) - 5000 = 6050 - 5000 = ₹1050.', examType: ['Degree Level', 'University Assistant'] },
  { subject: 'Mathematics', topic: 'Geometry', difficulty: 'easy', text: 'A triangle with all sides equal is called?', options: ['Equilateral', 'Isosceles', 'Scalene', 'Right-angled'], correctAnswer: 0, explanation: 'An equilateral triangle has all three sides equal.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Mathematics', topic: 'Geometry', difficulty: 'medium', text: 'What is the area of a circle with radius 7 cm? (π = 22/7)', options: ['154 sq cm', '44 sq cm', '22 sq cm', '77 sq cm'], correctAnswer: 0, explanation: 'Area = πr² = (22/7) × 7 × 7 = 154 sq cm.', examType: ['Secretariat Assistant', 'Degree Level'] },

  // ─── SOCIAL SCIENCE ───
  { subject: 'Social Science', topic: 'Economics', difficulty: 'easy', text: 'What is the primary sector of the economy?', options: ['Agriculture', 'Manufacturing', 'Services', 'Banking'], correctAnswer: 0, explanation: 'The primary sector involves extraction of natural resources, mainly agriculture.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Social Science', topic: 'Economics', difficulty: 'medium', text: 'GST stands for?', options: ['Goods and Services Tax', 'General Sales Tax', 'Government Sales Tax', 'Goods Supply Tax'], correctAnswer: 0, explanation: 'GST (Goods and Services Tax) was introduced in India on 1 July 2017.', examType: ['LDC', 'Secretariat Assistant', 'Degree Level'] },
  { subject: 'Social Science', topic: 'Civics', difficulty: 'easy', text: 'The head of the state government is called?', options: ['Chief Minister', 'Governor', 'President', 'Speaker'], correctAnswer: 0, explanation: 'The Chief Minister is the head of the state government.', examType: ['LDC', 'Secretariat Assistant'] },
  { subject: 'Social Science', topic: 'Civics', difficulty: 'medium', text: 'How many members are nominated by the President to the Rajya Sabha?', options: ['12', '10', '14', '8'], correctAnswer: 0, explanation: '12 members are nominated to the Rajya Sabha by the President for their expertise in art, literature, science, etc.', examType: ['Degree Level', 'University Assistant'] },
];

function pickWeighted(arr: CorpusEntry[]): CorpusEntry {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function searchCorpus(
  subject?: string,
  topic?: string,
  difficulty?: 'easy' | 'medium' | 'hard',
): CorpusEntry | null {
  if (!subject) return null;

  // Best: same subject + topic + difficulty
  if (topic && difficulty) {
    const exact = ENTRIES.filter((e) => e.subject === subject && e.topic === topic && e.difficulty === difficulty);
    if (exact.length > 0) return pickWeighted(exact);
  }

  // Good: same subject + topic (any difficulty)
  if (topic) {
    const byTopic = ENTRIES.filter((e) => e.subject === subject && e.topic === topic);
    if (byTopic.length > 0) return pickWeighted(byTopic);
  }

  // OK: same subject + difficulty (any topic)
  if (difficulty) {
    const byDifficulty = ENTRIES.filter((e) => e.subject === subject && e.difficulty === difficulty);
    if (byDifficulty.length > 0) return pickWeighted(byDifficulty);
  }

  // Fallback: same subject only
  const bySubject = ENTRIES.filter((e) => e.subject === subject);
  if (bySubject.length > 0) return pickWeighted(bySubject);

  return null;
}

export function getCorpusSubjects(): string[] {
  return [...new Set(ENTRIES.map((e) => e.subject))];
}

export function getCorpusTopicCount(subject: string, topic: string): number {
  return ENTRIES.filter((e) => e.subject === subject && e.topic === topic).length;
}

export function toGeneratedQuestion(entry: CorpusEntry): GeneratedQuestion {
  return {
    id: `corpus_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: entry.text,
    options: entry.options,
    correctAnswer: entry.correctAnswer,
    subject: entry.subject,
    topic: entry.topic,
    difficulty: entry.difficulty,
    explanation: entry.explanation,
    examType: entry.examType,
    confidence: entry.confidence ?? 1.0,
    source: 'corpus',
    generatedAt: new Date().toISOString(),
    subtopic: entry.subtopic,
  };
}

export const CORPUS_SIZE = ENTRIES.length;
