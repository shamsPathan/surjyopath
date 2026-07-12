import { create } from "zustand";
import type { Goal, GoalInput, GoalStep } from "../types/goal";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";
import * as api from "../api/client";
import { processGoal as processGoalService } from "../services/aiService";

interface GoalState {
  goals: Goal[];
  loading: boolean;

  /* Init */
  initialize: (authenticated: boolean) => Promise<void>;

  /* CRUD */
  addGoal: (input: GoalInput) => Promise<void>;
  updateGoal: (id: string, partial: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  /* Step management */
  toggleStep: (goalId: string, stepId: string) => Promise<void>;

  /* AI enrichment */
  processGoalWithAI: (goalId: string) => Promise<void>;
}

let _counter = 0;
function nextId() {
  return String(++_counter);
}

/**
 * Persist current goals to guest storage when the user is not authenticated.
 */
function persistIfGuest(goals: Goal[]) {
  if (!useAuthStore.getState().isAuthenticated) {
    guestStorage.setGuestGoals(goals);
  }
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,

  initialize: async (authenticated: boolean) => {
    if (authenticated) {
      const user = useAuthStore.getState().user;
      if (user) {
        try {
          const goals = await api.getGoals(user.id);
          // Seed welcome goals for a brand-new user with no goals yet
          if (goals.length === 0) {
            try {
              await api.createGoal(
                user.id,
                "Build a consistent writing practice",
                "Problem: I write in bursts — inspired one week, silent the next. Ideas feel scattered across notes apps, voice memos, and forgotten notebooks. I never return to refine them, so nothing grows.\n\nSolution: A 15-minute morning pages ritual every day before checking email or social media. Write stream-of-consciousness — no editing, no judgment. On Sunday evenings, review the week's pages and extract one seed worth developing. The goal isn't volume; it's momentum. After 30 days, I'll have a backlog of raw material to shape into essays, publications, or talks.",
                { emoji: "✍️", direction: "growth" },
              );
              await api.createGoal(
                user.id,
                "Develop systems thinking for everyday decisions",
                "Problem: I solve problems reactively — putting out fires instead of understanding root causes. I read a lot but can't connect the dots between domains. When things break, I treat symptoms, not the structure.\n\nSolution: Each week I'll analyse one recurring frustration in my life (work, habits, relationships) using a systems lens — map the feedback loops, identify the leverage points, document the mental models at play. Use mind maps to connect insights across weeks. After 12 weeks, I'll build a personal 'systems playbook' of the patterns I see most often. This turns scattered lessons into a reusable framework for better decisions.",
                { emoji: "🧠", direction: "growth" },
              );
              const seeded = await api.getGoals(user.id);
              set({ goals: seeded });
              return;
            } catch (seedErr) {
              console.warn("Failed to seed goals:", seedErr);
            }
          } else {
            set({ goals });
            return;
          }
        } catch (err) {
          console.error("Failed to fetch goals:", err);
        }
      }
      set({ goals: [] });
      return;
    }

    // Guest: load from localStorage
    const stored = guestStorage.getGuestGoals();
    set({ goals: stored });
  },

  addGoal: async (input) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated && auth.user) {
      const goal = await api.createGoal(
        auth.user.id,
        input.title,
        input.description,
        {
          emoji: "🎯",
          direction: input.direction ?? null,
        },
      );
      set({ goals: [goal, ...get().goals] });
      return;
    }

    // Guest: create locally
    const now = new Date().toISOString();
    const goal: Goal = {
      id: nextId(),
      title: input.title,
      description: input.description,
      target_date: input.target_date,
      emoji: "🎯",
      direction: input.direction ?? null,
      thought_id: null,
      steps: [],
      progress: 0,
      status: "active",
      is_new: true,
      course: null,
      aiCourseStatus: "idle",
      last_touched_step_at: null,
      user_id: "guest",
      created_at: now,
      updated_at: now,
      completed_at: null,
      processed_at: null,
    };
    const goals = [goal, ...get().goals];
    set({ goals });
    persistIfGuest(goals);
  },

  updateGoal: async (id, partial) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      // Only pass fields that the API accepts
      const apiUpdates: Record<string, unknown> = {};
      if (partial.title !== undefined) apiUpdates.title = partial.title;
      if (partial.description !== undefined) apiUpdates.description = partial.description;
      if (partial.status !== undefined) apiUpdates.status = partial.status;
      if (partial.progress !== undefined) apiUpdates.progress = partial.progress;
      if (partial.emoji !== undefined) apiUpdates.emoji = partial.emoji;
      if (partial.direction !== undefined) apiUpdates.direction = partial.direction;
      if (partial.last_touched_step_at !== undefined)
        apiUpdates.last_touched_step_at = partial.last_touched_step_at;
      if (partial.steps !== undefined) apiUpdates.steps = partial.steps;
      if (partial.course !== undefined) apiUpdates.course = partial.course;
      if (partial.aiCourseStatus !== undefined) apiUpdates.aiCourseStatus = partial.aiCourseStatus;
      if (partial.completed_at !== undefined) apiUpdates.completed_at = partial.completed_at;
      if (partial.processed_at !== undefined) apiUpdates.processed_at = partial.processed_at;

      if (Object.keys(apiUpdates).length > 0) {
        try {
          await api.updateGoal(id, apiUpdates as any);
        } catch (err) {
          console.warn("Failed to update goal in Supabase:", err);
        }
      }
    }

    // Always update local state
    const goals = get().goals.map((g) =>
      g.id === id
        ? { ...g, ...partial, updated_at: new Date().toISOString() }
        : g,
    );
    set({ goals });
    persistIfGuest(goals);
  },

  deleteGoal: async (id) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      await api.deleteGoal(id);
    }

    const goals = get().goals.filter((g) => g.id !== id);
    set({ goals });
    persistIfGuest(goals);
  },

  toggleStep: async (goalId, stepId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    const steps: GoalStep[] = goal.steps.map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s,
    );
    const completedCount = steps.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const completed = progress === 100;
    const last_touched_step_at = new Date().toISOString();

    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        await api.updateGoal(goalId, {
          steps: JSON.stringify(steps),
          progress,
          status: completed ? "completed" : goal.status,
          last_touched_step_at,
        } as any);
      } catch (err) {
        console.warn("Failed to persist step toggle:", err);
      }
    }

    const goals = get().goals.map((g) =>
      g.id === goalId
        ? {
            ...g,
            steps,
            progress,
            status: completed ? ("completed" as const) : g.status,
            last_touched_step_at,
            updated_at: new Date().toISOString(),
          }
        : g,
    );
    set({ goals });
    persistIfGuest(goals);
  },

  processGoalWithAI: async (goalId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    set({ loading: true });

    try {
      // Mark as generating
      const goals = get().goals.map((g) =>
        g.id === goalId ? { ...g, aiCourseStatus: "generating" as const } : g,
      );
      set({ goals });

      const result = await processGoalService(
        goalId,
        goal.title,
        goal.description,
        goal.direction,
      );

      if (result.success && result.data) {
        const { modules } = result.data;

        // Build steps from the course modules
        const steps: GoalStep[] = modules.flatMap((mod, mi) => [
          {
            id: `step-${mi + 1}`,
            title: `Module: ${mod.title}`,
            description: mod.description,
            completed: false,
            order: mi + 1,
          },
        ]);

        const updated = get().goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                course: modules,
                aiCourseStatus: "ready" as const,
                steps,
                progress: 0,
                processed_at: new Date().toISOString(),
              }
            : g,
        );
        set({ goals: updated });

        // Persist to Supabase if authenticated
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            await api.updateGoal(goalId, {
              course: JSON.stringify(modules),
              ai_course_status: "ready",
              steps: JSON.stringify(steps),
              progress: 0,
              processed_at: new Date().toISOString(),
            } as any);
          } catch (err) {
            console.warn("Failed to persist AI course:", err);
          }
        }

        persistIfGuest(updated);
      } else {
        // Mark as failed
        const failed = get().goals.map((g) =>
          g.id === goalId ? { ...g, aiCourseStatus: "failed" as const } : g,
        );
        set({ goals: failed });
        persistIfGuest(failed);
      }
    } finally {
      set({ loading: false });
    }
  },
}));