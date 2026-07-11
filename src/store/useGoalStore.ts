import { create } from "zustand";
import type { Goal, GoalCourseModule } from "../types/goal";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";
import { processGoal } from "../services/aiService";

interface GoalState {
  goals: Goal[];
  creating: boolean;

  /* Init */
  initialize: (authenticated: boolean) => void;

  /* CRUD */
  addGoal: (input: Omit<Goal, "id" | "created_at" | "updated_at" | "steps" | "progress">) => void;
  updateGoal: (id: string, partial: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  /* Step tracking */
  toggleStep: (goalId: string, stepIndex: number) => void;

  /* UI */
  setCreating: (v: boolean) => void;

  /* AI course enrichment */
  generateCourse: (goalId: string) => void;
}

let _counter = 20000;
function nextId() {
  return String(++_counter);
}

function persistIfGuest(goals: Goal[]) {
  if (!useAuthStore.getState().isAuthenticated) {
    guestStorage.setGuestGoals(goals);
  }
}

/**
 * Compass-aligned arc templates for each direction.
 * Each step has a poetic title and an actionable description.
 */
interface ArcStep {
  title: string;
  description: (goal: string) => string;
}

const COMPASS_ARCS: Record<string, ArcStep[]> = {
  growth: [
    {
      title: "Assess Your Starting Point",
      description: (g) =>
        `Take 15 minutes to write down everything you already know about "${g}". No judgments — just inventory. What feels solid? What feels foggy?`,
    },
    {
      title: "Build Core Foundation",
      description: (g) =>
        `Identify the single most essential skill or concept for "${g}" and spend a week exploring it. Read one guide, watch one tutorial, take notes by hand.`,
    },
    {
      title: "Practice & Experiment",
      description: (g) =>
        `Create a small, low-stakes project related to "${g}". It doesn't have to be good — it has to be done. Break something, learn why, fix it.`,
    },
    {
      title: "Deepen & Integrate",
      description: (g) =>
        `Connect "${g}" to something else you already know. Write a short reflection: How does this change how you see an old problem? Teach one concept to a friend.`,
    },
    {
      title: "Apply & Teach Others",
      description: (g) =>
        `Use "${g}" in a real context — a conversation, a project, a post. Then explain it to someone who knows nothing about it. If they understand, you've grown.`,
    },
  ],
  creation: [
    {
      title: "Clarify the Vision",
      description: (g) =>
        `Close your eyes and picture "${g}" fully realized. Then write one sentence that captures its essence. What feeling should it evoke? What problem does it solve?`,
    },
    {
      title: "Draft & Prototype",
      description: (g) =>
        `Build the ugliest possible version of "${g}" — paper sketch, rough wireframe, bullet-point outline. The goal is speed, not polish. Get it out of your head.`,
    },
    {
      title: "Build the First Version",
      description: (g) =>
        `Create a functional version of "${g}" that you could show one trusted person. Focus on the core — strip everything that isn't essential.`,
    },
    {
      title: "Refine & Iterate",
      description: (g) =>
        `Gather honest feedback on "${g}" and choose three things to improve. Make them one by one. Let each iteration teach you what the next should be.`,
    },
    {
      title: "Share with the World",
      description: (g) =>
        `Release "${g}" — imperfect, unfinished, yours. Share it with the people it was meant for. The act of sharing completes the creation.`,
    },
  ],
  grounding: [
    {
      title: "Pause & Take Stock",
      description: (g) =>
        `Stop. Breathe. Answer honestly: what drew you to "${g}" ? What part of you feels depleted right now? Write without filtering — this is just for you.`,
    },
    {
      title: "Create Space & Safety",
      description: (g) =>
        `Remove one obligation this week that doesn't serve "${g}". Block 20 minutes a day for stillness — no phone, no goals, just being. Protect this space.`,
    },
    {
      title: "Nurture Daily Rituals",
      description: (g) =>
        `Design one tiny daily practice that supports "${g}" — a morning page, a walk without a destination, three deep breaths before a meeting. Repeat until it's reflex.`,
    },
    {
      title: "Build Strength & Resilience",
      description: (g) =>
        `Challenge yourself gently: do one thing related to "${g}" that feels uncomfortable but safe. Then rest. Then do it again. Strength is built in the return.`,
    },
    {
      title: "Rest & Integrate",
      description: (g) =>
        `Take a full day off from pursuing "${g}". Let the changes settle. Journal: What feels different than when you started? What are you carrying now that you weren't before?`,
    },
  ],
  release: [
    {
      title: "Acknowledge What Is",
      description: (g) =>
        `Write down three specific situations where "${g}" has shaped your choices. No blame, no fixing — just witnessing. Say each one aloud: "This happened. I see it."`,
    },
    {
      title: "Untangle the Old Story",
      description: (g) =>
        `Ask yourself: where did this pattern around "${g}" begin? A voice from childhood? A failure that calcified? Write the story as it was, then ask: "Is this still true?"`,
    },
    {
      title: "Make Space for Grief",
      description: (g) =>
        `Sit with what letting go of "${g}" costs you. Set a timer for 10 minutes and let yourself feel it — disappointment, anger, sadness. Don't fix it. Let it move through you.`,
    },
    {
      title: "Choose What Comes Next",
      description: (g) =>
        `Define one small, concrete action that points toward life after "${g}". Not a grand resolution — just a next step. "Today I will ___ instead."`,
    },
    {
      title: "Step Forward Lighter",
      description: (g) =>
        `Create a symbolic closing — burn the old list, delete the file, rewrite the story. Take the step you defined. Notice: the weight you carried is already lighter.`,
    },
  ],
};

/** Fallback: keyword-sorted generic steps when no direction is chosen. */
function keywordFallbackSteps(title: string, _description: string): string[] {
  const lower = (title + " " + _description).toLowerCase();

  if (lower.includes("javascript") || lower.includes("react") || lower.includes("coding") || lower.includes("programming") || lower.includes("web")) {
    return ["Fundamentals & Core Concepts", "Build Foundation Projects", "Intermediate Techniques", "Advanced Patterns", "Real-World Application"];
  }
  if (lower.includes("fitness") || lower.includes("workout") || lower.includes("run") || lower.includes("strength") || lower.includes("health")) {
    return ["Assessment & Baseline", "Starter Routine", "Progressive Overload", "Intermediate Plan", "Peak Performance"];
  }
  if (lower.includes("read") || lower.includes("book") || lower.includes("learn") || lower.includes("study")) {
    return ["Set Learning Objectives", "Core Resources", "Active Practice", "Deep Dive", "Reflect & Share"];
  }
  return ["Foundation & Research", "First Milestone", "Build Momentum", "Deepen Understanding", "Mastery & Review"];
}

/**
 * Generate a learning path infused with the compass direction's arc.
 * When a direction is chosen, the steps reflect the soul of that arc.
 * When omitted, keyword-based fallback is used.
 */
function generateLearningPath(title: string, description: string, direction?: string | null): Goal["steps"] {
  const arc = direction ? COMPASS_ARCS[direction] : null;

  const steps: { title: string; description: string }[] = arc
    ? arc.map((step) => ({
        title: step.title,
        description: step.description(title),
      }))
    : keywordFallbackSteps(title, description).map((stepTitle) => ({
        title: stepTitle,
        description: `Complete this phase to move forward toward "${title}".`,
      }));

  return steps.map((s, i) => ({
    id: `step-${i + 1}`,
    title: s.title,
    description: s.description,
    completed: false,
    order: i,
  }));
}

/**
 * Fire-and-forget AI enrichment: generates a full course with modules
 * for the given goal and updates the store when complete.
 */
async function enrichGoalWithAICourse(goalId: string, title: string, description: string) {
  /* Mark as generating */
  const store = useGoalStore.getState();
  store.updateGoal(goalId, { aiCourseStatus: "generating" });

  try {
    const result = await processGoal(goalId, title, description);

    if (result.success && result.data?.modules && result.data.modules.length > 0) {
      const course: GoalCourseModule[] = result.data.modules.map((m, i) => ({
        title: m.title ?? `Module ${i + 1}`,
        description: m.description ?? "",
        books: (m.books ?? []).map((b) => ({
          title: b.title,
          author: b.author,
          description: b.description,
          chapters: (b.chapters ?? []).map((c) => ({
            title: c.title,
            content: c.content,
          })),
        })),
        topicTest: m.topicTest
          ? {
              title: m.topicTest.title,
              questions: m.topicTest.questions.map((q) => ({
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
              })),
            }
          : undefined,
      }));
      useGoalStore.getState().updateGoal(goalId, {
        course,
        aiCourseStatus: "ready",
      });
    } else {
      useGoalStore.getState().updateGoal(goalId, { aiCourseStatus: "failed" });
    }
  } catch {
    useGoalStore.getState().updateGoal(goalId, { aiCourseStatus: "failed" });
  }
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  creating: false,

  initialize: (authenticated: boolean) => {
    if (!authenticated) {
      const stored = guestStorage.getGuestGoals();
      if (stored.length > 0) {
        set({ goals: stored });
      }
      // No seed goals — let the user create their own
    }
  },

  addGoal: (input) => {
    const now = new Date().toISOString();
    const steps = generateLearningPath(input.title, input.description, input.direction);
    const goal: Goal = {
      ...input,
      direction: input.direction ?? null,
      id: nextId(),
      steps,
      progress: 0,
      course: null,
      aiCourseStatus: "idle",
      last_touched_step_at: null,
      created_at: now,
      updated_at: now,
    };
    const goals = [goal, ...get().goals];
    set({ goals });
    persistIfGuest(goals);

    /* Fire-and-forget AI enrichment */
    enrichGoalWithAICourse(goal.id, goal.title, goal.description);
  },

  updateGoal: (id, partial) => {
    const goals = get().goals.map((g) =>
      g.id === id ? { ...g, ...partial, updated_at: new Date().toISOString() } : g,
    );
    set({ goals });
    persistIfGuest(goals);
  },

  deleteGoal: (id) => {
    const goals = get().goals.filter((g) => g.id !== id);
    set({ goals });
    persistIfGuest(goals);
  },

  toggleStep: (goalId, stepIndex) => {
    const goals = get().goals.map((g) => {
      if (g.id !== goalId) return g;
      const steps = g.steps.map((s, i) =>
        i === stepIndex ? { ...s, completed: !s.completed } : s,
      );
      const completedCount = steps.filter((s) => s.completed).length;
      const progress = Math.round((completedCount / steps.length) * 100);
      return {
        ...g,
        steps,
        progress,
        last_touched_step_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    set({ goals });
    persistIfGuest(goals);
  },

  setCreating: (v) => set({ creating: v }),

  generateCourse: (goalId) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (goal) {
      enrichGoalWithAICourse(goalId, goal.title, goal.description);
    }
  },
}));