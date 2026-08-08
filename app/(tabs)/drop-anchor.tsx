import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing, vibes, type VibeId } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { dropAnchorSchema, type DurationChoice } from "@/lib/validation";
import type { Audience, Precision } from "@/types/raftoff";
import { requestForegroundLocation } from "@/lib/permissions/location";
import { DURATION_CHOICES, resolveDurationMinutes } from "@/lib/time/duration";
import { SafetyBanner } from "@/components/safety/SafetyBanner";

const AUDIENCES: Audience[] = ["public", "followers", "friends", "crew", "private"];
const PRECISIONS: { id: Precision; label: string }[] = [
  { id: "location", label: "Location only (recommended)" },
  { id: "approx", label: "Approximate area" },
  { id: "exact_group", label: "Exact for trusted group" },
  { id: "hidden", label: "Hidden from map" },
];

export default function DropAnchorScreen() {
  const params = useLocalSearchParams<{ locationId?: string }>();
  const locations = useRaftOffStore((s) => s.locations);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const dropAnchor = useRaftOffStore((s) => s.dropAnchor);
  const activeMineId = useRaftOffStore((s) => s.activeMineId);
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const endCheckIn = useRaftOffStore((s) => s.endCheckIn);
  const extendCheckIn = useRaftOffStore((s) => s.extendCheckIn);
  const lakes = useRaftOffStore((s) => s.lakes);
  const activeLake = lakes.find((l) => l.id === activeLakeId);
  const lakeName = activeLake?.name ?? "Lake";
  const lakeTimezone = activeLake?.timezone ?? "America/Detroit";

  const checkInCapable = useMemo(
    () =>
      locations.filter((l) => {
        const supports = l.attributes?.supportsCheckIn;
        const onLake = !activeLakeId || l.lake_id === activeLakeId;
        return onLake && supports !== false && !["region", "channel"].includes(l.type);
      }),
    [locations, activeLakeId]
  );

  const [locationId, setLocationId] = useState(
    params.locationId ?? checkInCapable[0]?.id ?? ""
  );
  const [vibe, setVibe] = useState<VibeId>("chill");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("public");
  const [precision, setPrecision] = useState<Precision>("location");
  const [durationChoice, setDurationChoice] = useState<DurationChoice>("120");
  const [postToFeed, setPostToFeed] = useState(true);

  useEffect(() => {
    if (params.locationId) setLocationId(params.locationId);
  }, [params.locationId]);

  useEffect(() => {
    // Soft ask once on Drop Anchor — location helps nearby suggestions later; not required to check in.
    void requestForegroundLocation();
  }, []);

  const activeMine = checkIns.find((c) => c.id === activeMineId && c.status === "active");

    const onSubmit = async () => {
    const durationMinutes = resolveDurationMinutes(durationChoice, lakeTimezone);
    const parsed = dropAnchorSchema.safeParse({
      locationId,
      vibe,
      message,
      audience,
      precision,
      durationMinutes,
      durationChoice,
      postToFeed,
    });
    if (!parsed.success) {
      Alert.alert("Check your Anchor", parsed.error.errors[0]?.message ?? "Invalid form");
      return;
    }
    try {
      await dropAnchor(parsed.data);
      Alert.alert("You're anchored", "Presence will expire automatically.", [
        {
          text: "See who's here",
          onPress: () =>
            router.push({
              pathname: "/(tabs)/map",
              params: { locationId: parsed.data.locationId },
            } as never),
        },
        { text: "View map", onPress: () => router.push("/(tabs)/map") },
      ]);
    } catch (e) {
      Alert.alert("Could not Drop Anchor", e instanceof Error ? e.message : "Try again");
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Temporary check-in on {lakeName}. You control vibe, audience, precision, and duration.
      </Text>

      <SafetyBanner variant="check_in" />

      {activeMine ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTitle}>You’re anchored here</Text>
          <Text style={styles.activeBody}>
            {activeMine.location?.name} · {activeMine.vibe} · ends{" "}
            {new Date(activeMine.expires_at).toLocaleTimeString()}
          </Text>
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={() => extendCheckIn(activeMine.id, 60)}>
              <Text style={styles.secondaryText}>Extend +1h</Text>
            </Pressable>
            <Pressable style={styles.danger} onPress={() => endCheckIn(activeMine.id)}>
              <Text style={styles.secondaryText}>End</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={styles.label}>Location</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {checkInCapable.slice(0, 24).map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setLocationId(l.id)}
            style={[styles.chip, locationId === l.id && styles.chipOn]}
          >
            <Text style={styles.chipText}>{l.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Vibe</Text>
      <View style={styles.grid}>
        {vibes.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => setVibe(v.id)}
            style={[styles.vibe, vibe === v.id && styles.chipOn]}
          >
            <View style={[styles.vibeDot, { backgroundColor: v.color }]} />
            <Text style={styles.chipText}>{v.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Message (optional)</Text>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        maxLength={180}
        placeholder="Calm water, room to raft up…"
        placeholderTextColor={colors.muted}
        multiline
      />

      <Text style={styles.label}>Audience</Text>
      <View style={styles.rowWrap}>
        {AUDIENCES.map((a) => (
          <Pressable
            key={a}
            onPress={() => setAudience(a)}
            style={[styles.chip, audience === a && styles.chipOn]}
          >
            <Text style={styles.chipText}>{a}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Precision</Text>
      {PRECISIONS.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setPrecision(p.id)}
          style={[styles.option, precision === p.id && styles.chipOn]}
        >
          <Text style={styles.chipText}>{p.label}</Text>
        </Pressable>
      ))}

      <Text style={styles.label}>Duration</Text>
      <View style={styles.rowWrap}>
        {DURATION_CHOICES.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setDurationChoice(d.id)}
            style={[styles.chip, durationChoice === d.id && styles.chipOn]}
          >
            <Text style={styles.chipText}>{d.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        You can end your check-in manually anytime — it also expires automatically.
      </Text>

      <Pressable style={styles.check} onPress={() => setPostToFeed((v) => !v)}>
        <Text style={styles.chipText}>
          {postToFeed ? "✓" : "○"} Also post to location & lake feed
        </Text>
      </Pressable>

      <Pressable style={styles.primary} onPress={onSubmit}>
        <Text style={styles.primaryText}>Drop Anchor</Text>
      </Pressable>
      <Text style={styles.hint}>
        Check-ins expire automatically. Exact fishing GPS is never public.
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48, gap: 8 },
  lead: { color: colors.muted, marginBottom: 8 },
  label: { color: "#9FD3E8", fontWeight: "700", fontSize: 12, marginTop: 10 },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.bgElevated,
  },
  row: { gap: 8 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  vibe: {
    width: "48%",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  vibeDot: { width: 10, height: 10, borderRadius: 5 },
  chipOn: {
    borderColor: "rgba(46,183,224,0.6)",
    backgroundColor: "rgba(46,183,224,0.15)",
  },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  check: { marginTop: 12, marginBottom: 8 },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryText: { color: "#041018", fontWeight: "800", fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  danger: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryText: { color: colors.text, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 12, marginTop: 8 },
  activeBanner: {
    borderWidth: 1,
    borderColor: "rgba(61,207,142,0.4)",
    backgroundColor: "rgba(61,207,142,0.12)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  activeTitle: { color: colors.text, fontWeight: "800" },
  activeBody: { color: colors.muted, fontSize: 13 },
});
