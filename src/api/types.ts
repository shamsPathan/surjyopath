/* ─── Shared API types ─── */

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  content: string;
  order: number;
  created_at: string;
}