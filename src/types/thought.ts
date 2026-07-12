/* ─── Thought type — unified for both mock and API usage ─── */

export interface Thought {
  id: string;

  /* Core content — DB stores everything here; frontend splits title/content */
  content: string;

  /* AI-edited version of the content (from Knock Engine) */
  edited_content: string | null;

  /* Frontend convenience fields */
  title: string;
  tags: string[];

  /* DB fields */
  user_id: string;
  status: "pending" | "ready";
  analysis: ThoughtAnalysis | null;
  ai_feedback: AIChatFeedback | null;
  goal_id: string | null;
  is_published: boolean;
  publication_id: string | null;
  is_new: boolean;

  /* Timestamps */
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PublishEligibility = "low" | "medium" | "high";

export interface BookSuggestion {
  book: string;
  reason: string;
}

export interface ThoughtAnalysis {
  summary: string;
  wasRight: boolean | null;
  publishEligibility: PublishEligibility;
  clickMoment: string | null;
  improvements: string[];
  hiddenQuestions: { question: string; answer: string }[];
  isMisleading: boolean;
  misleadingReason: string | null;
  suggestedReading: string[];
  bookSuggestions: BookSuggestion[];
  knownUnknowns: string[];
  suggestions: string[];
}

export interface AIChatFeedback {
  conversation: { role: "user" | "assistant"; content: string }[];
  lastInteraction: string;
}

/* ─── Supabase DB row → domain type converter ─── */

/**
 * Build a Thought from a Supabase thoughts row.
 * The DB stores everything in `content` — we extract title from the first line
 * and set tags/is_new as defaults since those are frontend-only convenience fields.
 */
export function thoughtFromDb(db: {
  id: string;
  user_id: string;
  content: string;
  status: string;
  analysis: unknown;
  ai_feedback: unknown;
  goal_id: string | null;
  is_published: boolean;
  publication_id: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  edited_content: string | null;
}): Thought {
  const firstLine = db.content.split("\n")[0].slice(0, 60).trim();
  let analysis: ThoughtAnalysis | null = null;
  try {
    if (typeof db.analysis === "string") analysis = JSON.parse(db.analysis);
    else if (db.analysis) analysis = db.analysis as ThoughtAnalysis;
  } catch { /* ignore */ }

  let aiFeedback: AIChatFeedback | null = null;
  try {
    if (typeof db.ai_feedback === "string") aiFeedback = JSON.parse(db.ai_feedback);
    else if (db.ai_feedback) aiFeedback = db.ai_feedback as AIChatFeedback;
  } catch { /* ignore */ }

  return {
    id: db.id,
    content: db.content,
    edited_content: db.edited_content,
    title: firstLine || "Untitled",
    tags: [],
    user_id: db.user_id,
    status: (db.status === "ready" ? "ready" : "pending") as "pending" | "ready",
    analysis,
    ai_feedback: aiFeedback,
    goal_id: db.goal_id,
    is_published: db.is_published ?? false,
    publication_id: db.publication_id,
    is_new: false,
    processed_at: db.processed_at,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

/* ─── Helper to create a new thought from user input ─── */
export function createThoughtFromInput(
  content: string,
  title?: string,
  tags?: string[],
): Omit<Thought, "id" | "created_at" | "updated_at"> {
  return {
    content,
    title: title || content.split("\n")[0].slice(0, 60),
    tags: tags || [],
    user_id: "",
    status: "pending",
    analysis: null,
    ai_feedback: null,
    goal_id: null,
    is_published: false,
    publication_id: null,
    is_new: true,
    processed_at: null,
  };
}