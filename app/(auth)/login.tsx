import React, { useState } from "react";
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

export default function AuthScreen() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const resendVerification = useAuthStore((s) => s.resendVerification);

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  if (session) return <Redirect href="/(tabs)/map" />;

  const onSubmit = async () => {
    try {
      if (mode === "reset") {
        await resetPassword(email);
        Alert.alert("Check your email", "Password reset link sent.");
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        await signUp(email, password, displayName || "Boater");
        Alert.alert(
          "Verify your email",
          "We sent a verification link. You can resend it from this screen if needed."
        );
        return;
      }
      await signIn(email, password);
      router.replace("/(tabs)/map");
    } catch {
      // error surfaced via store
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inner}
      >
        <Text style={styles.brand}>RaftOff Social</Text>
        <Text style={styles.sub}>Find Your Crew. Find Your Spot.</Text>

        {!isSupabaseConfigured ? (
          <Text style={styles.warn}>
            Supabase env vars are missing. Set EXPO_PUBLIC_SUPABASE_URL and
            EXPO_PUBLIC_SUPABASE_ANON_KEY before production use.
          </Text>
        ) : null}

        {mode === "signup" ? (
          <TextInput
            style={styles.input}
            placeholder="Display name"
            placeholderTextColor={colors.muted}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {mode !== "reset" ? (
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primary} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
            </Text>
          )}
        </Pressable>

        {mode === "signin" ? (
          <>
            <Pressable style={styles.oauth} onPress={() => signInGoogle().catch(() => {})}>
              <Text style={styles.oauthText}>Continue with Google</Text>
            </Pressable>
            <Pressable style={styles.oauth} onPress={() => signInApple().catch(() => {})}>
              <Text style={styles.oauthText}>Continue with Apple</Text>
            </Pressable>
          </>
        ) : null}

        <View style={styles.links}>
          {mode !== "signup" ? (
            <Pressable onPress={() => setMode("signup")}>
              <Text style={styles.link}>Create account</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setMode("signin")}>
              <Text style={styles.link}>Have an account? Sign in</Text>
            </Pressable>
          )}
          {mode !== "reset" ? (
            <Pressable onPress={() => setMode("reset")}>
              <Text style={styles.link}>Forgot password</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() =>
              resendVerification(email).then(() =>
                Alert.alert("Sent", "Verification email resent.")
              )
            }
          >
            <Text style={styles.link}>Resend verification</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.xl, justifyContent: "center", gap: spacing.md },
  brand: { color: colors.text, fontSize: 32, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: spacing.lg },
  warn: { color: "#FBBF24", marginBottom: spacing.md },
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
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  oauth: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  oauthText: { color: colors.text, fontWeight: "600" },
  links: { gap: 12, marginTop: spacing.md },
  link: { color: colors.active, fontWeight: "600" },
  error: { color: "#F87171" },
});
