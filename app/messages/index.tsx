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
import { listConversations } from "@/features/profiles/api";
import type { ConversationPreview } from "@/types/raftoff";

export default function MessagesListScreen() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [items, setItems] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await listConversations(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <Pressable onPress={() => router.push("/connections" as never)} hitSlop={12}>
          <Text style={[styles.link, styles.accent]}>People</Text>
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
          ListEmptyComponent={
            <Text style={styles.empty}>
              No conversations yet. Connect with someone, then tap Message.
            </Text>
          }
          renderItem={({ item }) => (
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
                <Text style={styles.name}>{item.peer.display_name}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage?.body ?? "Say hello on the water"}
                </Text>
              </View>
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
  link: { color: colors.muted, fontWeight: "600" },
  accent: { color: colors.action },
  list: { padding: spacing.lg, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgElevated },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  name: { color: colors.text, fontWeight: "800" },
  preview: { color: colors.muted, fontSize: 13, marginTop: 3 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, lineHeight: 20 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginTop: 8 },
});
