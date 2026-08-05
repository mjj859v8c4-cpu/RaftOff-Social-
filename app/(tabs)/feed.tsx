import React, { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, vibes } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { getLakeById } from "@/supabase/seed/michigan-lakes";
import { LakeSwitcher } from "@/components/map/LakeSwitcher";

export default function FeedScreen() {
  const posts = useRaftOffStore((s) => s.posts);
  const toggleLike = useRaftOffStore((s) => s.toggleLike);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const setActiveLakeId = useRaftOffStore((s) => s.setActiveLakeId);
  const lake = getLakeById(activeLakeId);

  const lakePosts = useMemo(
    () =>
      [...posts]
        .filter((p) => p.lake_id === activeLakeId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [posts, activeLakeId]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.switcher}>
        <LakeSwitcher value={activeLakeId} onChange={setActiveLakeId} />
      </View>
      <Text style={styles.sub}>
        <Text style={styles.dot}>● </Text>
        Live feed · {lake.name}
      </Text>
      <FlatList
        data={lakePosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const vibe = vibes.find((v) => v.id === (item as { vibe?: string }).vibe);
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.author}>{item.profile?.display_name ?? "Member"}</Text>
                  <Text style={styles.meta}>
                    {item.location?.name ?? lake.name}
                    {vibe ? ` · ${vibe.label}` : ""} · {formatAge(item.created_at)}
                    {item.check_in_id ? " · check-in" : ""}
                  </Text>
                </View>
              </View>
              <Text style={styles.body}>{item.text}</Text>
              <Pressable style={styles.like} onPress={() => toggleLike(item.id)}>
                <Text style={[styles.likeText, item.liked_by_me && styles.liked]}>
                  {item.liked_by_me ? "Liked" : "Like"} · {item.like_count ?? 0}
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No posts on {lake.name} yet — Drop Anchor to start the feed.
          </Text>
        }
      />
    </View>
  );
}

function formatAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  switcher: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  sub: { color: colors.muted, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  dot: { color: colors.active },
  card: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.md,
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 8 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  author: { color: colors.text, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  like: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  liked: { color: "#B9ECFF" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
