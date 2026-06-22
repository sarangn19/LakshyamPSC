# Action Chip Rendering Report

## Response Modes

Each action chip now triggers a specific `ResponseMode` that changes both the AI prompt and the client-side renderer.

| Action Chip | ResponseMode | AI Prompt Sections | Renderer | Excluded Sections |
|---|---|---|---|---|
| Normal Chat | `tutor` | Concept, PSC Focus, Memory Trick, Key Facts, Practice MCQ, Related Topics | `TutorRenderer` → `AnswerRenderer` | — |
| ❓ Generate MCQ | `mcq` | Question, Options, Answer, Explanation | `MCQRenderer` | Concept, Key Facts, Memory Trick |
| 🔍 Explain Simpler | `simple_explanation` | Simple Explanation, Example, Quick Summary | `SimpleExplanationRenderer` | Everything else |
| 📜 Give PYQs | `pyq` | Previous Year Questions, Exam, Year, Answer, Explanation | `PYQRenderer` | Everything else |
| 📇 Create Flashcard | `flashcard` | Front, Back | `FlashcardRenderer` | Everything else |
| 🔗 Related Topic | `related_topic` | Topic Card, Why Related, Key Facts, Suggested Follow-up | `RelatedTopicRenderer` | Everything else |

## Architecture

### Dispatch Chain
```
ActionChip tap
  → MODE_MAP[action] → ResponseMode
  → sendMessage(prompt, mode)
    → getAIResponse(text, history, mode)
      → ask-ai edge function (mode-aware system prompt)
      → returns { reply, responseMode }
    → { role: 'ai', text: reply, responseMode: mode }
  → ResponseModeRenderer({ mode: msg.responseMode, text: msg.text })
    → switch(mode):
        'tutor'              → AnswerRenderer (existing)
        'mcq'                → MCQRenderer
        'simple_explanation' → SimpleExplanationRenderer
        'pyq'                → PYQRenderer
        'flashcard'          → FlashcardRenderer
        'related_topic'      → RelatedTopicRenderer
```

### Data Flow
```
[Client]                      [Server]
user taps chip                ask-ai receives
  → mode='mcq'                  → responseMode='mcq'
  → prompt=prompts[action]      → picks modeInstructions['mcq']
  → mode sent in body           → returns { reply, responseMode }

AI response stored with responseMode on ChatMessage
  → rendered via ResponseModeRenderer{mode, text}
```

## Files Changed

| File | Change |
|------|--------|
| `src/services/chatService.ts` | Added `ResponseMode` type, extended `ChatMessage` with optional `responseMode`, added `logRenderer()` |
| `src/components/renderers/ResponseModeRenderer.tsx` | **NEW** — Dispatcher with 6 sub-renderers: TutorRenderer, MCQRenderer, SimpleExplanationRenderer, PYQRenderer, FlashcardRenderer, RelatedTopicRenderer |
| `src/screens/AITutorScreen.tsx` | Updated `sendMessage` to accept `ResponseMode` param; tagged AI messages with `responseMode`; used `ResponseModeRenderer` instead of `AnswerRenderer`; added `MODE_MAP` to action chips |
| `src/screens/ChatbotScreen.tsx` | Same as AITutorScreen — `handleSend` accepts mode, messages tagged, `ResponseModeRenderer` used |
| `supabase/functions/ask-ai/index.ts` | Accepts `responseMode` in body; added `modeInstructions` map with section formats per mode; returns `responseMode` in response |
| `src/components/AnswerRenderer.tsx` | Exported `extractSections()` and `Section` interface for use by mode renderers |

## Renderer Details

### MCQRenderer
- Parses: `## Question`, `## Options`, `## Answer`, `## Explanation`
- Renders: question text → lettered options → green answer box → italic explanation
- Fallback: renders plain markdown if sections missing

### SimpleExplanationRenderer
- Parses: `## Simple Explanation`, `## Example`, `## Quick Summary`
- Renders: blue card for explanation → purple card with example → amber card for summary
- Fallback: plain markdown

### PYQRenderer
- Parses: `## Previous Year Questions`, `## Exam`, `## Year`, `## Answer`, `## Explanation`
- Renders: red-bordered PYQ card → side-by-side Exam/Year badges → green answer → gray explanation
- Subheadings (`### Exam`) handled as separate sections
- Fallback: plain markdown

### FlashcardRenderer
- Parses: `## Front`, `## Back`
- Renders: indigo-bordered Front card → lavender Back card with subtle shadow
- Fallback: plain markdown

### RelatedTopicRenderer
- Parses: `## Topic Card`, `## Why Related`, `## Key Facts`, `## Suggested Follow-up`
- Renders: cyan topic card → purple why-related → amber key facts with ✦ bullets → green follow-up card
- Fallback: plain markdown

## Logging

Every renderer call logs to console in dev mode:

```
[Renderer] AITutor sendMessage mode=mcq
[Renderer] MCQRenderer
[Renderer] Chatbot handleSend mode=flashcard
[Renderer] FlashcardRenderer
[Renderer] TutorRenderer
```

Controlled by `logRenderer(rendererName: string)` in `chatService.ts` (gated behind `__DEV__`).

## Verification

| Scenario | Expected Renderer | Verified |
|---|---|---|
| User types "what is federalism" | `TutorRenderer` → section cards | ✅ |
| User taps Generate MCQ | `MCQRenderer` → question + options + answer | ✅ |
| User taps Explain Simpler | `SimpleExplanationRenderer` → 3 sections | ✅ |
| User taps Give PYQs | `PYQRenderer` → question/exam/year/answer | ✅ |
| User taps Create Flashcard | `FlashcardRenderer` → Front + Back cards | ✅ |
| User taps Related Topic | `RelatedTopicRenderer` → 4 sections | ✅ |
| AI returns plain text (no sections) | Falls back to `MarkdownRenderer` | ✅ |
| Network error | Returned as tutor mode, renders plain text | ✅ |

## Prompt Changes

TUTOR mode (unchanged from previous):
```
## Concept, ## PSC Exam Focus, ## Memory Trick, ## Key Facts, ## Common Confusions, ## Practice MCQ, ## Related Topics
```

MCQ mode:
```
## Question, ## Options (A/B/C/D), ## Answer, ## Explanation
No other sections.
```

SIMPLE_EXPLANATION mode:
```
## Simple Explanation, ## Example, ## Quick Summary
```

PYQ mode:
```
## Previous Year Questions, ### Exam, ### Year, ### Answer, ### Explanation
```

FLASHCARD mode:
```
## Front, ## Back
```

RELATED_TOPIC mode:
```
## Topic Card, ## Why Related, ## Key Facts, ## Suggested Follow-up
```

## Testing

1. Open AI Tutor or Chatbot
2. Type any question → verify TUTOR rendering with section cards
3. Tap each action chip and verify:
   - Correct renderer (no Concept/Key Facts in MCQ, etc.)
   - Console log shows correct renderer name
   - AI response matches the expected section format
4. Verify graceful fallback: simulate network failure → message appears in TUTOR mode
