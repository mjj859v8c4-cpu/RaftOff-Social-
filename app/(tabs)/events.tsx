import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, vibes } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { LakeSwitcher } from "@/components/map/LakeSwitcher";

const START_PRESETS = [
  { id: "tonight", label: "Tonight 6pm", offsetMs: () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d.getTime() - Date.now();
  }},
  { id: "tomorrow", label: "Tomorrow 11am", offsetMs: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(11, 0, 0, 0);
    return d.getTime() - Date.now();
  }},
  { id: "weekend", label: "Sat 1pm", offsetMs: () => {
    const d = new Date();
    const day = d.getDay();
    const add = day === 6 ? 7 : (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + add);
    d.setHours(13, 0, 0, 0);
    return d.getTime() - Date.now();
  }},
] as const;

export default function EventsScreen() {
  const events = useRaftOffStore((s) => s.events);
  const locationsForActiveLake = useRaftOffStore((s) => s.locationsForActiveLake);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const setActiveLakeId = useRaftOffStore((s) => s.setActiveLakeId);
  const rsvpEvent = useRaftOffStore((s) => s.rsvpEvent);
  const createEvent = useRaftOffStore((s) => s.createEvent);
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeName = lakes.find((l) => l.id === activeLakeId)?.name ?? "Lake";
  const locations = locationsForActiveLake();

  const lakeEvents = useMemo(
    () => events.filter((e) => e.lake_id === activeLakeId),
    [events, activeLakeId]
  );

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [category, setCategory] = useState("party");
  const [whenId, setWhenId] = useState<(typeof START_PRESETS)[number]["id"]>("tomorrow");

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
        <View style={styles.switcher}>
        <LakeSwitcher value={activeLakeId} onChange={setActiveLakeId} />
      </View>
      <View style={styles.header}>
        <Text style={styles.sub}>Events on {lakeName}</Text>
        <Pressable style={styles.ghost} onPress={() => setCreating((v) => !v)}>
          <Text style={styles.ghostText}>{creating ? "Close" : "Create"}</Text>
        </Pressable>
      </View>

      {creating ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Event title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />
          <ScrollChips
            items={locations.slice(0, 24).map((l) => ({ id: l.id, label: l.name }))}
            value={locationId || locations[0]?.id || ""}
            onChange={setLocationId}
          />
          <ScrollChips
            items={vibes.map((v) => ({ id: v.id, label: v.label }))}
            value={category}
            onChange={setCategory}
          />
          <ScrollChips
            items={START_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
            value={whenId}
            onChange={(id) => setWhenId(id as typeof whenId)}
          />
          <Pressable
            style={styles.primary}
            onPress={() => {
              const loc = locationId || locations[0]?.id;
              if (!title.trim() || !loc) return;
              const preset = START_PRESETS.find((p) => p.id === whenId) ?? START_PRESETS[1];
              createEvent({
                title: title.trim(),
                locationId: loc,
                category,
                startsAt: new Date(Date.now() + preset.offsetMs()).toISOString(),
              });
              setTitle("");
              setCreating(false);
            }}
          >
            <Text style={styles.primaryText}>Publish event</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={lakeEvents}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No events on {lakeName} yet — create the first one.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {new Date(item.starts_at).toLocaleString()} · {item.location?.name} ·{" "}
              {item.category} · {item.rsvp_count ?? 0} going
            </Text>
            <Pressable
              style={[styles.primary, item.going && styles.ghost]}
              onPress={() => rsvpEvent(item.id, !item.going)}
            >
              <Text style={[styles.primaryText, item.going && styles.ghostText]}>
                {item.going ? "Going ✓" : "RSVP Going"}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function ScrollChips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => onChange(item.id)}
          style={[styles.chip, value === item.id && styles.chipOn]}
        >
          <Text style={styles.chipText}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  switcher: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sub: { color: colors.muted, flex: 1, paddingRight: 12 },
  form: { padding: spacing.lg, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.bgElevated,
    minHeight: 44,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipOn: {
    borderColor: "rgba(46,183,224,0.6)",
    backgroundColor: "rgba(46,183,224,0.15)",
  },
  chipText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  card: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: spacing.md },
  title: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13, marginBottom: 10 },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryText: { color: "#041018", fontWeight: "800" },
  ghost: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "transparent",
    borderRadius: 10,
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { color: colors.text, fontWeight: "700" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 32 },
});
