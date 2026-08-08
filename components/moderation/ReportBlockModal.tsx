import React, { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { blockUser, reportContent, REPORT_CATEGORIES, type ReportCategory } from "@/features/moderation/api";

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
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const requireAuth = () => {
    if (!session?.user?.id) {
      Alert.alert("Sign in required", "Sign in to report or block.");
      return false;
    }
    return true;
  };

  const reset = () => {
    setCategory(null);
    setReason("");
  };

  const onReport = async () => {
    if (!requireAuth() || !targetId) return;
    if (!category) {
      Alert.alert("Pick a reason", "Choose a category so moderators know what to check.");
      return;
    }
    setBusy(true);
    try {
      const categoryLabel = REPORT_CATEGORIES.find(([id]) => id === category)?.[1] ?? "Other";
      await reportContent({
        reporterId: session!.user.id,
        targetType,
        targetId,
        category,
        reason: reason.trim() || `${categoryLabel} — no additional details provided`,
      });
      Alert.alert("Report submitted", "Thanks — our moderators will review.");
      reset();
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

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Safety tools</Text>
          <Text style={styles.label}>What's the issue?</Text>
          <View style={styles.chipGrid}>
            {REPORT_CATEGORIES.map(([id, label]) => (
              <Pressable
                key={id}
                style={[styles.chip, category === id && styles.chipActive]}
                onPress={() => setCategory(id)}
              >
                <Text style={[styles.chipText, category === id && styles.chipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Add details (optional)"
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
          <Pressable onPress={handleClose}>
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
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 4 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.action,
    backgroundColor: "rgba(255,61,130,0.15)",
  },
  chipText: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  chipTextActive: { color: colors.text },
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
