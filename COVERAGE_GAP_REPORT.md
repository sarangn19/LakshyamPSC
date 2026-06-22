# Coverage Gap Report

**Generated:** 2026-06-22 (post-taxonomy migration)
**Total questions:** 1,336
**Canonical subjects:** 18 | **Subjects with data:** 16 | **Zero-coverage subjects:** 2

## Zero-Coverage Subjects

These canonical subjects have **0 questions** in the repository:

| Subject | Topics Missing |
|---------|---------------|
| **Kerala Economy** | Kerala Model of Development, Socio-Economic Safety Networks, Kerala Fiscal & Industrial Landscape |
| **Special Acts & Social Welfare** | Human Rights & Civil Rights, Gender & Child Welfare, Transparency & Anti-Corruption |

## Cells Below 5 Questions (aggregated across difficulties)

Cells with very low coverage that need attention:

| Subject | Topic | Total | Priority |
|---------|-------|-------|----------|
| Arts, Sports & Culture | Classical & Ritualistic Art Forms | 1 | High |
| Civics & Public Administration | Social Welfare & Public Policy | 1 | High |
| English | Grammar | 1 | High |
| Information Technology & Cyber Laws | Computer Hardware & Architecture | 1 | High |
| Information Technology & Cyber Laws | IT Act & Legal Frameworks | 1 | High |
| Information Technology & Cyber Laws | Software & Operating Systems | 1 | High |
| World History | Great Revolutions | 1 | High |
| World History | World Wars & International Alliances | 1 | High |
| Civics & Public Administration | Bureaucracy & Administrative Machinery | 4 | Medium |
| Constitution | Federal System & Local Government | 4 | Medium |
| Current Affairs | International News | 4 | Medium |
| Current Affairs | Science & Technology | 2 | Medium |
| Current Affairs | Sports | 5 | Medium |
| Geography | Physiography of India | 4 | Medium |
| Indian Economy | National Income & Macroeconomic Indicators | 4 | Medium |
| Malayalam | Grammar (വ്യാകരണം) | 5 | Medium |
| Malayalam | Poetry (കവിത) | 5 | Medium |
| Mental Ability | Blood Relations & Direction Sense | 4 | Medium |
| Mental Ability | Coding & Decoding | 2 | Medium |
| Mental Ability | Series & Patterns | 2 | Medium |
| Mental Ability | Syllogisms & Venn Diagrams | 2 | Medium |
| Quantitative Aptitude | Number System & Basic Operations | 4 | Medium |
| Quantitative Aptitude | Time, Speed, Distance & Work | 3 | Medium |
| Science | Biology — Human Physiology | 5 | Medium |
| Science | Biology — Plant Physiology & Ecology | 5 | Medium |
| Science | Chemistry — Acids, Bases & Chemical Reactions | 5 | Medium |
| Science | Chemistry — Atomic Structure & Periodicity | 4 | Medium |
| Science | Environmental Science & Waste Management | 5 | Medium |
| Science | Physics — Mechanics & Properties of Matter | 4 | Medium |

**Total cells below 5:** 29 (improved from 30 pre-migration)

## Good Coverage Cells (>50 questions)

| Subject | Topic | Total |
|---------|-------|-------|
| Constitution | Constitutional Framework | 75 |
| Kerala History | Ancient Kerala | 92 |
| Kerala History | Medieval Kerala | 81 |
| Kerala History | Modern Kerala | 96 |
| Renaissance | Social Reform Movements | 82 |
| Geography | Physical Geography (World) | 55 |
| Indian History & National Movement | Ancient India | 50 |

## Remaining Taxonomy Issues (non-canonical topics within valid subjects)

These topics exist in the DB but don't match canonical syllabus names:

| Subject | Non-Canonical Topic | Questions | Should Map To |
|---------|-------------------|-----------|---------------|
| Science | Biology | 11 | (split: Human Physiology, Biochemistry, Plant Physiology) |
| Science | Chemistry | 9 | (split: Atomic Structure, Acids/Bases) |
| Science | Physics | 10 | (split: Mechanics, Light/Sound/Heat) |
| Science | Environmental Science | 17 | Environmental Science & Waste Management |
| Malayalam | വ്യാകരണം (Unicode) | 11 | Grammar (വ്യാകരണം) |
| Malayalam | സാഹിത്യം (Unicode) | 13 | Literature (സാഹിത്യം) |
| Kerala History | General | 23 | (split across topics) |
| Current Affairs | General | 10 | (split: Kerala News, National News, etc.) |
| Geography | General | 9 | (split across topics) |
| Mental Ability | General | 11 | (split across topics) |
| Mental Ability | Logical Reasoning | 12 | Analogy & Classification |
| Quantitative Aptitude | General | 14 | (split across topics) |
| Malayalam | General | 9 | (split across topics) |

## Key Recommendations

1. **Seed 0-coverage subjects** — Kerala Economy (3 topics) and Special Acts & Social Welfare (3 topics) have zero questions
2. **Consolidate Malayalam Unicode topics** — 24 questions in Unicode topic names should be migrated to English-named equivalents
3. **Split General topics** — ~95 questions across 5 subjects use a non-specific "General" topic
4. **Fix Science subtopics** — 30 questions use generic Biology/Chemistry/Physics instead of specific canonical subtopic names
5. **Target 29 low-coverage cells** for next-generation round (once API keys are renewed)
