import { create } from "zustand";
import type { Thought } from "../types/thought";
import { mockThoughts } from "../data/mockThoughts";
import { knockThought as knockThoughtService } from "../services/aiService";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";
import * as api from "../api/client";

interface JournalState {
  thoughts: Thought[];
  editingThoughtId: string | null;
  knockingThoughtId: string | null;

  /* Init */
  initialize: (authenticated: boolean) => Promise<void>;

  /* Edit actions */
  setEditingThought: (id: string | null) => void;
  updateThought: (id: string, partial: Partial<Thought>) => Promise<void>;
  cancelEditing: () => void;

  /* CRUD */
  addThought: (
    input: Omit<Thought, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  deleteThought: (id: string) => Promise<void>;

  /* AI */
  knockThought: (id: string) => Promise<void>;

  /* Publish */
  publishThought: (id: string) => Promise<void>;

  /* Guest sync */
  _syncGuestToServer: () => Promise<void>;
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
  thoughts: [],
  editingThoughtId: null,
  knockingThoughtId: null,

  initialize: async (authenticated: boolean) => {
    if (authenticated) {
      const user = useAuthStore.getState().user;
      if (user) {
        try {
          const thoughts = await api.getThoughts(user.id);
          // Seed welcome thoughts for a brand-new user with no thoughts yet
          if (thoughts.length === 0) {
            try {
              await api.createThought(
                user.id,
                "The quiet discipline of showing up\n\nSome days the page stays blank for ten minutes. I stare at the cursor blinking — patient, unbothered by my hesitation. On those mornings I've learned to start anywhere: the colour of the light through the window, the sound of rain against the roof, a memory from three years ago that suddenly demands attention.\n\nThe act of showing up is the victory. Not brilliance, not insight — just the willingness to sit with whatever arrives. Writing has taught me that the voice you find on the page is rarely the one you expected. It's deeper, older, less in a hurry.\n\nI want to remember this when I'm chasing productivity hacks and optimisation. The answer is simpler: keep showing up.\n\nTags: writing, discipline, reflection",
              );
              await api.createThought(
                user.id,
                "Learning in public is terrifying and necessary\n\nI published my first rough idea yesterday — not polished, not perfect, just honest. Within hours someone reframed the entire problem in a way I'd never considered. My half-baked thought became the seed of something bigger because I was willing to share it before it was ready.\n\nThe fear of being wrong keeps most of us silent. But silence doesn't refine ideas; conversation does. Every email I almost didn't send, every post I almost deleted, has taught me more than the safe ones I kept to myself.\n\nA commitment: one raw thought published every week, no matter how unformed. Let the community help me bake it.\n\nTags: learning, vulnerability, growth",
              );
              await api.createThought(
                user.id,
                "Morning clarity\n\nWoke up early today and sat with my coffee watching the sunrise. There's something profoundly grounding about the quiet hours before the world wakes up. I should do this more often — it sets a calm tone for the whole day ahead.\n\nTags: mindfulness, routine, wellness",
              );
              await api.createThought(
                user.id,
                "Struggling with patience\n\nHad a frustrating moment at work today where I snapped at a colleague. Not proud of it. Need to remember that everyone is moving at their own pace. Taking a deep breath before responding is a skill I need to practise daily.\n\nTags: emotions, growth, work",
              );
              const seeded = await api.getThoughts(user.id);
              set({ thoughts: seeded });
              return;
            } catch (seedErr) {
              console.warn("Failed to seed thoughts:", seedErr);
            }
          } else {
            set({ thoughts });
            return;
          }
        } catch (err) {
          console.error("Failed to fetch thoughts:", err);
        }
      }
      // fall through to empty if fetch fails
      set({ thoughts: [] });
      return;
    }

    // Guest: load from localStorage or seed examples
    const stored = guestStorage.getGuestThoughts();
    if (stored.length > 0) {
      set({ thoughts: stored });
    } else {
      const now = new Date().toISOString();
      const examples: Thought[] = [
        {
          id: "guest-1",
          title: "The quiet discipline of showing up",
          content:
            "Some days the page stays blank for ten minutes. I stare at the cursor blinking — patient, unbothered by my hesitation. On those mornings I've learned to start anywhere: the colour of the light through the window, the sound of rain against the roof, a memory from three years ago that suddenly demands attention.\n\nThe act of showing up is the victory. Not brilliance, not insight — just the willingness to sit with whatever arrives. Writing has taught me that the voice you find on the page is rarely the one you expected. It's deeper, older, less in a hurry.\n\nI want to remember this when I'm chasing productivity hacks and optimisation. The answer is simpler: keep showing up.\n\nTags: writing, discipline, reflection",
          tags: ["writing", "discipline", "reflection"],
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
          title: "Learning in public is terrifying and necessary",
          content:
            "I published my first rough idea yesterday — not polished, not perfect, just honest. Within hours someone reframed the entire problem in a way I'd never considered. My half-baked thought became the seed of something bigger because I was willing to share it before it was ready.\n\nThe fear of being wrong keeps most of us silent. But silence doesn't refine ideas; conversation does. Every email I almost didn't send, every post I almost deleted, has taught me more than the safe ones I kept to myself.\n\nA commitment: one raw thought published every week, no matter how unformed. Let the community help me bake it.\n\nTags: learning, vulnerability, growth",
          tags: ["learning", "vulnerability", "growth"],
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
          id: "guest-3",
          title: "Morning clarity",
          content:
            "Woke up early today and sat with my coffee watching the sunrise. There's something profoundly grounding about the quiet hours before the world wakes up. I should do this more often — it sets a calm tone for the whole day ahead.\n\nTags: mindfulness, routine, wellness",
          tags: ["mindfulness", "routine", "wellness"],
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
          id: "guest-4",
          title: "Struggling with patience",
          content:
            "Had a frustrating moment at work today where I snapped at a colleague. Not proud of it. Need to remember that everyone is moving at their own pace. Taking a deep breath before responding is a skill I need to practise daily.\n\nTags: emotions, growth, work",
          tags: ["emotions", "growth", "work"],
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
  },

  setEditingThought: (id) => set({ editingThoughtId: id }),

  updateThought: async (id, partial) => {
    const auth = useAuthStore.getState();
    const isAuthenticated = auth.isAuthenticated;

    if (isAuthenticated) {
      // Sync to Supabase — embed title into content if both are being updated
      const current = get().thoughts.find((t) => t.id === id);
      if (current) {
        const newContent =
          partial.content !== undefined
            ? partial.content
            : partial.title !== undefined
              ? `${partial.title}\n\n${current.content.split("\n\n").slice(1).join("\n\n") || current.content}`
              : current.content;

        const newTitle = partial.title !== undefined ? partial.title : current.title;
        const contentToSave = newContent.startsWith(newTitle)
          ? newContent
          : `${newTitle}\n\n${newContent}`;

        await api.updateThought(id, {
          content: contentToSave,
          ...(partial.status ? { status: partial.status as "pending" | "ready" } : {}),
        });
      }
    }

    // Always update local state
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

  addThought: async (input) => {
    const auth = useAuthStore.getState();
    const isAuthenticated = auth.isAuthenticated;

    if (isAuthenticated && auth.user) {
      // Embed title as first line so thoughtFromDb can extract it
      const contentWithTitle = `${input.title}\n\n${input.content}`;
      const thought = await api.createThought(
        auth.user.id,
        contentWithTitle,
        input.goal_id || undefined,
      );
      set({ thoughts: [thought, ...get().thoughts] });
      return;
    }

    // Guest: create locally
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

  deleteThought: async (id) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      await api.deleteThought(id);
    }

    // Always update local state
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
        const analysisData = result.data;
        const now = new Date().toISOString();

        // For authenticated users, persist the analysis data to Supabase
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            await api.updateThought(id, {
              status: "ready",
              analysis: analysisData,
              processed_at: now,
            });
          } catch (err) {
            console.warn("Failed to persist knock analysis:", err);
          }
        }

        const thoughts = get().thoughts.map((t) =>
          t.id === id
            ? {
                ...t,
                analysis: analysisData,
                status: "ready" as const,
                processed_at: now,
                updated_at: now,
              }
            : t,
        );
        set({ thoughts });
        persistIfGuest(thoughts);
      } else {
        console.warn("Knock AI returned no analysis:", result.error);
      }
    } finally {
      set({ knockingThoughtId: null });
    }
  },

  publishThought: async (id) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        await api.updateThought(id, { is_published: true });
      } catch (err) {
        console.warn("Failed to persist publish status:", err);
      }
    }

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

  _syncGuestToServer: async () => {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || !auth.user) return;

    const guestThoughts = guestStorage.getGuestThoughts();
    if (guestThoughts.length === 0) return;

    // Migrate guest thoughts to Supabase
    for (const thought of guestThoughts) {
      try {
        const contentWithTitle = thought.title
          ? `${thought.title}\n\n${thought.content}`
          : thought.content;
        await api.createThought(auth.user.id, contentWithTitle, thought.goal_id || undefined);
      } catch (err) {
        console.warn("Failed to migrate guest thought:", err);
      }
    }

    // Clear guest thoughts after migration
    guestStorage.setGuestThoughts([]);

    // Re-fetch from Supabase to get canonical state
    try {
      const thoughts = await api.getThoughts(auth.user.id);
      set({ thoughts });
    } catch (err) {
      console.error("Failed to re-fetch thoughts after migration:", err);
    }
  },
}));
