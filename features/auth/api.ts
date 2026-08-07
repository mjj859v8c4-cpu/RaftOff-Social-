/**
 * Production Auth — email/password, Google, Apple, reset, verify, session persistence.
 */
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import type { Session, User, Provider } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { logger } from "@/lib/logging";
import { track } from "@/lib/analytics";

WebBrowser.maybeCompleteAuthSession();

export type AuthProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  home_lake_id: string | null;
  home_city: string | null;
  home_marina: string | null;
  role: string;
  email: string | null;
  identity_tags: string[];
  badges: string[];
  is_verified: boolean;
  onboarding_completed: boolean;
  primary_boat_id: string | null;
};

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AuthError";
  }
}

function requireClient() {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    throw new AuthError(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
      "not_configured"
    );
  }
  return supabase;
}

export async function getSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logger.warn("auth.getSession", error);
    return null;
  }
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

export async function fetchMyProfile(): Promise<AuthProfile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  // Prefer social ensure so signup always has a profiles row
  try {
    const { ensureMyProfile } = await import("@/features/profiles/api");
    const full = await ensureMyProfile({
      displayName: (user.user_metadata?.display_name as string | undefined) ?? undefined,
      email: user.email,
    });
    return {
      id: full.id,
      username: full.username,
      display_name: full.display_name,
      avatar_url: full.avatar_url ?? null,
      cover_url: full.cover_url ?? null,
      bio: full.bio ?? null,
      home_lake_id: full.home_lake_id ?? null,
      home_city: full.home_city ?? null,
      home_marina: full.home_marina ?? null,
      role: full.role ?? "user",
      email: full.email ?? user.email ?? null,
      identity_tags: full.identity_tags ?? [],
      badges: full.badges ?? [],
      is_verified: !!full.is_verified,
      onboarding_completed: !!full.onboarding_completed,
      primary_boat_id: full.primary_boat_id ?? null,
    };
  } catch (e) {
    logger.warn("auth.fetchMyProfile.ensure", e);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, cover_url, bio, home_lake_id, home_city, home_marina, role, email, identity_tags, badges, is_verified, onboarding_completed, primary_boat_id"
    )
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    logger.error("auth.fetchMyProfile", error);
    throw new AuthError(error.message, error.code);
  }
  if (!data) return null;
  return {
    ...(data as AuthProfile),
    identity_tags: (data as AuthProfile).identity_tags ?? [],
    badges: (data as AuthProfile).badges ?? [],
    is_verified: !!(data as AuthProfile).is_verified,
    onboarding_completed: !!(data as AuthProfile).onboarding_completed,
    cover_url: (data as AuthProfile).cover_url ?? null,
    home_city: (data as AuthProfile).home_city ?? null,
    home_marina: (data as AuthProfile).home_marina ?? null,
    primary_boat_id: (data as AuthProfile).primary_boat_id ?? null,
  };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: { display_name: input.displayName.trim() },
      emailRedirectTo: makeRedirectUri({ scheme: "raftoff" }),
    },
  });
  if (error) throw new AuthError(error.message, error.status?.toString());
  track("auth_sign_up", { provider: "email" });
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new AuthError(error.message, error.status?.toString());
  track("auth_sign_in", { provider: "email" });
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new AuthError(error.message);
  track("auth_sign_out", {});
}

export async function resetPassword(email: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: makeRedirectUri({ scheme: "raftoff" }),
  });
  if (error) throw new AuthError(error.message);
  track("auth_password_reset", {});
}

export async function resendVerification(email: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
  });
  if (error) throw new AuthError(error.message);
}

export async function updatePassword(newPassword: string) {
  const supabase = requireClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new AuthError(error.message);
}

async function signInWithOAuth(provider: Provider) {
  const supabase = requireClient();
  const redirectTo = makeRedirectUri({ scheme: "raftoff" });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw new AuthError(error.message);
  if (!data.url) throw new AuthError("OAuth URL missing");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !("url" in result) || !result.url) {
    throw new AuthError("OAuth cancelled", "cancelled");
  }

  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    throw new AuthError("OAuth tokens missing from redirect");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw new AuthError(sessionError.message);
  track("auth_sign_in", { provider });
  return sessionData;
}

export async function signInWithGoogle() {
  return signInWithOAuth("google");
}

export async function signInWithApple() {
  const supabase = requireClient();
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    // Web / Android fallback via OAuth
    return signInWithOAuth("apple");
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new AuthError("Apple identity token missing");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw new AuthError(error.message);
  track("auth_sign_in", { provider: "apple" });
  return data;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const supabase = getSupabase();
  if (!supabase) {
    callback(null);
    return { data: { subscription: { unsubscribe() {} } } };
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
