import { create } from "zustand";
import type { User, AuthEvent as SupabaseAuthEvent } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import * as api from "../api/client";
import type { UserProfile } from "../types/supabase";

type AuthEvent = SupabaseAuthEvent;

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  authEvent: AuthEvent | null;

  initialize: () => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  authEvent: null,

  initialize: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;
      let profile: UserProfile | null = null;

      if (user) {
        profile = await api.getUserProfile(user.id);
      }

      set({
        user,
        profile,
        isAuthenticated: !!user,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user ?? null;
        let currentProfile: UserProfile | null = null;

        if (currentUser && event !== "PASSWORD_RECOVERY") {
          currentProfile = await api.getUserProfile(currentUser.id);
        }

        set({
          user: currentUser,
          profile: currentProfile,
          isAuthenticated: !!currentUser,
          authEvent: event,
        });
      });
    } catch (err) {
      set({ isLoading: false, error: "Failed to initialize authentication" });
    }
  },

  signUp: async (email: string, password: string, nickname: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.signUp(email, password, nickname);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Sign up failed" });
      throw err;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.signIn(email, password);
      const user = data.user;
      const profile = user ? await api.getUserProfile(user.id) : null;
      set({
        user,
        profile,
        isAuthenticated: !!user,
        isLoading: false,
      });
    } catch (err: any) {
      const rawMessage = err.message || "Sign in failed";
      // Transform the terse "Email not confirmed" into a friendlier message
      const friendlyMessage = rawMessage.toLowerCase().includes("email not confirmed")
        ? "Check your email and confirm your account"
        : rawMessage;
      set({ isLoading: false, error: friendlyMessage });
      throw err;
    }
  },

  signInWithOAuth: async (provider: 'google' | 'facebook') => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "OAuth sign-in failed" });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await api.signOut();
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Sign out failed" });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.resetPasswordForEmail(email);
      set({ isLoading: false, error: "Reset link sent! Check your email." });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Failed to send reset email" });
      throw err;
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.updatePassword(newPassword);
      set({ isLoading: false, authEvent: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Failed to update password" });
      throw err;
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await api.getUserProfile(user.id);
    if (profile) set({ profile });
  },

  clearError: () => set({ error: null }),
}));