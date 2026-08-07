import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { suggestUsernameFromEmail } from "@/features/profiles/api";

function friendlyAuthError(raw: string | null): string | null {
  if (!raw) return null;
  const m = raw.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "That email or password doesn’t match. Try again, or reset your password.";
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Confirm your email first — tap Resend verification below, then sign in.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "That email already has an account. Sign in instead.";
  }
  if (m.includes("password") && (m.includes("least") || m.includes("short") || m.includes("weak"))) {
    return "Use a password with at least 6 characters.";
  }
  if (m.includes("rate") || m.includes("too many")) {
    return "Too many attempts — wait a moment and try again.";
  }
  return raw;
}

export default function AuthScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [pendingVerify, setPendingVerify] = useState(false);

  const suggestedName = useMemo(() => {
    const base = suggestUsernameFromEmail(email);
    if (!base) return "";
    return base
      .split(/[_]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }, [email]);

  useEffect(() => {
    if (mode === "signup" && !nameTouched && suggestedName) {
      setDisplayName(suggestedName);
    }
  }, [mode, nameTouched, suggestedName]);

  if (session) {
    const dest = profile?.onboarding_completed
      ? "/(tabs)/map"
      : "/(auth)/onboarding";
    return <Redirect href={dest as never} />;
  }

  const setModeClean = (next: "signin" | "signup" | "reset") => {
    clearError();
    setPendingVerify(false);
    setMode(next);
  };

  const onSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert("Email needed", "Enter your email to continue.");
      return;
    }
    if (mode !== "reset" && password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }
    try {
      if (mode === "reset") {
        await resetPassword(trimmedEmail);
        Alert.alert("Check your email", "We sent a password reset link.");
        setModeClean("signin");
        return;
      }
      if (mode === "signup") {
        const name = displayName.trim() || suggestedName || "Boater";
        await signUp(trimmedEmail, password, name);
        const nextSession = useAuthStore.getState().session;
        if (nextSession) {
          router.replace("/(auth)/onboarding" as never);
          return;
        }
        setPendingVerify(true);
        setMode("signin");
        return;
      }
      await signIn(trimmedEmail, password);
      const done = useAuthStore.getState().profile?.onboarding_completed;
      router.replace((done ? "/(tabs)/map" : "/(auth)/onboarding") as never);
    } catch {
      // error surfaced via store
    }
  };

  const headline =
    mode === "signup"
      ? "Jump in free"
      : mode === "reset"
        ? "Reset password"
        : "Welcome back";
  const sub =
    mode === "signup"
      ? "Create an account in under a minute. You can explore the map right after."
      : mode === "reset"
        ? "We’ll email you a reset link."
        : pendingVerify
          ? "Confirm your email, then sign in to open the lakes."
          : "Sign in to find your crew and spot.";

  const friendly = friendlyAuthError(error);

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <Text style={styles.brand}>RaftOff Social</Text>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.sub}>{sub}</Text>

        {!isSupabaseConfigured ? (
          <Text style={styles.warn}>
            Supabase env vars are missing. Set EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_ANON_KEY before production use.
          </Text>
        ) : null}

        {pendingVerify ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>You’re almost in</Text>
            <Text style={styles.bannerBody}>
              We sent a verification link to {email.trim() || "your email"}. Open it,
              then sign in below.
            </Text>
          </View>
        ) : null}

        {mode === "signup" ? (
          <>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={styles.input}
              placeholder="What should people call you?"
              placeholderTextColor={colors.muted}
              value={displayName}
              onChangeText={(t) => {
                setNameTouched(true);
                setDisplayName(t);
              }}
              autoCapitalize="words"
              autoComplete="name"
            />
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={(t) => {
            clearError();
            setEmail(t);
          }}
        />

        {mode !== "reset" ? (
          <>
            <Text style={styles.label}>
              Password{mode === "signup" ? " · min 6 characters" : ""}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={mode === "signup" ? "Create a password" : "Your password"}
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoComplete={mode === "signup" ? "new-password" : "password"}
              value={password}
              onChangeText={(t) => {
                clearError();
                setPassword(t);
              }}
            />
          </>
        ) : null}

        {friendly ? <Text style={styles.error}>{friendly}</Text> : null}

        <Pressable style={styles.primary} onPress={() => void onSubmit()} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
            </Text>
          )}
        </Pressable>

        {mode !== "reset" ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>
            <Pressable
              style={styles.oauth}
              onPress={() =>
                signInGoogle()
                  .then(() => {
                    const done = useAuthStore.getState().profile?.onboarding_completed;
                    router.replace((done ? "/(tabs)/map" : "/(auth)/onboarding") as never);
                  })
                  .catch(() => {})
              }
              disabled={loading}
            >
              <Text style={styles.oauthText}>Continue with Google</Text>
            </Pressable>
            <Pressable
              style={styles.oauth}
              onPress={() =>
                signInApple()
                  .then(() => {
                    const done = useAuthStore.getState().profile?.onboarding_completed;
                    router.replace((done ? "/(tabs)/map" : "/(auth)/onboarding") as never);
                  })
                  .catch(() => {})
              }
              disabled={loading}
            >
              <Text style={styles.oauthText}>Continue with Apple</Text>
            </Pressable>
          </>
        ) : null}

        <View style={styles.links}>
          {mode !== "signup" ? (
            <Pressable onPress={() => setModeClean("signup")}>
              <Text style={styles.link}>New here? Create account</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setModeClean("signin")}>
              <Text style={styles.link}>Have an account? Sign in</Text>
            </Pressable>
          )}
          {mode !== "reset" ? (
            <Pressable onPress={() => setModeClean("reset")}>
              <Text style={styles.linkMuted}>Forgot password</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setModeClean("signin")}>
              <Text style={styles.link}>Back to sign in</Text>
            </Pressable>
          )}
          {mode === "signin" || pendingVerify ? (
            <Pressable
              onPress={() =>
                resendVerification(email.trim())
                  .then(() => Alert.alert("Sent", "Verification email resent."))
                  .catch(() => {})
              }
            >
              <Text style={styles.linkMuted}>Resend verification</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.xl, justifyContent: "center", gap: 8 },
  brand: { color: colors.action, fontSize: 14, fontWeight: "800", letterSpacing: 0.4 },
  headline: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 4 },
  sub: { color: colors.muted, marginBottom: spacing.md, lineHeight: 20 },
  warn: { color: "#FBBF24", marginBottom: spacing.md },
  banner: {
    backgroundColor: "rgba(46,242,200,0.1)",
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    marginBottom: 4,
  },
  bannerTitle: { color: colors.active, fontWeight: "800", fontSize: 14 },
  bannerBody: { color: colors.text, fontSize: 13, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 6 },
  input: {
    backgroundColor: "#0E1A24",
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
  },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#1F3344" },
  dividerText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  oauth: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  oauthText: { color: colors.text, fontWeight: "600" },
  links: { gap: 12, marginTop: spacing.md },
  link: { color: colors.active, fontWeight: "700" },
  linkMuted: { color: colors.muted, fontWeight: "600" },
  error: { color: "#F87171", marginTop: 4, lineHeight: 18 },
});
