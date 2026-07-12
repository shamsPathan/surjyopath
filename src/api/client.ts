/**
 * Surjyopath API client.
 *
 * Routes auth + data calls to Supabase.
 * AI calls go through the knock-ai Edge Function; mock fallbacks for dev.
 */

import { supabase } from "../lib/supabase";
import { CONFIG } from "../lib/config";
import type { User } from "@supabase/supabase-js";

/* ─── Canonical type imports ─── */
import type { UserProfile, CourseModule, Book, GoalCourseResponse, Message, ConversationSummary } from "../types/supabase";
import type { Thought, ThoughtAnalysis, AIChatFeedback } from "../types/thought";
import { thoughtFromDb } from "../types/thought";
import type { Goal, GoalStep } from "../types/goal";
import { goalFromDb } from "../types/goal";
import type { Publication } from "../types/publication";

/* ─── Types not yet in canonical homes — keep here until moved ─── */

export interface AIAnalysisResponse {
  thoughtId: string;
  analysis: {
    wasRight: boolean;
    summary: string;
    improvements: string[];
    hiddenQuestions: { question: string; answer: string }[];
    isMisleading: boolean;
    misleadingReason: string | null;
    suggestedReading: string[];
    suggestions: string[];
  };
}

export interface PublicationComment {
  id: string;
  publication_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  content: string;
  order: number;
  created_at: string;
}

export interface TopicTest {
  id: string;
  module_id: string;
  title: string;
  is_completed: boolean;
  score: number | null;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question: string;
  options: string[];
  correct_index: number;
  user_answer_index: number | null;
  order: number;
  test_type: "topic" | "chapter";
  created_at: string;
}

export interface SearchUserResult {
  id: string;
  nickname: string;
  avatar_emoji: string;
  bio: string | null;
  level: number;
  xp: number;
}

/* Friend/request types — the DB returns snake_case; keep them here for now */
export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  from_user: UserProfile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  added_at: string;
  friend: UserProfile;
}

/* ─── DB-to-domain helpers ─── */

/** Map a Supabase publications row (with joined `user`) into the canonical Publication type. */
function publicationFromDb(row: {
  id: string;
  thought_id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  created_at: string;
  user?: { nickname: string; avatar_emoji: string } | null;
}): Publication {
  const excerpt =
    row.content.length > 140
      ? row.content.slice(0, 140).trimEnd() + "…"
      : row.content;
  return {
    id: row.id,
    thought_id: row.thought_id,
    title: row.title,
    content: row.content,
    excerpt,
    tags: [],
    category: row.category,
    is_polished: false,
    author_name: row.user?.nickname ?? "Unknown",
    user_id: row.user_id,
    likes_count: row.likes,
    comments_count: 0,
    liked_by_user: false,
    comments: [],
    status: "published",
    created_at: row.created_at,
    updated_at: row.created_at,
    published_at: row.created_at,
  };
}

/* ─── Helpers ─── */

async function goFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const url = `${CONFIG.goBackend.url}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Go backend error ${res.status}: ${text}`);
  }
  return res.json();
}

/* ─── Auth ─── */

export async function signUp(email: string, password: string, nickname: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
    },
  });
  if (error) throw error;

  // Create user profile in the database
  if (data.user) {
    const { error: profileError } = await supabase.from("users").insert({
      id: data.user.id,
      email,
      nickname,
      password_hash: "", // handled by Supabase Auth
      avatar_emoji: "🧑‍🚀",
      bio: "",
    });
    if (profileError && profileError.code !== "23505") {
      // 23505 = duplicate, fine if already created via trigger
      console.warn("Profile creation warning:", profileError);
    }
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithOAuth(provider: 'google' | 'facebook') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function resetPasswordForEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/* ─── Profile ─── */

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as unknown as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, "nickname" | "avatar_emoji" | "bio">>,
) {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

/* ─── Thoughts ─── */

export async function getThoughts(userId: string): Promise<Thought[]> {
  const { data, error } = await supabase
    .from("thoughts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => thoughtFromDb(row));
}

export async function createThought(
  userId: string,
  content: string,
  goalId?: string,
): Promise<Thought> {
  const { data, error } = await supabase
    .from("thoughts")
    .insert({
      user_id: userId,
      content,
      goal_id: goalId ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return thoughtFromDb(data);
}

export async function updateThought(
  thoughtId: string,
  updates: Partial<Pick<Thought, "content" | "status" | "is_published">> & {
    analysis?: ThoughtAnalysis | null;
    edited_content?: string | null;
    processed_at?: string | null;
  },
): Promise<void> {
  const dbUpdates: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
  // Serialize JSON fields for storage
  if (updates.analysis !== undefined) {
    dbUpdates.analysis = updates.analysis;
    delete (dbUpdates as any).analysis;
    dbUpdates.analysis = updates.analysis ? JSON.stringify(updates.analysis) : null;
  }
  if (updates.edited_content !== undefined) {
    dbUpdates.edited_content = updates.edited_content;
  }
  if (updates.processed_at !== undefined) {
    dbUpdates.processed_at = updates.processed_at;
  }
  const { error } = await supabase
    .from("thoughts")
    .update(dbUpdates)
    .eq("id", thoughtId);
  if (error) throw error;
}

export async function deleteThought(thoughtId: string): Promise<void> {
  const { error } = await supabase
    .from("thoughts")
    .delete()
    .eq("id", thoughtId);
  if (error) throw error;
}

/* ─── Knock AI ─── */

export async function knockThought(thoughtId: string): Promise<AIAnalysisResponse> {
  try {
    return await goFetch<AIAnalysisResponse>("/api/ai/knock/thought", {
      method: "POST",
      body: JSON.stringify({ thoughtId }),
    });
  } catch {
    return mockKnockThought(thoughtId);
  }
}

export async function processGoal(goalId: string): Promise<GoalCourseResponse> {
  try {
    return await goFetch<GoalCourseResponse>("/api/ai/process/goal", {
      method: "POST",
      body: JSON.stringify({ goalId }),
    });
  } catch {
    return mockProcessGoal(goalId);
  }
}

/* ─── Goals ─── */

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => goalFromDb(row));
}

export async function createGoal(
  userId: string,
  title: string,
  description: string,
  options?: {
    thoughtId?: string;
    direction?: string | null;
    emoji?: string;
    targetDate?: string;
    steps?: GoalStep[];
    aiCourseStatus?: string;
  },
): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title,
      description,
      thought_id: options?.thoughtId ?? null,
      direction: options?.direction ?? null,
      emoji: options?.emoji ?? "🎯",
      target_date: options?.targetDate ?? null,
      status: "pending",
      progress: 0,
      steps: options?.steps ?? [],
      ai_course_status: options?.aiCourseStatus ?? "idle",
    })
    .select()
    .single();
  if (error) throw error;
  return goalFromDb(data);
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, "progress" | "status" | "title" | "description">> & {
    steps?: GoalStep[];
    direction?: string | null;
    last_touched_step_at?: string | null;
    aiCourseStatus?: string;
    course?: any;
    is_new?: boolean;
    target_date?: string;
    emoji?: string;
  },
): Promise<void> {
  const dbUpdates: Record<string, any> = { ...updates };
  if (updates.aiCourseStatus !== undefined) {
    dbUpdates.ai_course_status = updates.aiCourseStatus;
    delete dbUpdates.aiCourseStatus;
  }
  if (updates.target_date !== undefined) {
    dbUpdates.target_date = updates.target_date;
  }
  const { error } = await supabase
    .from("goals")
    .update({ ...dbUpdates, updated_at: new Date().toISOString() })
    .eq("id", goalId);
  if (error) throw error;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId);
  if (error) throw error;
}

/* ─── Modules & Courses ─── */

export async function getGoalModules(goalId: string): Promise<CourseModule[]> {
  const { data: modules, error } = await supabase
    .from("modules")
    .select("*")
    .eq("goal_id", goalId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (modules ?? []) as unknown as CourseModule[];
}

export async function createModules(
  goalId: string,
  modules: { title: string; description: string; order: number }[],
): Promise<void> {
  const { error } = await supabase.from("modules").insert(
    modules.map((m) => ({ goal_id: goalId, ...m })),
  );
  if (error) throw error;
}

export async function getBooks(moduleId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("module_id", moduleId);
  if (error) throw error;
  return (data ?? []) as unknown as Book[];
}

export async function getBookChapters(bookId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Chapter[];
}

export async function getTopicTest(moduleId: string): Promise<TopicTest | null> {
  const { data, error } = await supabase
    .from("topic_tests")
    .select("*")
    .eq("module_id", moduleId)
    .single();
  if (error) return null;
  return data as unknown as TopicTest;
}

export async function getTestQuestions(
  testId: string,
  testType: "topic" | "chapter",
): Promise<TestQuestion[]> {
  const { data, error } = await supabase
    .from("test_questions")
    .select("*")
    .eq("test_id", testId)
    .eq("test_type", testType)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TestQuestion[];
}

export async function answerQuestion(
  questionId: string,
  answerIndex: number,
): Promise<void> {
  const { error } = await supabase
    .from("test_questions")
    .update({ user_answer_index: answerIndex })
    .eq("id", questionId);
  if (error) throw error;
}

export async function completeTopicTest(
  testId: string,
  score: number,
): Promise<void> {
  const { error } = await supabase
    .from("topic_tests")
    .update({ is_completed: true, score })
    .eq("id", testId);
  if (error) throw error;
}

/* ─── Publications ─── */

export async function getPublicationById(id: string): Promise<Publication | null> {
  const { data, error } = await supabase
    .from("publications")
    .select("*, user:user_id(nickname, avatar_emoji)")
    .eq("id", id)
    .single();
  if (error) return null;
  return publicationFromDb(data as any);
}

export async function getPublications(): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("publications")
    .select("*, user:user_id(nickname, avatar_emoji)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => publicationFromDb(row));
}

export async function publishThought(
  thoughtId: string,
  userId: string,
  title: string,
  content: string,
  category?: string,
): Promise<Publication> {
  const { data, error } = await supabase
    .from("publications")
    .insert({
      thought_id: thoughtId,
      user_id: userId,
      title,
      content,
      category: category ?? "reflection",
    })
    .select("*, user:user_id(nickname, avatar_emoji)")
    .single();
  if (error) throw error;

  // Mark thought as published
  await supabase
    .from("thoughts")
    .update({ is_published: true, publication_id: data.id })
    .eq("id", thoughtId);

  return publicationFromDb(data);
}

export async function updatePublication(
  publicationId: string,
  updates: Partial<Pick<Publication, "content" | "title" | "status">>,
): Promise<void> {
  const { error } = await supabase
    .from("publications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", publicationId);
  if (error) throw error;
}

export async function deletePublication(publicationId: string): Promise<void> {
  const { error } = await supabase
    .from("publications")
    .delete()
    .eq("id", publicationId);
  if (error) throw error;
}

export async function likePublication(
  publicationId: string,
  userId: string,
): Promise<void> {
  const { error: likeError } = await supabase
    .from("publication_likes")
    .insert({ publication_id: publicationId, user_id: userId });
  if (likeError && likeError.code !== "23505") throw likeError; // 23505 = already liked

  await supabase.rpc("increment_publication_likes", {
    pub_id: publicationId,
  });
}

export async function unlikePublication(
  publicationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("publication_likes")
    .delete()
    .eq("publication_id", publicationId)
    .eq("user_id", userId);
  if (error) throw error;

  await supabase.rpc("decrement_publication_likes", {
    pub_id: publicationId,
  });
}

export async function getComments(publicationId: string): Promise<PublicationComment[]> {
  const { data, error } = await supabase
    .from("publication_comments")
    .select("*, user:user_id(nickname)")
    .eq("publication_id", publicationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PublicationComment[];
}

export async function addComment(
  publicationId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<PublicationComment> {
  const { data, error } = await supabase
    .from("publication_comments")
    .insert({
      publication_id: publicationId,
      user_id: userId,
      content,
      parent_id: parentId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as PublicationComment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from("publication_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}

export async function getUserLikedPublicationIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("publication_likes")
    .select("publication_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.publication_id);
}

/* ─── Achievements & Progress ─── */

export async function getUserAchievements(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}

/* ─── Mock AI Responses (dev mode) ─── */

async function mockKnockThought(thoughtId: string): Promise<AIAnalysisResponse> {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    thoughtId,
    analysis: {
      summary: "Your thought reflects a desire for growth and self-improvement. You're questioning your current approach and looking for better alternatives.",
      wasRight: true,
      improvements: [
        "Consider breaking down your goal into smaller, actionable steps",
        "Try journaling your progress daily to track patterns",
        "Seek feedback from peers who share similar interests",
      ],
      hiddenQuestions: [
        {
          question: "Am I on the right path?",
          answer: "Your reflection shows self-awareness, which is the foundation of growth. The very act of questioning means you're already on the right track. Trust your process while remaining open to adjustment.",
        },
        {
          question: "What am I missing?",
          answer: "Based on your thought, you might benefit from more structured learning. Consider finding a mentor or joining a community of like-minded learners.",
        },
      ],
      isMisleading: false,
      misleadingReason: null,
      suggestedReading: [
        "Atomic Habits by James Clear — building small consistent improvements",
        "Mindset by Carol Dweck — understanding growth vs fixed mindset",
        "The Art of Learning by Josh Waitzkin — deeper approach to skill acquisition",
      ],
      suggestions: [
        "Start a daily 5-minute reflection habit",
        "Create a mind map of your goals and sub-goals",
        "Share your insights with someone who can challenge your thinking",
      ],
    },
  };
}

export async function mockPolish(
  content: string,
  title?: string,
): Promise<{ polished: string; summary: string; improvements: string[] }> {
  await new Promise((r) => setTimeout(r, 1200));
  const trimmed = content.trim();
  return {
    polished: trimmed.endsWith(".") || trimmed.endsWith("!") || trimmed.endsWith("?")
      ? trimmed
      : trimmed + ".",
    summary: title
      ? `A polished reflection on "${title}".`
      : "A piece of writing polished for clarity and impact.",
    improvements: [
      "Tightened sentence structure for better flow",
      "Improved word choice for greater impact",
      "Added a stronger concluding thought",
    ],
  };
}

export async function mockProcessGoal(goalId: string): Promise<GoalCourseResponse> {
  await new Promise((r) => setTimeout(r, 2000));
  return {
    goalId,
    modules: [
      {
        title: "Understanding the Foundation",
        description: "Build a solid understanding of the fundamentals before diving deeper.",
        books: [
          {
            title: "The Beginner's Guide",
            author: "Sarah Mitchell",
            description: "A comprehensive introduction covering all foundational concepts.",
            chapters: [
              {
                title: "Getting Started",
                content: "Everything begins with understanding where you are right now. Take a moment to reflect on your current knowledge and experience. This is your starting point, and every expert was once here too.\n\nThe key is consistency — showing up every day, even when progress feels slow. Small steps compound into remarkable results over time.\n\nTry this: Write down three things you already know about your goal area, and three things you want to learn.",
              },
              {
                title: "Building Your First Practice",
                content: "Now that you've identified where you are, it's time to build a practice. Start with 10 minutes daily. The goal isn't perfection — it's showing up.\n\nCreate a simple routine:\n1. Set a fixed time each day\n2. Prepare your materials in advance\n3. Remove distractions\n4. Focus for 10 minutes\n5. Reflect for 2 minutes after\n\nConsistency beats intensity every time.",
              },
            ],
          },
        ],
        topicTest: {
          title: "Foundation Check",
          questions: [
            {
              question: "What is the most important factor for making progress?",
              options: ["Natural talent", "Consistency and showing up daily", "Having expensive tools", "Waiting for motivation"],
              correctIndex: 1,
            },
            {
              question: "How long should your initial practice session be?",
              options: ["2 hours", "30 minutes", "10 minutes", "As long as you can"],
              correctIndex: 2,
            },
            {
              question: "What should you do after each practice session?",
              options: ["Immediately start the next session", "Reflect for 2 minutes", "Check social media", "Forget about it until tomorrow"],
              correctIndex: 1,
            },
          ],
        },
      },
      {
        title: "Deepening Your Understanding",
        description: "Go beyond the basics and start building real competence through focused practice and study.",
        books: [
          {
            title: "Mastery Through Practice",
            author: "David Chen",
            description: "Advanced techniques for deepening your understanding and skill.",
            chapters: [
              {
                title: "The Art of Deliberate Practice",
                content: "Deliberate practice is the gold standard for skill development. Unlike casual repetition, deliberate practice involves:\n\n1. Clear specific goals\n2. Full concentration\n3. Immediate feedback\n4. Pushing just beyond your current ability\n\nIdentify one aspect of your goal that challenges you. Focus on just that aspect for your next practice session.",
              },
              {
                title: "Learning from Feedback",
                content: "Feedback is the breakfast of champions. Every mistake is data — information about what to adjust.\n\nCreate a feedback loop:\n- Practice → Get feedback → Adjust → Practice again\n\nSeek feedback from:\n- Your own reflection (journals)\n- Peers and mentors\n- Results and outcomes\n\nThe goal isn't to avoid mistakes, but to learn from them faster.",
              },
            ],
          },
        ],
        topicTest: {
          title: "Deepening Check",
          questions: [
            {
              question: "What is deliberate practice?",
              options: ["Repeating the same thing over and over", "Practicing with clear goals, focus, and feedback", "Practicing only when you feel like it", "Getting someone else to do the work"],
              correctIndex: 1,
            },
            {
              question: "How should you view mistakes?",
              options: ["As failures to avoid", "As data for improvement", "As reasons to quit", "As something to hide"],
              correctIndex: 1,
            },
          ],
        },
      },
      {
        title: "Sharing and Teaching Others",
        description: "The final stage of mastery — sharing what you've learned with others solidifies your understanding and creates impact.",
        books: [
          {
            title: "The Teacher's Path",
            author: "Maria Gonzalez",
            description: "How teaching others accelerates your own learning journey.",
            chapters: [
              {
                title: "Teaching as Learning",
                content: "The best way to truly learn something is to teach it. When you explain a concept to someone else, you:\n\n- Identify gaps in your own understanding\n- Organize knowledge into clear structures\n- Discover new perspectives through questions\n\nTry explaining your goal area to a friend or writing a short guide. You'll be surprised at how much clearer things become.",
              },
            ],
          },
        ],
        topicTest: {
          title: "Mastery Check",
          questions: [
            {
              question: "Why is teaching others considered the best way to learn?",
              options: [
                "It makes you look smart",
                "It reveals gaps in your understanding",
                "It takes less time",
                "You don't need to practice anymore",
              ],
              correctIndex: 1,
            },
            {
              question: "What should you do after completing this course?",
              options: [
                "Stop and feel accomplished",
                "Set a new goal and continue growing",
                "Wait for someone to tell you what's next",
                "Forget everything you learned",
              ],
              correctIndex: 1,
            },
          ],
        },
      },
    ],
  };
}

/* ─── Book library ─── */

export async function getLibraryBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("title", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Book[];
}

/* ─── Reading Progress ─── */

export async function getReadingProgress(userId: string): Promise<{ book_id: string; chapter_id: string; is_read: boolean }[]> {
  const { data, error } = await supabase
    .from("reading_progress")
    .select("book_id, chapter_id, is_read")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as { book_id: string; chapter_id: string; is_read: boolean }[];
}

export async function markChapterRead(
  userId: string,
  bookId: string,
  chapterId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reading_progress")
    .upsert(
      {
        user_id: userId,
        book_id: bookId,
        chapter_id: chapterId,
        is_read: true,
        read_at: new Date().toISOString(),
        source: "library",
      },
      { onConflict: "user_id, book_id, chapter_id" },
    );
  if (error) throw error;
}

/* ─── Messages ─── */

export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const { data: sent, error: sentErr } = await supabase
    .from("messages")
    .select("*, recipient:recipient_id(id, nickname, avatar_emoji, bio, level, xp)")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  const { data: received, error: recvErr } = await supabase
    .from("messages")
    .select("*, sender:sender_id(id, nickname, avatar_emoji, bio, level, xp)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false });

  if (sentErr) throw sentErr;
  if (recvErr) throw recvErr;

  const conversations = new Map<string, ConversationSummary>();

  for (const msg of (sent ?? []) as any[]) {
    const otherId = msg.recipient_id;
    const existing = conversations.get(otherId);
    const lastMsg = { ...msg, recipient: undefined, sender: undefined };
    if (!existing || new Date(msg.created_at) > new Date(existing.last_message.created_at)) {
      conversations.set(otherId, {
        other_user: msg.recipient as UserProfile,
        last_message: lastMsg as Message,
        unread_count: 0,
      });
    }
  }

  for (const msg of (received ?? []) as any[]) {
    const otherId = msg.sender_id;
    const existing = conversations.get(otherId);
    const lastMsg = { ...msg, sender: undefined, recipient: undefined };
    if (!existing || new Date(msg.created_at) > new Date(existing.last_message.created_at)) {
      conversations.set(otherId, {
        other_user: msg.sender as UserProfile,
        last_message: lastMsg as Message,
        unread_count: msg.is_read ? (existing?.unread_count ?? 0) : (existing?.unread_count ?? 0) + 1,
      });
    } else if (!msg.is_read) {
      existing!.unread_count += 1;
    }
  }

  return Array.from(conversations.values()).sort(
    (a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime(),
  );
}

export async function getConversationMessages(
  userId: string,
  otherUserId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:sender_id(id, nickname, avatar_emoji, bio, level, xp)")
    .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Message[];
}

export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string,
  thoughtId?: string,
  goalId?: string,
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    recipient_id: recipientId,
    content,
    thought_id: thoughtId ?? null,
    goal_id: goalId ?? null,
  });
  if (error) throw error;

  const { data: fromProfile } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", senderId)
    .single();

  await supabase.from("notifications").insert({
    user_id: recipientId,
    type: "friend_request",
    title: "New Message",
    body: `${fromProfile?.nickname ?? "Someone"} sent you a message!`,
    metadata: { from_user_id: senderId, type: "message" },
  });
}

export async function markMessagesAsRead(
  userId: string,
  otherUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("recipient_id", userId)
    .eq("sender_id", otherUserId)
    .eq("is_read", false);
  if (error) throw error;
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/* ─── Friends ─── */

export async function searchUsers(query: string): Promise<SearchUserResult[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id, nickname, avatar_emoji, bio, level, xp")
    .or(`nickname.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as SearchUserResult[];
}

export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
  const { error } = await supabase.from("friend_requests").insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") throw new Error("Request already sent or you're already friends");
    throw error;
  }

  const { data: fromProfile } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", fromUserId)
    .single();

  await supabase.from("notifications").insert({
    user_id: toUserId,
    type: "friend_request",
    title: "New Friend Request",
    body: `${fromProfile?.nickname ?? "Someone"} wants to be your friend!`,
    metadata: { from_user_id: fromUserId },
  });
}

export async function getIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, from_user:from_user_id(id, nickname, avatar_emoji, bio, level, xp)")
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FriendRequest[];
}

export async function getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("*, to_user:to_user_id(id, nickname, avatar_emoji, bio, level, xp)")
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FriendRequest[];
}

export async function acceptFriendRequest(requestId: string, userId: string, fromUserId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);
  if (updateError) throw updateError;

  const { error: f1Error } = await supabase
    .from("friends")
    .insert({ user_id: userId, friend_id: fromUserId });
  if (f1Error && f1Error.code !== "23505") throw f1Error;

  const { error: f2Error } = await supabase
    .from("friends")
    .insert({ user_id: fromUserId, friend_id: userId });
  if (f2Error && f2Error.code !== "23505") throw f2Error;

  const { data: toProfile } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", userId)
    .single();

  await supabase.from("notifications").insert({
    user_id: fromUserId,
    type: "friend_accepted",
    title: "Friend Request Accepted! 🎉",
    body: `${toProfile?.nickname ?? "Your friend"} accepted your friend request!`,
    metadata: { friend_user_id: userId },
  });
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "declined" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getUserPublications(userId: string): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("publications")
    .select("*, user:user_id(nickname, avatar_emoji)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => publicationFromDb(row));
}

export async function getMyFriends(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase
    .from("friends")
    .select("*, friend:friend_id(id, nickname, avatar_emoji, bio, level, xp)")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Friendship[];
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await supabase.from("friends").delete().eq("user_id", userId).eq("friend_id", friendId);
  await supabase.from("friends").delete().eq("user_id", friendId).eq("friend_id", userId);
}