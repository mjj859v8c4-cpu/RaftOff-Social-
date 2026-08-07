import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import {
  suggestUsernameFromEmail,
  suggestUsernameFromDisplayName,
  updateMyProfile,
} from "@/features/profiles/api";

/**
 * Lightweight first-run setup: display name + username.
 * Home lake defaults to Lake St. Clair. Photo is intentionally deferred.
 * Fully skippable — lands on the map either way.
 */
export default function OnboardingScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const lakes = useRaftOffStore((s) => s.lakes);

  const email = session?.user?.email ?? profile?.email ?? "";
  const emailSuggest = useMemo(() => suggestUsernameFromEmail(email), [email]);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [userTouched, setUserTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultLakeId = useMemo(
    () => lakes.find((l) => l.slug === "lake-st-clair")?.id ?? lakes[0]?.id ?? null,
    [lakes]
  );

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || emailSuggest || "Boater");
    const uglyAuto =
      !!profile.username &&
      /_[a-f0-9]{6}$/i.test(profile.username) &&
      profile.username.startsWith(emailSuggest || "x");
    const clean =
      emailSuggest ||
      suggestUsernameFromDisplayName(profile.display_name) ||
      profile.username?.replace(/_[a-f0-9]{6}$/i, "") ||
      "boater";
    setUsername(uglyAuto || !profile.username ? clean : profile.username);
  }, [profile, emailSuggest]);

  useEffect(() => {
    if (userTouched) return;
    const fromName = suggestUsernameFromDisplayName(displayName);
    if (fromName) setUsername(fromName);
  }, [displayName, userTouched]);

  if (!session) return <Redirect href={"/(auth)/login" as never} />;
  if (profile?.onboarding_completed) return <Redirect href="/(tabs)/map" />;

  const finish = async () => {
    if (!session.user.id) return;
    setSaving(true);
    setError(null);
    try {
      const name = displayName.trim() || "Boater";
      const handle = (username.trim() || emailSuggest || "boater")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 30);
      await updateMyProfile(session.user.id, {
        display_name: name,
        username: handle || `boater_${session.user.id.replace(/-/g, "").slice(0, 6)}`,
        home_lake_id: profile?.home_lake_id ?? defaultLakeId,
        onboarding_completed: true,
      });
      await refreshProfile();
      router.replace("/(tabs)/map" as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn’t save — try again";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        setError("That username is taken — try another.");
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.kicker}>You’re in</Text>
          <Text style={styles.title}>Quick setup</Text>
          <Text style={styles.sub}>
            Just a name so the crew can find you. Photo and the rest can wait —
            jump to the map whenever you’re ready.
          </Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name on RaftOff"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={(t) => {
              setUserTouched(true);
              setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30));
            }}
            placeholder={emailSuggest || "yourhandle"}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Suggested from your email. You can change it later in Edit Profile.
          </Text>

          <View style={styles.lakeCard}>
            <Text style={styles.lakeLabel}>Home lake</Text>
            <Text style={styles.lakeName}>
              {lakes.find((l) => l.id === (profile?.home_lake_id ?? defaultLakeId))?.name ??
                "Lake St. Clair"}
            </Text>
            <Text style={styles.lakeHint}>Default for Michigan — change anytime.</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={styles.primary}
            onPress={() => void finish()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Open the map</Text>
            )}
          </Pressable>

          <Pressable style={styles.skip} onPress={() => void finish()} disabled={saving}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: spacing.xl, paddingTop: spacing.xxl ?? 40, gap: 6 },
  kicker: { color: colors.active, fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", marginTop: 2 },
  sub: { color: colors.muted, lineHeight: 20, marginBottom: spacing.lg },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 10 },
  input: {
    backgroundColor: "#0E1A24",
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  lakeCard: {
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,61,130,0.35)",
    backgroundColor: "rgba(255,61,130,0.08)",
    padding: 14,
    gap: 2,
  },
  lakeLabel: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  lakeName: { color: colors.text, fontSize: 17, fontWeight: "800" },
  lakeHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  error: { color: "#F87171", marginTop: 10 },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 22,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  skip: { alignItems: "center", paddingVertical: 16 },
  skipText: { color: colors.muted, fontWeight: "700" },
});
