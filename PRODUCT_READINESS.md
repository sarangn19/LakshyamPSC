# Lakshyam — Product Readiness Assessment

> Audit performed: 2026-06-22 | Codebase: `psc/lakshyam` | Stack: React Native (Expo) + Supabase (Postgres) + OpenRouter AI

---

## 1. What Works Well

### 1.1 AI Question Generation Pipeline
- 4-provider failover chain (OpenRouter GPT-4o-mini → Gemini Lite → Llama 3.1 8B → Gemini 2.0 Flash) ensures high availability
- Generation queue throttles to 1 req/3s staying within OpenRouter free tier (20 RPM)
- Client-side question cache (500 entries, 24h TTL, AsyncStorage persistence) eliminates repeat API calls
- Prefetching (up to 3 questions ahead) eliminates perceived wait time during sessions
- Edge function exponential backoff (2s/4s/8s) prevents retry storms on 429

### 1.2 Bayesian Knowledge Tracing (BKT)
- Fully functional mastery tracking per-subtopic with continuous update on every answer
- Per-topic parameter fitting (`runParameterFitting`) adapts to individual learning rates
- Combined with cognitive twin model (hesitation, forgetting, confusion) provides rich learner profile

### 1.3 Adaptive Difficulty (Contextual Bandit)
- LinUCB algorithm with 8-dimensional context vector effectively personalizes question difficulty
- Initial default (`selectDifficultyByMastery`) provides reasonable cold-start behavior
- Session-level difficulty adapter (`sessionDifficultyAdapter`) provides smooth transitions within sessions

### 1.4 PSC Corpus Integration
- 17,165 scraped PYQ questions from 266 exams successfully imported into Supabase
- Edge function `psc-pyq-explorer` deployed with 3 endpoints (search, filters, session generation)
- Exam blueprint weights (`examBlueprints.ts`) encode syllabus composition for all major Kerala PSC exams (LDC, Secretariat Assistant, Degree Level, Police Constable) — 7 exams total

### 1.5 Infrastructure
- All 11 edge functions deployed and functional
- Supabase-backed auth, sync, and offline queue working
- Admin/SuperAdmin portals fully built with granular permissions
- Stripe/Razorpay subscription integration ready

### 1.6 Architecture Patterns
- Clean store separation (zustand slices: MCQ, BKT, cognitive twin, performance, user)
- Service layer separates concerns well; barrel exports keep import paths clean
- AsyncStorage persistence across most stores survives app restarts

---

## 2. What Is Confusing

### 2.1 PSC Frequency Data is Loaded But Never Used
`seedPSCFrequency()` is called on every HomeScreen mount. It fetches topic frequency data from Supabase into an in-memory cache. But `boostWithPSCFrequency()` — the function that applies a 20% weight to recommendations based on this data — is **never called anywhere**. The entire frequency mechanism runs but produces zero effect.

### 2.2 Blueprint Alignment Boost is Effectively Broken
`getBlueprintBoost()` is synchronous but `load()` is async. Since `getBlueprintBoost` never calls `load()`, `cache` is always `null`, and the function always returns the cold-start default of `1.5`. The blueprint alignment system runs but produces no real correction — it always boosts everything by the same factor.

### 2.3 Learner Stage `difficultyShift` is Computed But Unused
The learner stage system computes `difficultyShift` (-1 for discovering, +2 for polishing) but this value is stored in `StageConfig` and **never referenced** by any difficulty-selection logic. The bandit and `selectDifficulty()` entirely ignore it.

### 2.4 Two Different Scoring Formulas Exist Side-by-Side
`infinityScorer.ts` and `revisionEngine.ts` both compute topic importance scores, but with different denominators (`/100` vs `/50`). The same input produces different outputs depending on which system evaluates it. Their callers (`cognitiveTwinRecommender` and `infinityEngine`) blend them in a `0.6 / 0.4` ratio, but the raw scores are incomparable.

### 2.5 "Smart Practice" Modal Sequence vs. PSC Data
The Learn screen's modal chain (Type → Source → Select → Paste → Count) is well-built but never references PSC exam blueprints or frequency data. A student selecting "Chaptewise > Kerala History > Ancient Kerala" gets the same template-based questions regardless of whether that chapter is high-frequency in their target exam.

---

## 3. What Should Be Removed

### 3.1 Dead Screens

| Screen | Why Remove |
|--------|------------|
| `src/screens/PracticeScreen.tsx` | Orphaned — not registered in any navigator, no navigation path reaches it |
| `src/screens/RevisionHubScreen.tsx` | Imported in AppNavigator but never registered as a Stack.Screen |
| `src/screens/ReliabilityDashboardScreen.tsx` | Never imported anywhere after creation |
| `src/screens/ChatbotScreen.tsx` (tab) | Registered in HomeTabs but has no BottomNav button and no nav target |

### 3.2 Dead Code in Services

| Function | File | Why Remove |
|----------|------|------------|
| `boostWithPSCFrequency()` | `pscFrequencyBoost.ts` | Never called; PSC frequency data is fetched but never applied |
| `validateSessionAlignment()`, `calculateAlignmentScore()`, `getFallbackMessage()` | `sessionValidation.ts` | Only the type `SessionValidationReport` is used |
| `printValidationReport()` | `adaptiveValidationReport.ts` | Console-logging diagnostic function never invoked |
| `recordSessionImpact()` | `recommendationTracker.ts` | Supabase RPC `record_recommendation_impact` never called |

### 3.3 Dead Edge Function Route

| Route | Why Remove |
|-------|------------|
| `cancel-subscription` | Referenced in `subscriptionStore.ts` but no edge function file exists — will return 404 |

### 3.4 Redundant State

| Field | Why Remove |
|-------|------------|
| `difficultyShift` in `StageConfig` | Computed per-stage but never referenced by difficulty selection |
| `gapClosureRate` parameter in `getLearnerStage` | Accepted but never used in stage determination |
| `mcqStore` access in `examOutlookEngine` | `useMCQStore.getState()` is called but the result is never referenced |

---

## 4. What Should Be Improved

### 4.1 Critical: Wire PSC Frequency Data into Recommendations
`boostWithPSCFrequency()` exists, works, but is never called. The fix is a 3-line change: call it in `computeTopicScores()` (infinityScorer) or `getGapRecommendations()` (cognitiveTwinRecommender). This would make PSC historical frequency affect all downstream recommendations.

### 4.2 Critical: Fix Blueprint Alignment Boost
`getBlueprintBoost()` needs to be made async or `load()` needs to be called at startup. Without this, the coverage-vs-target correction never activates.

### 4.3 High: Fix Navigation Gaps
- PSC screens (PYQExplorer, HighYieldPractice, TopicIntelligence, ImpactDashboard, CorpusHealth) are registered in AppNavigator but have no reachable entry point from tabs
- `PracticeScreen` should either be deleted or registered and linked from BottomNav/LearnScreen
- PYQExplorer should be accessible from a "PYQ Practice" card on LearnScreen or HomeScreen

### 4.4 High: Fix Scoring Inconsistencies
- Align importance formula denominators (`/50` vs `/100`) between infinityScorer and revisionEngine
- Fix double-counted category boost in `infinityScorer.importanceScore`
- Make `computePriorities` caller pass actual forgetting rates (not `{}`)

### 4.5 Medium: Add Exploration to Topic Selection
`pickBestTopic()` always picks the top-scored topic with zero stochasticity. Add epsilon-greedy or softmax exploration to prevent cold-start fixation.

### 4.6 Medium: Normalize Bandit Features
`avgTimeToAnswer` in the bandit context is clamped to `[0,1]` without normalization. A 20-second response time saturates the feature to 1.0, losing all discriminative power.

### 4.7 Medium: Register ReliabilityDashboardScreen
The reliability dashboard is fully built with live metrics but inaccessible. Register it in AppNavigator (e.g., as a debug route or admin screen).

### 4.8 Low: Fix SetupScreen Constraints
SetupScreen has no "Skip" or "Exit" button. A returning user who needs to change exams must complete the full wizard again.

### 4.9 Low: Fix BottomNav Type Mismatches
`ChatbotScreen` passes `activeTab="Chatbot"` (invalid), `PYQExplorerScreen` passes `navigation` and `currentRoute` (wrong props type). TypeScript errors should be addressed.

---

## 5. Top 5 Highest-Impact Changes

| Rank | Change | Impact | Effort | Files Changed |
|------|--------|--------|--------|---------------|
| **1** | Wire `boostWithPSCFrequency` into `infinityScorer.computeTopicScores` | **High**: Makes 17K PYQ questions actually affect what students study | 3 lines | `infinityScorer.ts` |
| **2** | Fix `getBlueprintBoost` async loading | **High**: Enables exam-coverage alignment to work | 5 lines | `blueprintAlignment.ts` |
| **3** | Add PSC screen navigation from LearnScreen cards | **High**: Enables access to PYQ Explorer, HighYield, Corpus Health | ~50 lines | `LearnScreen.tsx`, `BottomNav.tsx` |
| **4** | Fix scoring formula denominators & category double-count | **Medium**: Makes importance scores consistent across systems | 4 lines | `infinityScorer.ts`, `revisionEngine.ts` |
| **5** | Wire `difficultyShift` into bandit difficulty selection | **Medium**: Makes learner stage actually affect difficulty | 8 lines | `contextualBandit.ts`, `mcqHelpers.ts` |

---

## 6. Recommendation Quality — 20 Generated Recommendations

Sample student: Target LDC + Secretariat Assistant. 65 total questions, streak 4, overallMastery 32%, ~35% accuracy in Kerala History.

| # | Recommended Topic | Rationale | PSC Frequency Affected? | Would PSC Mentor Agree? |
|---|---|---|---|---|
| 1 | Renaissance → Sree Narayana Guru | Highest BKT priority (0.85) due to low mastery + high exam weight | No (boostWithPSCFrequency never called) | Yes — high-frequency topic in LDC |
| 2 | Constitution → Fundamental Rights | High exam importance (Article-based questions common) | No | Yes — core PSC topic |
| 3 | Kerala History → Ancient Kerala | Gap detected (mastery 30%) + LDC weight 12 | No | Yes — Sangam/Muziris frequently tested |
| 4 | Geography → Districts | Synthetic coverage pushes to subjects with fewer questions | No | Yes — 14 districts is classic PSC question |
| 5 | Science → Chemistry | Coverage balance favors untapped subjects | No | Neutral — lower frequency but syllabus requirement |
| 6 | Renaissance → Temple Entry Movement | Subtopic gap within high-priority subject | No | Yes — Vaikom/Temple Entry Proclamation very common |
| 7 | Kerala History → Modern Kerala | BKT priority high due to zero attempts | No | Yes — formation of Kerala always asked |
| 8 | Constitution → Directive Principles | Moderate mastery + exam weight boost | No | Yes — DPSP vs FR comparison common |
| 9 | Malayalam → Ancient Poets | Random exploration in infinityScorer ranking | No | Neutral — moderate frequency in LDC |
| 10 | Mental Ability → Analogies | Low attempt count → weaknessScore default 0.5 | No | Neutral — always appears but low weight |
| 11 | Geography → Rivers | Coverage balance favors | No | Yes — Periyar/Pamba frequently asked |
| 12 | Current Affairs → Kerala News | Always generated; no mastery tracking | No | Yes — budget/scheme questions common |
| 13 | Renaissance → Social Reform Movements | Gap priority due to low mastery | No | Yes — Ayyankali/SNDP Yogam important |
| 14 | Kerala History → Medieval Kerala | BKT forgetting score high (days > 30) | No | Yes — Zamorins/Kochi Kingdom asked |
| 15 | Constitution → Union Executive | Untapped in current sessions | No | Yes — President election process common |
| 16 | Quantitative Aptitude → Percentages | Low attempt count → moderate weakness score | No | Neutral — appears but less PSC-specific |
| 17 | Science → Human Body | Coverage balance (many Science topics unvisited) | No | Neutral — skeleton/organs occasionally asked |
| 18 | Kerala History → (any) | Triple-counted category boost inflates all Kerala topics | No (boost still applies but not PSC frequency) | Would agree but for wrong reasons |
| 19 | Constitution → Fundamental Rights | Returned after other topics exhausted | No | Yes — likely already answered correctly |
| 20 | Renaissance → Sree Narayana Guru | Recursion: highest priority topic regenerated | No | Yes — but repetition may bore student |

### Key Finding

**Zero of 20 recommendations were affected by PSC historical frequency data.** Although `seedPSCFrequency()` fetches topic-level question counts from the database, `boostWithPSCFrequency()` is never called, so the 17,165 scraped PYQs exert exactly zero influence on what the app recommends.

Recommendations are instead driven by:
- BKT mastery estimates (primary factor)
- Cognitive gap records (60% weight when gaps exist)
- Static exam blueprint weights (syllabus composition, NOT actual question frequency)
- Coverage balancing (favors subjects with fewer questions)
- Category boosts from blueprint alignment (partially broken; always returns 1.5)

---

## 7. PSC Corpus Usage Analysis

### Where PSC Corpus IS Used

| Component | Usage | Impact |
|-----------|-------|--------|
| `psc-pyq-explorer` edge function | Search/filter/browse 17,165 questions | Student can browse PYQs |
| `PYQExplorerScreen` | UI for browsing PYQs (dead nav, but screen exists) | Potentially useful |
| `pscFrequencyBoost.ts` → `seedPSCFrequency()` | Fetches topic frequencies from edge function | In memory but never applied |
| `examBlueprints.ts` | Static weights for all 7 PSC exams | Affects importance scores |
| `pscFrequencyBoost.ts` → `PSC_TOPIC_MAP` | Mappings for subject→topic→frequency | In memory but never read |

### Where Corpus Data Is Ignored

| Location | What's Missing | Consequence |
|----------|---------------|-------------|
| `infinityScorer.computeTopicScores` | No `boostWithPSCFrequency` call | Topic scores don't reflect actual exam frequency |
| `cognitiveTwinRecommender.getGapRecommendations` | No PSC frequency factor | Gap priority ignores how often a topic is tested |
| `examOutlookEngine.computeBlockingTopics` | No frequency weighting | "Blocking topics" don't distinguish 1%-vs-15% exam topics |
| `HomeScreen` PSC cards | No "High Frequency Topic" badge | Student never sees frequency context |
| `LearnScreen` | No "PYQ Practice" entry point | Need to know it exists via other paths |

### Where AI-Generated Questions Are Used

| Location | Usage | Volume |
|----------|-------|--------|
| `mcqSessionSlice.startDailyDrill` | First question + prefetch | 1-4 per session |
| `mcqSessionSlice.nextQuestion` | All subsequent questions | 1 per user action |
| `mcqSessionSlice.startOrchestratedSession` | First question | 1 per session |
| `infinityEngine.generateNextAdaptiveQuestion` | All adaptive sessions | Primary generation path |
| `aiFlashcardGenerator` | Flashcard content | Per flashcard request |

### Where Template Questions Are Used

| Location | Usage | Volume |
|----------|-------|--------|
| `mcqSessionSlice.startExamMode` | 20-question exam simulation | 20 per session (all template) |
| `mcqSessionSlice.startPracticeSession` | Configurable count | Variable (all template) |
| `topicEnforcement` | Fallback when AI fails | Rare (template as backup) |

---

## 8. Future Work Ranking

### Priority A — Must Do Before Users

| # | Item | Why | Est. Effort |
|---|------|-----|-------------|
| A1 | Wire `boostWithPSCFrequency` into `infinityScorer` and `cognitiveTwinRecommender` | PSC corpus data currently has zero impact on recommendations | 1 hour |
| A2 | Fix `getBlueprintBoost` async loading | Blueprint alignment is permanently stuck at 1.5x | 30 min |
| A3 | Create navigation entry points for PSC screens | PYQExplorer, HighYieldPractice, ImpactDashboard, TopicIntelligence, CorpusHealth are registered but unreachable | 2 hours |
| A4 | Delete or register `PracticeScreen` and `RevisionHubScreen` | Dead code increases maintenance surface | 30 min |
| A5 | Fix scoring formula denominators and category double-count | Two scoring systems produce inconsistent results | 1 hour |
| A6 | Deploy `cancel-subscription` edge function or remove reference | Current code throws 404 on subscription cancellation | 30 min |

### Priority B — Should Do After First Users

| # | Item | Why | Est. Effort |
|---|------|-----|-------------|
| B1 | Add exploration to `pickBestTopic` (epsilon-greedy) | Cold-start fixation prevents topic diversity | 2 hours |
| B2 | Wire `difficultyShift` into bandit difficulty selection | Learner stage computed but unused | 2 hours |
| B3 | Fix `avgTimeToAnswer` normalization in bandit context | Feature saturated at 1.0 for most users | 30 min |
| B4 | Register ReliabilityDashboardScreen as admin/debug route | Fully built but inaccessible | 15 min |
| B5 | Fix `computePriorities` to accept actual forgetting rates | Empty `{}` passed → all subjects use 7-day default | 30 min |
| B6 | Add "PSC Frequency" badge to HomeScreen topic cards | Students should see "Asked in 5 of last 10 exams" | 3 hours |
| B7 | Add PYQ count and last-appeared year to `get_distinct_values` RPC | Enables "This topic appeared in 2024 LDC" metadata | 2 hours |
| B8 | Fix `computeExamOutlook` coverage formula | Current formula `g.count/(g.count+1)` is synthetic, not actual | 1 hour |

### Priority C — Nice-to-Have

| # | Item | Why | Est. Effort |
|---|------|-----|-------------|
| C1 | Delete dead functions: `sessionValidation.validateSessionAlignment`, `recommendationTracker.recordSessionImpact`, `adaptiveValidationReport.printValidationReport` | Cleanup | 30 min |
| C2 | Fix BottomNav type mismatches (Chatbot, PYQExplorer, PracticeScreen) | TypeScript hygiene | 30 min |
| C3 | Add "Skip" button to SetupScreen | Returning users shouldn't be forced through setup | 1 hour |
| C4 | Deploy `fetch-current-affairs` on Supabase cron | Currently deployed but never triggered | 30 min |
| C5 | Add `load()` call to `getBlueprintBoost` initialization path | Ensures blueprint data persists across sessions | 30 min |
| C6 | Make `aiFlashcardGenerator` pass `priority: 'low'` to generation queue | Prevents flashcard generation from blocking interactive questions | 15 min |
| C7 | Add cache hit / miss logging to reliability dashboard API calls | Better observability | 1 hour |
| C8 | Normalize `getRetentionPriorityTopics` to use subtopic keys | Currently deduped by `subject::topic`, losing subtopic specificity | 1 hour |

---

## 9. Summary

### Student Capacity: 26 reachable screens across 4 main tabs + 22 stack routes
### Dead Code: 4 orphaned screens, 5 orphaned functions, 1 missing edge function
### Reliability: Queue, cache, prefetch, and backoff all correctly implemented and wired
### Recommendation Quality: Driven by BKT + cognitive twin + blueprint weights, but **PSC frequency data is completely ignored**
### Live Corpus Integration: 17,165 questions searchable via edge function but not influencing recommendations
### Top Risk: PSC frequency data and blueprint alignment are loaded/calculated but produce zero effect — the app operates as if the corpus doesn't exist for recommendation purposes
