import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import { createCrew, joinCrew, leaveCrew, listCrews, listMyCrewIds } from "@/features/crews/api";
import type { Crew } from "@/types/raftoff";

export default function CrewsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [myCrewIds, setMyCrewIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, mine] = await Promise.all([
        listCrews(),
        userId ? listMyCrewIds(userId) : Promise.resolve([]),
      ]);
      setCrews(list);
      setMyCrewIds(new Set(mine));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load crews");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleJoin = async (crew: Crew) => {
    if (!userId) return;
    setBusyId(crew.id);
    const joined = myCrewIds.has(crew.id);
    try {
      if (joined) {
        await leaveCrew(crew.id, userId);
        setMyCrewIds((prev) => {
          const next = new Set(prev);
          next.delete(crew.id);
          return next;
        });
      } else {
        await joinCrew(crew.id, userId);
        setMyCrewIds((prev) => new Set(prev).add(crew.id));
      }
      setCrews((prev) =>
        prev.map((c) =>
          c.id === crew.id
            ? { ...c, member_count: Math.max(0, (c.member_count ?? 0) + (joined ? -1 : 1)) }
            : c
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update crew");
    } finally {
      setBusyId(null);
    }
  };

  const submitCreate = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const crew = await createCrew({
        name,
        description,
        lakeId: activeLakeId,
        createdBy: userId,
      });
      setCrews((prev) => [crew, ...prev]);
      setMyCrewIds((prev) => new Set(prev).add(crew.id));
      setName("");
      setDescription("");
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create crew");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Crews</Text>
        <Pressable onPress={() => setCreating((v) => !v)} hitSlop={12}>
          <Text style={[styles.link, styles.accent]}>{creating ? "Close" : "New"}</Text>
        </Pressable>
      </View>

      <Text style={styles.hint}>
        Small groups for your regular raft-up — chill together, plan around a boat, or just keep
        your people close.
      </Text>

      {creating ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Crew name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="What's this crew about? (optional)"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
          />
          <Pressable
            style={styles.primary}
            disabled={saving || !name.trim()}
            onPress={() => void submitCreate()}
          >
            <Text style={styles.primaryText}>{saving ? "Creating…" : "Create crew"}</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={crews}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No crews yet</Text>
              <Text style={styles.emptyBody}>
                Be the first to start one — tap “New” above.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const joined = myCrewIds.has(item.id);
            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>
                    {item.member_count ?? 0} member{item.member_count === 1 ? "" : "s"}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardBody} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  style={[styles.joinBtn, joined && styles.joinBtnOn]}
                  disabled={!userId || busyId === item.id}
                  onPress={() => void toggleJoin(item)}
                >
                  <Text style={[styles.joinBtnText, joined && styles.joinBtnTextOn]}>
                    {busyId === item.id ? "…" : joined ? "Joined ✓" : "Join"}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 16 },
  link: { color: colors.muted, fontWeight: "600" },
  accent: { color: colors.action },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, padding: spacing.lg, paddingBottom: 4 },
  form: { paddingHorizontal: spacing.lg, gap: 10, paddingBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.bgElevated,
    minHeight: 44,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: "top" },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#041018", fontWeight: "800" },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginBottom: 4 },
  list: { padding: spacing.lg, paddingTop: 8, gap: 10, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.bgElevated,
  },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cardBody: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 16 },
  joinBtn: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  joinBtnOn: { borderColor: "rgba(46,242,200,0.5)", backgroundColor: "rgba(46,242,200,0.1)" },
  joinBtnText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  joinBtnTextOn: { color: colors.active },
  empty: { alignItems: "center", marginTop: 60, gap: 6, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  emptyBody: { color: colors.muted, textAlign: "center", lineHeight: 18 },
});
