import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { blockUser, reportContent } from "@/features/moderation/api";

type Props = {
  targetUserId?: string;
  targetType?: "user" | "post" | "comment" | "event" | "check_in";
  targetId?: string;
  visible: boolean;
  onClose: () => void;
};

export function ReportBlockModal({
  targetUserId,
  targetType = "user",
  targetId,
  visible,
  onClose,
}: Props) {
  const session = useAuthStore((s) => s.session);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const requireAuth = () => {
    if (!session?.user?.id) {
      Alert.alert("Sign in required", "Sign in to report or block.");
      return false;
    }
    return true;
  };

  const onReport = async () => {
    if (!requireAuth() || !targetId) return;
    setBusy(true);
    try {
      await reportContent({
        reporterId: session!.user.id,
        targetType,
        targetId,
        reason: reason || "Violation of community guidelines",
      });
      Alert.alert("Report submitted", "Thanks — our moderators will review.");
      onClose();
    } catch (e) {
      Alert.alert("Could not report", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  const onBlock = async () => {
    if (!requireAuth() || !targetUserId) return;
    setBusy(true);
    try {
      await blockUser(session!.user.id, targetUserId);
      Alert.alert("Blocked", "You won’t see this user in your feed.");
      onClose();
    } catch (e) {
      Alert.alert("Could not block", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Safety tools</Text>
          <TextInput
            style={styles.input}
            placeholder="Why are you reporting?"
            placeholderTextColor={colors.muted}
            value={reason}
            onChangeText={setReason}
            multiline
          />
          <Pressable style={styles.primary} disabled={busy} onPress={onReport}>
            <Text style={styles.btnText}>Report</Text>
          </Pressable>
          {targetUserId ? (
            <Pressable style={styles.danger} disabled={busy} onPress={onBlock}>
              <Text style={styles.btnText}>Block user</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0B1520",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 10,
    minHeight: 80,
    padding: 12,
    color: colors.text,
    textAlignVertical: "top",
  },
  primary: {
    backgroundColor: colors.action,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  danger: {
    backgroundColor: "#B91C1C",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  cancel: { color: colors.muted, textAlign: "center", padding: 10 },
});
