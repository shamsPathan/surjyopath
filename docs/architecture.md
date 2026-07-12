---
layout: default
title: Architecture — SurjyoPath
---

# 🏗️ Architecture

How SurjyoPath is built and how the pieces fit together.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React 19)                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │  Zustand  │  │  React    │  │  Tailwind │              │
│  │  Stores   │  │  Router   │  │  CSS v4   │              │
│  └─────┬─────┘  └─────┬─────┘  └───────────┘              │
│        │               │                                   │
│  ┌─────┴───────────────┴──────────────────────────────┐    │
│  │                 Page Components                     │    │
│  │  Galaxy · Journal · Goals · Library · Publications  │    │
│  │  Friends · Profile · Auth                          │    │
│  └───────────────────────┬────────────────────────────┘    │
│                          │                                  │
│  ┌───────────────────────┴────────────────────────────┐    │
│  │              Service Layer (aiService.ts)           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  Knock   │  │  Pathway │  │  Polish  │         │    │
│  │  │  Engine  │  │  Engine  │  │  Engine  │         │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  └───────┼──────────────┼─────────────┼───────────────┘    │
│          │              │             │                      │
│  ┌───────┴──────────────┴─────────────┴───────────────┐    │
│  │              Provider Chain                        │    │
│  │  1. Supabase Edge Function (knock-ai)              │    │
│  │  2. Browser-based Mock AI (fallback)               │    │
│  └───────────────────────┬────────────────────────────┘    │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Supabase   │
                    │  ─────────  │
                    │  • Postgres │
                    │  • Auth     │
                    │  • Edge Fn  │
                    │  • Realtime │
                    └─────────────┘
```

---

## Directory Structure

```
src/
├── api/                    # API client & types
│   ├── client.ts           # HTTP client with smart fallback
│   └── types.ts            # API response types
│
├── components/             # Shared UI components
│   ├── GoalCard.tsx        # Goal summary card
│   ├── GoalCourseSection.tsx # Course structure display
│   ├── ThoughtCard.tsx     # Journal entry card
│   ├── PublicationCard.tsx # Publication preview
│   ├── CommentSection.tsx  # Social comments
│   ├── TopicTestQuiz.tsx   # Assessment quiz
│   ├── ThemeToggle.tsx     # Dark/light mode
│   ├── Layout.tsx          # App shell
│   ├── Sidebar.tsx         # Navigation
│   ├── FloatReader.tsx     # Reading mode
│   └── ProcessingIndicator.tsx # AI state indicator
│
├── lib/                    # Core libraries
│   ├── config.ts           # App configuration
│   ├── supabase.ts         # Supabase client singleton
│   ├── mockAI.ts           # Browser-based AI fallback
│   ├── rateLimiter.ts      # Rate limiting logic
│   ├── guestStorage.ts     # Guest/local storage
│   └── database.types.ts   # Generated DB types
│
├── pages/                  # Route-level pages
│   ├── GalaxyPage.tsx      # Home — solar system
│   ├── JournalPage.tsx     # Journal with AI
│   ├── GoalsPage.tsx       # Goals dashboard
│   ├── GoalDetailPage.tsx  # Single goal view
│   ├── LibraryPage.tsx     # Digital library
│   ├── PublicationsPage.tsx # Community publications
│   ├── ArticleView.tsx     # Public article reader
│   ├── FriendsPage.tsx     # Social connections
│   ├── FriendProfilePage.tsx # Friend's profile
│   ├── ProfilePage.tsx     # Personal profile
│   ├── HomePage.tsx        # Alternative home
│   └── AuthPage.tsx        # Login/Signup
│
├── services/
│   └── aiService.ts        # Unified AI service layer
│
├── store/                  # Zustand state stores
│   ├── useAuthStore.ts     # Authentication
│   ├── useThemeStore.ts    # Theme state
│   ├── useJournalStore.ts  # Journal entries
│   ├── useGoalStore.ts     # Goals & courses
│   ├── useLibraryStore.ts  # Library
│   ├── usePublicationStore.ts # Publications
│   ├── useFriendStore.ts   # Friends
│   └── useMessageStore.ts  # Messaging
│
├── types/                  # TypeScript definitions
│   ├── thought.ts          # Thought types
│   ├── goal.ts             # Goal types
│   ├── publication.ts      # Publication types
│   └── supabase.ts         # Supabase types
│
├── utils/
│   └── categorizer.ts     # Thought categorization
│
├── App.tsx                 # Root with routing
├── main.tsx                # Entry point
└── index.css               # Tailwind + design tokens
```

---

## State Management (Zustand)

Each domain has its own Zustand store. Stores are independent and communicate through the app layer.

```typescript
// Example: useAuthStore
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

### Store List

| Store | Manages | Persistence |
|-------|---------|-------------|
| `useAuthStore` | User session, auth state | Supabase session |
| `useThemeStore` | Dark/light mode | localStorage |
| `useJournalStore` | Thoughts/entries | Supabase + local |
| `useGoalStore` | Goals & courses | Supabase + local |
| `useLibraryStore` | Library items | Supabase + local |
| `usePublicationStore` | Publications | Supabase + local |
| `useFriendStore` | Friends list | Supabase + local |
| `useMessageStore` | Messages | Supabase |

---

## Routing (React Router v7)

```typescript
<Routes>
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/publications/:id" element={<ArticleView />} />

  <Route element={<AppLayout />}>
    <Route path="/" element={<GalaxyPage />} />
    <Route path="/journal" element={<JournalPage />} />
    <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
    <Route path="/goals/:id" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
    <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
    <Route path="/publications" element={<PublicationsPage />} />
    <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
  </Route>
</Routes>
```

Public routes (Galaxy, Journal, Publications) are accessible to everyone. Protected routes require authentication and redirect to `/auth` if unauthenticated.

---

## Design System (Tailwind CSS v4)

SurjyoPath uses **Tailwind CSS v4** with CSS custom properties for dynamic theming.

### Color Tokens

```css
--color-bg:             /* Background */
--color-surface:        /* Card/surface backgrounds */
--color-foreground:     /* Primary text */
--color-muted:          /* Secondary/muted text */
--color-primary:        /* Primary actions (golden amber) */
--color-secondary:      /* Secondary elements */
--color-accent:         /* Accent elements (violet) */
--color-border:         /* Borders and dividers */
--color-destructive:    /* Destructive actions */
```

### Typography

| Role | Font |
|------|------|
| UI Text | Inter |
| Headings | Space Grotesk |
| Reading | Crimson Pro (serif) |

Both **dark** and **light** modes are fully themed using OKLCH color space for perceptual uniformity.

---

## Data Flow

```
User Action
    │
    ▼
Page Component
    │
    ├──► Zustand Store (optimistic update)
    │
    ├──► Service Layer (aiService.ts)
    │       │
    │       ├──► Supabase Edge Function (primary)
    │       │
    │       └──► Mock AI (fallback)
    │
    └──► UI Re-render (reactive)
```

---

- [Back to Documentation Home](index.md)
- [Next: AI Engines](ai-engines.md)