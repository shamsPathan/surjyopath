import { create } from "zustand";
import type { Thought } from "../types/thought";
import { mockThoughts } from "../data/mockThoughts";
import { knockThought as knockThoughtService } from "../services/aiService";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";

interface JournalState {
  thoughts: Thought[];
  editingThoughtId: string | null;
  knockingThoughtId: string | null;

  /* Init */
  initialize: (authenticated: boolean) => void;

  /* Edit actions */
  setEditingThought: (id: string | null) => void;
  updateThought: (id: string, partial: Partial<Thought>) => void;
  cancelEditing: () => void;

  /* CRUD */
  addThought: (
    input: Omit<Thought, "id" | "created_at" | "updated_at">,
  ) => void;
  deleteThought: (id: string) => void;

  /* AI */
  knockThought: (id: string) => Promise<void>;

  /* Publish */
  publishThought: (id: string) => void;
}

let _counter = 10000;
function nextId() {
  return String(++_counter);
}

/**
 * Persist current thoughts to guest storage when the user is not authenticated.
 */
function persistIfGuest(thoughts: Thought[]) {
  if (!useAuthStore.getState().isAuthenticated) {
    guestStorage.setGuestThoughts(thoughts);
  }
}

export const useJournalStore = create<JournalState>((set, get) => ({
  thoughts: mockThoughts,
  editingThoughtId: null,
  knockingThoughtId: null,

  initialize: (authenticated: boolean) => {
    if (!authenticated) {
      const stored = guestStorage.getGuestThoughts();
      if (stored.length > 0) {
        set({ thoughts: stored });
      } else {
        // Seed with a couple of example thoughts for new guests
        const now = new Date().toISOString();
        const examples: Thought[] = [
          {
            id: "guest-1",
            title: "Welcome to Vital Vault",
            content:
              "This is your private space. Write freely — thoughts, ideas, reflections. When you're ready, tap 'Knock AI' to get insights.",
            tags: ["welcome", "reflection"],
            user_id: "guest",
            status: "pending",
            analysis: null,
            ai_feedback: null,
            goal_id: null,
            is_published: false,
            publication_id: null,
            is_new: false,
            processed_at: null,
            created_at: now,
            updated_at: now,
          },
          {
            id: "guest-2",
            title: "Try editing this",
            content:
              "Click the edit icon to change this thought. After saving, the 'Knock AI' button will appear. Give it a tap!",
            tags: ["guide"],
            user_id: "guest",
            status: "pending",
            analysis: null,
            ai_feedback: null,
            goal_id: null,
            is_published: false,
            publication_id: null,
            is_new: false,
            processed_at: null,
            created_at: now,
            updated_at: now,
          },
        ];
        guestStorage.setGuestThoughts(examples);
        set({ thoughts: examples });
      }
    } else {
      // Authenticated: start with mock data
      set({ thoughts: mockThoughts });
    }
  },

  setEditingThought: (id) => set({ editingThoughtId: id }),

  updateThought: (id, partial) => {
    const updated = get().thoughts.map((t) =>
      t.id === id
        ? {
            ...t,
            ...partial,
            updated_at: new Date().toISOString(),
            /* If user edits title or content, reset AI analysis so Knock AI button reappears */
            ...((partial.content !== undefined || partial.title !== undefined)
              ? { analysis: null, status: "pending" as const }
              : {}),
          }
        : t,
    );
    set({ thoughts: updated });
    persistIfGuest(updated);
  },

  cancelEditing: () => set({ editingThoughtId: null }),

  addThought: (input) => {
    const now = new Date().toISOString();
    const thought: Thought = {
      ...input,
      id: nextId(),
      created_at: now,
      updated_at: now,
      user_id: input.user_id || "guest",
      status: "pending",
      analysis: null,
      ai_feedback: null,
      goal_id: null,
      is_published: false,
      publication_id: null,
      is_new: false,
      processed_at: null,
    };
    const thoughts = [thought, ...get().thoughts];
    set({ thoughts });
    persistIfGuest(thoughts);
  },

  deleteThought: (id) => {
    const thoughts = get().thoughts.filter((t) => t.id !== id);
    set({ thoughts });
    persistIfGuest(thoughts);
  },

  knockThought: async (id) => {
    const thought = get().thoughts.find((t) => t.id === id);
    if (!thought) return;

    set({ knockingThoughtId: id });

    try {
      const result = await knockThoughtService(thought);
      if (result.success && result.data) {
        const thoughts = get().thoughts.map((t) =>
          t.id === id
            ? {
                ...t,
                analysis: result.data!,
                status: "ready" as const,
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : t,
        );
        set({ thoughts });
        persistIfGuest(thoughts);
      } else {
        // If rate-limited or error, still allow retry but surface feedback
        console.warn("Knock AI returned no analysis:", result.error);
      }
    } finally {
      set({ knockingThoughtId: null });
    }
  },

  publishThought: (id) => {
    const thoughts = get().thoughts.map((t) =>
      t.id === id
        ? {
            ...t,
            is_published: true,
            publication_id: `pub-${id}`,
            updated_at: new Date().toISOString(),
          }
        : t,
    );
    set({ thoughts });
    persistIfGuest(thoughts);
  },
}));