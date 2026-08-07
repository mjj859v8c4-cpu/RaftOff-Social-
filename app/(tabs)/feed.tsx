import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { useAuthStore } from "@/features/auth/store";
import { LakeSwitcher } from "@/components/map/LakeSwitcher";
import { PostCard } from "@/components/feed/PostCard";
import { CommentsSheet } from "@/components/feed/CommentsSheet";
import { NewPostModal } from "@/components/feed/NewPostModal";
import { NetworkActivity } from "@/components/feed/NetworkActivity";
import { getSavedPostIds, toggleSavePost } from "@/features/posts/api";

type Mode = "lake" | "network";

export default function FeedScreen() {
  const posts = useRaftOffStore((s) => s.posts);
  const toggleLike = useRaftOffStore((s) => s.toggleLike);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const setActiveLakeId = useRaftOffStore((s) => s.setActiveLakeId);
  const lakes = useRaftOffStore((s) => s.lakes);
  const myId = useAuthStore((s) => s.session?.user?.id);
  const lakeName = lakes.find((l) => l.id === activeLakeId)?.name ?? "Lake";

  const [mode, setMode] = useState<Mode>("lake");
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const lakePosts = useMemo(
    () =>
      [...posts]
        .filter((p) => p.lake_id === activeLakeId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [posts, activeLakeId]
  );

  useEffect(() => {
    if (!myId || mode !== "lake") return;
    void getSavedPostIds(
      myId,
      lakePosts.map((p) => p.id)
    ).then(setSaved);
  }, [myId, mode, lakePosts]);

  const onToggleSave = async (postId: string) => {
    if (!myId) return;
    const { saved: nowSaved } = await toggleSavePost(postId, myId);
    setSaved((prev) => {
      const next = new Set(prev);
      if (nowSaved) next.add(postId);
      else next.delete(postId);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.switcher}>
        <LakeSwitcher value={activeLakeId} onChange={setActiveLakeId} />
      </View>

      <View style={styles.segmentRow}>
        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentBtn, mode === "lake" && styles.segmentBtnActive]}
            onPress={() => setMode("lake")}
          >
            <Text style={[styles.segmentText, mode === "lake" && styles.segmentTextActive]}>
              Lake
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, mode === "network" && styles.segmentBtnActive]}
            onPress={() => setMode("network")}
          >
            <Text style={[styles.segmentText, mode === "network" && styles.segmentTextActive]}>
              Network
            </Text>
          </Pressable>
        </View>
        <Pressable style={styles.composeBtn} onPress={() => setComposeOpen(true)}>
          <Text style={styles.composeBtnText}>+ Post</Text>
        </Pressable>
      </View>

      {mode === "lake" ? (
        <FlatList
          data={lakePosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={styles.sub}>
              <Text style={styles.dot}>● </Text>
              Feed · {lakeName}
            </Text>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={() => toggleLike(item.id)}
              onOpenComments={() => setCommentsPostId(item.id)}
              onToggleSave={() => onToggleSave(item.id)}
              saved={saved.has(item.id)}
              fallbackLocationLabel={lakeName}
              onOpenProfile={
                item.profile?.username
                  ? () => router.push(`/u/${item.profile!.username}` as never)
                  : undefined
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No posts on {lakeName} yet — Drop Anchor or tap + Post to start the feed.
            </Text>
          }
        />
      ) : (
        <NetworkActivity onOpenComments={setCommentsPostId} />
      )}

      <CommentsSheet
        postId={commentsPostId}
        visible={!!commentsPostId}
        onClose={() => setCommentsPostId(null)}
      />
      <NewPostModal visible={composeOpen} onClose={() => setComposeOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  switcher: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.bgSoft,
    borderRadius: 999,
    padding: 3,
  },
  segmentBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999 },
  segmentBtnActive: { backgroundColor: colors.action },
  segmentText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  segmentTextActive: { color: "#fff" },
  composeBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  composeBtnText: { color: colors.text, fontWeight: "800", fontSize: 13 },
  sub: { color: colors.muted, paddingBottom: spacing.sm },
  dot: { color: colors.active },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
