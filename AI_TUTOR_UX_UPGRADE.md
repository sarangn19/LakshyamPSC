# AI Tutor UX Upgrade

## Overview

Transformed Lakshyam AI Tutor from a plain-text chatbot into a structured PSC exam preparation tutor. Every AI response is now rendered as scannable, revision-friendly sections with action chips for further learning.

## Files Changed

| File | Change |
|------|--------|
| `src/components/MarkdownRenderer.tsx` | **NEW** — Lightweight markdown renderer (headings, bold, bullet/numbered lists, code blocks, dividers) |
| `src/components/AnswerRenderer.tsx` | **NEW** — Section-aware renderer that parses `## Section Name` headings into color-coded cards |
| `src/components/ActionChips.tsx` | **NEW** — Horizontal scrolling action chips below every AI response |
| `src/screens/AITutorScreen.tsx` | Modified — Uses AnswerRenderer + ActionChips instead of plain `<Text>`; message spacing increased |
| `src/screens/ChatbotScreen.tsx` | Modified — Same AnswerRenderer + ActionChips integration; aiBubble maxWidth → 85%, added padding |
| `supabase/functions/ask-ai/index.ts` | Modified — System prompt rewritten to request structured section format |

## New Components

### MarkdownRenderer (`src/components/MarkdownRenderer.tsx`)
- Parses text into line types: heading, bullet, ordered, paragraph, code, divider
- Supports `**bold**` inline formatting
- Code blocks rendered with monospace font on gray background
- No external dependencies — pure React Native `Text` and `View`

### AnswerRenderer (`src/components/AnswerRenderer.tsx`)
- Extracts `## Section` headings from AI response
- Maps known headings to icons and accent colors:
  - `Concept` → 📘 blue
  - `PSC Exam Focus` → 🎯 red
  - `Memory Trick` → 🧠 purple (italic quote style)
  - `Key Facts` → 📌 amber (✦ bullet list on yellow background)
  - `Common Confusions` → ⚠️ orange
  - `Practice MCQ` → ❓ green (parses question/options/answer/explanation)
  - `Related Topics` → 🔗 cyan
  - `Summary` → 📋 gray
- Each section rendered as a card with left accent border, shadow, and section-specific styling
- MCQ section detects and renders interactive quiz format with answer reveal
- Plain text fallback: `plainTextToSections()` wraps unformatted text into Concept + Key Facts + Summary

### ActionChips (`src/components/ActionChips.tsx`)
- Five horizontal scrolling chips below every AI message:
  - ❓ Generate MCQ
  - 🔍 Explain Simpler
  - 📜 Give PYQs
  - 🔗 Related Topic
  - 📇 Create Flashcard
- Each chip sends a tailored prompt back to the AI on tap

## Prompt Changes

**Before:**
```
Keep answers concise but thorough (2-5 paragraphs).
Use simple language and bullet points where helpful.
If the user asks for MCQs, generate 4 options with the correct answer marked.
```

**After:**
```
Always structure your answers for PSC exam preparation using these sections:
## Concept
## PSC Exam Focus
## Memory Trick
## Key Facts
## Common Confusions
## Practice MCQ
## Related Topics
Only include sections that are relevant.
Use "## Section Name" as heading format.
Keep the response comprehensive but exam-focused.
```

## Before vs After UI Structure

### Before
```
┌─────────────────────┐
│ 🤖 Lakshyam Tutor   │
├─────────────────────┤
│ [User] what is the  │
│ capital of Kerala?  │
├─────────────────────┤
│ [AI] Thiruvananthapuram │
│ is the capital of   │
│ Kerala. It is known │
│ for... [large text  │
│ block, no structure]│
├─────────────────────┤
│ [Save as Note]      │
├─────────────────────┤
│ chip chip chip chip  │
├─────────────────────┤
│ [Input]             │
└─────────────────────┘
```

### After
```
┌─────────────────────┐
│ 🤖 Lakshyam Tutor   │
├─────────────────────┤
│ [User] what is the  │
│ capital of Kerala?  │
├─────────────────────┤
│ [AI]                │
│ ┌─── 📘 Concept ──┐ │
│ │ Thiruvananthapuram │
│ │ is the capital...│ │
│ └─────────────────┘ │
│ ┌─── 🎯 PSC Focus ─┐ │
│ │ Often asked in...│ │
│ └─────────────────┘ │
│ ┌─── 🧠 Memory ───┐ │
│ │ "TVM = Very      │ │
│ │  Memorable"      │ │
│ └─────────────────┘ │
│ ┌─── 📌 Key Facts ─┐ │
│ │ ✦ Capital: TVM  │ │
│ │ ✦ Language: Mal │ │
│ └─────────────────┘ │
│ ┌─── ❓ Practice ──┐ │
│ │ Q. Which city... │ │
│ │ A. ... B. ...    │ │
│ │ Answer: A        │ │
│ └─────────────────┘ │
│ [Save as Note]      │
│ ┌─────────────────┐ │
│ │❓Generate MCQ    │ │
│ │🔍Explain Simpler │ │
│ │📜Give PYQs       │ │
│ │🔗Related Topic   │ │
│ │📇Create Flashcard│ │
│ └─────────────────┘ │
├─────────────────────┤
│ chip chip chip chip  │
├─────────────────────┤
│ [Input]             │
└─────────────────────┘
```

## Future Improvements

- **Interactive MCQ** — Tappable options with instant correct/incorrect feedback instead of static text
- **Flashcard mode** — Chip triggers a modal showing Front/Back card format
- **Related Topics as links** — Tappable topic chips that navigate to the topic's study screen
- **Collapsible sections** — Long sections can be collapsed for scannability
- **Rate response** — Thumbs up/down per message for feedback loop
- **Copy section** — Long-press or tap to copy individual section content
