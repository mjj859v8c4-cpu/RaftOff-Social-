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
  bio: string | null;
  home_lake_id: string | null;
  role: string;
  email: string | null;
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
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio, home_lake_id, role, email")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    logger.error("auth.fetchMyProfile", error);
    throw new AuthError(error.message, error.code);
  }
  return data as AuthProfile | null;
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
