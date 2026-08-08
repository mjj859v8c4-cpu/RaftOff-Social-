import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
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
import { listConnectionProfiles } from "@/features/profiles/api";
import {
  createCrew,
  getCrewChatId,
  inviteToCrew,
  joinCrew,
  leaveCrew,
  listCrewMembers,
  listCrews,
  listMyCrewIds,
} from "@/features/crews/api";
import type { Crew, Profile } from "@/types/raftoff";
import { Avatar } from "@/components/social/Avatar";

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
  const [privateCrew, setPrivateCrew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteCrew, setInviteCrew] = useState<Crew | null>(null);
  const [connections, setConnections] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, mine] = await Promise.all([
        listCrews(activeLakeId ?? undefined, userId ?? undefined),
        userId ? listMyCrewIds(userId) : Promise.resolve([]),
      ]);
      setCrews(list);
      setMyCrewIds(new Set(mine));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load crews");
    } finally {
      setLoading(false);
    }
  }, [userId, activeLakeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openInvite = async (crew: Crew) => {
    if (!userId) return;
    setInviteCrew(crew);
    setError(null);
    try {
      const [conn, mem] = await Promise.all([
        listConnectionProfiles(userId),
        listCrewMembers(crew.id),
      ]);
      setConnections(conn);
      setMembers(mem);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load connections");
    }
  };

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

  const openChat = async (crew: Crew) => {
    const chatId = crew.conversation_id ?? (await getCrewChatId(crew.id));
    if (chatId) router.push(`/messages/${chatId}` as never);
    else setError("Crew chat not ready yet");
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
        visibility: privateCrew ? "private" : "public",
      });
      setCrews((prev) => [crew, ...prev]);
      setMyCrewIds((prev) => new Set(prev).add(crew.id));
      setName("");
      setDescription("");
      setCreating(false);
      if (privateCrew && crew.conversation_id) {
        router.push(`/messages/${crew.conversation_id}` as never);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create crew");
    } finally {
      setSaving(false);
    }
  };

  const memberIds = new Set(members.map((m) => m.id));

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
        Private crews for your raft-up circle — group chat, invite connections, keep your
        people close.
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
          <Pressable style={styles.checkRow} onPress={() => setPrivateCrew((v) => !v)}>
            <Text style={styles.checkText}>
              {privateCrew ? "✓" : "○"} Private crew + group chat
            </Text>
          </Pressable>
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
                Start a private crew — tap New above.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const joined = myCrewIds.has(item.id);
            const isPrivate = item.visibility === "private";
            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    {isPrivate ? (
                      <Text style={styles.privateBadge}>Private</Text>
                    ) : null}
                  </View>
                  <Text style={styles.cardMeta}>
                    {item.member_count ?? 0} captain{item.member_count === 1 ? "" : "s"}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardBody} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  {joined && item.conversation_id ? (
                    <Pressable style={styles.chatBtn} onPress={() => void openChat(item)}>
                      <Text style={styles.chatBtnText}>Chat</Text>
                    </Pressable>
                  ) : null}
                  {joined && (item.my_role === "owner" || item.my_role === "admin") ? (
                    <Pressable style={styles.inviteBtn} onPress={() => void openInvite(item)}>
                      <Text style={styles.inviteBtnText}>Invite</Text>
                    </Pressable>
                  ) : null}
                  {!isPrivate ? (
                    <Pressable
                      style={[styles.joinBtn, joined && styles.joinBtnOn]}
                      disabled={!userId || busyId === item.id}
                      onPress={() => void toggleJoin(item)}
                    >
                      <Text style={[styles.joinBtnText, joined && styles.joinBtnTextOn]}>
                        {busyId === item.id ? "…" : joined ? "Joined ✓" : "Join"}
                      </Text>
                    </Pressable>
                  ) : joined ? (
                    <Text style={styles.joinedLabel}>Member</Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!inviteCrew} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Invite to {inviteCrew?.name}</Text>
            <Text style={styles.modalHint}>Connections only</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {connections
                .filter((c) => c.id !== userId && !memberIds.has(c.id))
                .map((c) => (
                  <View key={c.id} style={styles.inviteRow}>
                    <Avatar uri={c.avatar_url} name={c.display_name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inviteName}>{c.display_name}</Text>
                      <Text style={styles.inviteHandle}>@{c.username}</Text>
                    </View>
                    <Pressable
                      style={styles.inviteAdd}
                      disabled={inviteBusy === c.id}
                      onPress={() => {
                        if (!inviteCrew) return;
                        setInviteBusy(c.id);
                        void inviteToCrew(inviteCrew.id, c.id)
                          .then(() => setMembers((prev) => [...prev, c]))
                          .catch((e) =>
                            setError(e instanceof Error ? e.message : "Invite failed")
                          )
                          .finally(() => setInviteBusy(null));
                      }}
                    >
                      <Text style={styles.inviteAddText}>
                        {inviteBusy === c.id ? "…" : "Add"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setInviteCrew(null)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  checkRow: { paddingVertical: 4 },
  checkText: { color: colors.text, fontWeight: "600", fontSize: 13 },
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
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 15 },
  privateBadge: {
    color: colors.active,
    fontSize: 10,
    fontWeight: "800",
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  cardBody: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 16 },
  cardActions: { alignItems: "flex-end", gap: 6 },
  chatBtn: {
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  inviteBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inviteBtnText: { color: colors.text, fontWeight: "700", fontSize: 12 },
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
  joinedLabel: { color: colors.active, fontWeight: "700", fontSize: 12 },
  empty: { alignItems: "center", marginTop: 60, gap: 6, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  emptyBody: { color: colors.muted, textAlign: "center", lineHeight: 18 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.lg,
    gap: 10,
  },
  modalTitle: { color: colors.text, fontWeight: "800", fontSize: 18 },
  modalHint: { color: colors.muted, fontSize: 12, marginBottom: 4 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  inviteName: { color: colors.text, fontWeight: "700" },
  inviteHandle: { color: colors.muted, fontSize: 12 },
  inviteAdd: {
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inviteAddText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  modalClose: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  modalCloseText: { color: colors.action, fontWeight: "800" },
});
