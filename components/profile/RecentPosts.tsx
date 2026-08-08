import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import type { Post } from "@/types/raftoff";

function formatAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Read-only preview list used on own + public profiles (§25). */
export function RecentPosts({ posts }: { posts: Post[] }) {
  if (!posts.length) return null;

  return (
    <View style={styles.wrap}>
      {posts.map((post) => {
        const photo = post.photo_urls?.[0] ?? post.photo_url ?? null;
        return (
          <View key={post.id} style={styles.card}>
            {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : null}
            <View style={styles.body}>
              {post.text ? (
                <Text style={styles.text} numberOfLines={3}>
                  {post.text}
                </Text>
              ) : null}
              <Text style={styles.meta}>
                {post.location?.name ? `${post.location.name} · ` : ""}
                {formatAge(post.created_at)}
                {" · "}♡ {post.like_count ?? 0} · 💬 {post.comment_count ?? 0}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  photo: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.bgElevated },
  body: { flex: 1, gap: 4 },
  text: { color: colors.text, fontSize: 13, lineHeight: 18 },
  meta: { color: colors.muted, fontSize: 11, fontWeight: "600" },
});
