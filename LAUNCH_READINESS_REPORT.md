# Launch Readiness Report

**Date:** 2026-06-22
**App:** Lakshyam — Kerala PSC Exam Preparation
**Total questions:** 1,336 in repository

## Classification Categories

- 🔴 **Critical blockers** — must fix before any launch
- 🟠 **High priority** — should fix before public launch
- 🟡 **Medium** — address within first month
- 🔵 **Nice-to-have** — aspirational improvements

---

## 🔴 Critical Blockers

### C1. AI Question Generation Completely Broken (502)
All 3 AI API keys are expired/invalid:
- **Groq** (`AI_API_KEY`) — 401
- **OpenRouter** (`FALLBACK_API_KEY`) — 401
- **Gemini** (`GEMINI_API_KEY`) — 400

**Impact:** `generate-question` edge function returns 502. `get-repository-question` cannot fall back to AI generation. The only working question sources are the repository (1,336 questions) and client-side templates (~40 hardcoded). Users will exhaust seen questions quickly.

**Location:** `supabase/functions/generate-question/index.ts:252-255`, line 319

### C2. Dual Taxonomy: knowledgeTree (9 subjects) vs syllabus.ts (18 subjects)
The learning engine (`knowledgeTree.ts`) knows only 9 subjects:
> Kerala History, Renaissance, Constitution, Geography, Science, Current Affairs, Quantitative Aptitude, Mental Ability, Malayalam

The canonical repository taxonomy (`syllabus.ts`) has 18 subjects — **9 are invisible to the recommendation engine**:
> Arts, Sports & Culture, Civics & Public Administration, English, Indian Economy, Indian History & National Movement, Information Technology & Cyber Laws, Kerala Economy, Special Acts & Social Welfare, World History

**Impact:** Questions stored under these 9 subjects will never be recommended for practice. The cognitive twin, BKT mastery tracking, and gap detection are all blind to them.

**Locations:** `src/data/knowledgeTree.ts:11-424` vs `src/data/syllabus.ts`

### C3. generate-question Has No Taxonomy Validation
The AI prompt in `generate-question` instructs the model to return `subject` and `topic` fields, but there is no validation against the canonical taxonomy. The model can (and will) produce non-canonical names like "Polity", "Indian History", "Renaissance" as subjects — creating orphan data on every successful AI generation.

**Location:** `supabase/functions/generate-question/index.ts:183-228` — `parseResponse()` only checks types, not canonical validity.

### C4. Dead Code in get-repository-question (Unreachable AI Fallback)
Lines 114-254 in `get-repository-question/index.ts` are unreachable because the function returns on line 113 (`return corsResponse(...)`). This code was intended to call `generate-question` on repository miss, but dead code eliminates the entire AI generation fallback path. If the repository has no matching question, the response is `{ found: false, source: 'miss' }` — nothing more.

**Location:** `supabase/functions/get-repository-question/index.ts:113-254`

---

## 🟠 High Priority

### H1. knowledgeTree Missing 9 Canonical Subjects
The knowledge tree must be extended to include all 18 canonical subjects from `syllabus.ts`. Without this:
- `getNodesByLevel('subject')` returns only 9 subjects
- `getRecommendedSubjectAndTopic()` cannot recommend 9 subjects
- `getNextCognitiveGapTopic()` skips 9 subjects entirely
- PSC_FREQUENCY_BOOST map has no entries for missing subjects

### H2. PSC Frequency Boost Uses Non-Canonical Names
`PSC_TOPIC_MAP` references non-canonical keys like `"Indian Constitution::Constitutional Framework"` and `"Renaissance::Social Reform Movements"` maps to `"Kerala Renaissance"`. After the taxonomy migration, the canonical key is `"Constitution::Constitutional Framework"`. The frequency lookup will miss against the canonical subject names stored in the repository.

**Location:** `src/services/pscFrequencyBoost.ts:4-28`

### H3. No Automated Tests (Unit, Integration, E2E)
Zero test files found in the entire codebase. No `__tests__` directories, no Jest/Mocha/Vitest config, no test scripts in `package.json`. Cannot verify:
- Question validation logic
- Taxonomy mapping
- Recommendation scoring
- Session orchestration
- Edge function responses

### H4. No Error Monitoring or Alerting
No Sentry, Datadog, or any error tracking SDK integrated. Edge functions log to Supabase console (not monitored). Client-side errors silently fail in `try/catch` blocks with no reporting. Cannot detect production issues without user reports.

### H5. Last Resort Fallback Uses Non-Canonical Taxonomy
The absolute last resort question uses:
```
subject: 'General', topic: 'General Knowledge'
```
Neither exists in the canonical taxonomy. If this question reaches the repository, it creates an orphan entry.

**Location:** `src/services/questionFallback.ts:120-141`

### H6. ask-ai Has No RAG (Retrieval-Augmented Generation)
The AI tutor has no access to the syllabus, knowledge tree, repository questions, or PSC past papers. All answers rely solely on the LLM's training data. Cannot cite specific syllabus points or reference actual Kerala PSC exam patterns. The system prompt only provides exam context — no factual grounding.

**Location:** `supabase/functions/ask-ai/index.ts:43-51`

### H7. seed-repository Uses Pre-Migration Taxonomy Names
The `COVERAGE_MATRIX` in `seed-repository/index.ts` still uses `'Indian History'`, `'Polity'`, `'Social Science'`, `'Mathematics'`, `'Kerala History/Renaissance'`. If this function is run, it will create questions with orphan subject names that the `store-mcq-batch` validation would reject or the synonym mapper would canonicalize.

**Location:** `supabase/functions/seed-repository/index.ts:27-295`

---

## 🟡 Medium

### M1. "General" Orphan Topics Remain (95+ questions)
Several "General" topic entries persist within valid subjects:

| Subject | General Count |
|---------|--------------|
| Kerala History | 23 |
| Current Affairs | 10 |
| Geography | 9 |
| Malayalam | 9 |
| Mental Ability | 11 |
| Quantitative Aptitude | 14 |

These cannot be recommended because the recommendation engine looks for specific topic names. They need splitting into canonical topics based on content.

### M2. Science Subtopics Not Canonical (30 questions)
Questions stored under non-canonical Science topics:
- `Science/Biology` (11 questions) — should be `Science/Biology — Human Physiology` etc.
- `Science/Chemistry` (9 questions)
- `Science/Physics` (10 questions)
- `Science/Environmental Science` (17 questions) — should be `Science/Environmental Science & Waste Management`

### M3. Malayalam Unicode Duplicates (24 questions)
Malayalam topic names exist in both Unicode (വ്യാകരണം, സാഹിത്യം) and English-transliterated forms (Grammar (വ്യാകരണം), Literature (സാഹിത്യം)). This creates duplicate coverage cells in the materialized view.

### M4. No Rate Limiting on Public Endpoints
Edge functions have no rate limiting configuration. No protection against abuse of `generate-question` or `ask-ai` if API keys are restored.

### M5. No Deduplication Across Sources
Hash-based dedup only checks within `question_bank_mcqs`. If the same question flows from template → repository → AI generation, it could appear 3 times. No cross-source dedup.

### M6. fill_coverage_full.cjs Uses Wrong Taxonomy
The CLI seed script uses non-canonical subject/topic names like `Renaissance` (should be under `Kerala History` or be a canonical subject) and `Constitution` as a module-level topic. Would fail `store-mcq-batch` validation.

---

## 🔵 Nice-to-Have

### N1. CI/CD Pipeline
No GitHub Actions, no automated deployment. Supabase functions are deployed manually via CLI. No staging/preview environment.

### N2. Offline Support Robustness
The app appears to rely on AsyncStorage for persistence, but the extent of offline question caching is unclear. Network failures in edge function calls are caught but not retried with exponential backoff.

### N3. Performance: PSC Analytics Memory Load
The PSC frequency JSON (17K+ entries from PSC PYQs) is loaded into an in-memory cache on app startup (`seedPSCFrequency()`). This could be 2-5MB+ parsed into `topicFrequencyCache`. On mobile with limited memory, this may cause jank.

### N4. Bundle Size / Code Splitting
No evidence of code splitting or lazy loading. `aiMCQGenerator.ts` (660 lines with dozens of template questions) is imported eagerly. The `cognitiveTwinRecommender` and `knowledgeTree` are also eagerly loaded.

### N5. A/B Testing Infrastructure
No feature flagging system beyond a simple `isFeatureEnabled` check in authStore. No experimentation framework.

### N6. Backup / DR Strategy
No visible backup schedule for the Supabase database. No disaster recovery plan for the 1,336 curated questions.

---

## Verification Results

### 1. Recommendations (✓/✗)
| Check | Result | Notes |
|-------|--------|-------|
| Generate 20 recommendations | ⚠️ Partial | Engine can produce ~12 from 9 knowledgeTree subjects — 9 subjects have no knowledge tree coverage |
| PSC frequency influence | ⚠️ Broken | Uses non-canonical names — lookup misses after migration |
| Taxonomy consistency | ✗ Fail | knowledgeTree (9) ≠ syllabus (18) |

### 2. Repository
| Check | Result | Notes |
|-------|--------|-------|
| No orphan subjects | ✓ Pass | 0 orphan subjects after migration |
| No orphan topics | ✗ Fail | ~95 "General" + 30 Science + 24 Malayalam unicode remain |
| All lookups use canonical taxonomy | ✗ Fail | seed-repository, PSC frequency boost use old names |

### 3. Practice Sessions
| Check | Result | Notes |
|-------|--------|-------|
| Run 50 generated sessions | ✗ Fail | AI generation 502 — only repository + templates available |
| Record source: repository | ✓ | Working |
| Record source: AI | ✗ | Always 502 |
| Record source: corpus | ⚠️ | PSC corpus fallback exists but limited |
| Record source: template | ✓ | Working |
| No null questions | ⚠️ | Fallback chain can return emergency question |

### 4. AI Tutor (ask-ai)
| Check | Result | Notes |
|-------|--------|-------|
| Edge function functional | ✗ | AI_API_KEY same as generate-question — likely expired |
| Conversation history passed | ✓ | Last 10 messages included in request |
| No hardcoded responses | ✓ | All responses from LLM, no hardcoded fallback |

### 5. Coverage
| Check | Result | Notes |
|-------|--------|-------|
| Subjects below target | 2 | Kerala Economy (0), Special Acts & Social Welfare (0) |
| Topics below target (≤5) | 29 | See COVERAGE_GAP_REPORT.md |
| Zero-coverage subjects | 2 | Same as above |

---

## Launch Recommendation

### ❌ NOT READY FOR ANY LAUNCH

**Reason:** 4 critical blockers and 7 high-priority issues prevent even an internal beta.

The AI question generation (the core value proposition) is entirely non-functional. The recommendation engine is blind to half the syllabus. The taxonomy is split across two incompatible systems.

### Recommended Path

| Phase | Actions | Estimate |
|-------|---------|----------|
| **Phase 1: Critical** | Renew API keys, add taxonomy validation to generate-question, unify knowledgeTree with syllabus.ts | 1-2 weeks |
| **Phase 2: High** | Update seed-repository, PSC frequency maps, fix dead code, add error monitoring | 1 week |
| **Phase 3: Medium** | Split General topics, consolidate Science/Malayalam, add rate limiting | 1 week |
| **Phase 4: Polish** | Tests, CI/CD, offline robustness, bundle optimization | 2 weeks |
| **Internal Beta** | After Phase 1+2 | ~3 weeks |
| **Public Beta** | After Phase 3 | ~4 weeks |
| **Production** | After Phase 4 | ~6 weeks |

### Go/No-Go Gates

| Gate | Criteria |
|------|----------|
| Internal Beta | AI generation working, taxonomy unified, no orphan subjects |
| Public Beta | Internal beta stable 1 week, error monitoring active, all 18 subjects recommendable |
| Production | Tests passing, rate limiting active, coverage ≥80% of canonical topics at ≥5 questions |
