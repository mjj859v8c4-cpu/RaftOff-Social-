import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing } from "@/lib/theme";
import { listComments } from "@/lib/api/production";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";

type CommentRow = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  profiles?: { display_name?: string; avatar_url?: string | null } | null;
};

function formatAge(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function CommentsSheet({
  postId,
  visible,
  onClose,
}: {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const addComment = useRaftOffStore((s) => s.addComment);
  const session = useAuthStore((s) => s.session);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    setError(null);
    listComments(postId)
      .then((rows) => setComments(rows as CommentRow[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load comments"))
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const onSend = async () => {
    if (!postId || !text.trim()) return;
    if (!session?.user?.id) {
      setError("Sign in to comment");
      return;
    }
    setBusy(true);
    try {
      await addComment(postId, text.trim());
      setComments((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          text: text.trim(),
          created_at: new Date().toISOString(),
          author_id: session.user.id,
          profiles: { display_name: "You" },
        },
      ]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.action} style={{ marginVertical: 24 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  {item.profiles?.avatar_url ? (
                    <Image source={{ uri: item.profiles.avatar_url }} style={styles.commentAvatar} />
                  ) : (
                    <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
                      <Text style={styles.commentAvatarText}>
                        {(item.profiles?.display_name ?? "?").slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentAuthor}>
                      {item.profiles?.display_name ?? "Member"}{" "}
                      <Text style={styles.commentAge}>· {formatAge(item.created_at)}</Text>
                    </Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>Be the first to comment.</Text>
              }
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment…"
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <Pressable style={styles.send} disabled={busy || !text.trim()} onPress={onSend}>
              <Text style={styles.sendText}>{busy ? "…" : "Post"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0B1520",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  close: { color: colors.muted, fontWeight: "700" },
  commentRow: { flexDirection: "row", gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgSoft },
  commentAvatarFallback: { alignItems: "center", justifyContent: "center" },
  commentAvatarText: { color: colors.text, fontWeight: "700", fontSize: 11 },
  commentAuthor: { color: colors.text, fontWeight: "700", fontSize: 13 },
  commentAge: { color: colors.muted, fontWeight: "500" },
  commentText: { color: colors.text, marginTop: 2, lineHeight: 19 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 24 },
  error: { color: colors.danger, fontSize: 12 },
  composer: { flexDirection: "row", gap: 8, alignItems: "flex-end", paddingTop: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    maxHeight: 90,
  },
  send: {
    backgroundColor: colors.action,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendText: { color: "#fff", fontWeight: "800" },
});
