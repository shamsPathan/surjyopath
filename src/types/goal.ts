/* ─── Goal type for the Goals system ─── */

/** The four compass directions — each represents a kind of intention */
export type CompassDirection = "growth" | "creation" | "grounding" | "release";

export const COMPASS_LABELS: Record<CompassDirection, { label: string; emoji: string }> = {
  growth:   { label: "Growth",   emoji: "🧭" },
  creation: { label: "Creation", emoji: "🌅" },
  grounding:{ label: "Grounding",emoji: "⛰️" },
  release:  { label: "Release",  emoji: "🌇" },
};

export interface Goal {
  id: string;

  /* Core */
  title: string;
  description: string;
  target_date: string;     /* ISO date string */

  /* Compass */
  direction: CompassDirection | null;

  /* Steps — the AI-generated learning path */
  steps: GoalStep[];

  /* Derived */
  progress: number;        /* 0–100, computed from steps */

  /* Status */
  status: "active" | "completed" | "abandoned";

  /* AI-enriched course (from Knock Engine) */
  course: GoalCourseModule[] | null;
  aiCourseStatus: "idle" | "generating" | "ready" | "failed";

  /* Drift tracking */
  last_touched_step_at: string | null;   /* ISO — when a step was last toggled */

  /* Metadata */
  user_id: string;
  created_at: string;
  updated_at: string;
}

/** A module in the AI-generated course structure */
export interface GoalCourseModule {
  title: string;
  description: string;
  books: {
    title: string;
    author: string;
    description: string;
    chapters: {
      title: string;
      content: string;
    }[];
  }[];
  topicTest?: {
    title: string;
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
    }[];
  };
}

export interface GoalStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

/* ─── Input for creating a new goal ─── */
export interface GoalInput {
  title: string;
  description: string;
  target_date: string;
  direction?: CompassDirection;
}

/**
 * Compute an alignment score (0–100) for a goal.
 * Alignment blends progress (40%), direction clarity (30%), and recency (30%).
 * This is the metric we show instead of plain "progress" — it answers
 * "How aligned is this goal with your path right now?"
 */
export function computeAlignment(goal: Goal): number {
  const progressWeight = goal.progress * 0.4;

  const directionScore = goal.direction ? 100 : 0;
  const directionWeight = directionScore * 0.3;

  let recencyScore = 0;
  if (goal.last_touched_step_at) {
    const daysSinceTouch = (Date.now() - new Date(goal.last_touched_step_at).getTime()) / 86400000;
    if (daysSinceTouch <= 2) recencyScore = 100;
    else if (daysSinceTouch <= 7) recencyScore = 70;
    else if (daysSinceTouch <= 14) recencyScore = 40;
    else recencyScore = 20;
  }
  const recencyWeight = recencyScore * 0.3;

  return Math.round(progressWeight + directionWeight + recencyWeight);
}

/**
 * How many days since the last step was toggled? Returns Infinity if never touched.
 */
export function driftDays(goal: Goal): number {
  if (!goal.last_touched_step_at) return Infinity;
  return (Date.now() - new Date(goal.last_touched_step_at).getTime()) / 86400000;
}