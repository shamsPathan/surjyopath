---
layout: default
title: AI Engines — SurjyoPath
---

# 🤖 AI Engines

SurjyoPath features **three specialized AI engines**, each designed for a distinct purpose. Together, they form an intelligent companion that *augments* your thinking rather than replacing it.

```
                    ┌──────────────────────┐
                    │   ☀️  SurjyoPath      │
                    │   (You — The Center)  │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  KNOCK       │  │  PATHWAY     │  │  POLISH      │
    │  Engine      │  │  Engine      │  │  Engine      │
    ├──────────────┤  ├──────────────┤  ├──────────────┤
    │ Journal      │  │ Goals        │  │ Publications │
    │ Analysis     │  │ Curriculum   │  │ Refinement   │
    │ Patterns     │  │ Generation   │  │ Voice        │
    │ Blind Spots  │  │ Milestones   │  │ Preservation │
    │ Reflection   │  │ Assessments  │  │ Clarity      │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔨 Knock Engine

The **Knock Engine** analyzes journal entries to uncover hidden meaning.

### What it does

When you write a journal entry and "knock" on it, the engine returns:

| Output | Description |
|--------|-------------|
| **Hidden Patterns** | Recurring themes, emotional arcs, and behavioral patterns |
| **Reflective Questions** | Questions designed to deepen your self-understanding |
| **Cognitive Blind Spots** | Perspectives or angles you may be overlooking |
| **Learning Opportunities** | Suggested areas for growth and exploration |

### How it's called

```typescript
// From aiService.ts — the unified service layer
const result = await knockThought(thought);
// Returns: { success, data: ThoughtAnalysis, source: "edge-function" | "mock" }
```

### Provider Chain

1. **Supabase Edge Function** (`knock-ai`) — powered by Fireworks AI + MiniMax M2.7
2. **Browser-based Mock AI** — graceful fallback when the edge function is unavailable

---

## 🧭 Pathway Engine

The **Pathway Engine** transforms ambitions into structured learning journeys.

### What it does

When you define a goal, Pathway generates:

| Output | Description |
|--------|-------------|
| **Course Structure** | A multi-module curriculum with logical progression |
| **Chapters** | Individual lessons within each module |
| **Milestones** | Checkpoints to track progress |
| **Tags** | Related topics and skills |
| **Assessments** | Optional quizzes to reinforce learning |

### How it's called

```typescript
const result = await processGoal(goalId, title, description, direction);
// Returns: { success, data: GoalCourseResponse, source: "edge-function" | "mock" }
```

### Caching

Course results are cached to avoid redundant generation. When a cached result is returned, the response includes `fromCache: true`.

---

## ✨ Polish Engine

The **Polish Engine** refines drafts into publication-ready content while preserving the author's unique voice.

### What it does

When you polish a draft, the engine returns:

| Output | Description |
|--------|-------------|
| **Polished Version** | Improved clarity, grammar, and flow — without rewriting your voice |
| **Summary** | A concise overview of your article |
| **Improvements** | Specific suggestions: word choices, structural changes, clarity fixes |

### How it's called

```typescript
const result = await knockPolish(content, title);
// Returns: { success, data: { polished, summary, improvements } }
```

---

## 🧬 Technical Architecture

### Service Layer (`src/services/aiService.ts`)

All three engines share a common service layer that provides:

- **Unified interface** — consistent API across all engines
- **Provider chaining** — tries edge function first, falls back to mock
- **Rate limiting** — fair usage enforcement (configurable delays)
- **Processing state** — observable state for UI feedback
- **Timeout handling** — 30-second timeout on edge function calls
- **Error handling** — graceful degradation on failure

### AI Provider

```
┌──────────────────────────────────────────────┐
│              aiService.ts                     │
│                                              │
│  knockThought(thought) ──────┐              │
│  processGoal(goal) ──────────┤              │
│  knockPolish(draft) ─────────┼──► Provider  │
│                              │    Chain     │
│  onProcessingChange(listener)│       │       │
│  getProcessingState()        │       │       │
└──────────────────────────────┘       │       │
                                       │       │
                         ┌─────────────▼───────┴──────┐
                         │  Step 1: Edge Function     │
                         │  POST supabase/functions/  │
                         │  invoke("knock-ai")        │
                         │  ───────────────────────   │
                         │  Timeout: 30s              │
                         └─────────────┬──────────────┘
                                       │
                         ┌─────────────▼──────────────┐
                         │  Step 2: Mock AI Fallback  │
                         │  Browser-based analysis    │
                         │  (always available)        │
                         └────────────────────────────┘
```

### Edge Function (`supabase/functions/knock-ai/index.ts`)

The Deno-based edge function:

1. Receives the request with type (`thought`, `goal`, or `polish`) and content
2. Routes to the appropriate handler
3. Calls Fireworks AI with the MiniMax M2.7 model
4. Returns structured results matching the expected response format

### Rate Limiting

| Action | Limit |
|--------|-------|
| Thought analysis | 20 knocks per day per user |
| Goal processing | 5-second minimum interval |
| Polish requests | Same pool as thought analysis |

---

## 🧪 Processing State

The service layer exposes observable processing state for UI feedback:

```typescript
interface ProcessingState {
  isProcessing: boolean;
  currentType: "thought" | "goal" | "polish" | null;
  progress: number;       // 0–100
  message: string;        // Human-readable status
}
```

Components like `ProcessingIndicator` subscribe to state changes via `onProcessingChange()`.

---

## 🔌 Provider Comparison

| Aspect | Edge Function (Primary) | Mock AI (Fallback) |
|--------|------------------------|-------------------|
| **Location** | Supabase cloud | Browser (JavaScript) |
| **Model** | MiniMax M2.7 via Fireworks AI | Deterministic pattern matching |
| **Latency** | ~1-5 seconds | Instant |
| **Quality** | High — real LLM analysis | Moderate — rule-based |
| **Availability** | Requires Supabase + API key | Always available |
| **Rate limit** | 20/day | Unlimited |

---

- [Back to Documentation Home](index.md)
- [Next: API Reference](api-reference.md)