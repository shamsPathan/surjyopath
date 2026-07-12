/* ─── Supabase DB row type aliases + API response types ─── */

import type { Database } from "../lib/database.types";
import type { ThoughtAnalysis, AIChatFeedback } from "./thought";
import type { GoalCourseModule } from "./goal";

/* ─── Convenience aliases for DB row types ─── */

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export type CourseModule = Database["public"]["Tables"]["modules"]["Row"];

export type Book = Database["public"]["Tables"]["books"]["Row"];

export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];

export type TopicTest = Database["public"]["Tables"]["topic_tests"]["Row"];

export type TestQuestion = Database["public"]["Tables"]["test_questions"]["Row"];

export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];

export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];

export type FriendRequestRow = Database["public"]["Tables"]["friend_requests"]["Row"];

export type FriendshipRow = Database["public"]["Tables"]["friends"]["Row"];

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type PublicationCommentRow = Database["public"]["Tables"]["publication_comments"]["Row"];

/* ─── Enriched types (DB rows with joined user data) ─── */

export interface FriendRequestWithUser {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  from_user?: UserProfile;
  to_user?: UserProfile;
}

export interface FriendshipWithUser {
  id: string;
  user_id: string;
  friend_id: string;
  added_at: string;
  friend?: UserProfile;
}

export interface MessageWithSender {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  thought_id: string | null;
  goal_id: string | null;
  is_read: boolean;
  created_at: string;
  sender?: UserProfile;
  recipient?: UserProfile;
}

export type Message = MessageWithSender;

export interface PublicationComment {
  id: string;
  publication_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user?: UserProfile;
}

/* ─── Computed types ─── */

export interface ConversationSummary {
  other_user: UserProfile;
  last_message: Message;
  unread_count: number;
}

export interface SearchUserResult {
  id: string;
  nickname: string;
  avatar_emoji: string;
  bio: string | null;
  level: number;
  xp: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

/* ─── AI response types ─── */

export interface AIAnalysisResponse {
  thoughtId: string;
  analysis: ThoughtAnalysis;
}

export interface GoalCourseResponse {
  goalId: string;
  modules: GoalCourseModule[];
  /** True if this course was served from the Goal Pattern Knowledge Base cache */
  fromCache: boolean;
  /** AI-generated tags for this goal pattern */
  tags?: string[];
}