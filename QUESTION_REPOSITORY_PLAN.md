# Question Repository Plan

## 1. Current Coverage

| Metric | Value |
|--------|-------|
| PSC PYQs in database | 17,165 |
| Quiz-ready PSC PYQs | 2,546 |
| Stored AI-generated questions | 504 |
| Runtime AI calls per session | 1 per question (current) |
| 502 failure rate | Occasional, under load |

### Subject Distribution (from `question_bank_mcqs`)

The 504 stored AI questions span a subset of PSC subjects. Exact distribution depends on what users have studied — coverage is uneven because questions are only stored when `confidenceScore >= 0.8` during active sessions.

### Gaps

| Gap | Impact |
|-----|--------|
| No pre-seeded questions | Every first session hits AI |
| Uneven subject coverage | Some subjects always trigger AI |
| No dedup at storage | Same question can be stored multiple times |
| No usage tracking | Repository can't prioritize questions |
| No coverage analytics | Unknown which (subject, topic, difficulty) cells are filled |

## 2. Target: 5,000+ Questions

### Coverage Matrix

| Subject | Topics | Easy | Medium | Hard | Total |
|---------|--------|------|--------|------|-------|
| Kerala History | 4 | 40 | 40 | 5 | 85 |
| Indian History | 4 | 40 | 40 | 0 | 80 |
| Polity | 5 | 50 | 50 | 5 | 105 |
| Geography | 3 | 30 | 30 | 0 | 60 |
| Science | 3 | 30 | 30 | 5 | 65 |
| Social Science | 2 | 20 | 20 | 0 | 40 |
| Malayalam | 2 | 20 | 20 | 0 | 40 |
| English | 2 | 20 | 10 | 0 | 30 |
| Mental Ability | 3 | 30 | 30 | 0 | 60 |
| Mathematics | 2 | 20 | 20 | 5 | 45 |
| Current Affairs | 2 | 20 | 0 | 0 | 20 |
| General Knowledge | 4 | 40 | 20 | 0 | 60 |
| **Total** | **36** | **360** | **310** | **20** | **690** |

Each cell is seeded with 10 questions (5 for hard). With 36 topic×difficulty cells, initial AI generation covers **690 unique questions**. After seeding, runtime generation fills gaps organically as students encounter uncovered cells.

### Estimated Reduction in AI Calls

| Phase | AI Calls per Question | Source |
|-------|----------------------|--------|
| Before (current) | 100% | AI always |
| After seeding (690 Qs) | ~50% | Repository covers half of session questions |
| After 2,000 Qs | ~70% | Most common (subject, topic, difficulty) combos covered |
| After 5,000 Qs | ~85% | Long tail coverage |

## 3. Migration Steps

### Step 1: Database Migration (file: `00021_question_repository.sql`)
- Add `question_hash` (text, unique) to `question_bank_mcqs` for dedup
- Add `source` (enum) to `question_bank_mcqs` for origin tracking
- Add `exam_types` (text[]) to `question_bank_mcqs` for multi-exam matching
- Create `generation_metadata` table for analytics
- Create materialized view `repository_coverage` for fast lookup
- Create RPC functions: `get_repository_stats()`, `get_repository_coverage()`, `get_repository_topics()`, `increment_question_usage()`

### Step 2: Deploy Edge Functions
- `get-repository-question`: Database-first question lookup → AI fallback → store result
- `seed-repository`: Batch generation across 67 subject+topic+difficulty combos
- `repository-analytics`: Coverage statistics and hit rate monitoring
- Update `store-mcq`: Add dedup via SHA-256 hash, add validation (duplicate options, invalid answers, short explanations)
- Update `store-mcq-batch`: Add per-row validation + hash dedup

### Step 3: Deploy Client Changes
- `src/services/repositoryService.ts`: Client-side repository query + analytics
- `src/services/questionBankStorage.ts`: Add `validateMCQ()` for client-side quality control, update request shape
- `src/store/mcqHelpers.ts`: Add repository-first lookup in `resolveValidQuestion()` — checks Supabase before calling AI

### Step 4: Seed Repository
- Deploy migration to production
- Run `seed-repository` edge function via HTTP POST
- Generates 690 questions across all coverage cells
- ~20 minutes total (1.5s between requests, 3 parallel streams)

### Step 5: Verify
- Run `GET /functions/v1/repository-analytics` to confirm:
  - `totalQuestions >= 1,194` (504 existing + 690 seeded)
  - `coverageCells >= 36` (subject+topic+difficulty combos)
  - `databaseHitRate` increasing over time

## 4. Expected Reduction in 502 Failures

| State | AI Call Volume | 502 Rate |
|-------|---------------|----------|
| Current | ~100% of questions | 1-5% of requests |
| After seeding | ~50% of questions | ~0.5-2.5% of requests |
| At 5,000 Qs | ~15% of questions | ~0.15-0.75% of requests |

The 502 errors come from the `generate-question` edge function timing out under cold start. Reducing AI call volume proportionally reduces 502 exposure. At 5,000 stored questions, 85% of session questions come from the repository (sub-millisecond response, no cold start).

## 5. New Question Flow

```
Student → resolveValidQuestion()
  ├── Repository lookup (POST /functions/v1/get-repository-question)
  │     ├── SELECT FROM question_bank_mcqs WHERE subject, topic, difficulty, status='active'
  │     ├── FOUND? → increment usage_count, record generation_metadata (result='repository_hit'), return
  │     └── NOT FOUND? → POST /functions/v1/generate-question (AI)
  │                       ├── SUCCESS? → compute SHA-256 hash, check duplicate
  │                       │              → INSERT INTO question_bank_mcqs
  │                       │              → record generation_metadata (result='ai_generated')
  │                       │              → return
  │                       └── FAIL? → record generation_metadata (result='ai_failed'), return null
  │
  ├── (if repository+AI both fail) generateNextAdaptiveQuestion() [existing fallback]
  └── (if all fail) getFallbackQuestion() [corpus → template → emergency]
```

## 6. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/00021_question_repository.sql` | **NEW** — Schema + RPCs |
| `supabase/functions/get-repository-question/index.ts` | **NEW** — Database-first question edge function |
| `supabase/functions/seed-repository/index.ts` | **NEW** — Batch seed generation |
| `supabase/functions/repository-analytics/index.ts` | **NEW** — Coverage analytics |
| `supabase/functions/store-mcq/index.ts` | Updated — SHA-256 dedup + validation |
| `supabase/functions/store-mcq-batch/index.ts` | Updated — Per-row validation + hash dedup |
| `src/services/repositoryService.ts` | **NEW** — Client-side repository client |
| `src/services/questionBankStorage.ts` | Updated — Add `validateMCQ()`, `source`, `examTypes` |
| `src/store/mcqHelpers.ts` | Updated — Repository-first lookup in `resolveValidQuestion()` |

## 7. Operation Playbook

### Seed Command
```bash
curl -X POST https://cycutcqlhpeudmaebwmb.supabase.co/functions/v1/seed-repository \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'
```
Uses the built-in `COVERAGE_MATRIX` (67 jobs, 690 questions target).

### Analytics Check
```bash
curl https://cycutcqlhpeudmaebwmb.supabase.co/functions/v1/repository-analytics \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

### Monitor Hit Rate
The `repository-analytics` response includes `hitRate.databaseHitRate` — the percentage of question requests served from the repository (vs. triggering AI generation). Target: >80% after seeding.
