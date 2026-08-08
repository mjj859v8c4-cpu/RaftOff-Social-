import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  getOrCreateDm,
  listMessages,
  markConversationRead,
  sendMessage,
} from "@/features/profiles/api";
import { getConversationHeader, isBlockedPair } from "@/features/messages/api";
import { describeDmError } from "@/features/messages/errors";
import { useUnreadMessages } from "@/features/messages/unread";
import { getSupabase } from "@/lib/supabase/client";
import { ReportBlockModal } from "@/components/moderation/ReportBlockModal";
import type { DirectMessage, Profile } from "@/types/raftoff";

export default function MessageThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ? String(id) : undefined;
  const userId = useAuthStore((s) => s.session?.user?.id);
  const clearUnread = useUnreadMessages((s) => s.clearConversation);

  const [peer, setPeer] = useState<Profile | null>(null);
  const [headerTitle, setHeaderTitle] = useState("Chat");
  const [isGroup, setIsGroup] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restricted, setRestricted] = useState<string | null>(null);
  const [modOpen, setModOpen] = useState(false);
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const load = useCallback(async () => {
    if (!conversationId || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const [header, rows] = await Promise.all([
        getConversationHeader(conversationId, userId),
        listMessages(conversationId),
      ]);
      setPeer(header?.peer ?? null);
      setHeaderTitle(header?.title ?? "Chat");
      setIsGroup(header?.kind === "group");
      setMemberCount(header?.memberCount ?? 0);
      setMessages(rows);
      await markConversationRead(conversationId, userId);
      clearUnread(conversationId);

      if (header?.peer) {
        const blocked = await isBlockedPair(userId, header.peer.id);
        setRestricted(blocked ? describeDmError(new Error("messaging blocked")) : null);
      } else if (header?.kind === "group") {
        setRestricted(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load thread");
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, clearUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!conversationId || !userId) return;
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel(`dm:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as DirectMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          if (row.sender_id !== userId) {
            void markConversationRead(conversationId, userId);
            clearUnread(conversationId);
          }
        }
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [conversationId, userId, clearUnread]);

  const onSend = async () => {
    if (!conversationId || !userId || !body.trim() || sending) return;
    if (!isGroup && !peer) return;
    setSending(true);
    setError(null);
    try {
      if (!isGroup && peer) {
        await getOrCreateDm(peer.id);
      }
      const msg = await sendMessage(conversationId, userId, body);
      setBody("");
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e) {
      const friendly = describeDmError(e);
      setRestricted(friendly);
      Alert.alert("Can’t send message", friendly);
    } finally {
      setSending(false);
    }
  };

  const openProfile = () => {
    if (peer?.username) router.push(`/u/${peer.username}` as never);
  };

  const emptyHint = useMemo(() => {
    if (isGroup) return "Start the crew chat — who's pulling up?";
    const first = peer?.display_name?.trim().split(/\s+/)[0];
    return first ? `No messages yet — say hey to ${first}.` : "No messages yet — say hey.";
  }, [peer?.display_name, isGroup]);

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Text style={styles.link}>‹ Back</Text>
        </Pressable>
        <Pressable style={styles.peer} onPress={openProfile} disabled={!peer || isGroup} hitSlop={8}>
          {isGroup ? (
            <View style={[styles.avatar, styles.groupAvatar]}>
              <Text style={styles.groupAvatarText}>⚓</Text>
            </View>
          ) : peer?.avatar_url ? (
            <Image source={{ uri: peer.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>
                {(peer?.display_name ?? "?").slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {headerTitle}
            </Text>
            {isGroup ? (
              <Text style={styles.subtitle}>{memberCount} captains</Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          style={styles.more}
          onPress={() => setModOpen(true)}
          disabled={!peer || isGroup}
          hitSlop={12}
        >
          <Text style={styles.moreText}>•••</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
            ListEmptyComponent={<Text style={styles.empty}>{emptyHint}</Text>}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View style={[styles.itemWrap, mine ? styles.itemWrapMine : styles.itemWrapTheirs]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={styles.bubbleText}>{item.body}</Text>
                  </View>
                  <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
                </View>
              );
            }}
          />
          {restricted ? (
            <View style={styles.restrictedBanner}>
              <Text style={styles.restrictedText}>{restricted}</Text>
            </View>
          ) : (
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
          )}
        </KeyboardAvoidingView>
      )}

      {peer ? (
        <ReportBlockModal
          visible={modOpen}
          onClose={() => {
            setModOpen(false);
            void load();
          }}
          targetUserId={peer.id}
          targetType="user"
          targetId={peer.id}
        />
      ) : null}
    </SafeAreaView>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backBtn: { minWidth: 48 },
  peer: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bgElevated },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  title: { color: colors.text, fontWeight: "800", fontSize: 16, flexShrink: 1 },
  subtitle: { color: colors.muted, fontSize: 11 },
  groupAvatar: {
    backgroundColor: "rgba(255,61,130,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,61,130,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvatarText: { fontSize: 14 },
  link: { color: colors.muted, fontWeight: "600" },
  more: { minWidth: 32, alignItems: "flex-end" },
  moreText: { color: colors.text, fontWeight: "800" },
  list: { padding: spacing.lg, paddingBottom: 12, gap: 10, flexGrow: 1 },
  itemWrap: { maxWidth: "82%" },
  itemWrapMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  itemWrapTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    maxWidth: "100%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: colors.action,
  },
  bubbleTheirs: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  timestamp: { color: colors.muted, fontSize: 10, marginTop: 3, marginHorizontal: 4 },
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
  restrictedBanner: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: "rgba(255,92,92,0.08)",
  },
  restrictedText: { color: colors.danger, textAlign: "center", fontWeight: "600" },
});
