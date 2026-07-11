import { create } from "zustand";
import type { Publication, PublishInput } from "../types/publication";
import type { Thought } from "../types/thought";
import { useAuthStore } from "./useAuthStore";
import * as guestStorage from "../lib/guestStorage";
import { knockPolish } from "../services/aiService";

interface PublicationState {
  publications: Publication[];
  selectedId: string | null;
  publishModalOpen: boolean;

  /* Loading */
  polishingId: string | null;

  /* Init */
  initialize: (authenticated: boolean) => void;

  /* Selection */
  selectPublication: (id: string | null) => void;
  setPublishModalOpen: (v: boolean) => void;

  /* CRUD */
  publishFromThought: (thought: Thought) => string;
  unpublish: (id: string) => void;
  deletePublication: (id: string) => void;

  /* AI Polish */
  polishPublication: (id: string) => Promise<void>;

  /* Social actions */
  toggleLike: (id: string) => void;
}

let _counter = 30000;
function nextId() {
  return String(++_counter);
}

function persistIfGuest(publications: Publication[]) {
  if (!useAuthStore.getState().isAuthenticated) {
    guestStorage.setGuestPublications(publications);
  }
}

export const usePublicationStore = create<PublicationState>((set, get) => ({
  publications: [],
  selectedId: null,
  publishModalOpen: false,
  polishingId: null,

  initialize: (authenticated: boolean) => {
    if (!authenticated) {
      const stored = guestStorage.getGuestPublications();
      if (stored.length > 0) {
        set({ publications: stored });
      }
    }
  },

  selectPublication: (id) => set({ selectedId: id }),
  setPublishModalOpen: (v) => set({ publishModalOpen: v }),

  publishFromThought: (thought) => {
    const now = new Date().toISOString();
    const excerpt =
      thought.content.length > 140
        ? thought.content.slice(0, 140).trimEnd() + "…"
        : thought.content;

    const pub: Publication = {
      id: nextId(),
      thought_id: thought.id,
      title: thought.title,
      content: thought.content,
      excerpt,
      tags: thought.tags,
      author_name: "You",
      user_id: thought.user_id,
      likes_count: 0,
      comments_count: 0,
      liked_by_user: false,
      is_polished: false,
      status: "published",
      created_at: now,
      updated_at: now,
      published_at: now,
    };

    const publications = [pub, ...get().publications];
    set({ publications });
    persistIfGuest(publications);
    return pub.id;
  },

  unpublish: (id) => {
    const publications = get().publications.map((p) =>
      p.id === id
        ? { ...p, status: "draft" as const, published_at: null, updated_at: new Date().toISOString() }
        : p,
    );
    set({ publications });
    persistIfGuest(publications);
  },

  deletePublication: (id) => {
    const publications = get().publications.filter((p) => p.id !== id);
    set({ publications, selectedId: get().selectedId === id ? null : get().selectedId });
    persistIfGuest(publications);
  },

  polishPublication: async (id) => {
    const pub = get().publications.find((p) => p.id === id);
    if (!pub || pub.is_polished) return;

    set({ polishingId: id });
    try {
      const result = await knockPolish(pub.content, pub.title);
      if (!result.success || !result.data) throw new Error(result.error ?? "Polish failed");

      const { polished } = result.data;
      const publications = get().publications.map((p) =>
        p.id === id
          ? {
              ...p,
              polished_content: polished,
              is_polished: true,
              updated_at: new Date().toISOString(),
            }
          : p,
      );
      set({ publications });
      persistIfGuest(publications);
    } catch (err) {
      console.error("Polish failed:", err);
    } finally {
      set({ polishingId: null });
    }
  },

  toggleLike: (id) => {
    const publications = get().publications.map((p) =>
      p.id === id
        ? {
            ...p,
            liked_by_user: !p.liked_by_user,
            likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
          }
        : p,
    );
    set({ publications });
    persistIfGuest(publications);
  },
}));