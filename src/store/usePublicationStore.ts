import { create } from "zustand";
import type { Publication, Comment } from "../types/publication";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";
import * as api from "../api/client";
import { knockPolish as knockPolishService } from "../services/aiService";

interface PublicationState {
  publications: Publication[];
  loading: boolean;

  /* Detail view */
  selectedId: string | null;
  selectPublication: (id: string | null) => void;

  /* Publish modal */
  publishModalOpen: boolean;
  setPublishModalOpen: (open: boolean) => void;

  /* Polish tracking */
  polishingId: string | null;

  /* Init */
  initialize: (authenticated: boolean) => Promise<void>;

  /* CRUD */
  publishFromThought: (
    thoughtId: string,
    title: string,
    content: string,
    category?: string,
  ) => Promise<void>;
  unpublish: (id: string) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;

  /* Engagement */
  toggleLike: (id: string) => Promise<void>;
  addComment: (publicationId: string, content: string) => Promise<void>;
  deleteComment: (publicationId: string, commentId: string) => Promise<void>;

  /* Polish */
  polishPublication: (id: string) => Promise<void>;

  /* Fetch single publication by ID (for shared links) */
  fetchPublicationById: (id: string) => Promise<Publication | null>;

  /* Guest sync */
  _syncGuestToServer: () => Promise<void>;
}

let _counter = 0;
function nextId() {
  return String(++_counter);
}

/**
 * Build a guest publication ID that won't collide with Supabase UUIDs.
 */
function guestPubId(): string {
  return `guest-pub-${Date.now()}-${nextId()}`;
}

/**
 * Persist current publications to guest storage when the user is not authenticated.
 */
function persistIfGuest(publications: Publication[]) {
  if (!useAuthStore.getState().isAuthenticated) {
    guestStorage.setGuestPublications(publications);
  }
}

export const usePublicationStore = create<PublicationState>((set, get) => ({
  publications: [],
  loading: false,

  /* Detail view */
  selectedId: null,
  selectPublication: (id) => set({ selectedId: id }),

  /* Publish modal */
  publishModalOpen: false,
  setPublishModalOpen: (open) => set({ publishModalOpen: open }),

  /* Polish tracking */
  polishingId: null,

  initialize: async (authenticated: boolean) => {
    if (authenticated) {
      const user = useAuthStore.getState().user;
      if (user) {
        set({ loading: true });
        try {
          const publications = await api.getPublications();
          set({ publications, loading: false });
          return;
        } catch (err) {
          console.error("Failed to fetch publications:", err);
        }
        set({ loading: false });
      }
      return;
    }

    // Guest: load from localStorage
    const stored = guestStorage.getGuestPublications();
    set({ publications: stored });
  },

  publishFromThought: async (thoughtId, title, content, category) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated && auth.user) {
      const publication = await api.publishThought(
        thoughtId,
        auth.user.id,
        title,
        content,
        category,
      );
      set({ publications: [publication, ...get().publications] });
      return;
    }

    // Guest: create locally
    const now = new Date().toISOString();
    const publication: Publication = {
      id: guestPubId(),
      thought_id: thoughtId || "",
      user_id: "guest",
      author_name: "Guest User",
      author_avatar: "",
      title,
      content,
      excerpt: content.split("\n")[0].slice(0, 120),
      category: category || "general",
      tags: [],
      is_polished: false,
      likes_count: 0,
      comments_count: 0,
      liked_by_user: false,
      comments: [],
      status: "published",
      processed_at: now,
      created_at: now,
      updated_at: now,
    };
    const publications = [publication, ...get().publications];
    set({ publications });
    persistIfGuest(publications);
  },

  unpublish: async (id) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        await api.updatePublication(id, { status: "draft" });
      } catch (err) {
        console.warn("Failed to unpublish on Supabase:", err);
      }
    }

    const publications = get().publications.filter((p) => p.id !== id);
    set({ publications });
    persistIfGuest(publications);
  },

  deletePublication: async (id) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        await api.deletePublication(id);
      } catch (err) {
        console.warn("Failed to delete publication from Supabase:", err);
      }
    }

    const publications = get().publications.filter((p) => p.id !== id);
    set({ publications });
    persistIfGuest(publications);
  },

  toggleLike: async (id) => {
    const pub = get().publications.find((p) => p.id === id);
    if (!pub) return;

    const auth = useAuthStore.getState();
    if (auth.isAuthenticated && auth.user) {
      try {
        if (pub.liked_by_user) {
          await api.unlikePublication(id, auth.user.id);
        } else {
          await api.likePublication(id, auth.user.id);
        }
      } catch (err) {
        console.warn("Failed to sync like to Supabase:", err);
      }
    }

    // Always update local state
    const publications = get().publications.map((p) =>
      p.id === id
        ? {
            ...p,
            liked_by_user: !p.liked_by_user,
            likes_count: p.liked_by_user
              ? Math.max(0, p.likes_count - 1)
              : p.likes_count + 1,
          }
        : p,
    );
    set({ publications });
    persistIfGuest(publications);
  },

  addComment: async (publicationId, content) => {
    const auth = useAuthStore.getState();
    let newComment: Comment;

    if (auth.isAuthenticated && auth.user) {
      const comment = await api.addComment(
        publicationId,
        auth.user.id,
        content,
      );
      newComment = {
        id: comment.id,
        user_id: comment.user_id,
        author_name: auth.user.email?.split("@")[0] || "User",
        author_avatar: "",
        content: comment.content,
        created_at: comment.created_at,
      };
    } else {
      // Guest: create locally
      const now = new Date().toISOString();
      newComment = {
        id: `guest-cmt-${nextId()}`,
        user_id: "guest",
        author_name: "Guest User",
        author_avatar: "",
        content,
        created_at: now,
      };
    }

    const publications = get().publications.map((p) =>
      p.id === publicationId
        ? {
            ...p,
            comments: [...p.comments, newComment],
            comments_count: p.comments_count + 1,
          }
        : p,
    );
    set({ publications });
    persistIfGuest(publications);
  },

  deleteComment: async (publicationId, commentId) => {
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        await api.deleteComment(commentId);
      } catch (err) {
        console.warn("Failed to delete comment from Supabase:", err);
        return; // Don't update local state if server delete fails
      }
    }

    const publications = get().publications.map((p) =>
      p.id === publicationId
        ? {
            ...p,
            comments: p.comments.filter((c) => c.id !== commentId),
            comments_count: Math.max(0, p.comments_count - 1),
          }
        : p,
    );
    set({ publications });
    persistIfGuest(publications);
  },

  polishPublication: async (id) => {
    const pub = get().publications.find((p) => p.id === id);
    if (!pub) return;

    set({ polishingId: id, loading: true });

    try {
      const result = await knockPolishService(pub.content, pub.title);
      if (result.success && result.data) {
        const publications = get().publications.map((p) =>
          p.id === id
            ? {
                ...p,
                content: result.data!.polished,
                is_polished: true,
                updated_at: new Date().toISOString(),
              }
            : p,
        );
        set({ publications });
        persistIfGuest(publications);

        // For authenticated users, persist the updated content
        const auth = useAuthStore.getState();
        if (auth.isAuthenticated) {
          try {
            await api.updatePublication(id, {
              content: result.data!.polished,
            });
          } catch (err) {
            console.warn("Failed to persist polished content:", err);
          }
        }
      }
    } finally {
      set({ loading: false, polishingId: null });
    }
  },

  fetchPublicationById: async (id) => {
    // First check if already in store
    const existing = get().publications.find((p) => p.id === id);
    if (existing) return existing;

    // For authenticated users, fetch from Supabase
    const auth = useAuthStore.getState();
    if (auth.isAuthenticated) {
      try {
        const publication = await api.getPublicationById(id);
        if (publication) {
          // Add to store so it's available for comments/likes
          set({
            publications: [publication, ...get().publications],
          });
          return publication;
        }
      } catch (err) {
        console.warn("Failed to fetch publication by ID:", err);
      }
    }

    return null;
  },

  _syncGuestToServer: async () => {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || !auth.user) return;

    const guestPubs = guestStorage.getGuestPublications();
    if (guestPubs.length === 0) return;

    // Migrate guest publications to Supabase
    for (const pub of guestPubs) {
      try {
        await api.publishThought(
          pub.thought_id || "",
          auth.user.id,
          pub.title,
          pub.content,
          pub.category,
        );
      } catch (err) {
        console.warn("Failed to migrate guest publication:", err);
      }
    }

    // Clear guest publications after migration
    guestStorage.setGuestPublications([]);

    // Re-fetch from Supabase to get canonical state
    try {
      const publications = await api.getPublications();
      set({ publications });
    } catch (err) {
      console.error("Failed to re-fetch publications after migration:", err);
    }
  },
}));