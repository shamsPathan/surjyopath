import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useJournalStore } from "./useJournalStore";
import type { Book, Chapter } from "../api/types";
import * as api from "../api/client";

interface BookWithProgress extends Book {
  chapters?: Chapter[];
  progress: number; // 0-100
  readChapterIds: Set<string>;
}

interface LibraryState {
  /* Data */
  books: BookWithProgress[];
  suggestedBooks: string[]; // titles from AI analysis
  isLoading: boolean;
  expandedBookId: string | null;

  /* Actions */
  initialize: () => Promise<void>;
  toggleBookExpanded: (bookId: string) => Promise<void>;
  markChapterRead: (bookId: string, chapterId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  suggestedBooks: [],
  isLoading: false,
  expandedBookId: null,

  initialize: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      // Guest mode: show suggested books from thoughts
      const thoughts = useJournalStore.getState().thoughts;
      const suggested = new Set<string>();
      thoughts.forEach((t) => {
        if (t.analysis?.suggestedReading) {
          t.analysis.suggestedReading.forEach((s) => suggested.add(s));
        }
      });
      set({ suggestedBooks: [...suggested], books: [], isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      // Get all books and reading progress in parallel
      const [allBooks, progress] = await Promise.all([
        api.getLibraryBooks(),
        api.getReadingProgress(user.id),
      ]);

      // Build progress map
      const readMap = new Map<string, Set<string>>();
      progress.forEach((p) => {
        if (!readMap.has(p.book_id)) readMap.set(p.book_id, new Set());
        readMap.get(p.book_id)!.add(p.chapter_id);
      });

      // Get AI-suggested reading from thoughts
      const thoughts = useJournalStore.getState().thoughts;
      const suggested = new Set<string>();
      thoughts.forEach((t) => {
        if (t.analysis?.suggestedReading) {
          t.analysis.suggestedReading.forEach((s) => suggested.add(s));
        }
      });

      // Enrich books with progress
      const booksWithProgress: BookWithProgress[] = allBooks.map((b) => {
        const readChapterIds = readMap.get(b.id) ?? new Set();
        const chapterCount = 0; // will be set when expanded
        return {
          ...b,
          chapters: undefined,
          progress: 0,
          readChapterIds,
        };
      });

      set({
        books: booksWithProgress,
        suggestedBooks: [...suggested],
        isLoading: false,
      });
    } catch (err) {
      console.warn("Failed to load library:", err);
      set({ isLoading: false });
    }
  },

  toggleBookExpanded: async (bookId: string) => {
    const { expandedBookId, books } = get();
    if (expandedBookId === bookId) {
      set({ expandedBookId: null });
      return;
    }

    // Check if we already have chapters
    const existing = books.find((b) => b.id === bookId);
    if (existing?.chapters) {
      set({ expandedBookId: bookId });
      return;
    }

    // Fetch chapters
    try {
      const chapters = await api.getBookChapters(bookId);
      const updated = books.map((b) => {
        if (b.id === bookId) {
          const readIds = b.readChapterIds;
          const total = chapters.length;
          const read = chapters.filter((c) => readIds.has(c.id)).length;
          return {
            ...b,
            chapters,
            progress: total > 0 ? Math.round((read / total) * 100) : 0,
          };
        }
        return b;
      });
      set({ books: updated, expandedBookId: bookId });
    } catch (err) {
      console.warn("Failed to load chapters:", err);
      set({ expandedBookId: bookId });
    }
  },

  markChapterRead: async (bookId: string, chapterId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await api.markChapterRead(user.id, bookId, chapterId);

      const { books } = get();
      const updated = books.map((b) => {
        if (b.id === bookId) {
          const newReadIds = new Set(b.readChapterIds);
          newReadIds.add(chapterId);
          const total = b.chapters?.length ?? 0;
          const read = newReadIds.size;
          return {
            ...b,
            readChapterIds: newReadIds,
            progress: total > 0 ? Math.round((read / total) * 100) : 0,
          };
        }
        return b;
      });
      set({ books: updated });
    } catch (err) {
      console.warn("Failed to mark chapter as read:", err);
    }
  },
}));