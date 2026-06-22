# Taxonomy Audit

**Date:** 2026-06-22  
**Repository:** `question_bank_mcqs`  
**Total questions:** 1,336  

## Canonical Taxonomy (from `src/data/syllabus.ts`)

18 subjects, 86 topics:

| Subject | Topics | Questions |
|---------|--------|----------|
| Arts, Sports & Culture | Classical & Ritualistic Art Forms, Folk & Traditional Arts, Malayalam Cinema, Sports & Athletics | 1 |
| Civics & Public Administration | Bureaucracy & Administrative Machinery, Digital Governance & E-Governance, Social Welfare & Public Policy | 1 |
| Constitution | Constitutional Framework, Fundamental Rights, Directive Principles & Fundamental Duties, Union Executive, Union Legislature, Judiciary, State Executive & Legislature, Federal System & Local Government, Constitutional Bodies | 74 |
| Current Affairs | Kerala News, National News, International News, Science & Technology, Sports | 44 |
| English | Grammar, Vocabulary, Reading Comprehension & Writing | 1 |
| Geography | Physical Geography (World), Geophysical Phenomena, Physiography of India, Indian River Systems, Climate of India, Kerala Geography | 111 |
| Indian Economy | National Income & Macroeconomic Indicators, Banking & Monetary Policy, Public Finance & Fiscal System, Sectors of Indian Economy, Planning & Development | **0** |
| Indian History & National Movement | Ancient India, Medieval India, British Rule & Early Struggles, Indian National Movement | 11 |
| Information Technology & Cyber Laws | Computer Hardware & Architecture, Software & Operating Systems, Networks & Internet, Web Technologies & Languages, Cyber Security & Threats, IT Act & Legal Frameworks | 3 |
| Kerala Economy | Kerala Model of Development, Socio-Economic Safety Networks, Kerala Fiscal & Industrial Landscape | **0** |
| Kerala History | Ancient Kerala, Medieval Kerala, Arrival of Europeans & Early Resistance, Modern Kerala, Cultural History | 383 |
| Malayalam | Grammar (വ്യാകരണം), Literature (സാഹിത്യം), Poetry (കവിത), Prose & Drama (ഗദ്യവും നാടകവും) | 60 |
| Mental Ability | Series & Patterns, Analogy & Classification, Coding & Decoding, Blood Relations & Direction Sense, Syllogisms & Venn Diagrams, Clock, Calendar & Miscellaneous | 38 |
| Quantitative Aptitude | Number System & Basic Operations, Arithmetic, Time Speed Distance & Work, Mensuration, Algebra & Progressions, Data Interpretation | 52 |
| Renaissance | Social Reform Movements, Temple Entry Movement, Major Agitations & Structural Protests, Literary Renaissance | 54 |
| Science | Physics — Mechanics, Physics — Light/Sound/Heat, Chemistry — Atomic Structure, Chemistry — Acids/Bases, Biology — Human Physiology, Biology — Biochemistry/Nutrition, Biology — Plant Physiology, Environmental Science | 69 |
| Special Acts & Social Welfare | Human Rights & Civil Rights, Gender & Child Welfare, Transparency & Anti-Corruption | **0** |
| World History | Great Revolutions, World Wars & International Alliances | 2 |
| **Total (canonical)** | **86 topics** | **904** |

## Orphan Subjects (7 subjects, 432 questions, 32.3%)

Questions stored under non-canonical subject names that should be migrated:

| Orphan Subject | Questions | Canonical Target | Topics |
|---------------|-----------|-----------------|--------|
| **Polity** | **210** | Constitution | Constitution (50), Directive Principles (20), Fundamental Rights (40), Judiciary (24), Parliament (40), President (36) |
| **Indian History** | **170** | Indian History & National Movement | Ancient India (47), Medieval India (43), Modern India (40), Freedom Movement (40) |
| **General Science** | 17 | Science | General (17) |
| **Indian Constitution** | 20 | Constitution | General (20) |
| **Social Science** | 8 | Civics & Public Administration / Indian Economy | Civics (4), Economics (4) |
| **മലയാളം (Unicode)** | 6 | Malayalam | വ്യാകരണം (3), സാഹിത്യം (3) |
| **Test** | 1 | REJECT | Test Topic (1) |

**Migration priority:** Polity (210) > Indian History (170) > General Science (17) > Indian Constitution (20) > Social Science (8) > Unicode Malayalam (6) > Test (1)

## Orphan Topics (within valid subjects, 260 questions)

Topics stored under correct canonical subject but topic name doesn't match syllabus:

| Subject | Invalid Topic | Questions | Should Map To |
|---------|--------------|-----------|---------------|
| Constitution | Directive Principles | 6 | Directive Principles & Fundamental Duties |
| Current Affairs | General | 10 | (split across topics) |
| Geography | Continents and Oceans | 8 | Physical Geography (World) |
| Geography | General | 9 | (split across topics) |
| Geography | Geographical Features | 5 | Physical Geography (World) |
| Geography | Physical Geography | 33 | Physical Geography (World) |
| Geography | World Geography | 5 | Physical Geography (World) |
| Kerala History | General | 23 | (split across topics) |
| Kerala History | Renaissance | 67 | Renaissance (subject) |
| Malayalam | General | 9 | (split across topics) |
| Malayalam | Grammar | 8 | Grammar (വ്യാകരണം) |
| Malayalam | Literature | 10 | Literature (സാഹിത്യം) |
| Mental Ability | General | 11 | (split across topics) |
| Mental Ability | Logical Reasoning | 12 | (split across topics) |
| Quantitative Aptitude | General | 14 | (split across topics) |
| Science | Biology | 11 | Biology — Human Physiology etc. |
| Science | Chemistry | 9 | Chemistry — Atomic Structure etc. |
| Science | Physics | 10 | Physics — Mechanics etc. |

## Cells Missing Entirely (0 questions for canonical subject)

These canonical subjects have zero questions in the repository:
- **Indian Economy** — 5 topics, 0 questions
- **Kerala Economy** — 3 topics, 0 questions
- **Special Acts & Social Welfare** — 3 topics, 0 questions

## Taxonomy Mapping (applied by `store-mcq-batch`)

### Subject synonyms (auto-mapped at store time):
```
Polity → Constitution
Indian History → Indian History & National Movement
Social Science → Civics & Public Administration
General Science → Science
Indian Constitution → Constitution
Mathematics → Quantitative Aptitude
General Knowledge → Current Affairs
```

### Topic synonyms (auto-mapped at store time):
```
Polity/Constitution → Constitution/Constitutional Framework
Polity/Directive Principles → Constitution/Directive Principles & Fundamental Duties
Polity/Fundamental Rights → Constitution/Fundamental Rights
Polity/Judiciary → Constitution/Judiciary
Polity/Parliament → Constitution/Union Legislature
Polity/President → Constitution/Union Executive
Indian History/Ancient India → Indian History & National Movement/Ancient India
Indian History/Medieval India → Indian History & National Movement/Medieval India
Indian History/Modern India → Indian History & National Movement/British Rule & Early Struggles
Indian History/Freedom Movement → Indian History & National Movement/Indian National Movement
Social Science/Economics → Indian Economy/National Income & Macroeconomic Indicators
Social Science/Civics → Civics & Public Administration/Bureaucracy & Administrative Machinery
Indian Constitution/General → Constitution/Constitutional Framework
General Science/General → Science/Chemistry — Atomic Structure & Periodicity
```

### Rejected subjects:
```
Test → "Rejected subject is not a valid PSC category"
```

## Migration Plan

### Phase 1: Store-time validation (NOW)
- [x] `store-mcq-batch` rejects unknown taxonomy at ingest
- [x] Synonym mapping applied automatically before storage
- [ ] Apply same validation to `store-mcq` (single-item store) and `generate-question`

### Phase 2: Backfill orphan data
- [ ] Migrate Polity → Constitution (210 questions, UPDATE SQL)
- [ ] Migrate Indian History → Indian History & National Movement (170 questions, UPDATE SQL)
- [ ] Migrate General Science → Science (17 questions)
- [ ] Migrate Indian Constitution → Constitution (20 questions)
- [ ] Migrate Social Science → Civics & Public Administration (8 questions)
- [ ] Migrate Unicode മലയാളം → Malayalam (6 questions)
- [ ] Delete Test/Test Topic question (1 question)

### Phase 3: Expand canonical syllabus
- [ ] Add missing topics (General, Physical Geography, Biology, Chemistry, Physics etc.) to syllabus.ts
- [ ] Or split orphan general topics into specific canonical topics
- [ ] Seed questions for zero-coverage subjects: Indian Economy, Kerala Economy, Special Acts

### Phase 4: Schema enforcement
- [ ] Add `knowledge_nodes` table to remote DB (migration exists locally but never applied)
- [ ] Add FK constraint from `question_bank_mcqs.subject` → `knowledge_nodes.name`
- [ ] Add deployment check that prevents orphan taxonomy from being created

## Key Decisions

1. **Reject over warn:** Unknown taxonomy returns a hard error at storage time — better to surface immediately than accumulate drift
2. **Auto-map synonyms:** Accepted legacy names (Polity, Indian History) are silently canonicalized before storage so existing callers still work
3. **Canonical syllabus as source of truth:** `src/data/syllabus.ts` is the authoritative taxonomy definition; all other files (knowledgeTree.ts, PSC_SUBJECT_MAP, COVERAGE_MATRIX) should derive from it
4. **`knowledge_nodes` table sync:** The remote DB is missing the knowledge_nodes hierarchy table despite local migration existing. Migration 00004 was never applied to remote. Address separately.
