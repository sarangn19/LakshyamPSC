# Fallback Architecture Validation

## Test Scenarios

All scenarios were run via two validation scripts:

- `scripts/validateFallback.mts` — 12 tests (PSC corpus queries, chain simulation, coverage audit)
- `scripts/validateFallbackIntegration.mts` — 6 tests (integration-level chain simulation)

**Total: 18/18 passed.**

| # | Scenario | Simulated Failure | Source Selected | Response Time | Result |
|---|---|---|---|---|---|
| 1 | PSC Corpus — exact subject+topic+difficulty match | None (direct query) | `corpus` | <1ms | ✓ Question returned, valid options, valid answer |
| 2 | PSC Corpus — unknown subject | None (direct query) | none | <1ms | ✓ Correctly returned null |
| 3 | PSC Corpus — subject-only fallback | None (direct query) | `corpus` | <1ms | ✓ Returns question from subject (no topic filter) |
| 4 | PSC Corpus → GeneratedQuestion conversion | None (direct conversion) | `corpus` | <1ms | ✓ source=corpus, id present, generatedAt present |
| 5 | AI provider 502 → corpus hit | HTTP 502 from edge function | `corpus` | <1ms | ✓ Corpus served question for same subject+topic |
| 6 | AI 502 + corpus miss → template_topic | HTTP 502, unknown subject | `template_topic` | <1ms | ✓ Topic template filled the gap |
| 7 | AI 502 + corpus miss + topic template miss → template_subject | HTTP 502, all upper tiers fail | `template_subject` | <1ms | ✓ Subject template served |
| 8 | AI timeout (>30s) | fetch() aborted after 30s | `corpus` | <1ms | ✓ Corpus hit for Geography/Kerala Geography |
| 9 | AI returned empty JSON (200 OK, no question field) | Edge function returns `{}` with 200 | `corpus` | <1ms | ✓ Corpus hit for Mathematics/Arithmetic |
| 10 | All 3 AI retries fail + all fallback tiers exhausted | 502×3, corpus miss, topic template miss, subject template miss | `template_subject` (emergency) | 1ms | ✓ Last resort "national bird" served |
| 11 | Subject coverage — every PSC subject has corpus entry | N/A (audit) | `corpus` | <1ms | ✓ 11 subjects in corpus, all covered |
| 12 | Topic diversity — ≥2 topics per subject | N/A (audit) | `corpus` | <1ms | ✓ All subjects have ≥2 searchable topics |
| 13 | Integration — corpus hit with exact subject+topic | Simulated AI fail | `corpus` | <1ms | ✓ subject=Kerala History, topic=Ancient Kerala |
| 14 | Integration — corpus miss → template_topic | Simulated AI fail + corpus miss | `template_topic` | <1ms | ✓ Template topic filled |
| 15 | Integration — corpus + topic template miss → template_subject | Simulated AI fail + both upper tiers miss | `template_subject` | <1ms | ✓ Template subject filled |
| 16 | Integration — all tiers exhausted → emergency last resort | All 3 tiers fail | `template_subject` | <1ms | ✓ "What is the national bird of India?" |
| 17 | Integration — corpus covers all 8 major PSC subjects | Simulated AI fail | `corpus` | <1ms | ✓ All 8/8 subjects hit corpus |
| 18 | Integration — generatedAt timestamp valid | N/A | `corpus` | <1ms | ✓ Valid ISO 8601 timestamp |

## Key Findings

### 1. Session never stops
In every scenario, a question was returned. There is no code path where `resolveValidQuestion` returns `{ question: null }` — the fallback chain guarantees a question.

### 2. Source tracking is correct
Each tier correctly records its source:
- `corpus` — when the PSC corpus serves the question
- `template_topic` — when topic-level generation fills in
- `template_subject` — when subject-level generation or the emergency last resort is used
- `ai_generated` — set at the edge function level (not tested here, production-only)

### 3. Response times
All fallback paths complete in <1–2ms since they operate on in-memory data structures. No network dependency.

### 4. Practical production behavior
Because `searchCorpus` falls back to subject-only when a specific topic is missing, the `corpus` tier effectively always succeeds for any subject known to the PSC syllabus. The `template_topic` and `template_subject` tiers will only activate for:
- Subjects not in the corpus (unlikely for PSC)
- Edge cases where `generateMCQs()` returns no valid questions after 50 attempts (extremely unlikely)

### 5. Last resort is reachable
If all Tier A, B, and C logic were to fail (e.g., corpus is empty, templates are empty), the hardcoded emergency question guaranteed a valid question.

## Verification Commands

```bash
# Unit validation (12 tests)
npx tsx scripts/validateFallback.mts

# Integration validation (6 tests)
npx tsx scripts/validateFallbackIntegration.mts
```

## Coverage

| Requirement | Status |
|---|---|
| Session never stops | ✓ All paths return a question |
| Student always receives a question | ✓ Verified for 6 failure modes |
| `ai_generated` source recorded | ✓ Set in `aiQuestionGenerator.ts:118` |
| `corpus` source recorded | ✓ Set in `pscCorpus.ts:164` |
| `template_topic` source recorded | ✓ Set in `questionFallback.ts` (returned from tryTopicTemplate) |
| `template_subject` source recorded | ✓ Set in `questionFallback.ts` (returned from trySubjectTemplate / last resort) |
| Fallback telemetry recorded | ✓ `addFallbackEvent` called in `questionFallback.ts:24` |
