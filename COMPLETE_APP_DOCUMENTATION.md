# Lakshyam PSC — Complete App Documentation

## 1. App Overview

**Lakshyam** is a React Native (Expo) mobile app for Kerala PSC exam preparation. It provides AI-powered adaptive learning, question bank, flashcards, current affairs, previous year questions, notes, and progress tracking — all offline-first with optional Supabase sync.

**Target exams:** LDC, Secretariat Assistant, University Assistant, Police Constable, Degree Level

---

## 2. Navigation Architecture

**File:** `src/navigation/AppNavigator.tsx`

```
RootNavigator (Stack)
├── Unauthenticated
│   ├── LoginScreen
│   └── SetupScreen (3-step onboarding: name → subjects → exams)
│
└── Authenticated (role-based)
    ├── Student (MainTabs)
    │   ├── HomeTab → HomeStack
    │   │   ├── HomeScreen (dashboard)
    │   │   ├── SubjectsScreen
    │   │   ├── CurrentAffairsScreen
    │   │   ├── ContinueLearningScreen (redirect)
    │   │   └── BookmarkedQuestionsScreen
    │   │
    │   ├── LearnTab → LearnStack
    │   │   ├── LearnScreen (adaptive learning card, action cards)
    │   │   ├── MCQEngineScreen (adaptive practice engine)
    │   │   ├── FlashcardsScreen (SM-2 spaced repetition)
    │   │   ├── AITutorScreen (structured tutor with renderers)
    │   │   ├── ChatbotScreen (general AI chat)
    │   │   └── PostSessionScreen (session results)
    │   │
    │   ├── PracticeTab → PracticeStack
    │   │   ├── PracticeScreen (hub: PYQ, High Yield, Topic Intelligence)
    │   │   ├── PYQExplorerScreen
    │   │   ├── HighYieldPracticeScreen
    │   │   ├── TopicIntelligenceScreen (per-topic mastery)
    │   │   ├── ImpactDashboardScreen (recommendation stats)
    │   │   ├── RevisionHubScreen
    │   │   └── AnalyticsRedirect (redirects)
    │   │
    │   ├── ProgressTab → ProgressStack
    │   │   ├── ProgressScreen
    │   │   ├── SavedNotesScreen
    │   │   ├── NoteDetailScreen
    │   │   ├── CreateNoteScreen
    │   │   └── RetentionDashboardRedirect / KnowledgeMapRedirect / ...
    │   │
    │   └── ProfileTab → ProfileStack
    │       ├── ProfileScreen (settings)
    │       └── SubscriptionScreen
    │
    ├── Admin (AdminTabs)
    │   ├── Dashboard, Question Management, CA Management
    │   ├── Content Quality Center, Learner Support
    │   ├── Learning Analytics, Question Audit
    │   ├── Bulk Upload, Subscription Management
    │   └── Suggestion Management
    │
    └── SuperAdmin (SuperAdminTabs)
        ├── Executive Dashboard, Recommendation Engine Analytics
        ├── User Management, Access Control
        ├── System Monitoring, Audit Logs
        └── Billing Dashboard
```

**Total screens:** 36 registered routes + 6 LearnScreen subcomponents.

---

## 3. Complete File Inventory

### 3.1 Screens (`src/screens/`)

| File | Purpose |
|------|---------|
| `HomeScreen.tsx` | Dashboard: greeting, exam outlook card, weak areas, current affairs, streak |
| `LoginScreen.tsx` | Phone/email auth, login/signup |
| `SetupScreen.tsx` | 3-step onboarding: name → subjects → target exams |
| `LearnScreen.tsx` | Main learn hub: adaptive learning card, 6 action cards (subjects, tasks, paste, CA, PYQ, source select) |
| `MCQEngineScreen.tsx` | Full MCQ practice engine: question display, option selection, confidence calibration, explanation, report |
| `PostSessionScreen.tsx` | Session results: accuracy meter, weak/strong subjects, difficulty breakdown, comparison |
| `AITutorScreen.tsx` | PSC-structured AI tutor with section cards + action chips |
| `ChatbotScreen.tsx` | General AI chatbot with greeting, suggestions, attach modal, voice input |
| `PracticeScreen.tsx` | Practice hub: PYQ Explorer, High Yield, Topic Intelligence, Impact Dashboard, MCQ, Flashcards |
| `SubjectsScreen.tsx` | Browse subjects and topics |
| `CurrentAffairsScreen.tsx` | Current affairs feed from NewsAPI |
| `PYQExplorerScreen.tsx` | Previous year question browser with filters |
| `HighYieldPracticeScreen.tsx` | 70% weak areas + 30% high-yield PSC topics |
| `TopicIntelligenceScreen.tsx` | Per-topic mastery indicators, yield scores, trends |
| `ImpactDashboardScreen.tsx` | Recommendation impact by type (weakness-only, frequency, hybrid) |
| `RevisionHubScreen.tsx` | Revision content hub |
| `FlashcardsScreen.tsx` | SM-2 spaced repetition flashcard review |
| `BookmarkedQuestionsScreen.tsx` | Saved/bookmarked questions |
| `SavedNotesScreen.tsx` | User notes list |
| `NoteDetailScreen.tsx` | Single note view/edit |
| `CreateNoteScreen.tsx` | Create new note |
| `ProgressScreen.tsx` | Overall progress metrics |
| `SubscriptionScreen.tsx` | Plans, Razorpay payment, 30-day trial |
| `CorpusHealthScreen.tsx` | Question bank health metrics |
| `ReliabilityDashboardScreen.tsx` | AI provider reliability stats |
| `LeaderboardScreen.tsx` | User leaderboard |
| `AnalyticsRedirect.tsx` | Redirect placeholder |
| `GoalTrackerRedirect.tsx` | Redirect placeholder |
| `RetentionDashboardRedirect.tsx` | Redirect placeholder |
| `KnowledgeRepositoryRedirect.tsx` | Redirect placeholder |
| `KnowledgeMapRedirect.tsx` | Redirect placeholder |
| `CorpusHealthRedirect.tsx` | Redirect placeholder |
| `ReliabilityDashboardRedirect.tsx` | Redirect placeholder |

### 3.2 Admin Screens (`src/screens/Admin/`)

| File | Purpose |
|------|---------|
| `AdminDashboard.tsx` | Admin metrics overview |
| `QuestionManagement.tsx` | Manage question bank |
| `CurrentAffairsManagement.tsx` | Manage current affairs articles |
| `ContentQualityCenter.tsx` | Content quality review |
| `LearnerSupport.tsx` | User support tickets |
| `LearningAnalytics.tsx` | Learning patterns analytics |
| `QuestionAudit.tsx` | Question audit trail |
| `BulkUpload.tsx` | Bulk question upload |
| `SubscriptionManagement.tsx` | Manage user subscriptions |
| `SuggestionManagement.tsx` | User suggestions/feedback |

### 3.3 SuperAdmin Screens (`src/screens/SuperAdmin/`)

| File | Purpose |
|------|---------|
| `ExecutiveDashboard.tsx` | Executive-level metrics |
| `RecommendationEngineAnalytics.tsx` | Recommendation performance |
| `UserManagement.tsx` | Manage all users |
| `AccessControl.tsx` | Role/permission management |
| `SystemMonitoring.tsx` | System health monitoring |
| `AuditLogs.tsx` | Full audit log viewer |
| `BillingDashboard.tsx` | Revenue/billing metrics |

### 3.4 Components (`src/components/`)

| File | Purpose |
|------|---------|
| `BottomNav.tsx` | Custom bottom navigation bar (exports tab height constants) |
| `ActionChips.tsx` | Horizontal action chips (Generate MCQ, Explain Simpler, etc.) |
| `AnswerRenderer.tsx` | Section-aware tutor response renderer with color-coded cards |
| `MarkdownRenderer.tsx` | Lightweight markdown renderer (headings, bold, lists, code) |
| `Icons.tsx` | SVG icon components (SendArrow, Attach, Mic, Back, Arrow45, etc.) |
| `Logo.tsx` | App logo component |
| `LoadingAnimation.tsx` | Loading spinner/animation |
| `FirstLaunchTooltip.tsx` | First-launch tooltip overlay |
| `RecommendationCard.tsx` | Recommendation display card |
| `StyledComponents.tsx` | Reusable styled primitives |
| **`cards/`** | |
| `ContinueLearningCard.tsx` | Resume last session card |
| `CurrentAffairsCard.tsx` | Current affairs summary card |
| `ExamOutlookCard.tsx` | Exam readiness card |
| `RevisionDueCard.tsx` | Due revision card |
| `TodayFocusCard.tsx` | Today's focus area card |
| `WeakAreasCard.tsx` | Weak subjects card |
| **`flashcards/`** | Flashcard-specific components |
| **`home/`** | Home screen components |
| **`mcq/`** | MCQ-related components |
| **`notes/`** | Note-related components |
| **`renderers/`** | |
| `ResponseModeRenderer.tsx` | 6-mode response dispatcher (tutor, mcq, simple_explanation, pyq, flashcard, related_topic) |
| **`revision/`** | Revision hub components |
| **`tutor/`** | AI tutor components |
| **`analytics/`** | Analytics dashboard components |
| **`map/`** | Knowledge map components |
| **`currentaffairs/`** | Current affairs components |

### 3.5 LearnScreen Subcomponents (`src/screens/LearnScreen/`)

| File | Purpose |
|------|---------|
| `AdaptiveLearningCard.tsx` | Card launching adaptive daily drill |
| `ActionCardsRow.tsx` | Row of action cards (subjects, tasks, paste, etc.) |
| `PasteModal.tsx` | Paste content modal |
| `SelectListModal.tsx` | Selection list modal |
| `SourceSelectModal.tsx` | Source selection modal |
| `SuggestionModal.tsx` | Suggestions modal |
| `TasksModal.tsx` | Tasks modal |
| `TypeSelectModal.tsx` | Type selection modal |
| `styles.ts` | LearnScreen shared styles |

---

## 4. State Management (Zustand Stores)

**File:** `src/store/`

| Store | Key File(s) | AsyncStorage Key | Purpose |
|-------|------------|-----------------|---------|
| **authStore** | `authStore.ts` | `lakshyam-auth` | Auth state, Supabase session, role-based permissions matrix |
| **userStore** | `userStore.ts` | `lakshyam-user` | Profile (name, exams, locale, streak, goals, setupComplete) |
| **knowledgeStore** | `knowledgeStore.ts` | `lakshyam-knowledge` | Notes CRUD, subject selection |
| **performanceStore** | `performanceStore.ts` | `lakshyam-performance` | Interaction signals, confusion pairs, session outcomes, recommendations, forgetting curves, confidence calibration |
| **mcqStore** | `mcqStore.ts` (combines 5 slices) | `lakshyam-mcq-store` | MCQ session state, difficulty, questions, recommendations, analytics |
| **mcqSessionSlice** | `mcqSessionSlice.ts` | — | Session lifecycle (startDailyDrill, nextQuestion, endSession, triggerPrefetch) |
| **mcqDifficultySlice** | `mcqDifficultySlice.ts` | — | Difficulty state, adaptation |
| **mcqRecommendationSlice** | `mcqRecommendationSlice.ts` | — | Recommended subject/topic |
| **flashcardStore** | `flashcardStore.ts` | `lakshyam-flashcards` | SM-2 spaced repetition, review scheduling |
| **bktStore** | `bktStore.ts` | `lakshyam-bkt` | Bayesian Knowledge Tracing per subject/topic/subtopic |
| **cognitiveTwinStore** | `cognitiveTwinStore.ts` (4 slices) | `lakshyam-cognitive-twin-v2` | Mastery, gaps, analytics, retention |
| **cognitiveTwinMasterySlice** | `cognitiveTwinMasterySlice.ts` | — | Mastery score per knowledge node |
| **cognitiveTwinGapSlice** | `cognitiveTwinGapSlice.ts` | — | Gap detection, lifecycle, prioritization |
| **cognitiveTwinAnalyticsSlice** | `cognitiveTwinAnalyticsSlice.ts` | — | Health score, improving/forgotten topics |
| **cognitiveTwinRetentionSlice** | `cognitiveTwinRetentionSlice.ts` | — | 7/30/90 day retention, reopen logic |
| **subscriptionStore** | `subscriptionStore.ts` | `lakshyam-subscription` | 30-day trial, Razorpay integration |
| **analyticsStore** | `analyticsStore.ts` | `lakshyam-analytics` | Score, revision health, predicted readiness |
| **adminStore** | `adminStore.ts` | `lakshyam-admin` | Flagged questions, CA, support tickets, system health |

### All AsyncStorage Keys:
- `lakshyam-auth`
- `lakshyam-user`
- `lakshyam-knowledge`
- `lakshyam-performance`
- `lakshyam-mcq-store`
- `lakshyam-flashcards`
- `lakshyam-bkt`
- `lakshyam-cognitive-twin-v2`
- `lakshyam-subscription`
- `lakshyam-analytics`
- `lakshyam-admin`

---

## 5. Services (`src/services/`)

### 5.1 AI Services

| File | Purpose | API Calls |
|------|---------|-----------|
| `chatService.ts` | Client for `ask-ai` edge function; builds user context | `ask-ai` edge function |
| `aiQuestionGenerator.ts` | Client for `generate-question` with cache + queue | `generate-question` edge function |
| `aiMCQGenerator.ts` | Template-based MCQs (50+ sets, 10 subjects, EN/ML) | None — purely local |
| `aiFlashcardGenerator.ts` | Flashcard generation | (edge function) |

### 5.2 Adaptive Learning Engine

| File | Purpose |
|------|---------|
| `infinityEngine.ts` | Topic selection (`pickTopic`), weakest subtopic, difficulty mapping, question generation orchestration |
| `infinityScorer.ts` | Multi-factor topic scoring (weakness, forgetting, importance, exam weight, recency, coverage) |
| `sessionOrchestrator.ts` | Scores 6 session types with modifiers (exam proximity, flashcard urgency, confusion pairs, etc.) |
| `sessionDifficultyAdapter.ts` | In-session dynamic difficulty (3 correct→↑, 2 wrong→↓) |
| `contextualBandit.ts` | LinUCB bandit for difficulty selection (8-feature context vector) |
| `revisionEngine.ts` | BKT-based revision priorities |
| `knowledgeEngine.ts` | BKT update/decay formulas, prerequisite checking |
| `bktFitter.ts` | Grid-search BKT parameter fitting from interaction signals |
| `learnerStage.ts` | Stage detection (discovering/building/mastering/polishing) |
| `spacedRepetition.ts` | Decay formulas, interval computation, overdue detection |
| `retentionAssessmentService.ts` | 7/30/90 day retention checkpoints, reopen decisions |

### 5.3 Cognitive Twin & Recommendations

| File | Purpose |
|------|---------|
| `cognitiveTwinRecommender.ts` | Gap recommendations, unified priorities (60% cog twin + 40% BKT), next topic selection |
| `adaptiveLearningService.ts` | Mastery snapshots, health score, gap closure validation |
| `learningRecommendationEngine.ts` | Re-export hub for recommendation functions |
| `recommendationTracker.ts` | Records recommendation impact via Supabase RPC |
| `confidenceCalibration.ts` | Tracks confidence vs accuracy calibration |

### 5.4 PSC-Specific

| File | Purpose |
|------|---------|
| `pscService.ts` | PSC exam data, syllabus lookups |
| `pscFrequencyBoost.ts` | Boosts topic scores with PSC exam frequency data |
| `highYieldTopics.ts` | High-yield topic scoring from Supabase corpus |
| `blueprintAlignment.ts` | Exam blueprint alignment boost for topic selection |
| `examOutlookEngine.ts` | Exam readiness: blocking topics, revision risks, score range |

### 5.5 Quality & Validation

| File | Purpose |
|------|---------|
| `topicEnforcement.ts` | Strict topic enforcement for AI-generated questions |
| `questionValidator.ts` | Question integrity validation (schema, options, language) |
| `questionAudit.ts` | Question audit trail |
| `skipAuditService.ts` | Tracks skipped/rejected questions |
| `skipAuditAnalysis.ts` | Analysis of skip patterns |
| `sessionValidation.ts` | Session integrity validation |
| `topicCoverageDiagnostics.ts` | Coverage analysis |
| `topicDiversityTracker.ts` | Tracks topic diversity in sessions |
| `adaptiveValidationReport.ts` | Validation report generation |
| `reliabilityTracker.ts` | AI provider reliability metrics (success rate, latency, cache hits) |
| `profileBuilder.ts` | Builds user profile from signals |

### 5.6 Infrastructure

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client initialization |
| `dataSync.ts` | Supabase data sync |
| `syncService.ts` | Background sync service |
| `notifications.ts` | Push notification setup |
| `syncSubscriptions.ts` | Realtime subscriptions |
| `offlineQueue.ts` | Offline action queue |

---

## 6. Edge Functions (`supabase/functions/`)

| Function | Type | Cost | Purpose |
|----------|------|------|---------|
| `generate-question` | AI (4-tier) | ~$0.000165/call | Generate MCQ via AI with taxonomy validation |
| `ask-ai` | AI (4-tier) | ~$0.000375/call | Chat/tutor responses with mode-aware prompts |
| `store-mcq` | DB write | $0 | Store single MCQ to `question_bank_mcqs` |
| `store-mcq-batch` | DB write | $0 | Batch store MCQs with dedup |
| `store-flashcard` | DB write | $0 | Store flashcard |
| `get-repository-question` | DB read | $0 | Fetch cached question from repository |
| `seed-repository` | AI + DB | ~$0.000165/call | Bulk seed question bank (calls generate-question) |
| `refresh-coverage` | DB RPC | $0 | Refresh materialized view |
| `repository-analytics` | DB RPC | $0 | Cache hit rate, usage stats |
| `question-bank-stats` | DB query | $0 | MCQ + flashcard counts |
| `psc-pyq-explorer` | DB RPC | $0 | Browse previous year questions |
| `fetch-current-affairs` | NewsAPI | $0 (free tier) | Current affairs feed |
| `report-question` | DB insert | $0 | Flag/report bad questions |
| `create-subscription` | Razorpay API | $0 | Create Razorpay subscription |
| `razorpay-webhook` | Razorpay | $0 | Handle subscription events |

### AI Provider Cascade (shared by `generate-question` and `ask-ai`)

```
Tier 1: Primary provider (AI_API_URL + AI_API_KEY + AI_MODEL)
        Default: OpenAI gpt-4o-mini
        └── success → return

Tier 2: OpenRouter alt models (if primary URL is OpenRouter)
        google/gemini-2.0-flash-lite-001
        meta-llama/llama-3.1-8b-instruct
        └── success → return

Tier 3: Fallback provider (FALLBACK_API_URL + FALLBACK_API_KEY + FALLBACK_MODEL)
        Default: meta-llama/llama-3.1-8b-instruct:free
        └── success → return

Tier 4: Gemini direct (GEMINI_API_KEY)
        gemini-2.0-flash-lite
        └── success → return

If all fail → 502 error
```

---

## 7. Knowledge Models

### 7.1 Knowledge Tree (18 Canonical Subjects)

```
Indian History & National Movement
Kerala History
Renaissance in Kerala
Constitution of India
Indian Geography
Kerala Geography
Indian Economy
Science & Technology
Physics
Chemistry
Biology
Mental Ability
Quantitative Aptitude
Malayalam
English
General Studies
Social Science
Current Affairs
```

Each subject has topics → subtopics with prerequisites defined in `src/data/knowledgeTree.ts`.

### 7.2 Bayesian Knowledge Tracing (BKT)

Per subject/topic/subtopic, maintains:
- `pMastered`: probability knowledge is mastered
- `pSlip`, `pGuess`, `pLearn`, `pL0`: skill parameters
- Updated on every interaction signal
- Decay: exponential with 21-day half-life

### 7.3 Cognitive Twin

4-slice model:
1. **Mastery** — `accuracy × 0.6 + (1-hesitation) × 0.2 + (1-forgetting) × 0.2`
2. **Gaps** — lifecycle: `open → improving → closing → closed → retained`
3. **Analytics** — health score, trend detection
4. **Retention** — 7/30/90 day checkpoints with reopen logic

### 7.4 SM-2 Spaced Repetition (Flashcards)

Standard SM-2 algorithm:
- Rating 0–5
- Interval = previous × EF (when rating ≥ 3)
- EF updated per review
- Due flashcards trigger session type boost

---

## 8. Key Data Models

| Model | File | Fields |
|-------|------|--------|
| `Note` | `knowledgeStore.ts` | id, title, content, type, subject, topicIds, tags, createdAt |
| `FlashCard` | `flashcardStore.ts` | id, question, answer, subject, topic, ef, interval, repetitions, nextReview |
| `InteractionSignal` | `performanceStore.ts` | questionId, topic, subject, difficulty, answeredCorrect, timeToAnswer, confidenceFlip |
| `SessionOutcome` | `performanceStore.ts` | sessionId, type, accuracy, subjectScores, difficultyMix, duration |
| `ConfusionPair` | `performanceStore.ts` | topicA, topicB, count, accuracy |
| `GapRecord` | `cognitiveTwinTypes.ts` | knowledgeNodeId, status, masteryScore, sessionsApplied, questionsAnswered |
| `KnowledgeMastery` | `cognitiveTwinTypes.ts` | nodeId, accuracy, hesitationScore, forgettingScore, trend |
| `RetentionRecord` | `cognitiveTwinTypes.ts` | gapId, status, retentionRate, checkpoints |
| `Question` | `mcqTypes.ts` | id, text, options[], correctAnswer, explanation, subject, topic, difficulty |
| `DailyGoal` | `userStore.ts` | type, target, progress |

---

## 9. Authentication Flow

```
App starts
  → authStore.initialize()
    → check Supabase session
    → if session exists:
        → fetch profile from Supabase
        → determine role (student/admin/superadmin)
        → render appropriate navigator
    → if no session:
        → render LoginScreen
  → LoginScreen:
    → phone/email auth
    → on success → SetupScreen (first time only)
    → on complete → main app
```

**Roles:**
- `student` — full learning app (5 tabs)
- `admin` — admin panel (10 tabs)
- `superadmin` — super admin panel (8 tabs)

**Permissions matrix** in `authStore.ts` controls feature access per role.

---

## 10. Subscription & Payments

**Flow:**
```
userStore.subscription.status (trial/free/paid)
  → trial: 30-day free trial tracked locally
  → paid: Razorpay subscription
     → subscriptionStore → create-subscription edge function
     → Razorpay checkout
     → razorpay-webhook handles events
     → subscriptionStore updates status
  → expired: limited access
```

---

## 11. Theming System

**Directory:** `src/theme/`

| File | Content |
|------|---------|
| `colors.ts` | Primary (#2563EB), 9 subject colors, semantic colors (success/error/warning), backgrounds, text |
| `typography.ts` | SFProDisplay family (Bold, Heavy, Light, Medium, Regular, Semibold, Italic), locale-aware line heights |
| `spacing.ts` | 14-step scale (xs=2 → huge=32), radii (sm=6, md=12, lg=20), elevations (1–24), motion durations |
| `index.ts` | Re-exports |

---

## 12. Internationalization (i18n)

**Directory:** `src/i18n/`

| File | Size | Purpose |
|------|------|---------|
| `en.json` | ~36KB | English translations |
| `ml.json` | ~29KB | Malayalam translations |
| `index.ts` | — | Translation engine (dot-path lookup, interpolation) |
| `useTranslation.ts` | — | React hook reads locale from `userStore`, returns `t()` function |

**Locale determination:**
- Default: `'ml'` (Malayalam)
- Stored in `userStore.locale`
- Theme adjusts line heights based on locale
- AI can respond in Malayalam if asked

---

## 13. Data Layer Architecture

```
Offline-First Architecture
══════════════════════════

┌─────────────────────────────────────────────┐
│                  APP                        │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         LOCAL (Always available)      │   │
│  │                                       │   │
│  │  Zustand Stores → AsyncStorage        │   │
│  │  (lakshyam-* keys)                    │   │
│  │                                       │   │
│  │  • All user data: notes, progress,    │   │
│  │    signals, BKT params, mastery       │   │
│  │  • Question cache (AsyncStorage)      │   │
│  │  • Template MCQs (in code)            │   │
│  │                                       │   │
│  │  FULL functionality without network   │   │
│  └──────────────────────────────────────┘   │
│                     │                        │
│                     │ (optional sync)        │
│                     ▼                        │
│  ┌──────────────────────────────────────┐   │
│  │         REMOTE (Supabase)             │   │
│  │                                       │   │
│  │  Edge Functions (Deno)                │   │
│  │   → AI generation (OpenAI/Gemini)    │   │
│  │   → DB operations                     │   │
│  │   → NewsAPI                           │   │
│  │                                       │   │
│  │  Database                             │   │
│  │   → profiles, notes, subscriptions    │   │
│  │   → question_bank_mcqs, flashcards    │   │
│  │   → current_affairs, pyq_questions    │   │
│  │   → audit_logs, reports               │   │
│  │                                       │   │
│  │  Real-time: syncSubscriptions.ts      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 14. API Cost Summary

| Component | Provider | Per-Call Cost | Est. Monthly Volume | Est. Monthly Cost |
|-----------|----------|--------------|--------------------|--------------------|
| Question generation | OpenAI gpt-4o-mini | $0.000165 | 30,000 (1000/day) | $4.95 |
| Chat/tutor | OpenAI gpt-4o-mini | $0.000375 | 30,000 (1000/day) | $11.25 |
| Edge function invocations | Supabase | Free (in Pro) | ~60,000 | $0 |
| Database | Supabase Pro | — | — | $25.00 |
| NewsAPI | Free tier | — | 100/day | $0 |
| AsyncStorage (local) | Device | — | — | $0 |
| **Total** | | | | **~$41.25/month** |

With template MCQs (free) handling ~30% of requests and question cache (free) handling another ~30%, actual AI costs are ~$20–25/month.

---

## 15. Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Offline-first | Kerala network can be unreliable; students study offline |
| Zustand + AsyncStorage | Simple, typed, persistent; no Redux boilerplate |
| Supabase optional | App works fully without env vars; Supabase is enhancement |
| 4-tier AI fallback | Free tier OpenRouter + Gemini minimize cost; gpt-4o-mini is primary |
| BKT client-side | No server needed; fast updates; personalized per device |
| Cognitive twin over pure BKT | BKT is binary; cognitive twin adds continuous mastery + gap lifecycle |
| Template MCQs as fallback | Zero-cost backup when AI fails or cache misses |
| SM-2 for flashcards | Well-proven algorithm; simple implementation |
| Role-based routing | Student/Admin/SuperAdmin from same codebase |
| 18 canonical subjects | Consistent taxonomy across AI generation, storage, and rendering |
| Edge functions over server | Supabase ecosystem; no separate server to maintain |
| Section-based AI responses | Structured tutor output for scannable revision content |
