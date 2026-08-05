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
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing, vibes, type VibeId } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { dropAnchorSchema } from "@/lib/validation";
import type { Audience, Precision } from "@/types/raftoff";
import { getLakeById } from "@/supabase/seed/michigan-lakes";

const AUDIENCES: Audience[] = ["public", "followers", "friends", "crew", "private"];
const PRECISIONS: { id: Precision; label: string }[] = [
  { id: "location", label: "Location only (recommended)" },
  { id: "approx", label: "Approximate area" },
  { id: "exact_group", label: "Exact for trusted group" },
  { id: "hidden", label: "Hidden from map" },
];
const DURATIONS = [
  { minutes: 30 as const, label: "30 min" },
  { minutes: 60 as const, label: "1 hour" },
  { minutes: 120 as const, label: "2 hours" },
  { minutes: 240 as const, label: "4 hours" },
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
  const lake = getLakeById(activeLakeId);

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
  const [durationMinutes, setDurationMinutes] = useState<30 | 60 | 120 | 240>(120);
  const [postToFeed, setPostToFeed] = useState(true);

  useEffect(() => {
    if (params.locationId) setLocationId(params.locationId);
  }, [params.locationId]);

  const activeMine = checkIns.find((c) => c.id === activeMineId && c.status === "active");

  const onSubmit = () => {
    const parsed = dropAnchorSchema.safeParse({
      locationId,
      vibe,
      message,
      audience,
      precision,
      durationMinutes,
      postToFeed,
    });
    if (!parsed.success) {
      Alert.alert("Check your Anchor", parsed.error.errors[0]?.message ?? "Invalid form");
      return;
    }
    dropAnchor(parsed.data);
    Alert.alert("You’re anchored", "Presence will expire automatically.", [
      { text: "View map", onPress: () => router.push("/(tabs)/map") },
    ]);
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>
        Temporary check-in on {lake.name}. You control vibe, audience, precision, and duration.
      </Text>

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
        {DURATIONS.map((d) => (
          <Pressable
            key={d.minutes}
            onPress={() => setDurationMinutes(d.minutes)}
            style={[styles.chip, durationMinutes === d.minutes && styles.chipOn]}
          >
            <Text style={styles.chipText}>{d.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.check} onPress={() => setPostToFeed((v) => !v)}>
        <Text style={styles.chipText}>
          {postToFeed ? "✓" : "○"} Also post to location & lake feed
        </Text>
      </Pressable>

      <Pressable style={styles.primary} onPress={onSubmit}>
        <Text style={styles.primaryText}>Drop Anchor</Text>
      </Pressable>
      <Text style={styles.hint}>
        Check-ins expire automatically on the server schedule. Exact fishing GPS is never public.
      </Text>
    </ScrollView>
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
