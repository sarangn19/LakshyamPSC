# Blocker Resolution Report

## Status: All 3 Resolvable Blockers Resolved

### C2 — Dual Taxonomy (knowledgeTree 9 subjects → 18 subjects) ✅
**Root cause**: `knowledgeTree.ts` had 9 subjects while `syllabus.ts` (canonical) had 18. Learning engine (cognitive twin, BKT, gap detection, recommendation) never recommended 9 canonical subjects.

**Fix**: Extended `knowledgeTree.ts`:
- Added `CANONICAL_SUBJECTS`, `SUBJECT_ALIASES`, `TOPIC_ALIASES`, `toCanonicalSubject()`, `toCanonicalTopic()` exports
- Added 9 missing subject nodes: Indian History & National Movement, World History, Civics & Public Administration, Indian Economy, Kerala Economy, Information Technology & Cyber Laws, English, Arts, Sports & Culture, Special Acts & Social Welfare
- Added all topic and subtopic nodes for new subjects (matching syllabus.ts names)
- Preserved existing 9 subjects with their prerequisite chains and subtopic detail
- All 18 subjects now discoverable via `getNodesByLevel('subject')`

### C3 — No Taxonomy Validation in generate-question ✅
**Root cause**: `generate-question/index.ts:parseResponse()` only validated JSON types, never checked subject/topic against canonical taxonomy. AI model could produce any string.

**Fix**: Added complete taxonomy validation:
- Inline `CANONICAL` map (18 subjects with topic sets), `SUBJECT_SYNONYMS`, `TOPIC_SYNONYMS`, `REJECTED_SUBJECTS`
- `validateTaxonomy()` function — mirrors store-mcq and store-mcq-batch patterns
- **Input validation**: rejects invalid subject/topic BEFORE calling AI (returns 400)
- **Output validation**: rejects AI response if subject/topic not canonical (returns 422)
- Deployed and verified: `Test` subject → 400 `Invalid taxonomy: Rejected subject "Test"`

### C4 — Dead AI Fallback in get-repository-question ✅
**Root cause**: Lines 114-254 (AI generation, storage, dedup logic) were unreachable after `return corsResponse()` on line 113. Referenced undeclared variables (`genRes`, `genBody`).

**Fix**: Removed all dead code (lines 115-243):
- Repository miss now cleanly returns `{ found: false, source: 'miss' }` 
- Client-side `resolveValidQuestion` handles AI generation and fallback chain (as already documented in comment)
- Deployed and verified: Kerala Economy → `found: false, source: miss` (correct), Constitution → `found: true, source: repository` (still works)

## Remaining Items (Non-Blocking)

| Item | Priority | Status |
|------|----------|--------|
| C1: All 3 AI API keys expired (Groq 401, OpenRouter 401, Gemini 400) | Critical | Deferred |
| PSC_FREQUENCY_BOOST keys updated to canonical names | Medium | Done |
| topicTaxonomy.ts deprecated (used by topicRelations.ts) | Low | Done |
| seed-repository COVERAGE_MATRIX uses pre-migration taxonomy | Low | Noted (can't run without AI keys) |
| 2 zero-coverage subjects (Kerala Economy, Special Acts) | High | Awaiting C1 resolution |
| ~149 orphan topics remain within valid subjects | Medium | Awaiting C1 resolution |
| fill_coverage_full.cjs uses non-canonical taxonomy | Low | Noted |

## Deployments
- `generate-question` — deployed (v2 with taxonomy validation)
- `get-repository-question` — deployed (v2, dead code removed)
- `store-mcq` — deployed (was already validated)
- `store-mcq-batch` — deployed (was already validated)
