# Question Generation Fallback Architecture

## Why

The `generate-question` Supabase edge function returns 502 errors under load (cold starts, model inference timeouts). Previously, sessions would enter `sessionReduced` state with no new question — effectively stalling.

## Tiered Fallback Chain

```
AI Generation ──▶ PSC Corpus ──▶ Topic Template ──▶ Subject Template
    502                  miss               miss               miss
                                                         ↓
                                                   Last Resort
                                              (hardcoded emergency Q)
```

### Level A — PSC Corpus (`psc_corpus`)
- Static question bank in `src/data/pscCorpus.ts` (~80 entries)
- Indexed by subject, topic, difficulty
- Searched first by `activeSubject`+`activeTopic`, then by each weak subject

### Level B — Topic Template (`template_topic`)
- Calls `generateMCQs()` with narrow constraints (single subject + topic)
- Easy difficulty (hard → medium) to maximize hit rate
- Validated with `validateQuestionIntegrity` before returning

### Level C — Subject Template (`template_subject`)
- Broadcast `generateMCQs()` across all weak subjects, easy difficulty, count=10
- Same validation as Level B

### Last Resort
- Hardcoded "What is the national bird of India?" question in both en/ml
- Guarantees the session never receives `null`

## Telemetry

Each fallback hit records a `FallbackEvent` in `performanceStore.fallbackEvents`:
```ts
{ id, source: 'psc_corpus' | 'template_topic' | 'template_subject',
  subject, topic?, timestamp }
```

## Key Files

| File | Role |
|---|---|
| `src/services/questionFallback.ts` | Orchestrates the 3-tier chain, records telemetry |
| `src/data/pscCorpus.ts` | Static question bank (Level A) |
| `src/store/mcqHelpers.ts` | `resolveValidQuestion` — entry point; calls fallback when AI returns null |
| `src/store/performanceStore.ts` | `FallbackEvent` type + `addFallbackEvent` action |

## Recovery from 502

When the edge function returns 502:
1. `infinityEngine.ts` catches the fetch error and returns `{ question: null }`
2. `resolveValidQuestion` loops all 3 retries — all fail (same 502)
3. Fallback chain activates → returns a valid question
4. Session continues with `source: 'template'`

No more `"AI failed, no template fallback"`.
