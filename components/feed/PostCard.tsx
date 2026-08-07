import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, vibes } from "@/lib/theme";
import type { Post } from "@/types/raftoff";

function formatAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type Props = {
  post: Post;
  onLike: () => void;
  onOpenComments: () => void;
  onToggleSave?: () => void;
  onOpenProfile?: () => void;
  saved?: boolean;
  fallbackLocationLabel?: string;
};

export function PostCard({
  post,
  onLike,
  onOpenComments,
  onToggleSave,
  onOpenProfile,
  saved,
  fallbackLocationLabel,
}: Props) {
  const vibe = vibes.find((v) => v.id === (post as { vibe?: string }).vibe);
  const photos = post.photo_urls?.length ? post.photo_urls : post.photo_url ? [post.photo_url] : [];

  return (
    <View style={styles.card}>
      <Pressable style={styles.row} onPress={onOpenProfile} disabled={!onOpenProfile}>
        {post.profile?.avatar_url ? (
          <Image source={{ uri: post.profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {(post.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{post.profile?.display_name ?? "Member"}</Text>
          <Text style={styles.meta}>
            {post.location?.name ?? fallbackLocationLabel ?? "Lake St. Clair"}
            {vibe ? ` · ${vibe.label}` : ""} · {formatAge(post.created_at)}
            {post.check_in_id ? " · check-in" : ""}
          </Text>
        </View>
      </Pressable>

      {post.text ? <Text style={styles.body}>{post.text}</Text> : null}

      {photos.length ? (
        <View style={styles.photoWrap}>
          {photos.length === 1 ? (
            <Image source={{ uri: photos[0] }} style={styles.photoSingle} />
          ) : (
            <View style={styles.photoGrid}>
              {photos.slice(0, 4).map((url, idx) => (
                <Image key={url + idx} source={{ uri: url }} style={styles.photoGridItem} />
              ))}
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onLike}>
          <Text style={[styles.actionText, post.liked_by_me && styles.liked]}>
            {post.liked_by_me ? "♥ Liked" : "♡ Like"} · {post.like_count ?? 0}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onOpenComments}>
          <Text style={styles.actionText}>💬 {post.comment_count ?? 0}</Text>
        </Pressable>
        {onToggleSave ? (
          <Pressable style={styles.actionBtn} onPress={onToggleSave}>
            <Text style={[styles.actionText, saved && styles.saved]}>{saved ? "★ Saved" : "☆ Save"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: spacing.md,
    gap: 8,
  },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSoft },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.text, fontWeight: "700", fontSize: 12 },
  author: { color: colors.text, fontWeight: "700" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  photoWrap: { borderRadius: 12, overflow: "hidden" },
  photoSingle: { width: "100%", height: 220, borderRadius: 12 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  photoGridItem: { width: "49%", height: 110, borderRadius: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 2 },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  liked: { color: colors.action },
  saved: { color: colors.warn },
});
