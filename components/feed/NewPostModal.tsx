import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import { createPost, pickAndUploadPostPhoto } from "@/features/posts/api";

export function NewPostModal({
  visible,
  onClose,
  onPosted,
}: {
  visible: boolean;
  onClose: () => void;
  onPosted?: () => void;
}) {
  const session = useAuthStore((s) => s.session);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const refreshLake = useRaftOffStore((s) => s.refreshLake);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setPhotoUrl(null);
    setError(null);
  };

  const onAddPhoto = async () => {
    if (!session?.user?.id) return;
    setUploading(true);
    setError(null);
    try {
      const url = await pickAndUploadPostPhoto(session.user.id);
      if (url) setPhotoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!session?.user?.id || !activeLakeId) {
      setError("Sign in required");
      return;
    }
    setPosting(true);
    setError(null);
    try {
      await createPost({
        authorId: session.user.id,
        lakeId: activeLakeId,
        text,
        photoUrls: photoUrl ? [photoUrl] : [],
      });
      reset();
      onPosted?.();
      await refreshLake(activeLakeId);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post");
    } finally {
      setPosting(false);
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
            <Text style={styles.title}>New post</Text>
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
            >
              <Text style={styles.close}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.input}
              placeholder="What's happening on the water?"
              placeholderTextColor={colors.muted}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
            />

            {photoUrl ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
                <Pressable style={styles.removePhoto} onPress={() => setPhotoUrl(null)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.photoBtn} disabled={uploading} onPress={onAddPhoto}>
                <Text style={styles.photoBtnText}>
                  {uploading ? "Uploading…" : "📷 Add a photo"}
                </Text>
              </Pressable>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            style={[styles.submit, (posting || uploading) && styles.submitDisabled]}
            disabled={posting || uploading || (!text.trim() && !photoUrl)}
            onPress={onSubmit}
          >
            {posting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Post to Lake feed</Text>
            )}
          </Pressable>
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
    gap: spacing.md,
    maxHeight: "85%",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  close: { color: colors.muted, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 12,
    minHeight: 100,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: "top",
  },
  photoBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  photoBtnText: { color: colors.text, fontWeight: "700" },
  photoPreviewWrap: { marginTop: 10 },
  photoPreview: { width: "100%", height: 180, borderRadius: 12 },
  removePhoto: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: { color: "#fff", fontWeight: "800" },
  error: { color: colors.danger, marginTop: 8 },
  submit: {
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800" },
});
