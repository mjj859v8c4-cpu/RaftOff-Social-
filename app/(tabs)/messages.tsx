import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { listConversations } from "@/features/profiles/api";
import { useUnreadMessages } from "@/features/messages/unread";
import type { ConversationPreview } from "@/types/raftoff";

export default function MessagesTabScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const unreadByConversation = useUnreadMessages((s) => s.byConversation);
  const refreshUnread = useUnreadMessages((s) => s.refresh);
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [conversations] = await Promise.all([
        listConversations(userId),
        refreshUnread(userId),
      ]);
      setItems(conversations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, refreshUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  // Threads change while you're away — re-pull whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Text style={styles.title}>Messages</Text>
        <Pressable onPress={() => router.push("/connections" as never)} hitSlop={12}>
          <Text style={styles.link}>Connections</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.muted}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyBody}>
                Connect with boaters on the map or in Discover, then tap Message to start a
                thread.
              </Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/(tabs)/discover" as never)}
              >
                <Text style={styles.emptyBtnText}>Find people</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const unread = unreadByConversation[item.id] ?? 0;
            return (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/messages/${item.id}` as never)}
              >
                {item.peer.avatar_url ? (
                  <Image source={{ uri: item.peer.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarText}>
                      {(item.peer.display_name ?? "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.name, unread > 0 && styles.nameUnread]} numberOfLines={1}>
                      {item.peer.display_name}
                    </Text>
                    <Text style={styles.time}>{formatWhen(item.lastMessage?.created_at)}</Text>
                  </View>
                  <View style={styles.rowTop}>
                    <Text
                      style={[styles.preview, unread > 0 && styles.previewUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessage?.body ?? "Say hello on the water"}
                    </Text>
                    {unread > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso);
  const minutes = Math.floor((Date.now() - then.getTime()) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  title: { color: colors.text, fontWeight: "800", fontSize: 20 },
  link: { color: colors.action, fontWeight: "700" },
  list: { padding: spacing.lg, paddingBottom: 40, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgElevated },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  name: { color: colors.text, fontWeight: "700", flex: 1 },
  nameUnread: { fontWeight: "800" },
  time: { color: colors.muted, fontSize: 11 },
  preview: { color: colors.muted, fontSize: 13, marginTop: 3, flex: 1 },
  previewUnread: { color: colors.text, fontWeight: "600" },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: spacing.lg, gap: 8 },
  emptyTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  emptyBody: { color: colors.muted, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800" },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginTop: 8 },
});
