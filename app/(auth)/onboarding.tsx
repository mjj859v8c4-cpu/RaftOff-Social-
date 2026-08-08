import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  getConnectionStatuses,
  listInterests,
  setMyInterests,
  suggestUsernameFromDisplayName,
  suggestUsernameFromEmail,
  updateMyProfile,
  upsertMyBoat,
} from "@/features/profiles/api";
import { peopleOnMyLake, suggestedConnections, type DiscoverPerson } from "@/features/social/discover";
import { pickAndCompressImage, uploadPhoto } from "@/lib/media/upload";
import { ConnectButton } from "@/components/social/ConnectButton";
import { track } from "@/lib/analytics";
import type { ConnectionStatus, Interest } from "@/types/raftoff";

/**
 * "Create your RaftOff profile" — its own section, five skippable steps.
 * Every step saves as you leave it, so bailing out early still keeps whatever
 * you filled in. Nothing here blocks the map.
 */
const STEPS = [
  { key: "photo", label: "Photo" },
  { key: "lake", label: "Lake" },
  { key: "interests", label: "Interests" },
  { key: "boat", label: "Boat" },
  { key: "people", label: "People" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

type StatusMap = Record<string, { status: ConnectionStatus; requestId?: string }>;

export default function OnboardingScreen() {
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const lakes = useRaftOffStore((s) => s.lakes);
  const userId = session?.user?.id;

  const email = session?.user?.email ?? profile?.email ?? "";
  const emailSuggest = useMemo(() => suggestUsernameFromEmail(email), [email]);

  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [homeLakeId, setHomeLakeId] = useState<string | null>(null);
  const [interestCatalog, setInterestCatalog] = useState<Interest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [boatName, setBoatName] = useState("");
  const [boatMake, setBoatMake] = useState("");
  const [boatType, setBoatType] = useState("");
  const [people, setPeople] = useState<DiscoverPerson[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step: StepKey = STEPS[stepIndex].key;

  const defaultLakeId = useMemo(
    () => lakes.find((l) => l.slug === "lake-st-clair")?.id ?? lakes[0]?.id ?? null,
    [lakes]
  );

  useEffect(() => {
    if (!profile) return;
    setDisplayName((prev) => prev || profile.display_name || emailSuggest || "Boater");
    setAvatarUrl((prev) => prev ?? profile.avatar_url ?? null);
    setHomeLakeId((prev) => prev ?? profile.home_lake_id ?? null);
    // Signup auto-generates handles like "dale_9f2c1b" — offer a clean one instead.
    const uglyAuto =
      !!profile.username &&
      /_[a-f0-9]{6}$/i.test(profile.username) &&
      profile.username.startsWith(emailSuggest || "x");
    const clean =
      emailSuggest ||
      suggestUsernameFromDisplayName(profile.display_name) ||
      profile.username?.replace(/_[a-f0-9]{6}$/i, "") ||
      "boater";
    setUsername((prev) => prev || (uglyAuto || !profile.username ? clean : profile.username));
  }, [profile, emailSuggest]);

  useEffect(() => {
    if (homeLakeId || !defaultLakeId) return;
    setHomeLakeId(defaultLakeId);
  }, [defaultLakeId, homeLakeId]);

  useEffect(() => {
    if (step !== "interests" || interestCatalog.length) return;
    void listInterests()
      .then(setInterestCatalog)
      .catch(() => {
        /* interests are optional — the step still lets you continue */
      });
  }, [step, interestCatalog.length]);

  const loadPeople = useCallback(async () => {
    if (!userId) return;
    setPeopleLoading(true);
    try {
      const suggested = await suggestedConnections(10).catch(() => [] as DiscoverPerson[]);
      const found = suggested.length
        ? suggested
        : await peopleOnMyLake(10).catch(() => [] as DiscoverPerson[]);
      setPeople(found);
      if (found.length) {
        const map = await getConnectionStatuses(
          userId,
          found.map((p) => p.id)
        ).catch(() => ({} as StatusMap));
        setStatuses(map);
      }
    } finally {
      setPeopleLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (step !== "people" || people.length || peopleLoading) return;
    void loadPeople();
  }, [step, people.length, peopleLoading, loadPeople]);

  if (!session) return <Redirect href={"/(auth)/login" as never} />;
  if (profile?.onboarding_completed) return <Redirect href="/(tabs)/map" />;

  const cleanHandle = () =>
    (username.trim() || emailSuggest || "boater")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30) || `boater_${(userId ?? "").replace(/-/g, "").slice(0, 6)}`;

  /** Persist just the fields the current step owns, so skipping never loses data. */
  const saveStep = async (which: StepKey) => {
    if (!userId) return;
    if (which === "lake") {
      await updateMyProfile(userId, { home_lake_id: homeLakeId ?? defaultLakeId });
    } else if (which === "interests") {
      await setMyInterests(userId, selectedInterests);
    } else if (which === "boat" && boatName.trim()) {
      await upsertMyBoat({
        ownerId: userId,
        nickname: boatName.trim(),
        name: boatName.trim(),
        manufacturer: boatMake.trim() || undefined,
        boatType: boatType.trim() || undefined,
        isPrimary: true,
      });
    }
    // The photo step uploads and patches immediately, so there is nothing to flush.
  };

  const finish = async (reason: "completed" | "skipped") => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await updateMyProfile(userId, {
        display_name: displayName.trim() || "Boater",
        username: cleanHandle(),
        home_lake_id: homeLakeId ?? defaultLakeId,
        onboarding_completed: true,
      });
      await refreshProfile();
      track("profile_complete", { reason, step });
      router.replace("/(tabs)/map" as never);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const goNext = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveStep(step);
      if (stepIndex >= STEPS.length - 1) {
        await finish("completed");
        return;
      }
      setStepIndex((i) => i + 1);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const skipStep = () => {
    setError(null);
    if (stepIndex >= STEPS.length - 1) {
      void finish("completed");
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const pickAvatar = async () => {
    if (!userId) return;
    setUploading(true);
    setError(null);
    try {
      const picked = await pickAndCompressImage({ allowsEditing: true });
      if (!picked) return;
      const uploaded = await uploadPhoto({
        userId,
        bucket: "profile-photos",
        uri: picked.uri,
        purpose: "profile",
        entityType: "avatar",
        entityId: userId,
      });
      await updateMyProfile(userId, { avatar_url: uploaded.url });
      setAvatarUrl(uploaded.url);
      await refreshProfile();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id].slice(0, 12)
    );
  };

  const initials = (displayName || "You").trim().slice(0, 2).toUpperCase();
  const lastStep = stepIndex === STEPS.length - 1;
  const primaryLabel = lastStep ? "Finish — open the map" : "Continue";

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {stepIndex > 0 ? (
            <Pressable onPress={() => setStepIndex((i) => Math.max(0, i - 1))} hitSlop={12}>
              <Text style={styles.headerLink}>Back</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.headerKicker}>Create your RaftOff profile</Text>
          <Pressable onPress={() => void finish("skipped")} hitSlop={12} disabled={busy}>
            <Text style={[styles.headerLink, styles.headerSkip]}>Skip all</Text>
          </Pressable>
        </View>
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.progressSeg,
                i <= stepIndex && styles.progressSegOn,
                i === stepIndex && styles.progressSegCurrent,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>
          Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label} · every step is optional
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === "photo" ? (
            <>
              <Text style={styles.title}>Add a profile photo</Text>
              <Text style={styles.sub}>
                Start with a face or your boat — everything here is optional, and you can change your
                name and handle later in Edit Profile.
              </Text>

              <Pressable style={styles.avatarTap} onPress={() => void pickAvatar()} disabled={uploading}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarEmpty}>
                    <Text style={styles.avatarEmptyText}>{initials}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => void pickAvatar()}
                disabled={uploading}
              >
                <Text style={styles.secondaryBtnText}>
                  {uploading ? "Uploading…" : avatarUrl ? "Choose a different photo" : "Choose a photo"}
                </Text>
              </Pressable>
            </>
          ) : null}

          {step === "lake" ? (
            <>
              <Text style={styles.title}>Where’s your home lake?</Text>
              <Text style={styles.sub}>
                This sets your default map and who shows up in Discover. Michigan boaters usually
                start with Lake St. Clair.
              </Text>
              {lakes.length ? (
                <View style={styles.chipWrap}>
                  {lakes.map((l) => {
                    const on = homeLakeId === l.id;
                    return (
                      <Pressable
                        key={l.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => setHomeLakeId(l.id)}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{l.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.hint}>
                  Lakes are still loading — skip ahead and we’ll default you to Lake St. Clair.
                </Text>
              )}
            </>
          ) : null}

          {step === "interests" ? (
            <>
              <Text style={styles.title}>What are you into?</Text>
              <Text style={styles.sub}>
                Pick a few and we’ll point you at boaters who are into the same things. Three is
                plenty.
              </Text>
              {interestCatalog.length ? (
                <View style={styles.chipWrap}>
                  {interestCatalog.map((i) => {
                    const on = selectedInterests.includes(i.id);
                    return (
                      <Pressable
                        key={i.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => toggleInterest(i.id)}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{i.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.hint}>Loading the list — you can skip this and add them later.</Text>
              )}
              {selectedInterests.length ? (
                <Text style={styles.hint}>{selectedInterests.length} picked</Text>
              ) : null}
            </>
          ) : null}

          {step === "boat" ? (
            <>
              <Text style={styles.title}>Got a boat?</Text>
              <Text style={styles.sub}>
                Totally optional — crew and guests are just as welcome. Never add registration
                numbers or your exact slip.
              </Text>
              <Text style={styles.label}>Boat name or nickname</Text>
              <TextInput
                style={styles.input}
                value={boatName}
                onChangeText={setBoatName}
                placeholder="Knot Working"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.label}>Manufacturer</Text>
              <TextInput
                style={styles.input}
                value={boatMake}
                onChangeText={setBoatMake}
                placeholder="Sea Ray"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.label}>Type</Text>
              <TextInput
                style={styles.input}
                value={boatType}
                onChangeText={setBoatType}
                placeholder="Bowrider / Cruiser / Pontoon…"
                placeholderTextColor={colors.muted}
              />
              <Text style={styles.hint}>
                Leave it blank and hit Skip — you can add your boat from Edit Profile anytime.
              </Text>
            </>
          ) : null}

          {step === "people" ? (
            <>
              <Text style={styles.title}>Find your people</Text>
              <Text style={styles.sub}>
                A few boaters worth following on your lake. Connect now or come back to Discover
                later.
              </Text>
              {peopleLoading ? (
                <ActivityIndicator color={colors.action} style={{ marginTop: 24 }} />
              ) : people.length ? (
                <View style={styles.peopleList}>
                  {people.map((p) => (
                    <View key={p.id} style={styles.personRow}>
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={styles.personAvatar} />
                      ) : (
                        <View style={[styles.personAvatar, styles.personAvatarFallback]}>
                          <Text style={styles.personAvatarText}>
                            {(p.display_name ?? "?").slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.personName} numberOfLines={1}>
                          {p.display_name}
                          {p.is_verified ? " ✓" : ""}
                        </Text>
                        <Text style={styles.personMeta} numberOfLines={1}>
                          {p.home_city ? p.home_city : `@${p.username}`}
                          {p.shared_interests ? ` · ${p.shared_interests} shared` : ""}
                        </Text>
                      </View>
                      {userId ? (
                        <ConnectButton
                          meId={userId}
                          targetId={p.id}
                          status={statuses[p.id]?.status ?? "none"}
                          requestId={statuses[p.id]?.requestId}
                          onChange={(next) => setStatuses((prev) => ({ ...prev, [p.id]: next }))}
                          compact
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.hint}>
                  It’s early on your lake — you’ll be one of the first. Head to the map and check in
                  to get on the radar.
                </Text>
              )}
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.primary} onPress={() => void goNext()} disabled={busy}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            )}
          </Pressable>
          {!lastStep ? (
            <Pressable style={styles.skip} onPress={skipStep} disabled={busy}>
              <Text style={styles.skipText}>Skip this step</Text>
            </Pressable>
          ) : (
            <View style={styles.skip} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Couldn’t save — try again";
  const lower = msg.toLowerCase();
  if (lower.includes("unique") || lower.includes("duplicate")) {
    return "That username is taken — try another.";
  }
  if (lower.includes("permission")) {
    return "We need photo access to upload a picture. You can skip this step.";
  }
  return msg;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 10,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerKicker: { color: colors.action, fontWeight: "800", fontSize: 13, letterSpacing: 0.2 },
  headerLink: { color: colors.muted, fontWeight: "700", fontSize: 13, minWidth: 40 },
  headerSkip: { textAlign: "right" },
  progress: { flexDirection: "row", gap: 5 },
  progressSeg: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressSegOn: { backgroundColor: colors.action },
  progressSegCurrent: { backgroundColor: colors.actionStrong },
  progressLabel: { color: colors.muted, fontSize: 11.5, fontWeight: "600" },
  body: { padding: spacing.xl, paddingTop: spacing.xl, gap: 6, flexGrow: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.4 },
  sub: { color: colors.muted, lineHeight: 20, marginTop: 6, marginBottom: spacing.md },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 12 },
  input: {
    backgroundColor: "#0E1A24",
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginTop: 4,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10, lineHeight: 17 },
  avatarTap: { alignSelf: "center", marginTop: 6 },
  avatarImg: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: colors.action,
    backgroundColor: colors.bgElevated,
  },
  avatarEmpty: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmptyText: { color: "#fff", fontWeight: "800", fontSize: 38 },
  secondaryBtn: {
    marginTop: 18,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  secondaryBtnText: { color: colors.action, fontWeight: "800", fontSize: 13 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "rgba(18,32,51,0.8)",
  },
  chipOn: { borderColor: colors.action, backgroundColor: "rgba(255,61,130,0.15)" },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  chipTextOn: { color: colors.text },
  peopleList: { marginTop: 4 },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  personAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgElevated },
  personAvatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  personAvatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  personName: { color: colors.text, fontWeight: "800", fontSize: 14.5 },
  personMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  error: { color: "#ff8fa8", marginTop: 14, lineHeight: 18 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  skip: { alignItems: "center", paddingVertical: 14, minHeight: 48 },
  skipText: { color: colors.muted, fontWeight: "700" },
});
