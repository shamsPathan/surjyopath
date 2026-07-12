/* ─── Thought type — unified for both mock and API usage ─── */

export interface Thought {
  id: string;

  /* Core content — DB stores everything here; frontend splits title/content */
  content: string;

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