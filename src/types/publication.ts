/* ─── Publication type for the Social / Publications system ─── */

export interface Publication {
  id: string;

  /* Reference to the original thought */
  thought_id: string;

  /* Core content */
  title: string;
  content: string;
  excerpt: string;           /* Short preview — first ~120 chars of content */
  tags: string[];

  /* AI-chosen category for organization */
  category: string;

  /* AI Polish */
  polished_content?: string;  /* AI-polished version (if polished) */
  is_polished: boolean;        /* Whether AI polish was applied */
  radiance_score?: number;    /* 0-100 quality score for feed sorting */

  /* Author info */
  author_name: string;
  user_id: string;

  /* Social metrics */
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  comments: Comment[];

  /* Status */
  status: "draft" | "published";

  /* Timestamps */
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

/* ─── Comment on a publication ─── */

export interface Comment {
  id: string;
  publication_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

/* ─── Input for publishing a thought ─── */

export interface PublishInput {
  thought_id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  author_name: string;
  user_id: string;
}