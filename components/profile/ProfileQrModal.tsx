import React from "react";
import { Image, Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import { profileQrPayload, profileShareUrl } from "@/lib/profile/qr";
import { track } from "@/lib/analytics";

type Props = {
  visible: boolean;
  username: string;
  displayName?: string | null;
  onClose: () => void;
};

/**
 * Simple QR scaffold (§21) — renders a scannable code via a lightweight image
 * endpoint so stickers / dock signs / merch can point back to a profile
 * without pulling in a native QR-rendering dependency.
 */
export function ProfileQrModal({ visible, username, displayName, onClose }: Props) {
  const payload = profileQrPayload(username);
  const shareUrl = profileShareUrl(username);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data=${encodeURIComponent(
    payload
  )}`;

  const onShare = () => {
    track("share_intent", { target: "profile_qr" });
    void Share.share({
      message: `Scan or tap to see ${displayName ?? "my profile"} on RaftOff: ${shareUrl}`,
      url: shareUrl,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Your profile QR</Text>
          <Text style={styles.subtitle}>Scan to open @{username} on RaftOff Social</Text>
          <View style={styles.qrWrap}>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
          </View>
          <Text style={styles.url}>{shareUrl.replace(/^https:\/\//, "")}</Text>
          <Pressable style={styles.primary} onPress={onShare}>
            <Text style={styles.btnText}>Share link</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Close</Text>
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
    alignItems: "center",
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  subtitle: { color: colors.muted, fontSize: 13 },
  qrWrap: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginVertical: spacing.sm,
  },
  qrImage: { width: 220, height: 220 },
  url: { color: colors.active, fontWeight: "700", marginBottom: spacing.sm },
  primary: {
    backgroundColor: colors.action,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "stretch",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  cancel: { color: colors.muted, textAlign: "center", padding: 10 },
});
