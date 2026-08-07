import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api";
import { Avatar } from "@/components/social/Avatar";
import type { AppNotification } from "@/types/raftoff";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type: string): string {
  switch (type) {
    case "connection_request":
      return "🤝";
    case "connection_accepted":
      return "✅";
    case "new_follower":
      return "⭐";
    case "like":
      return "❤️";
    case "comment":
      return "💬";
    default:
      return "🔔";
  }
}

export default function NotificationsScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listMyNotifications(userId);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onOpen = async (n: AppNotification) => {
    if (!n.read_at) {
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, read_at: new Date().toISOString() } : it)));
      void markNotificationRead(n.id).catch(() => {});
    }
    if (n.type === "connection_request") {
      router.push("/connections" as never);
      return;
    }
    if ((n.type === "connection_accepted" || n.type === "new_follower") && n.actor?.username) {
      router.push(`/u/${n.actor.username}` as never);
      return;
    }
    if (n.actor?.username) {
      router.push(`/u/${n.actor.username}` as never);
    }
  };

  const onMarkAll = async () => {
    if (!userId) return;
    setItems((prev) => prev.map((it) => ({ ...it, read_at: it.read_at ?? new Date().toISOString() })));
    try {
      await markAllNotificationsRead(userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark all read");
    }
  };

  const unreadCount = items.filter((n) => !n.read_at).length;

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={() => void onMarkAll()} hitSlop={12} disabled={!unreadCount}>
          <Text style={[styles.link, unreadCount ? styles.accent : styles.linkDisabled]}>Mark all read</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No notifications yet. Connection requests, accepts, and new followers will show up here.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.read_at && styles.rowUnread]}
              onPress={() => void onOpen(item)}
            >
              <View style={styles.avatarWrap}>
                <Avatar uri={item.actor?.avatar_url} name={item.actor?.display_name} size={42} />
                <Text style={styles.badgeIcon}>{iconFor(item.type)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.read_at ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
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
  link: { color: colors.muted, fontWeight: "600", fontSize: 13 },
  linkDisabled: { opacity: 0.4 },
  accent: { color: colors.action },
  list: { padding: spacing.lg, paddingTop: 8, gap: 4, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rowUnread: { backgroundColor: "rgba(255,61,130,0.08)" },
  avatarWrap: { position: "relative" },
  badgeIcon: {
    position: "absolute",
    bottom: -2,
    right: -4,
    fontSize: 14,
  },
  notifTitle: { color: colors.text, fontWeight: "700", fontSize: 13.5, lineHeight: 18 },
  notifBody: { color: colors.muted, fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  time: { color: colors.muted, fontSize: 11, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.action },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, lineHeight: 20 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginBottom: 4 },
});
