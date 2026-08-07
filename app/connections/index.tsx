import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import {
  acceptConnection,
  declineConnection,
  getOrCreateDm,
  listConnectionProfiles,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/features/profiles/api";
import type { ConnectionRequest, Profile } from "@/types/raftoff";

type Tab = "connections" | "requests";

export default function ConnectionsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [tab, setTab] = useState<Tab>("connections");
  const [people, setPeople] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [conn, inc, out] = await Promise.all([
        listConnectionProfiles(userId),
        listIncomingRequests(userId),
        listOutgoingRequests(userId),
      ]);
      setPeople(conn);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAccept = async (req: ConnectionRequest) => {
    setBusyId(req.id);
    try {
      await acceptConnection(req.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accept failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDecline = async (req: ConnectionRequest) => {
    if (!userId) return;
    setBusyId(req.id);
    try {
      await declineConnection(req.id, userId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decline failed");
    } finally {
      setBusyId(null);
    }
  };

  const openDm = async (peerId: string) => {
    setBusyId(peerId);
    try {
      const id = await getOrCreateDm(peerId);
      router.push(`/messages/${id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open chat");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = incoming.length;

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Connections</Text>
        <Pressable onPress={() => router.push("/messages" as never)} hitSlop={12}>
          <Text style={[styles.link, styles.accent]}>Messages</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "connections" && styles.tabOn]}
          onPress={() => setTab("connections")}
        >
          <Text style={[styles.tabText, tab === "connections" && styles.tabTextOn]}>
            People ({people.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "requests" && styles.tabOn]}
          onPress={() => setTab("requests")}
        >
          <Text style={[styles.tabText, tab === "requests" && styles.tabTextOn]}>
            Requests{pendingCount ? ` (${pendingCount})` : ""}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : tab === "connections" ? (
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No connections yet. Find boaters and tap Connect.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/u/${item.username}` as never)}
            >
              <Avatar profile={item} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.handle}>@{item.username}</Text>
              </View>
              <Pressable
                style={styles.msgBtn}
                onPress={() => void openDm(item.id)}
                disabled={busyId === item.id}
              >
                <Text style={styles.msgBtnText}>Message</Text>
              </Pressable>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={[
            ...incoming.map((r) => ({ req: r, direction: "in" as const })),
            ...outgoing.map((r) => ({ req: r, direction: "out" as const })),
          ]}
          keyExtractor={(r) => r.req.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No pending requests.</Text>}
          renderItem={({ item }) => {
            const peer = item.direction === "out" ? item.req.recipient : item.req.requester;
            if (!peer) return null;
            return (
              <View style={styles.row}>
                <Avatar profile={peer} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{peer.display_name}</Text>
                  <Text style={styles.handle}>
                    {item.direction === "out" ? "Outgoing · pending" : "Wants to connect"}
                  </Text>
                </View>
                {item.direction === "in" ? (
                  <View style={styles.reqActions}>
                    <Pressable
                      style={styles.accept}
                      disabled={busyId === item.req.id}
                      onPress={() => void onAccept(item.req)}
                    >
                      <Text style={styles.acceptText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={styles.decline}
                      disabled={busyId === item.req.id}
                      onPress={() => void onDecline(item.req)}
                    >
                      <Text style={styles.declineText}>Decline</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.pendingLabel}>Pending</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  if (profile.avatar_url) {
    return <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{(profile.display_name ?? "?").slice(0, 2).toUpperCase()}</Text>
    </View>
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
  tabs: {
    flexDirection: "row",
    gap: 8,
    padding: spacing.lg,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: "center",
  },
  tabOn: { borderColor: colors.action, backgroundColor: "rgba(255,61,130,0.15)" },
  tabText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  tabTextOn: { color: colors.text },
  list: { padding: spacing.lg, paddingTop: 8, gap: 10, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgElevated },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  name: { color: colors.text, fontWeight: "800" },
  handle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  msgBtn: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  msgBtnText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  reqActions: { flexDirection: "row", gap: 6 },
  accept: {
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  acceptText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  decline: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  declineText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  pendingLabel: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, lineHeight: 20 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginBottom: 4 },
});
