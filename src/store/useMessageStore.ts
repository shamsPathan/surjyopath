import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import type { Message, ConversationSummary, UserProfile } from "../api/types";
import * as api from "../api/client";

interface MessageState {
  /* Data */
  conversations: ConversationSummary[];
  activeConversation: {
    otherUser: UserProfile;
    messages: Message[];
  } | null;
  unreadCount: number;

  /* UI */
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;

  /* Actions */
  initialize: () => Promise<void>;
  loadConversations: () => Promise<void>;
  openConversation: (otherUserId: string) => Promise<void>;
  sendMessage: (recipientId: string, content: string, thoughtId?: string, goalId?: string) => Promise<void>;
  closeConversation: () => void;
  refreshUnreadCount: () => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  unreadCount: 0,
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,

  initialize: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoading: true });
    try {
      const [conversations, unreadCount] = await Promise.all([
        api.getConversations(user.id),
        api.getUnreadMessageCount(user.id),
      ]);
      set({ conversations, unreadCount });
    } catch (err) {
      console.warn("Failed to load conversations:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadConversations: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const [conversations, unreadCount] = await Promise.all([
        api.getConversations(user.id),
        api.getUnreadMessageCount(user.id),
      ]);
      set({ conversations, unreadCount });
    } catch (err) {
      console.warn("Failed to reload conversations:", err);
    }
  },

  openConversation: async (otherUserId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isLoadingMessages: true, activeConversation: null });
    try {
      const [messages] = await Promise.all([
        api.getConversationMessages(user.id, otherUserId),
        api.markMessagesAsRead(user.id, otherUserId),
      ]);

      // Get other user's profile
      const { data: otherUser } = await (await import("../lib/supabase")).supabase
        .from("users")
        .select("id, nickname, avatar_emoji, bio, level, xp")
        .eq("id", otherUserId)
        .single();

      set({
        activeConversation: {
          otherUser: otherUser as unknown as UserProfile,
          messages,
        },
      });

      // Refresh conversations and unread count
      await get().loadConversations();
    } catch (err) {
      console.warn("Failed to load conversation:", err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (recipientId: string, content: string, thoughtId?: string, goalId?: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isSending: true });
    try {
      await api.sendMessage(user.id, recipientId, content, thoughtId, goalId);

      // Reload the active conversation if we are chatting with this person
      const active = get().activeConversation;
      if (active && active.otherUser.id === recipientId) {
        const messages = await api.getConversationMessages(user.id, recipientId);
        set({ activeConversation: { ...active, messages } });
      }

      await get().loadConversations();
    } catch (err) {
      console.warn("Failed to send message:", err);
      throw err;
    } finally {
      set({ isSending: false });
    }
  },

  closeConversation: () => {
    set({ activeConversation: null });
  },

  refreshUnreadCount: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const count = await api.getUnreadMessageCount(user.id);
      set({ unreadCount: count });
    } catch {
      // silent
    }
  },
}));