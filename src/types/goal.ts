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
  emoji: string;            /* Visual icon for the goal */

  /* Compass */
  direction: CompassDirection | null;

  /* Link to originating thought */
  thought_id: string | null;

  /* Steps — the AI-generated learning path */
  steps: GoalStep[];

  /* Derived */
  progress: number;        /* 0–100, computed from steps */

  /* Status */
  status: "active" | "completed" | "abandoned";

  /* Flags */
  is_new: boolean;

  /* AI-enriched course (from Knock Engine) */
  course: GoalCourseModule[] | null;
  aiCourseStatus: "idle" | "generating" | "ready" | "failed";

  /* Drift tracking */
  last_touched_step_at: string | null;   /* ISO — when a step was last toggled */

  /* Metadata */
  user_id: string;
  created_at: string;
  updated_at: string;

  /* Timestamps */
  completed_at: string | null;   /* ISO — when the goal was marked completed */
  processed_at: string | null;   /* ISO — when AI last processed this goal */
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

/* ─── Supabase DB row → domain type converter ─── */

/**
 * Build a Goal from the Supabase goals row + parsed JSON fields.
 * The DB stores goals.status as "pending" | "ready", which we
 * map to domain equivalents ("active" | "completed").
 */
export function goalFromDb(db: {
  id: string;
  user_id: string;
  thought_id: string | null;
  title: string;
  description: string;
  emoji: string;
  direction: string | null;
  status: string;
  progress: number;
  is_new: boolean;
  completed_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  last_touched_step_at: string | null;
}): Goal {
  /* Map DB status → domain status */
  const dbStatus = db.status;
  const status: Goal["status"] =
    dbStatus === "completed" ? "completed"
    : dbStatus === "abandoned" ? "abandoned"
    : "active";

  /* Parse JSON columns */
  let course: GoalCourseModule[] | null = null;
  let steps: GoalStep[] = [];

  /* The DB stores `course` as a blob, try parsing it */
  try {
    if (typeof (db as any).course === "string") {
      course = JSON.parse((db as any).course);
    } else if ((db as any).course) {
      course = (db as any).course as GoalCourseModule[];
    }
  } catch { /* ignore parse errors */ }

  /* The DB stores `steps` as a blob */
  try {
    if (typeof (db as any).steps === "string") {
      steps = JSON.parse((db as any).steps);
    } else if ((db as any).steps) {
      steps = (db as any).steps as GoalStep[];
    }
  } catch { /* ignore parse errors */ }

  const direction: CompassDirection | null =
    db.direction && ["growth", "creation", "grounding", "release"].includes(db.direction)
      ? (db.direction as CompassDirection)
      : null;

  return {
    id: db.id,
    title: db.title,
    description: db.description,
    target_date: (db as any).target_date || new Date(db.created_at).toISOString().split("T")[0],
    emoji: db.emoji || "🎯",
    direction,
    thought_id: db.thought_id,
    steps,
    progress: db.progress ?? 0,
    status,
    is_new: db.is_new ?? false,
    course,
    aiCourseStatus: course ? "ready" : "idle",
    last_touched_step_at: db.last_touched_step_at,
    user_id: db.user_id,
    created_at: db.created_at,
    updated_at: db.updated_at,
    completed_at: db.completed_at,
    processed_at: db.processed_at,
  };
}