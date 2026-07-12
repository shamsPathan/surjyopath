---
layout: default
title: API Reference — SurjyoPath
---

# 📖 API Reference

Core APIs, stores, and type definitions used throughout SurjyoPath.

---

## 🎯 AI Service (`src/services/aiService.ts`)

### `knockThought(thought: Thought): Promise<AiServiceResult<ThoughtAnalysis>>`

Analyzes a journal entry for patterns, blind spots, and reflective questions.

```typescript
interface ThoughtAnalysis {
  patterns: string[];       // Hidden patterns detected
  questions: string[];      // Reflective questions
  blindSpots: string[];     // Cognitive blind spots
  learningOpportunities: string[]; // Suggested growth areas
}

interface AiServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fromCache?: boolean;
  source: "edge-function" | "mock";
}
```

### `processGoal(goalId, title, description, direction?): Promise<AiServiceResult<GoalCourseResponse>>`

Generates a structured learning course from a goal.

```typescript
interface GoalCourseResponse {
  goalId: string;
  modules: Array<{
    title: string;
    chapters: Array<{
      title: string;
      content: string;
      duration?: string;
    }>;
  }>;
  tags: string[];
  fromCache?: boolean;
}
```

### `knockPolish(content, title?): Promise<AiServiceResult<{ polished, summary, improvements }>>`

Polishes a draft while preserving the author's voice.

```typescript
// Returns:
{
  polished: string;        // Improved version
  summary: string;         // Article summary
  improvements: string[];  // Specific suggestions
}
```

### `onProcessingChange(listener): () => void`

Subscribe to AI processing state changes. Returns an unsubscribe function.

### `getProcessingState(): ProcessingState`

Get the current AI processing state.

```typescript
interface ProcessingState {
  isProcessing: boolean;
  currentType: "thought" | "goal" | "polish" | null;
  progress: number;
  message: string;
}
```

---

## 🏪 Zustand Stores

### `useAuthStore`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### `useThemeStore`

```typescript
interface ThemeState {
  theme: "dark" | "light";
  toggle: () => void;
  setTheme: (theme: "dark" | "light") => void;
}
```

### `useJournalStore`

```typescript
interface JournalState {
  thoughts: Thought[];
  isLoading: boolean;
  initialize: (isAuthenticated: boolean) => Promise<void>;
  addThought: (thought: Omit<Thought, "id" | "createdAt">) => Promise<void>;
  updateThought: (id: string, updates: Partial<Thought>) => Promise<void>;
  removeThought: (id: string) => Promise<void>;
  getThoughtById: (id: string) => Thought | undefined;
}
```

### `useGoalStore`

```typescript
interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  initialize: (isAuthenticated: boolean) => Promise<void>;
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  getGoalById: (id: string) => Goal | undefined;
}
```

### `useLibraryStore`

```typescript
interface LibraryState {
  items: LibraryItem[];
  isLoading: boolean;
  initialize: (isAuthenticated: boolean) => Promise<void>;
  addItem: (item: Omit<LibraryItem, "id" | "addedAt">) => Promise<void>;
  updateItem: (id: string, updates: Partial<LibraryItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}
```

### `usePublicationStore`

```typescript
interface PublicationState {
  publications: Publication[];
  isLoading: boolean;
  initialize: (isAuthenticated: boolean) => Promise<void>;
  addPublication: (pub: Omit<Publication, "id" | "createdAt">) => Promise<void>;
  updatePublication: (id: string, updates: Partial<Publication>) => Promise<void>;
  removePublication: (id: string) => Promise<void>;
}
```

### `useFriendStore`

```typescript
interface FriendState {
  friends: Friend[];
  isLoading: boolean;
  initialize: (isAuthenticated: boolean) => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  getFriendById: (id: string) => Friend | undefined;
}
```

---

## 🔧 Core Configuration (`src/lib/config.ts`)

```typescript
const CONFIG = {
  supabase: {
    url: "https://your-project.supabase.co",
    anonKey: "your-anon-key",
  },
  app: {
    name: "SurjyoPath",
    tagline: "The Sun's Way",
    version: "1.0.0",
  },
  knock: {
    rateLimitDelay: 5000,        // 5 seconds between manual knocks
    goalBatchInterval: 300000,   // 5 minutes for goal batch processing
    maxThoughtKnocksPerDay: 20,  // Daily limit
  },
};
```

---

## 🗄️ Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);
```

---

## 🧪 Mock AI (`src/lib/mockAI.ts`)

Browser-based fallback that provides deterministic analysis when the edge function is unavailable. Useful for development and offline scenarios.

```typescript
export async function runMockAI(thought: Thought): Promise<ThoughtAnalysis>
```

---

## 🛡️ Rate Limiter (`src/lib/rateLimiter.ts`)

```typescript
export function canKnock(type: "thought" | "goal"): string | null;
// Returns null if allowed, error message if blocked

export function recordKnock(type: "thought" | "goal"): void;
// Records a knock attempt
```

---

- [Back to Documentation Home](index.md)
- [Next: Deployment](deployment.md)