# Lakshyam — AI-Powered Kerala PSC Exam Coach

---

## Slide 1: Title

**Lakshyam**
*Your AI Coach for Kerala PSC Exams*

AI-native, cross-platform exam preparation for 1M+ annual Kerala PSC aspirants.

---

## Slide 2: The Problem

| | |
|---|---|
| **Massive market** | 1M+ applicants/year for Kerala PSC exams (LDC, Secretariat Assistant, University Assistant, Police Constable, Degree Level) |
| **No modern solution** | Existing tools are printed books, coaching centers, or generic exam apps not tailored to Kerala PSC |
| **Static content** | Traditional question banks are outdated; no personalization, no adaptive learning |
| **Language barrier** | Most tools are English-only; Kerala aspirants need Malayalam support |
| **Rural access** | Many aspirants have limited internet — existing solutions don't work offline |

---

## Slide 3: The Solution

**Lakshyam** is a full-stack AI learning platform that generates fresh, personalized questions on-the-fly, models each learner's knowledge as a cognitive twin, and works across iOS, Android, and Web — offline-first.

| Feature | What it does |
|---|---|
| **AI Question Generator** | Fresh questions for any subject/topic/difficulty, in English or Malayalam |
| **Cognitive Twin** | Digital replica of each learner's knowledge — knows what you know, what you're forgetting, and why |
| **Adaptive Engine** | Selects the next question based on your weaknesses, forgetting curve, and exam weight |
| **Spaced Repetition** | SM-2 algorithm schedules reviews at optimal intervals |
| **AI Tutor** | Kerala PSC chatbot that speaks Malayalam, explains concepts, generates practice questions |
| **Current Affairs** | Auto-fetched daily news, categorized and ready for practice |
| **Multi-Platform** | iOS + Android + Web from a single codebase |

---

## Slide 4: How It Works

```
Student answers a question
        │
        ▼
Cognitive Twin updates mastery model
        │
        ▼
Adaptive Engine picks next topic & difficulty
        │
        ▼
AI generates fresh question (Groq → Gemini → OpenRouter)
        │
        ▼
Question validated, served to student
        │
        ▼
Spaced Repetition schedules future review
```

**Every answer trains the model. The system gets smarter with every session.**

---

## Slide 5: The Cognitive Twin

The core differentiator. Each user has a persistent knowledge model across a 3-level syllabus:

```
9 Subjects
  └─ 20+ Topics
       └─ 47+ Subtopics (with prerequisite chains)
```

**Per-node tracking:**
- Mastery score, accuracy, hesitation, forgetting rate
- Attempt count, correct/incorrect ratio
- Trend direction (improving/declining/stable)
- 7-day, 30-day, 90-day retention rates

**Gap lifecycle:**
```
Open → Improving → Closing → Closed → Retained
```

**What this enables:**
- Know exactly what each student is about to forget
- Prioritize gaps that matter most for their target exam
- Measure real learning progress, not just question count

---

## Slide 6: AI Multi-Model Pipeline

**No single point of failure. No expensive vendor lock-in.**

```
                ┌──────────────────┐
                │   Student needs   │
                │   a question      │
                └────────┬─────────┘
                         │
               ┌─────────▼─────────┐
               │   Groq (Primary)   │
               │  Llama 3.1 8B     │
               │  30 req/min free  │
               └─────────┬─────────┘
                         │ (if down)
               ┌─────────▼─────────┐
               │ OpenRouter (Fail) │
               │ Gemini Flash      │
               └─────────┬─────────┘
                         │ (if down)
               ┌─────────▼─────────┐
               │ Gemini Direct     │
               │ 1,500 req/day     │
               │ Google AI Studio  │
               └───────────────────┘
```

**Capacity:** ~1,500+ AI-generated questions/day free tier
**Cost: $0 for AI inference at current scale**

---

## Slide 7: Product Screens (Student)

| Screen | Purpose |
|---|---|
| **Dashboard** | Daily progress, accuracy, streak, due reviews, subject breakdown |
| **MCQ Engine** | Core practice — AI-generated questions with confidence tracking, timer, flag/report |
| **Flashcards** | SM-2 spaced repetition — flip, rate, master |
| **Knowledge Map** | 3-level tree with mastery heatmap, prerequisite warnings, gap indicators |
| **AI Tutor** | Malayalam/English chatbot — explains concepts, generates practice on demand |
| **Analytics** | Gap lifecycle, retention curves, confidence calibration, weakest/strongest topics |
| **Current Affairs** | Daily news with images, categorized, exam-relevant |
| **Retention Dashboard** | Heat maps, sparklines, due/at-risk subtopics |
| **Goal Tracker** | Exam-specific roadmaps with phases and daily targets |
| **Profile** | Learner stage, cognitive twin summary, exam targets, streak |

---

## Slide 8: Admin & Superadmin Portals

**Admin Portal (8 tabs):**
Dashboard | Question Management | Current Affairs | Content Quality | Question Audit | Bulk Upload | Learner Support | Analytics

**Superadmin Portal (8 tabs):**
Executive Dashboard | Cognitive Twin Config | Recommendation Analytics | User Management | Access Control | System Monitoring | Experiment Center (A/B Testing) | Audit Logs

**Role model:** Student → Admin → Superadmin

---

## Slide 9: Technology

| Layer | Stack |
|---|---|
| **Frontend** | React Native + Expo 52 (iOS, Android, Web) |
| **State** | Zustand with offline persistence |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, Realtime) |
| **AI** | Groq + Gemini + OpenRouter + OpenAI |
| **Navigation** | React Navigation 7 |
| **i18n** | English + Malayalam |
| **Deploy** | Vercel (Web), Expo (Mobile) |
| **Codebase** | ~110+ source files, single TypeScript project |

**Single codebase. Three platforms. One team.**

---

## Slide 10: Market Opportunity

| Metric | Value |
|---|---|
| **Annual Kerala PSC applicants** | 1,000,000+ |
| **Exam types** | 5+ (LDC, SA, UA, Police, Degree) |
| **Active coaching centers in Kerala** | 10,000+ |
| **Smartphone penetration in Kerala** | 80%+ |
| **Current digital prep options** | None specifically for Kerala PSC |
| **Target addressable market** | ~500,000 active aspirants/year |

**Kerala has the highest literacy rate in India (96%). The market is ready — the product doesn't exist yet.**

---

## Slide 11: Competitive Advantage

| Factor | Lakshyam | Generic Apps | Coaching Centers | Books |
|---|---|---|---|---|
| **AI-generated questions** | ✅ | ❌ (static banks) | ❌ | ❌ |
| **Personalized adaptive learning** | ✅ | ❌ | ❌ | ❌ |
| **Cognitive twin modelling** | ✅ | ❌ | ❌ | ❌ |
| **Malayalam support** | ✅ | ❌ | ✅ | ✅ |
| **Offline-first** | ✅ | ❌ | ❌ | ✅ |
| **Multi-platform** | ✅ | ❌ | ❌ | ❌ |
| **Real-time analytics** | ✅ | ❌ | ❌ | ❌ |
| **Cost** | Free tier | Paid | ₹5,000-50,000 | ₹500-2,000 |
| **Scalable** | ✅ | ✅ | ❌ | ❌ |

---

## Slide 12: Business Model

| Tier | Features | Price |
|---|---|---|
| **Free** | AI-generated questions, basic analytics, daily current affairs | ₹0 |
| **Premium** (planned) | Unlimited questions, offline question bank, priority AI, detailed analytics, ad-free | ₹199/month |
| **Pro** (planned) | All Premium + AI tutor unlimited, cognitive twin deep dive, study groups | ₹499/month |
| **Enterprise** (planned) | Coaching center integration, white-label, batch management | Custom |

**Unit economics:**
- AI inference cost per question: ~₹0.001 (fraction of a paisa)
- User acquisition via organic (Google Play Store, word-of-mouth in coaching centers)
- Tier-1 city coaching center charges ₹15,000-50,000/year per student

---

## Slide 13: Traction & Milestones

| Milestone | Status |
|---|---|
| **MVP launched** | ✅ Live on Vercel |
| **AI question generation** | ✅ Multi-model pipeline, 1,500+ questions/day free |
| **Cognitive twin** | ✅ Full implementation with gap lifecycle |
| **Adaptive learning engine** | ✅ BKT-based with real-time difficulty adaptation |
| **Admin portal** | ✅ Full content management + analytics |
| **Current affairs automation** | ✅ Daily cron from NewsAPI |
| **Spaced repetition** | ✅ SM-2 implementation |
| **Malayalam support** | ✅ Full UI + AI-generated questions |
| **10+ concurrent users** | ✅ Comfortably supported on free tier |
| **Guest mode / free trial** | Next step |
| **Play Store / App Store launch** | Next step |

---

## Slide 14: The Ask

**We are building the definitive AI learning platform for Kerala PSC exams — and expanding to other state PSC exams (Tamil Nadu, Karnataka, UPSC) next.**

| Need | Amount | Use |
|---|---|---|
| **Seed investment** | $50,000 - $100,000 | Marketing & user acquisition in Kerala, content partnerships with coaching centers, premium feature development, Play Store/App Store launch |

**What you get:**
- Product with ~110+ source files, 30+ services, complete AI pipeline, admin backend
- Proven architecture (React Native + Supabase + Vercel) — low burn, easy to scale
- First-mover advantage in a 1M+ user market with zero competitors
- Data moat: more users = smarter AI = stronger lock-in

---

## Slide 15: Team

Lakshyam was built by a solo developer with expertise in:
- React Native & Expo (cross-platform mobile/web)
- Supabase (backend, auth, edge functions, PostgreSQL)
- AI/ML integration (multiple LLM providers, BKT, adaptive algorithms)
- Full-stack TypeScript development

**Looking for:** Co-founder (marketing/growth), designer, or seed investor to take this to the next level.

---

*"Lakshyam" means "target" in Malayalam. We help every aspirant hit theirs.*
