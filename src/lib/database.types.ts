export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          description: string;
          icon: string;
          id: string;
          title: string;
        };
        Insert: {
          category: string;
          description: string;
          icon: string;
          id: string;
          title: string;
        };
        Update: {
          category?: string;
          description?: string;
          icon?: string;
          id?: string;
          title?: string;
        };
        Relationships: [];
      };
      books: {
        Row: {
          author: string;
          category: string | null;
          cover_emoji: string;
          created_at: string;
          description: string;
          id: string;
          module_id: string | null;
          tags: Json | null;
          title: string;
        };
        Insert: {
          author?: string;
          category?: string | null;
          cover_emoji?: string;
          created_at?: string;
          description?: string;
          id?: string;
          module_id?: string | null;
          tags?: Json | null;
          title: string;
        };
        Update: {
          author?: string;
          category?: string | null;
          cover_emoji?: string;
          created_at?: string;
          description?: string;
          id?: string;
          module_id?: string | null;
          tags?: Json | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "books_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      chapter_tests: {
        Row: {
          chapter_id: string;
          created_at: string;
          id: string;
          is_completed: boolean;
          score: number | null;
          title: string;
        };
        Insert: {
          chapter_id: string;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          score?: number | null;
          title?: string;
        };
        Update: {
          chapter_id?: string;
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          score?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapter_tests_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
        ];
      };
      chapters: {
        Row: {
          book_id: string;
          content: string;
          created_at: string;
          id: string;
          order: number;
          title: string;
        };
        Insert: {
          book_id: string;
          content: string;
          created_at?: string;
          id?: string;
          order?: number;
          title: string;
        };
        Update: {
          book_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      discussions: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          target_id: string;
          target_type: "module" | "book" | "chapter";
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          target_id: string;
          target_type: "module" | "book" | "chapter";
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          target_id?: string;
          target_type?: "module" | "book" | "chapter";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussions_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      friend_requests: {
        Row: {
          created_at: string;
          from_user_id: string;
          id: string;
          status: "pending" | "accepted" | "declined";
          to_user_id: string;
        };
        Insert: {
          created_at?: string;
          from_user_id: string;
          id?: string;
          status?: "pending" | "accepted" | "declined";
          to_user_id: string;
        };
        Update: {
          created_at?: string;
          from_user_id?: string;
          id?: string;
          status?: "pending" | "accepted" | "declined";
          to_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friend_requests_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friend_requests_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      friends: {
        Row: {
          added_at: string;
          friend_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          friend_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          added_at?: string;
          friend_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey";
            columns: ["friend_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friends_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string;
          emoji: string;
          id: string;
          is_new: boolean;
          processed_at: string | null;
          progress: number;
          status: "pending" | "ready";
          thought_id: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description: string;
          emoji?: string;
          id?: string;
          is_new?: boolean;
          processed_at?: string | null;
          progress?: number;
          status?: "pending" | "ready";
          thought_id?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          emoji?: string;
          id?: string;
          is_new?: boolean;
          processed_at?: string | null;
          progress?: number;
          status?: "pending" | "ready";
          thought_id?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_thought_id_fkey";
            columns: ["thought_id"];
            isOneToOne: false;
            referencedRelation: "thoughts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          description: string;
          goal_id: string;
          id: string;
          order: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          goal_id: string;
          id?: string;
          order?: number;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          goal_id?: string;
          id?: string;
          order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modules_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          is_read: boolean;
          metadata: Json | null;
          title: string;
          type:
            | "friend_request"
            | "friend_accepted"
            | "goal_completed"
            | "test_passed"
            | "achievement_unlocked"
            | "publication_liked"
            | "publication_commented";
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title: string;
          type:
            | "friend_request"
            | "friend_accepted"
            | "goal_completed"
            | "test_passed"
            | "achievement_unlocked"
            | "publication_liked"
            | "publication_commented";
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          metadata?: Json | null;
          title?: string;
          type?:
            | "friend_request"
            | "friend_accepted"
            | "goal_completed"
            | "test_passed"
            | "achievement_unlocked"
            | "publication_liked"
            | "publication_commented";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      publication_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          publication_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          publication_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          publication_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publication_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "publication_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_comments_publication_id_fkey";
            columns: ["publication_id"];
            isOneToOne: false;
            referencedRelation: "publications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      publication_likes: {
        Row: {
          created_at: string;
          id: string;
          publication_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          publication_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          publication_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publication_likes_publication_id_fkey";
            columns: ["publication_id"];
            isOneToOne: false;
            referencedRelation: "publications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publication_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      publications: {
        Row: {
          category: "reflection" | "poetry" | "story" | "insight" | "learning" | "creative" | "question";
          content: string;
          created_at: string;
          id: string;
          likes: number;
          thought_id: string;
          title: string;
          user_id: string;
        };
        Insert: {
          category?: "reflection" | "poetry" | "story" | "insight" | "learning" | "creative" | "question";
          content: string;
          created_at?: string;
          id?: string;
          likes?: number;
          thought_id: string;
          title: string;
          user_id: string;
        };
        Update: {
          category?: "reflection" | "poetry" | "story" | "insight" | "learning" | "creative" | "question";
          content?: string;
          created_at?: string;
          id?: string;
          likes?: number;
          thought_id?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publications_thought_id_fkey";
            columns: ["thought_id"];
            isOneToOne: false;
            referencedRelation: "thoughts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "publications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reading_progress: {
        Row: {
          book_id: string;
          chapter_id: string;
          created_at: string;
          id: string;
          is_read: boolean;
          read_at: string | null;
          source: "library" | "goal";
          user_id: string;
        };
        Insert: {
          book_id: string;
          chapter_id: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          read_at?: string | null;
          source?: "library" | "goal";
          user_id: string;
        };
        Update: {
          book_id?: string;
          chapter_id?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          read_at?: string | null;
          source?: "library" | "goal";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reading_progress_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_progress_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          is_revoked: boolean;
          refresh_token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          is_revoked?: boolean;
          refresh_token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_revoked?: boolean;
          refresh_token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      test_questions: {
        Row: {
          correct_index: number;
          created_at: string;
          id: string;
          options: Json;
          order: number;
          question: string;
          test_id: string;
          test_type: "topic" | "chapter";
          user_answer_index: number | null;
        };
        Insert: {
          correct_index: number;
          created_at?: string;
          id?: string;
          options: Json;
          order?: number;
          question: string;
          test_id: string;
          test_type: "topic" | "chapter";
          user_answer_index?: number | null;
        };
        Update: {
          correct_index?: number;
          created_at?: string;
          id?: string;
          options?: Json;
          order?: number;
          question?: string;
          test_id?: string;
          test_type?: "topic" | "chapter";
          user_answer_index?: number | null;
        };
        Relationships: [];
      };
      thoughts: {
        Row: {
          ai_feedback: Json | null;
          analysis: Json | null;
          content: string;
          created_at: string;
          edited_content: string | null;
          goal_id: string | null;
          id: string;
          is_new: boolean;
          is_published: boolean;
          processed_at: string | null;
          publication_id: string | null;
          status: "pending" | "ready";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_feedback?: Json | null;
          analysis?: Json | null;
          content: string;
          created_at?: string;
          edited_content?: string | null;
          goal_id?: string | null;
          id?: string;
          is_new?: boolean;
          is_published?: boolean;
          processed_at?: string | null;
          publication_id?: string | null;
          status?: "pending" | "ready";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_feedback?: Json | null;
          analysis?: Json | null;
          content?: string;
          created_at?: string;
          edited_content?: string | null;
          goal_id?: string | null;
          id?: string;
          is_new?: boolean;
          is_published?: boolean;
          processed_at?: string | null;
          publication_id?: string | null;
          status?: "pending" | "ready";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_thoughts_goal";
            columns: ["goal_id"];
            isOneToOne: false;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "thoughts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      topic_tests: {
        Row: {
          created_at: string;
          id: string;
          is_completed: boolean;
          module_id: string;
          score: number | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          module_id: string;
          score?: number | null;
          title?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          module_id?: string;
          score?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topic_tests_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          id: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_emoji: string;
          bio: string | null;
          created_at: string;
          email: string;
          id: string;
          joined_at: string;
          level: number;
          nickname: string;
          password_hash: string;
          updated_at: string;
          xp: number;
        };
        Insert: {
          avatar_emoji?: string;
          bio?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          joined_at?: string;
          level?: number;
          nickname?: string;
          password_hash: string;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          avatar_emoji?: string;
          bio?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          joined_at?: string;
          level?: number;
          nickname?: string;
          password_hash?: string;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      discussion_target: "module" | "book" | "chapter";
      goal_status: "pending" | "ready";
      notification_type:
        | "friend_request"
        | "friend_accepted"
        | "goal_completed"
        | "test_passed"
        | "achievement_unlocked"
        | "publication_liked"
        | "publication_commented";
      pub_category: "reflection" | "poetry" | "story" | "insight" | "learning" | "creative" | "question";
      reading_source: "library" | "goal";
      request_status: "pending" | "accepted" | "declined";
      test_type: "topic" | "chapter";
      thought_status: "pending" | "ready";
    };
    CompositeTypes: Record<string, never>;
  };
};