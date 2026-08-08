import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { Avatar } from "@/components/social/Avatar";
import { useAuthStore } from "@/features/auth/store";
import {
  acceptConnection,
  declineConnection,
  followProfile,
  getFollowingSet,
  getOrCreateDm,
  listActiveStatuses,
  listConnectionProfiles,
  listFollowers,
  listFollowing,
  listIncomingRequests,
  listOutgoingRequests,
  mutualConnectionCount,
  removeConnection,
  unfollowProfile,
} from "@/features/profiles/api";
import { describeDmError } from "@/features/messages/errors";
import type { ConnectionRequest, Profile, UserStatus } from "@/types/raftoff";

type Tab = "connections" | "followers" | "following" | "requests";

const OWN_TABS: { id: Tab; label: string }[] = [
  { id: "connections", label: "Connections" },
  { id: "followers", label: "Followers" },
  { id: "following", label: "Following" },
  { id: "requests", label: "Requests" },
];

export default function ConnectionsScreen() {
  const params = useLocalSearchParams<{
    tab?: string;
    userId?: string;
    username?: string;
    displayName?: string;
  }>();
  const meId = useAuthStore((s) => s.session?.user?.id);
  const targetId = params.userId || meId;
  const isOwn = !!meId && (!params.userId || params.userId === meId);
  const tabs = isOwn ? OWN_TABS : OWN_TABS.filter((t) => t.id !== "requests");

  const [tab, setTab] = useState<Tab>(() => {
    const requested = params.tab as Tab | undefined;
    if (requested && tabs.some((t) => t.id === requested)) return requested;
    return "connections";
  });

  const [people, setPeople] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [mutuals, setMutuals] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({});
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    try {
      const [conn, fol, fing] = await Promise.all([
        listConnectionProfiles(targetId),
        listFollowers(targetId),
        listFollowing(targetId),
      ]);
      setPeople(conn);
      setFollowers(fol);
      setFollowing(fing);

      if (meId) {
        const ids = [...conn, ...fol, ...fing].map((p) => p.id);
        setFollowingSet(await getFollowingSet(meId, ids).catch(() => new Set<string>()));
      }

      if (isOwn && meId) {
        const [inc, out] = await Promise.all([
          listIncomingRequests(meId),
          listOutgoingRequests(meId),
        ]);
        setIncoming(inc);
        setOutgoing(out);
        const counts = await Promise.all(
          conn.map((p) => mutualConnectionCount(p.id).catch(() => 0))
        );
        setMutuals(Object.fromEntries(conn.map((p, i) => [p.id, counts[i]])));
        setStatuses(await listActiveStatuses(conn.map((p) => p.id)).catch(() => ({})));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [targetId, meId, isOwn]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRemove = (person: Profile) => {
    if (!meId) return;
    Alert.alert("Remove connection", `Remove ${person.display_name} from your connections?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setBusyId(person.id);
          void removeConnection(meId, person.id)
            .then(() => setPeople((prev) => prev.filter((p) => p.id !== person.id)))
            .catch((e) => setError(e instanceof Error ? e.message : "Could not remove"))
            .finally(() => setBusyId(null));
        },
      },
    ]);
  };

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
    if (!meId) return;
    setBusyId(req.id);
    try {
      await declineConnection(req.id, meId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decline failed");
    } finally {
      setBusyId(null);
    }
  };

  const openDm = async (peerId: string) => {
    setBusyId(peerId);
    setError(null);
    try {
      const id = await getOrCreateDm(peerId);
      router.push(`/messages/${id}` as never);
    } catch (e) {
      setError(describeDmError(e));
    } finally {
      setBusyId(null);
    }
  };

  const toggleFollow = async (person: Profile) => {
    if (!meId || person.id === meId) return;
    const nowFollowing = followingSet.has(person.id);
    setBusyId(person.id);
    try {
      if (nowFollowing) {
        await unfollowProfile(person.id);
        setFollowingSet((prev) => {
          const next = new Set(prev);
          next.delete(person.id);
          return next;
        });
      } else {
        await followProfile(person.id);
        setFollowingSet((prev) => new Set(prev).add(person.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update follow");
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = incoming.length;
  const headerTitle = isOwn
    ? "Connections"
    : params.displayName || (params.username ? `@${params.username}` : "Connections");

  const listData = useMemo(() => {
    if (tab === "connections") return people;
    if (tab === "followers") return followers;
    if (tab === "following") return following;
    return [];
  }, [tab, people, followers, following]);

  const countFor = (id: Tab) => {
    if (id === "connections") return people.length;
    if (id === "followers") return followers.length;
    if (id === "following") return following.length;
    return pendingCount;
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {headerTitle}
        </Text>
        {isOwn ? (
          <View style={styles.headerLinks}>
            <Pressable onPress={() => router.push("/notifications" as never)} hitSlop={12}>
              <Text style={styles.link}>🔔</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/messages" as never)} hitSlop={12}>
              <Text style={[styles.link, styles.accent]}>Messages</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabOn]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]} numberOfLines={1}>
              {t.label} ({countFor(t.id)})
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : tab === "requests" ? (
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
                <Avatar uri={peer.avatar_url} name={peer.display_name} size={44} />
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
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === "connections"
                ? "No connections yet. Find boaters and tap Connect."
                : tab === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </Text>
          }
          renderItem={({ item }) => {
            const showFollow = !!meId && item.id !== meId;
            const isFollowingPerson = followingSet.has(item.id);
            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/u/${item.username}` as never)}
              >
                <Avatar uri={item.avatar_url} name={item.display_name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.display_name}</Text>
                  <Text style={styles.handle}>
                    @{item.username}
                    {tab === "connections" && mutuals[item.id]
                      ? ` · ${mutuals[item.id]} mutual`
                      : ""}
                  </Text>
                  {tab === "connections" && statuses[item.id] ? (
                    <Text style={styles.statusLine} numberOfLines={1}>
                      💬 {statuses[item.id].body}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.connRowActions}>
                  {tab === "connections" && isOwn ? (
                    <>
                      <Pressable
                        style={styles.msgBtn}
                        onPress={() => void openDm(item.id)}
                        disabled={busyId === item.id}
                      >
                        <Text style={styles.msgBtnText}>Message</Text>
                      </Pressable>
                      <Pressable
                        style={styles.removeBtn}
                        hitSlop={8}
                        onPress={() => onRemove(item)}
                        disabled={busyId === item.id}
                      >
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </Pressable>
                    </>
                  ) : showFollow ? (
                    <Pressable
                      style={[styles.followBtn, isFollowingPerson && styles.followBtnOn]}
                      hitSlop={8}
                      disabled={busyId === item.id}
                      onPress={() => void toggleFollow(item)}
                    >
                      <Text
                        style={[
                          styles.followBtnText,
                          isFollowingPerson && styles.followBtnTextOn,
                        ]}
                      >
                        {busyId === item.id ? "…" : isFollowingPerson ? "Following" : "Follow"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </Pressable>
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
    gap: 8,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 16, flex: 1, textAlign: "center" },
  headerLinks: { flexDirection: "row", alignItems: "center", gap: 14 },
  link: { color: colors.muted, fontWeight: "600" },
  accent: { color: colors.action },
  tabs: {
    flexDirection: "row",
    gap: 6,
    padding: spacing.lg,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  tabOn: { borderColor: colors.action, backgroundColor: "rgba(255,61,130,0.15)" },
  tabText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
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
  name: { color: colors.text, fontWeight: "800" },
  handle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  statusLine: { color: colors.active, fontSize: 12, marginTop: 3, fontWeight: "600" },
  msgBtn: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  msgBtnText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  connRowActions: { flexDirection: "row", gap: 8 },
  removeBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeBtnText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  followBtn: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followBtnOn: { borderColor: "rgba(46,242,200,0.4)", backgroundColor: "rgba(46,242,200,0.1)" },
  followBtnText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  followBtnTextOn: { color: colors.active },
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
