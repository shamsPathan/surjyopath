/* ─── Frontend-specific types ─── */

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_emoji: string;
  bio: string | null;
  level: number;
  xp: number;
  joined_at: string;
}

export interface Thought {
  id: string;
  user_id: string;
  content: string;
  edited_content: string | null;
  status: "pending" | "ready";
  analysis: ThoughtAnalysis | null;
  ai_feedback: AIChatFeedback | null;
  goal_id: string | null;
  is_published: boolean;
  publication_id: string | null;
  is_new: boolean;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThoughtAnalysis {
  summary: string;
  wasRight: boolean | null;
  improvements: string[];
  hiddenQuestions: { question: string; answer: string }[];
  isMisleading: boolean;
  misleadingReason: string | null;
  suggestedReading: string[];
  suggestions: string[];
}

export interface AIChatFeedback {
  conversation: { role: "user" | "assistant"; content: string }[];
  lastInteraction: string;
}

export interface Goal {
  id: string;
  user_id: string;
  thought_id: string | null;
  title: string;
  description: string;
  emoji: string;
  status: "pending" | "ready";
  progress: number;
  is_new: boolean;
  created_at: string;
  completed_at: string | null;
  processed_at: string | null;
}

export interface CourseModule {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
  books?: Book[];
  topicTest?: TopicTest;
}

export interface Book {
  id: string;
  module_id: string | null;
  title: string;
  author: string;
  description: string;
  cover_emoji: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  chapters?: Chapter[];
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
  questions?: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  test_type: "topic" | "chapter";
  test_id: string;
  question: string;
  options: string[];
  correct_index: number;
  user_answer_index: number | null;
  order: number;
}

export interface Publication {
  id: string;
  thought_id: string;
  user_id: string;
  title: string;
  content: string;
  category: "reflection" | "poetry" | "story" | "insight" | "learning" | "creative" | "question";
  likes: number;
  created_at: string;
  user?: UserProfile;
}

export interface PublicationComment {
  id: string;
  publication_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  user?: UserProfile;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  from_user?: UserProfile;
  to_user?: UserProfile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  added_at: string;
  friend?: UserProfile;
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

export interface AIAnalysisResponse {
  thoughtId: string;
  analysis: ThoughtAnalysis;
}

export interface GoalCourseResponse {
  goalId: string;
  modules: {
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
    topicTest: {
      title: string;
      questions: {
        question: string;
        options: string[];
        correctIndex: number;
      }[];
    };
  }[];
}