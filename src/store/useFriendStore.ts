import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import type {
  FriendRequest,
  Friendship,
  SearchUserResult,
} from "../api/types";
import * as api from "../api/client";

interface FriendState {
  /* Data */
  friends: Friendship[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  searchResults: SearchUserResult[];

  /* UI */
  isSearching: boolean;
  isInitializing: boolean;
  searchQuery: string;

  /* Actions */
  initialize: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;

  /* Requests */
  sendRequest: (toUserId: string) => Promise<void>;
  acceptRequest: (requestId: string, fromUserId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;

  /* Friendship */
  removeFriend: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  isSearching: false,
  isInitializing: false,
  searchQuery: "",

  initialize: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ isInitializing: true });
    try {
      const [friends, incoming, outgoing] = await Promise.all([
        api.getMyFriends(user.id),
        api.getIncomingRequests(user.id),
        api.getOutgoingRequests(user.id),
      ]);
      set({ friends, incomingRequests: incoming, outgoingRequests: outgoing });
    } catch (err) {
      console.warn("Failed to load friend data:", err);
    } finally {
      set({ isInitializing: false });
    }
  },

  searchUsers: async (query: string) => {
    set({ searchQuery: query, isSearching: true });
    try {
      const results = await api.searchUsers(query);
      // Filter out yourself
      const userId = useAuthStore.getState().user?.id;
      set({ searchResults: results.filter((r) => r.id !== userId) });
    } catch (err) {
      console.warn("Search failed:", err);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: "" });
  },

  sendRequest: async (toUserId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      await api.sendFriendRequest(user.id, toUserId);
      // Reload outgoing requests
      const outgoing = await api.getOutgoingRequests(user.id);
      set({ outgoingRequests: outgoing });
    } catch (err) {
      console.warn("Failed to send request:", err);
    }
  },

  acceptRequest: async (requestId: string, fromUserId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      await api.acceptFriendRequest(requestId, user.id, fromUserId);
      await get().initialize();
    } catch (err) {
      console.warn("Failed to accept request:", err);
    }
  },

  declineRequest: async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      const incoming = get().incomingRequests.filter(
        (r) => r.id !== requestId,
      );
      set({ incomingRequests: incoming });
    } catch (err) {
      console.warn("Failed to decline request:", err);
    }
  },

  cancelRequest: async (requestId: string) => {
    try {
      await api.declineFriendRequest(requestId);
      const outgoing = get().outgoingRequests.filter(
        (r) => r.id !== requestId,
      );
      set({ outgoingRequests: outgoing });
    } catch (err) {
      console.warn("Failed to cancel request:", err);
    }
  },

  removeFriend: async (friendId: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      await api.removeFriend(user.id, friendId);
      const friends = get().friends.filter((f) => f.friend_id !== friendId);
      set({ friends });
    } catch (err) {
      console.warn("Failed to remove friend:", err);
    }
  },
}));