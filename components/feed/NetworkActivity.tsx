import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import {
  clearMyStatus,
  getMyActiveStatus,
  listConnectionActivity,
  setMyStatus,
} from "@/features/feed/api";
import { getSavedPostIds, toggleSavePost } from "@/features/posts/api";
import { PostCard } from "@/components/feed/PostCard";
import type { ActivityItem, UserStatus } from "@/types/raftoff";

function formatAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function NetworkActivity({ onOpenComments }: { onOpenComments: (postId: string) => void }) {
  const session = useAuthStore((s) => s.session);
  const toggleLike = useRaftOffStore((s) => s.toggleLike);
  const myId = session?.user?.id;

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myStatus, setMyStatusState] = useState<UserStatus | null>(null);
  const [statusText, setStatusText] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    if (!myId) return;
    setLoading(true);
    setError(null);
    try {
      const [activity, activeStatus] = await Promise.all([
        listConnectionActivity(myId),
        getMyActiveStatus(myId),
      ]);
      setItems(activity);
      setMyStatusState(activeStatus);
      const postIds = activity.filter((i) => i.kind === "post").map((i: any) => i.post.id);
      setSaved(await getSavedPostIds(myId, postIds));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your network feed");
    } finally {
      setLoading(false);
    }
  }, [myId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onLike = (postId: string) => {
    void toggleLike(postId).then(() =>
      setItems((prev) =>
        prev.map((i) =>
          i.kind === "post" && i.post.id === postId
            ? {
                ...i,
                post: {
                  ...i.post,
                  liked_by_me: !i.post.liked_by_me,
                  like_count: Math.max(0, (i.post.like_count ?? 0) + (i.post.liked_by_me ? -1 : 1)),
                },
              }
            : i
        )
      )
    );
  };

  const onSave = async (postId: string) => {
    if (!myId) return;
    const { saved: nowSaved } = await toggleSavePost(postId, myId);
    setSaved((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(postId);
      else next.delete(postId);
      return next;
    });
  };

  const onPostStatus = async () => {
    if (!statusText.trim()) return;
    setStatusBusy(true);
    try {
      const row = await setMyStatus(statusText.trim(), 6);
      setMyStatusState(row);
      setStatusText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post status");
    } finally {
      setStatusBusy(false);
    }
  };

  const onClearStatus = async () => {
    setStatusBusy(true);
    try {
      await clearMyStatus();
      setMyStatusState(null);
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
      ListHeaderComponent={
        <View style={styles.statusCard}>
          <Text style={styles.statusKicker}>Your status</Text>
          {myStatus ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusBody}>{myStatus.body}</Text>
              <Pressable onPress={onClearStatus} disabled={statusBusy}>
                <Text style={styles.statusClear}>Clear</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <TextInput
                style={styles.statusInput}
                placeholder="Fueling up, heading to the sandbar…"
                placeholderTextColor={colors.muted}
                value={statusText}
                onChangeText={setStatusText}
                maxLength={140}
              />
              <Pressable
                style={styles.statusPost}
                disabled={statusBusy || !statusText.trim()}
                onPress={onPostStatus}
              >
                <Text style={styles.statusPostText}>{statusBusy ? "…" : "Post"}</Text>
              </Pressable>
            </View>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      }
      renderItem={({ item }) => {
        if (item.kind === "post") {
          return (
            <PostCard
              post={item.post}
              onLike={() => onLike(item.post.id)}
              onOpenComments={() => onOpenComments(item.post.id)}
              onToggleSave={() => onSave(item.post.id)}
              saved={saved.has(item.post.id)}
              onOpenProfile={
                item.post.profile?.username
                  ? () => router.push(`/u/${item.post.profile!.username}` as never)
                  : undefined
              }
            />
          );
        }
        if (item.kind === "boat") {
          return (
            <Pressable
              style={styles.activityCard}
              onPress={() =>
                item.actor?.username && router.push(`/u/${item.actor.username}` as never)
              }
            >
              <View style={styles.activityRow}>
                {item.actor?.avatar_url ? (
                  <Image source={{ uri: item.actor.avatar_url }} style={styles.activityAvatar} />
                ) : (
                  <View style={[styles.activityAvatar, styles.activityAvatarFallback]}>
                    <Text style={styles.activityAvatarText}>
                      {(item.actor?.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.activityText}>
                  <Text style={styles.activityName}>{item.actor?.display_name ?? "A connection"}</Text>
                  {"  🚤 added a new boat — "}
                  <Text style={styles.activityName}>
                    {item.boat.name ?? item.boat.nickname}
                  </Text>
                </Text>
              </View>
              <Text style={styles.activityMeta}>{formatAge(item.created_at)}</Text>
              {item.boat.photo_url ? (
                <Image source={{ uri: item.boat.photo_url }} style={styles.boatPhoto} />
              ) : null}
            </Pressable>
          );
        }
        return (
          <Pressable
            style={styles.activityCard}
            onPress={() =>
              item.actor?.username && router.push(`/u/${item.actor.username}` as never)
            }
          >
            <View style={styles.activityRow}>
              {item.actor?.avatar_url ? (
                <Image source={{ uri: item.actor.avatar_url }} style={styles.activityAvatar} />
              ) : (
                <View style={[styles.activityAvatar, styles.activityAvatarFallback]}>
                  <Text style={styles.activityAvatarText}>
                    {(item.actor?.display_name ?? "?").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.activityText}>
                <Text style={styles.activityName}>{item.actor?.display_name ?? "A connection"}</Text>
                {`  💬 "${item.status.body}"`}
              </Text>
            </View>
            <Text style={styles.activityMeta}>{formatAge(item.created_at)}</Text>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>
          Connect with other boaters to see their check-ins, new boats, and posts here.
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  statusCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 4,
  },
  statusKicker: {
    color: colors.food,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statusRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  statusBody: { flex: 1, color: colors.text, fontWeight: "600" },
  statusClear: { color: colors.muted, fontWeight: "700" },
  statusInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  statusPost: {
    backgroundColor: colors.action,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusPostText: { color: "#fff", fontWeight: "800" },
  errorText: { color: colors.danger, fontSize: 12 },
  activityCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  activityRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  activityAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSoft },
  activityAvatarFallback: { alignItems: "center", justifyContent: "center" },
  activityAvatarText: { color: colors.text, fontWeight: "700", fontSize: 11 },
  activityText: { flex: 1, color: colors.text, lineHeight: 20 },
  activityName: { fontWeight: "800" },
  activityMeta: { color: colors.muted, fontSize: 11 },
  boatPhoto: { width: "100%", height: 140, borderRadius: 10 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
