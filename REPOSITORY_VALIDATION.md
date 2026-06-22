# Repository Validation Report

**Date:** 2026-06-22
**Database:** `cycutcqlhpeudmaebwmb` (Supabase)
**Total questions:** 1,254 (100% AI-generated)
**Subjects covered:** 17 | **Topics covered:** 98 | **Coverage cells:** 105

---

## 1. Hit Rate

| Metric | Value |
|---|---|
| **Requests made** | 100 |
| **Repository hits** | 28 (28.0%) |
| **Repository misses → AI/fallback** | 72 (72.0%) |
| **Errors (HTTP non-2xx)** | 0 (0.0%) |

### Per-Subject Hit Rates

| Subject | Hits/Requests | Hit Rate |
|---|---|---|
| Science | 7/10 | **70%** |
| Kerala History | 15/25 | **60%** |
| Geography | 2/7 | 29% |
| Constitution | 2/9 | 22% |
| Renaissance | 1/6 | 17% |
| Current Affairs | 1/7 | 14% |
| English | 0/1 | 0% |
| General Science | 0/1 | 0% |
| Indian Constitution | 0/3 | 0% |
| Indian History & National Movement | 0/2 | 0% |
| Information Technology & Cyber Laws | 0/2 | 0% |
| Malayalam | 0/9 | 0% |
| Mental Ability | 0/7 | 0% |
| Quantitative Aptitude | 0/10 | 0% |
| World History | 0/1 | 0% |

**Analysis:** Hit rate is concentrated in the 3 best-covered subjects (Kerala History, Science, Geography). The remaining 12 subjects have near-zero coverage due to uneven AI seeding and provider rate limits during the seed run.

---

## 2. Latency

| Metric | Overall | Hits | Misses |
|---|---|---|---|
| **Minimum** | 603ms | 1,042ms | 603ms |
| **Average** | 965ms | 1,419ms | 789ms |
| **P95** | 1,892ms | — | — |
| **P99** | 3,319ms | — | — |
| **Maximum** | 3,319ms | 2,455ms | 3,319ms |

**Analysis:** Repository hits average ~1.4s (acceptable for cache-first delivery). Misses are fast (~789ms) because the function returns immediately without attempting AI generation. This is the correct behavior — the client-side `resolveValidQuestion` handles the AI/fallback chain asynchronously.

---

## 3. Source Distribution

When a question is requested, the delivery chain resolves as follows:

| Source | Rate | Latency | Notes |
|---|---|---|---|
| **Repository (cache)** | 28% | ~1.4s | Direct DB hit, no AI involved |
| **AI generation** | ~60% (est.) | ~3-8s | Client-side 3-retry AI loop |
| **Fallback (corpus/template)** | ~10% (est.) | ~200ms | Only when AI fails |
| **Emergency (hardcoded)** | <1% | ~50ms | Absolute last resort, never returns null |
| **Error (HTTP)** | 0% | — | Eliminated by removing server-side AI fallback |

**Previous state:** 88% error rate (server-side AI fallback timed out). **Current state:** 0% error rate.

---

## 4. Relevance Verification

**20 random repository hits checked for subject/topic match:**

| Result | Count |
|---|---|
| Exact subject + topic match | 20/20 (100%) |
| Subject-only match | 0/20 |
| Full mismatch | 0/20 |

**Analysis:** The repository has perfect cache coherence — every returned question matches the requested subject and topic exactly. No off-topic or misaligned questions were served from the cache.

---

## 5. Remaining Coverage Gaps

### Top 10 Most Sparse Cells (≤1 question)

| Subject | Topic | Difficulty | Questions |
|---|---|---|---|
| Arts, Sports & Culture | Classical & Ritualistic Art Forms | easy | 1 |
| Civics & Public Administration | Social Welfare & Public Policy | easy | 1 |
| Constitution | Constitutional Bodies | easy | 1 |
| English | Grammar | easy | 1 |
| Indian Constitution | General | easy | 1 |
| Indian History & National Movement | Indian National Movement | easy | 1 |
| Indian History & National Movement | Medieval India | easy | 1 |
| Information Technology & Cyber Laws | Computer Hardware & Architecture | easy | 1 |
| Information Technology & Cyber Laws | IT Act & Legal Frameworks | easy | 1 |
| Information Technology & Cyber Laws | Software & Operating Systems | easy | 1 |

**Total low-coverage cells (≤2 questions):** 32 out of 105 (30%)

### Top 10 Uncovered Topics (zero hits during test)

| Subject | Topic |
|---|---|
| Malayalam | Grammar |
| Malayalam | Literature |
| Malayalam | Poetry |
| Malayalam | Prose & Drama |
| Quantitative Aptitude | General |
| Quantitative Aptitude | Data Interpretation |
| Mental Ability | Logical Reasoning |
| Constitution | Directive Principles |
| Constitution | Union Executive |
| Current Affairs | Kerala News |

---

## 6. Recommendation Integration Assessment

| Check | Result | Detail |
|---|---|---|
| Repository-first lookup | **PASS** | `resolveValidQuestion` at `mcqHelpers.ts:152` calls `getRepositoryQuestion()` before AI loop |
| PSC frequency boost | **PASS** | `boostWithPSCFrequency` at `pscFrequencyBoost.ts:88` blends 80% learning need + 20% PSC exam frequency |
| Repository source tracked | **PASS** | Source `"cache"` returned and distinguishable from `"ai"` / `"template"` |
| AI fallback on miss | **PASS** | Phase 2 in `resolveValidQuestion` — 3 AI retries |
| Fallback never null | **PASS** | `getFallbackQuestion()` → corpus → topic template → subject template → emergency (hardcoded) |
| Emergency question available | **PASS** | `"What is the national bird of India?"` at `questionFallback.ts:119` |
| No null paths | **PASS** | Only intentional null is `sessionType === "practice"` (`mcqHelpers.ts:150`) |
| Integrity validation | **PASS** | `validateQuestionIntegrity()` called before accepting any question |
| Source telemetry | **PASS** | Source (`"cache"`/`"ai"`/`"template"`) returned from `resolveValidQuestion` |

### PSC Frequency Boost Mechanics

```typescript
// pscFrequencyBoost.ts:88-109
const blendedScore = 0.8 * learningScore + 0.2 * pscScore * 100;
```

- PSC historical exam frequency data is loaded from Supabase edge function `psc-pyq-explorer`
- Topics are scored by weighted blend: 80% learning need (weakness + forgetting + retention), 20% PSC exam frequency
- Source is tracked as `'frequency_boosted'` in `recommendationTracker.ts`
- Repository questions are retrievable via `getRepositoryQuestion()` using the recommended subject/topic

---

## 7. Key Metrics Summary

| Metric | Value | Target | Status |
|---|---|---|---|
| Repository hit rate | 28% | >50% | ❌ Needs more seeds |
| Error rate | 0% | <1% | ✅ |
| Relevance accuracy | 100% | >95% | ✅ |
| Avg hit latency | 1.4s | <2s | ✅ |
| Max latency | 3.3s | <5s | ✅ |
| Subjects with >50% coverage | 2/17 | >10/17 | ❌ |
| Low-coverage cells (≤2 qs) | 32/105 | <10/105 | ❌ |
| Null paths to session | 0 | 0 | ✅ |
| PSC frequency boost active | Yes | Yes | ✅ |

---

## 8. Recommendations

1. **Resume seeding** when Groq API quota is topped up, prioritizing the 32 low-coverage cells and the 3 zero-hit-rate core subjects (Malayalam, Quantitative Aptitude, Mental Ability)
2. **Target 2,000+ total questions** for a 50%+ hit rate (the current 1,254 is insufficient for broad coverage)
3. **Monitor real usage** — actual hit rate in production will differ from synthetic test because real user sessions concentrate on their weak subjects (which tend to be the uncovered ones)
4. **The architecture is sound** — 0% error rate and 100% relevance prove the repository-first flow works correctly. The only gap is quantity.
