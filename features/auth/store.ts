import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { AuthProfile } from "./api";
import {
  fetchMyProfile,
  getSession,
  onAuthStateChange,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOut as apiSignOut,
  signUpWithEmail,
  resetPassword,
  resendVerification,
} from "./api";
import { logger } from "@/lib/logging";

type AuthState = {
  ready: boolean;
  loading: boolean;
  session: Session | null;
  profile: AuthProfile | null;
  error: string | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  loading: false,
  session: null,
  profile: null,
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    try {
      const session = await getSession();
      let profile: AuthProfile | null = null;
      if (session) {
        profile = await fetchMyProfile();
      }
      set({ session, profile, ready: true });
      onAuthStateChange(async (next) => {
        const nextProfile = next ? await fetchMyProfile() : null;
        set({ session: next, profile: nextProfile });
      });
    } catch (e) {
      logger.error("auth.bootstrap", e);
      set({ ready: true, error: e instanceof Error ? e.message : "Auth failed" });
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await fetchMyProfile();
      set({ profile });
    } catch (e) {
      logger.error("auth.refreshProfile", e);
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithEmail(email, password);
      const profile = await fetchMyProfile();
      set({ session: data.session, profile, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Sign in failed",
      });
      throw e;
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const data = await signUpWithEmail({ email, password, displayName });
      const profile = data.session ? await fetchMyProfile() : null;
      set({ session: data.session, profile, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Sign up failed",
      });
      throw e;
    }
  },

  signInGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithGoogle();
      const profile = await fetchMyProfile();
      set({ session: data.session, profile, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Google sign-in failed",
      });
      throw e;
    }
  },

  signInApple: async () => {
    set({ loading: true, error: null });
    try {
      const data = await signInWithApple();
      const profile = await fetchMyProfile();
      set({ session: data.session ?? get().session, profile, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Apple sign-in failed",
      });
      throw e;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await apiSignOut();
      set({ session: null, profile: null, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Sign out failed",
      });
      throw e;
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await resetPassword(email);
      set({ loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Reset failed",
      });
      throw e;
    }
  },

  resendVerification: async (email) => {
    set({ loading: true, error: null });
    try {
      await resendVerification(email);
      set({ loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Resend failed",
      });
      throw e;
    }
  },
}));
