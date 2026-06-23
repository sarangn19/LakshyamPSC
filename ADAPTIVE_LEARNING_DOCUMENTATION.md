# Lakshyam Adaptive Learning System — Complete Documentation

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React Native / Expo)               │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Screens  │  │ Services │  │  Stores  │  │   Question Cache   │  │
│  │          │  │          │  │(Zustand) │  │   (AsyncStorage)   │  │
│  │LearnScreen│ │infinity │  │performance│  │   key=subject+     │  │
│  │MCQEngine  │ │engine   │  │bkt       │  │   topic+difficulty │  │
│  │PostSession│ │scorer   │  │cognitive │  └───────────────────┘  │
│  │HomeScreen │ │bandit   │  │twin      │                          │
│  │Progress   │ │orchestr.│  │mcqSession│  ┌───────────────────┐  │
│  └──────────┘ │profile  │  │flashcard │  │  Generation Queue  │  │
│               │builder  │  │mcqStore  │  │  (dedup + priority)│  │
│               │revision │  └──────────┘  └───────────────────┘  │
│               │retention│                                         │
│               │spaced   │      ┌──────────────────────────────┐  │
│               │rep      │      │   Template MCQs (no API)     │  │
│               └──────────┘      │   50+ template sets         │  │
│                                 │   10 subjects               │  │
│                                 └──────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                               │  HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ generate-    │  │   ask-ai     │  │ store-mcq / store-mcq-   │  │
│  │ question     │  │  (chatbot/   │  │ batch / store-flashcard  │  │
│  │ (AI MCQ gen) │  │   tutor)    │  │ (DB inserts)             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
│         │                 │                                         │
│         ▼                 ▼                                         │
│  ┌────────────────────────────────────────────────────────┐        │
│  │           4-TIER PROVIDER FALLBACK CASCADE             │        │
│  │                                                        │        │
│  │  Tier 1: OpenAI (gpt-4o-mini)          ~$0.15/1M in   │        │
│  │  Tier 2: OpenRouter alt models         ~$0.15/1M in   │        │
│  │  Tier 3: Fallback provider (config)    ~$0.00/1M in   │        │
│  │  Tier 4: Gemini direct (gemini-2.0-    ~$0.075/1M in  │        │
│  │           flash-lite)                   ~$0.30/1M out  │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  OTHER EDGE FUNCTIONS (no AI cost)                     │        │
│  │                                                        │        │
│  │  get-repository-question  → Supabase DB (question_bank)│        │
│  │  psc-pyq-explorer         → Supabase DB (pyq_questions) │        │
│  │  report-question          → Supabase DB insert          │        │
│  │  fetch-current-affairs    → NewsAPI (free tier)         │        │
│  │  repository-analytics     → Supabase RPC                │        │
│  └────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Complete Data Flow

### 2.1 End-to-End Pipeline

```
Raw Interaction Signals
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     PARALLEL PROCESSING                           │
│                                                                   │
│  ┌────────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │   Profile Builder   │  │  BKT Knowledge   │  │Cognitive Twin│  │
│  │   (profileBuilder   │  │  Map (bktStore)  │  │  Mastery     │  │
│  │    .ts)             │  │                  │  │(masterySlice)│  │
│  │                     │  │  Bayesian update │  │              │  │
│  │ • subject accuracy  │  │  per answer:     │  │  accuracy*0.6│  │
│  │ • hesitation topics │  │  pMastered =     │  │+ (1-hesit)* 0│  │
│  │ • confusion pairs   │  │  Bayesian infer  │  │  .2          │  │
│  │ • forgetting rates  │  │  + decay (21d    │  │+ (1-forget)* │  │
│  │                     │  │  half-life)      │  │  0.2         │  │
│  └──────────┬──────────┘  └────────┬─────────┘  └──────┬───────┘  │
│             │                      │                    │         │
│             └──────────┬───────────┴───────────┬────────┘         │
│                        │                       │                  │
│                        ▼                       ▼                  │
│              ┌──────────────────┐   ┌────────────────────┐       │
│              │  Gap Detection   │   │  Priority Scoring   │       │
│              │  (gapSlice)      │   │  (gapSlice +        │       │
│              │                  │   │   recommender.ts)   │       │
│              │  flags:          │   │                     │       │
│              │  mastery < 60    │   │  weakness(40)       │       │
│              │  forgetting > t  │   │  + forgetting(30)   │       │
│              │  hesitation > t  │   │  + hesitation(15)   │       │
│              │                  │   │  + importance(30)   │       │
│              │  lifecycle:      │   │  + examWeight(20)   │       │
│              │  open→improving→ │   │  + recency          │       │
│              │  closing→closed→ │   │                     │       │
│              │  retained        │   │  Blend: 60% cogTwin │       │
│              └──────────────────┘   │  + 40% BKT          │       │
│                                      └──────────┬─────────┘       │
│                                                 │                  │
└─────────────────────────────────────────────────┼──────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│               SESSION ORCHESTRATION (sessionOrchestrator.ts)      │
│                                                                   │
│  Scores 6 session types with modifiers:                           │
│                                                                   │
│  confusion_repair(35)  → +45 if ≥3 confusion pairs               │
│  revision_reinforce(25)→ depends on mastery                       │
│  flashcard_review(30)  → +45 if ≥15 due flashcards               │
│  weakness_practice(40) → +35 if ≥3 weak subjects                 │
│  exam_simulation(30)   → +60 if exam ≤3 days away                │
│  knowledge_revisit(15) → depends on retention status              │
│                                                                   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              TOPIC SELECTION (infinityEngine.ts)                  │
│                                                                   │
│  1. pickTopic()                                                   │
│     • Filter by weakSubjects                                      │
│     • Score: BKT priority × recency penalty × prerequisites       │
│              × blueprint boost                                    │
│     • Weighted random selection from scored candidates            │
│                                                                   │
│  2. pickWeakestSubtopic()                                         │
│     • From BKT topicMap, pick subtopic with lowest pMastered      │
│                                                                   │
│  3. difficultyForTier()                                           │
│     • weak→easy, unattempted→medium, strong→hard                  │
│     • + stage shift: discovering(-1), building(0),                │
│       mastering(+1), polishing(+2)                                │
│                                                                   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              QUESTION GENERATION (3-tier)                         │
│                                                                   │
│  Tier 1: Repository Cache (question_bank table)                   │
│  ───────────────────────────────────────────────                 │
│  • Check hasSufficientInventory(subject, topic)                   │
│  • getRepositoryQuestion() — fetches pre-stored MCQ              │
│  • Zero API cost                                                  │
│  • Validates question integrity + topic alignment                 │
│                                                                   │
│  Tier 2: AI Generation (edge function)                            │
│  ───────────────────────────────────────                         │
│  • generate-question edge function                                │
│  • Falls back through 4 AI providers                              │
│  • Validates taxonomy + integrity                                 │
│  • ~2-5 sec latency, ~$0.0015 per question (gpt-4o-mini)         │
│                                                                   │
│  Tier 3: Template MCQs (aiMCQGenerator.ts)                        │
│  ──────────────────────────────────────                          │
│  • 50+ pre-written templates across 10 subjects                   │
│  • Zero API cost, zero latency                                    │
│  • Used when AI fails or cache misses                             │
│                                                                   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│              IN-SESSION ADAPTATION                                │
│                                                                   │
│  • SessionDifficultyAdapter:                                      │
│    3 correct → ↑ difficulty; 2 wrong → ↓ difficulty              │
│  • Contextual Bandit (LinUCB):                                    │
│    8-feature context vector (pMastered, accuracy, streak, ...)    │
│    Selects difficulty that maximizes expected reward              │
│  • answer recorded → BKT update → cognitive twin update          │
│    → gap detection → next question                                │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Capture Points

| Event | Source | Target Store | Data |
|-------|--------|-------------|------|
| MCQ answered | `MCQEngineScreen` | `performanceStore.addInteractionSignal()` | questionId, topic, subject, difficulty, correct, timeToAnswer, confidence |
| Confidence rated | `MCQEngineScreen` | `performanceStore.addConfidenceRecord()` | questionId, subject, topic, confidenceLevel, wasCorrect |
| Session started | `sessionOrchestrator` | `performanceStore.addSessionSignal()` | sessionId, type, startTime, subjects |
| Session ended | `MCQStore.endSession()` | `performanceStore.addSessionOutcome()` | accuracy, subjectScores, difficultyMix, duration |
| Flashcard reviewed | `flashcardStore` | `performanceStore.addFlashcardSignal()` | cardId, topic, subject, SM-2 rating, interval |
| Recommendation acted | Various | `performanceStore.addRecommendationAction()` | recommendationId, questionsAttempted, correctAnswers |

### 2.3 Persistence Layer

All stores use **Zustand + AsyncStorage** (local-first):
- `performanceStore` → key: `lakshyam-performance`
- `cognitiveTwinStore` → key: `lakshyam-cognitive-twin-v2`
- `bktStore` → key: `lakshyam-bkt`
- `mcqStore` → key: `lakshyam-mcq-store`
- `flashcardStore` → key: `lakshyam-flashcards`

Supabase sync is optional — used for:
- `recommendationTracker.recordSessionImpact()` → Supabase RPC
- `dataSync.fetchUserProfile()` → Supabase `profiles` table

## 3. Knowledge Models

### 3.1 Bayesian Knowledge Tracing (BKT)

**File:** `src/store/bktStore.ts`, `src/services/knowledgeEngine.ts`

BKT models each subtopic as a hidden binary state (mastered/not-mastered) with four parameters:

```
pL0      = probability initially mastered     (default: 0.15)
pLearn   = probability of learning per attempt (default: 0.18)
pGuess   = probability of correct guess        (default: 0.15)
pSlip    = probability of careless mistake     (default: 0.10)
pForget  = probability of forgetting per day   (default: 0.05, 21-day half-life)
```

**Update on correct answer:**
```
pGivenObs = (pMastered × (1-pSlip)) / (pMastered×(1-pSlip) + (1-pMastered)×pGuess)
pAfterLearn = pGivenObs + (1 - pGivenObs) × pLearn
```

**Update on wrong answer:**
```
pGivenObs = (pMastered × pSlip) / (pMastered×pSlip + (1-pMastered)×(1-pGuess))
pAfterLearn = pGivenObs + (1 - pGivenObs) × pLearn
```

**Decay (daily):**
```
decayFactor = 2^(-daysElapsed / 21)    // half-life = 21 days
pMastered_decayed = pMastered × decayFactor
```

**Parameter fitting** (`bktFitter.ts`): Grid search over:
- pL0 ∈ [0.05, 0.10, 0.15, 0.20, 0.30, 0.40]
- pT (pLearn) ∈ [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
- pG (pGuess) ∈ [0.05, 0.10, 0.15, 0.20, 0.25]
- pS (pSlip) ∈ [0.05, 0.10, 0.15, 0.20]

pForget is **always hardcoded to 0.05** (not fitted).

### 3.2 Cognitive Twin Mastery

**File:** `src/store/cognitiveTwinMasterySlice.ts`

Composite mastery score per knowledge node:

```
masteryScore = accuracy × 0.6 + (1 - hesitationScore) × 0.2 + (1 - forgettingScore) × 0.2
```

Where:
- **accuracy**: correct / attempts (percentage 0–100)
- **hesitationScore**: running average of hesitation values per interaction signal (0–1)
- **forgettingScore**: `accuracyFactor × 0.6 + recencyFactor × 0.4`
  - accuracyFactor = `1 - (accuracy / 100)`
  - recencyFactor = `min(1, daysSinceLastPractice / 30)`

**Trend detection:**
- improving: accuracy ≥ 70 in recent session
- declining: accuracy ≤ 30 in recent session
- stable: between 30 and 70
- unknown: insufficient data

### 3.3 Gap Lifecycle

**File:** `src/store/cognitiveTwinGapSlice.ts`

```
open → improving → closing → closed → retained
```

| Status | Criteria |
|--------|----------|
| `open` | Mastery score < 60 |
| `improving` | Mastery 60–79 AND trend is 'improving' |
| `closing` | Mastery 80+ |
| `closed` | Mastery ≥ 80 AND retention check passed |
| `retained` | Retention ≥ 75% AND mastery ≥ 60 AND ≥ 7 days since closure |

**Gap detection thresholds** (stage-dependent):

| Stage | Accuracy | Forgetting | Hesitation | Open Rate |
|-------|----------|------------|------------|-----------|
| discovering | < 30% | > 0.7 | > 0.6 | > 30% |
| building | < 40% | > 0.6 | > 0.5 | > 40% |
| mastering | < 45% | > 0.5 | > 0.4 | > 45% |
| polishing | < 50% | > 0.4 | > 0.3 | > 50% |

### 3.4 Learner Stages

**File:** `src/services/learnerStage.ts`

| Stage | Criteria | Difficulty Shift | Spaced Rep Multiplier |
|-------|----------|-----------------|----------------------|
| `discovering` | <100 questions OR streak <3 | -1 (easier) | 0.6× |
| `building` | <500 Q OR streak <14 OR mastery <40% | 0 | 0.8× |
| `mastering` | <2000 Q OR mastery <75% | +1 (harder) | 1.0× |
| `polishing` | ≥2000 Q AND mastery ≥75% | +2 (hardest) | 1.2× |

## 4. Edge Functions & API Costs

### 4.1 AI-Powered Edge Functions

#### `generate-question` (MCQ Generation)

| Detail | Value |
|--------|-------|
| **Runtime** | Deno (Supabase) |
| **Primary model** | `gpt-4o-mini` (configurable via `AI_MODEL`) |
| **Primary provider** | OpenAI / OpenRouter (via `AI_API_URL`) |
| **Tier 1 cost (OpenAI)** | Input: $0.15/1M tokens, Output: $0.60/1M tokens |
| **Tier 2 (OpenRouter alt)** | `google/gemini-2.0-flash-lite-001` or `meta-llama/llama-3.1-8b-instruct` |
| **Tier 3 (fallback)** | Configurable; default `meta-llama/llama-3.1-8b-instruct:free` |
| **Tier 4 (Gemini direct)** | `gemini-2.0-flash-lite` — Input: $0.075/1M, Output: $0.30/1M |
| **Max tokens per call** | 1024 (content-based), 800 (standard) |
| **Temperature** | 0.7 |
| **Timeout** | None server-side; 20s client-side |
| **Average latency** | 2–5 seconds (Tier 1); 3–8 seconds (fallback tiers) |
| **Typical tokens used** | ~300 input + ~200 output ≈ 500 per question |

**Cost per question (Tier 1, gpt-4o-mini):**
```
Input:  300 tokens × $0.15/1M = $0.000045
Output: 200 tokens × $0.60/1M = $0.000120
Total: ~$0.000165 per question
```

**Cost per question (Tier 4, Gemini flash-lite):**
```
Input:  300 tokens × $0.075/1M = $0.0000225
Output: 200 tokens × $0.30/1M  = $0.000060
Total: ~$0.0000825 per question
```

**Monthly estimate (1000 questions/day):**
```
1000 Q/day × $0.000165 × 30 days = $4.95/month (all Tier 1)
With 20% API failures → 80% Tier 1 + 15% Tier 4 + 5% free = ~$3.96/month
```

#### `ask-ai` (Chat/Tutor)

| Detail | Value |
|--------|-------|
| **Primary model** | `gpt-4o-mini` |
| **Max tokens per call** | 2048 (primary), 1024 (Gemini) |
| **Typical tokens used** | ~500 input (w/ history) + ~500 output ≈ 1000 per message |
| **Same 4-tier fallback** | Same cascade as `generate-question` |

**Cost per message:**
```
Input:  500 tokens × $0.15/1M = $0.000075
Output: 500 tokens × $0.60/1M = $0.000300
Total: ~$0.000375 per message
```

**Monthly estimate (1000 messages/day):**
```
1000 msg/day × $0.000375 × 30 days = $11.25/month
```

### 4.2 Zero-Cost Edge Functions

| Function | Data Source | Purpose |
|----------|-------------|---------|
| `get-repository-question` | `question_bank_mcqs` table | Fetch pre-stored MCQs |
| `store-mcq` | Insert into `question_bank_mcqs` | Store AI-generated MCQs |
| `store-mcq-batch` | Batch insert + dedup | Bulk store MCQs |
| `store-flashcard` | Insert into `flashcards` | Store user flashcards |
| `psc-pyq-explorer` | Supabase RPC + `pyq_questions` | Browse previous year questions |
| `report-question` | Insert into `question_reports` | Flag bad questions |
| `repository-analytics` | Supabase RPC | Cache hit rate, usage stats |
| `question-bank-stats` | Aggregate queries | MCQ + flashcard counts |
| `fetch-current-affairs` | NewsAPI (free tier) | Current affairs feed |
| `razorpay-webhook` | Razorpay API | Subscription management |
| `create-subscription` | Razorpay API | Create new subscription |
| `refresh-coverage` | Supabase RPC | Refresh materialized view |

### 4.3 Total Monthly Cost Estimate

| Component | Volume | Cost |
|-----------|--------|------|
| AI Question Generation | 1000 Q/day | ~$4.95 |
| Chat/Tutor | 1000 msg/day | ~$11.25 |
| Template Questions (no AI) | Unlimited | $0.00 |
| Question Cache Hits | ~30% of requests | Saves ~$1.49 |
| Supabase (Pro Plan) | 8GB DB, 50GB BW | $25.00 |
| Edge Function Invocations | ~60K/month | Included in Pro |
| NewsAPI (free tier) | 100 req/day | $0.00 |
| **Total** | | **~$41.25/month** |

## 5. Caching & Reliability Mechanisms

### 5.1 Question Cache (`aiQuestionGenerator.ts`)

```
key = (subject, topic, difficulty, language, focusInstruction)
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
           recentHistory empty?        non-empty?
           focusInstruction normal?    or CONTENT-BASED?
                    │                         │
                    ▼                         ▼
              Check cache                 Skip cache
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
        Hit                Miss
          │                   │
  return cached Q       Call generate-question
  recordCacheHit()      recordCacheMiss()
                              │
                        On success:
                        set cache
```

- **Storage**: AsyncStorage (persisted across app restarts)
- **Cache invalidation**: `clearAICache()` clears entire cache
- **Estimated hit rate**: ~30% (same topic/difficulty often requested)

### 5.2 Generation Queue

```
Request → dedupKey = "subject|topic|difficulty|lang"
              │
     ┌────────┴────────┐
     ▼                  ▼
  In-flight?         New request
     │                  │
  Return              enqueue(execute, {
  existing               dedupKey,
  promise                priority: 'high'|'low',
                         signal: AbortSignal
                       })
                          │
                     Fetch /v1/generate-question
                     Timeout: 20s
                          │
                     Record reliability metrics
                     (success/failure/latency/rate-limit)
```

### 5.3 Template MCQs (Zero-Latency Fallback)

**File:** `src/services/aiMCQGenerator.ts`

- 50+ pre-written template question sets
- Subjects: Kerala History, Renaissance, Constitution, Geography (Districts, Rivers, Physical), Science (Chemistry, Human Body, Physics, Biology), Malayalam (Poets, Grammar), Current Affairs, Aptitude, Mental Ability
- Languages: English + Malayalam
- Confidence: easy=95, medium=85, hard=70
- Used when AI generation fails (all 4 tiers down) or cache misses for known topic

### 5.4 Reliability Tracker

```
recordSuccess()
recordFailure(source, status?)
recordRateLimit()
recordLatency(ms)
recordCacheHit()
recordCacheMiss()
getHealth() → { successRate, avgLatency, cacheHitRate }
```

Metrics used for monitoring but NOT for automatic circuit-breaking (no circuit breaker implemented yet).

## 6. Topic Priority Scoring (Infinity Scorer)

**File:** `src/services/infinityScorer.ts`

When `pickTopic()` selects the next topic, each candidate is scored:

```
adjustedScore = BKT_priority × recency_penalty × prerequisite_discount × blueprint_boost
```

Where:
- **BKT_priority**: From `computePriorities()` — multi-factor score per topic
- **recency_penalty**: 0.3× if topic appeared in last 5 questions (prevents immediate repeat)
- **prerequisite_discount**: 0.5× if prerequisites not mastered (pMastered < 0.8)
- **blueprint_boost**: From PSC exam blueprint weights (1.0–2.0×)

And for weakness tier mapping:
```
weakness_tier = from BKT pMastered
  pMastered < 0.4   → 'weak'     → difficulty = 'easy'
  pMastered < 0.65  → 'emerging' → difficulty = 'medium'
  pMastered < 0.85  → 'competent'→ difficulty = 'medium'
  pMastered ≥ 0.85  → 'strong'   → difficulty = 'hard'
                      + stage shift applied
```

## 7. Session Orchestration Details

**File:** `src/services/sessionOrchestrator.ts`

### Session Types with Scoring

| Type | Base Weight | Boost Conditions |
|------|-------------|-----------------|
| `confusion_repair` | 35 | +45 if ≥3 confusion pairs detected |
| `revision_reinforcement` | 25 | +20 if mastery in 40–70% range |
| `flashcard_review` | 30 | +45 if ≥15 flashcards overdue |
| `weakness_practice` | 40 | +35 if ≥3 weak subjects; +20 if streak broken |
| `exam_simulation` | 30 | +60 if exam ≤3 days away; +30 if ≤7 days |
| `knowledge_revisit` | 15 | +25 if retention rate < 50% |

### Modifiers (all additive):
- **confusion_pairs**: +45 for 3+ pairs
- **weak_subjects**: +35 for 3+ weak
- **flashcard_urgency**: +45 for 15+ due
- **exam_proximity**: +60 for ≤3 days, +30 for ≤7 days
- **streak_broken**: +15
- **time_of_day**: -15 for off-peak heavy work
- **recency_penalty**: -20 if same type as last session

## 8. Contextual Bandit (LinUCB)

**File:** `src/services/contextualBandit.ts`

Optional difficulty selection algorithm (behind feature flag `advanced_difficulty_engine`):

### 8-feature context vector:
```
[pMastered, sessionAccuracy, avgTimeToAnswer, overallMastery,
 consecutiveCorrect, consecutiveIncorrect, streakDays, 1.0 (bias)]
```

### Algorithm:
```
For each arm (easy/medium/hard):
  θ = (A⁻¹ × b)                          // ridge regression coefficients
  expected_reward = θᵀ × context         // predicted reward
  upper_bound = α × √(xᵀ × A⁻¹ × x)     // exploration bonus (α=0.3)
  arm_score = expected_reward + upper_bound

Select arm with highest arm_score
Update A += x × xᵀ,  b += x × observed_reward
```

Not yet wired into the main question generation pipeline — `sessionDifficultyAdapter.ts` runs in parallel.

## 9. Retention Assessment

**File:** `src/services/retentionAssessmentService.ts`, `cognitiveTwinRetentionSlice.ts`

### Checkpoints:
- 7 days post-closure
- 30 days post-closure
- 90 days post-closure

### Reopen conditions:
```
retentionRate < 50% OR currentMastery < 60%
```

### Retention status:
```
excellent: ≥90%
good:      ≥75%
at_risk:   ≥50%
lost:      <50%
```

### Health Score:
```
score = gapClosureRate × 0.35 + recommendationSuccessRate × 0.35 + avgImprovement × 0.30
excellent: ≥75, good: ≥50, fair: ≥25, poor: <25
```

## 10. Adaptive Learning Card Flow (Learn Screen)

```
┌─────────────────────────────────────────────────────────────┐
│              ADAPTIVE LEARNING CARD (LearnScreen)            │
│                                                             │
│  User taps card                                             │
│       │                                                     │
│       ▼                                                     │
│  startDailyDrill()                                          │
│       │                                                     │
│       ├─ End any existing session                           │
│       ├─ Get weakSubjects from performanceStore             │
│       ├─ Set Zustand state: recommendedSubject=''           │
│       │  (no single topic pin — all weak topics eligible)   │
│       ├─ Call resolveValidQuestion(weakSubjects, ...)       │
│       │       │                                             │
│       │       ├─ Infinity Engine: pickTopic()               │
│       │       │  → scores ALL weak subjects by priority     │
│       │       │  → weighted random selection                │
│       │       │  → maps difficulty by weakness tier         │
│       │       │                                             │
│       │       ├─ AI Generation: generate-question edge fn   │
│       │       │  → 4-tier provider fallback                 │
│       │       │  → taxonomy validation                      │
│       │       │  → integrity check                          │
│       │       │                                             │
│       │       └─ Return validated question or null          │
│       │                                                     │
│       ├─ Set first question in state                        │
│       ├─ Trigger prefetch (background next Q)               │
│       └─ navigation.navigate('MCQ')                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 11. File Map

### Stores (Zustand)
| File | Purpose |
|------|---------|
| `src/store/performanceStore.ts` | Raw interaction signals, session outcomes, recommendations |
| `src/store/bktStore.ts` | Bayesian Knowledge Tracing per subtopic |
| `src/store/cognitiveTwinStore.ts` | Composite store (mastery + gaps + analytics + retention) |
| `src/store/cognitiveTwinMasterySlice.ts` | Mastery score computation per node |
| `src/store/cognitiveTwinGapSlice.ts` | Gap detection, lifecycle, prioritization |
| `src/store/cognitiveTwinAnalyticsSlice.ts` | Metrics, health score |
| `src/store/cognitiveTwinRetentionSlice.ts` | Retention checks, reopen logic |
| `src/store/cognitiveTwinTypes.ts` | All type definitions |
| `src/store/cognitiveTwinHelpers.ts` | Mastery/trend/forgetting computations |
| `src/store/mcqStore.ts` | MCQ session state, questions, difficulty |
| `src/store/mcqSessionSlice.ts` | Session lifecycle (startDailyDrill, nextQuestion, endSession) |
| `src/store/mcqRecommendationSlice.ts` | Recommendation state |
| `src/store/mcqTypes.ts` | MCQ type definitions |
| `src/store/flashcardStore.ts` | SM-2 spaced repetition |
| `src/store/mcqHelpers.ts` | resolveValidQuestion, validate, etc. |

### Services
| File | Purpose |
|------|---------|
| `src/services/adaptiveLearningService.ts` | Health score, retention metrics |
| `src/services/cognitiveTwinRecommender.ts` | Gap recommendations, unified priorities, next topic |
| `src/services/learningRecommendationEngine.ts` | Re-export hub |
| `src/services/infinityEngine.ts` | Topic selection, question generation orchestration |
| `src/services/infinityScorer.ts` | Multi-factor topic scoring |
| `src/services/sessionOrchestrator.ts` | Session type selection |
| `src/services/sessionDifficultyAdapter.ts` | In-session dynamic difficulty |
| `src/services/contextualBandit.ts` | LinUCB difficulty selection |
| `src/services/profileBuilder.ts` | User profile from signals |
| `src/services/revisionEngine.ts` | BKT-based revision priorities |
| `src/services/spacedRepetition.ts` | Decay formulas, intervals |
| `src/services/knowledgeEngine.ts` | BKT update/decay, prerequisites |
| `src/services/bktFitter.ts` | Parameter grid search |
| `src/services/learnerStage.ts` | Stage detection |
| `src/services/retentionAssessmentService.ts` | Retention scheduling |
| `src/services/examOutlookEngine.ts` | Exam readiness |
| `src/services/aiMCQGenerator.ts` | Template MCQs (no API) |
| `src/services/aiQuestionGenerator.ts` | AI generation with cache/queue |
| `src/services/topicEnforcement.ts` | Topic validation |
| `src/services/highYieldTopics.ts` | PSC frequency scoring |
| `src/services/pscFrequencyBoost.ts` | Frequency data integration |
| `src/services/blueprintAlignment.ts` | Exam blueprint boost |
| `src/services/recommendationTracker.ts` | Impact recording |
| `src/services/confidenceCalibration.ts` | Confidence vs accuracy |
| `src/services/chatService.ts` | Chat API client |

### Edge Functions
| File | Cost | Purpose |
|------|------|---------|
| `supabase/functions/generate-question/index.ts` | ~$0.000165/call | AI MCQ generation |
| `supabase/functions/ask-ai/index.ts` | ~$0.000375/call | Chat/tutor responses |
| `supabase/functions/store-mcq/index.ts` | $0 | Store MCQ to DB |
| `supabase/functions/store-mcq-batch/index.ts` | $0 | Batch store MCQs |
| `supabase/functions/store-flashcard/index.ts` | $0 | Store flashcard |
| `supabase/functions/get-repository-question/index.ts` | $0 | Fetch cached question |
| `supabase/functions/psc-pyq-explorer/index.ts` | $0 | PYQ queries |
| `supabase/functions/report-question/index.ts` | $0 | Flag bad questions |
| `supabase/functions/fetch-current-affairs/index.ts` | $0 | NewsAPI |
| `supabase/functions/repository-analytics/index.ts` | $0 | Cache stats |
| `supabase/functions/question-bank-stats/index.ts` | $0 | Count queries |
| `supabase/functions/seed-repository/index.ts` | ~$0.000165/call | Bulk seed (via generate-question) |

### Screens
| Screen | Purpose |
|--------|---------|
| `LearnScreen` | Adaptive Learning card, action cards |
| `MCQEngineScreen` | Interactive MCQ engine |
| `PostSessionScreen` | Session results, weak/strong analysis |
| `HomeScreen` | Exam outlook, weak areas, streak |
| `PracticeScreen` | Practice hub (PYQ, High Yield, Topic Intelligence) |
| `TopicIntelligenceScreen` | Per-topic mastery + yield |
| `ImpactDashboardScreen` | Recommendation impact stats |
| `HighYieldPracticeScreen` | 70% weak + 30% high-yield mix |
| `ProgressScreen` | Overall metrics |

### Data
| File | Purpose |
|------|---------|
| `src/data/knowledgeTree.ts` | Subject > topic > subtopic hierarchy with prerequisites |
| `src/data/examBlueprints.ts` | Composite exam subject/topic weights |
| `src/data/syllabus.ts` | Full syllabus for template generation |
| `src/data/populationNorms.ts` | Population forgetting rates per subject |

## 12. Known Limitations

1. **pForget hardcoded to 0.05** — BKT forgetting parameter is never fitted from data
2. **Contextual bandit not wired into main pipeline** — behind feature flag, `sessionDifficultyAdapter` runs in parallel
3. **No cross-user adaptation** — no collaborative filtering or population trajectories
4. **Duplicate health scores** — `adaptiveLearningService.ts` and `cognitiveTwinAnalyticsSlice.ts` compute slightly different versions
5. **No circuit breaker** — reliability tracker records metrics but doesn't auto-disable failing providers
6. **Empty catch blocks** — several `catch {}` silently swallow errors
7. **No onboarding calibration** — new users start with default BKT params (pL0=0.15)
8. **Stale gap persistence** — gaps never deprioritized if user avoids those topics
9. **`require()` calls in service files** — breaks tree-shaking (e.g., `spacedRepetition.ts:23`, `learnerStage.ts:40`)
10. **No A/B testing infrastructure** — strategies can't be experimentally compared
