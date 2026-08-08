import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import {
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/features/profiles/api";
import { getSupabase } from "@/lib/supabase/client";
import type { DirectMessage } from "@/types/raftoff";
import { SafetyBanner } from "@/components/safety/SafetyBanner";

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const load = useCallback(async () => {
    if (!id || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listMessages(String(id));
      setMessages(rows);
      await markConversationRead(String(id), userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load thread");
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel(`dm:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const row = payload.new as DirectMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [id]);

  const onSend = async () => {
    if (!id || !userId || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage(String(id), userId, body);
      setBody("");
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.link}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Chat</Text>
        <View style={{ width: 48 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.safety}>
        <SafetyBanner variant="message" />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={8}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.empty}>No messages yet — say hey.</Text>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={styles.bubbleText}>{item.body}</Text>
                </View>
              );
            }}
          />
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={body}
              onChangeText={setBody}
              placeholder="Message…"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={2000}
            />
            <Pressable
              style={[styles.send, (!body.trim() || sending) && styles.sendDisabled]}
              onPress={() => void onSend()}
              disabled={!body.trim() || sending}
            >
              <Text style={styles.sendText}>{sending ? "…" : "Send"}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  safety: { paddingHorizontal: spacing.lg, paddingBottom: 8 },
  list: { padding: spacing.lg, paddingBottom: 12, gap: 8, flexGrow: 1 },
  bubble: {
    maxWidth: "78%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.action,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: "rgba(18,32,51,0.9)",
  },
  send: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  sendDisabled: { opacity: 0.45 },
  sendText: { color: "#fff", fontWeight: "800" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginTop: 8 },
});
