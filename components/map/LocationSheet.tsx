import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, vibes } from "@/lib/theme";
import type { Location } from "@/types/raftoff";
import { pinColorForType } from "@/features/map/markers";

type Props = {
  location: Location;
  onClose: () => void;
  onOpenFeed: () => void;
  onDropAnchor: () => void;
};

export function LocationSheet({ location, onClose, onOpenFeed, onDropAnchor }: Props) {
  const vibe = vibes.find((v) => v.id === location.dominant_vibe);
  const active = location.active_check_ins ?? 0;
  const isDining = location.type === "restaurant" || location.attributes?.group === "dining";
  const diningCat = String(location.attributes?.diningCategory ?? "dining").replace(/_/g, " ");
  const tier = location.attributes?.partnerTier;
  const isPartner = !!location.attributes?.partner || tier === "featured" || tier === "listed";
  const pitch = typeof location.attributes?.pitch === "string" ? location.attributes.pitch : null;

  return (
    <View style={styles.sheet}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: pinColorForType(location.type) }]} />
        <Text style={styles.type}>
          {isDining
            ? isPartner
              ? `${tier === "featured" ? "Featured partner" : "On RaftOff"} · ${diningCat}`
              : `Bars & food · ${diningCat}`
            : location.type.replace(/_/g, " ")}
        </Text>
      </View>
      <Text style={styles.title}>{location.name}</Text>
      {location.description ? <Text style={styles.meta}>{location.description}</Text> : null}
      {!isDining ? (
        <Text style={styles.meta}>
          {active} active · {vibe ? `${vibe.label} vibe` : "No dominant vibe"} ·{" "}
          {location.last_activity_at
            ? `Last activity ${new Date(location.last_activity_at).toLocaleTimeString()}`
            : "Quiet now"}
        </Text>
      ) : (
        <Text style={styles.meta}>
          {pitch ??
            "Waterfront dining · Drop Anchor when you’re docked · share the vibe to the feed"}
        </Text>
      )}
      {location.verification_status === "needs_review" ? (
        <Text style={styles.warn}>Approximate pin — details pending verification</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={onOpenFeed}>
          <Text style={styles.primaryText}>{isDining ? "Open place feed" : "View Live Feed"}</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={onDropAnchor}>
          <Text style={styles.secondaryText}>
            {isDining ? "I’m here" : "Drop Anchor Here"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: "rgba(8, 14, 22, 0.94)",
    borderColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
  },
  close: { position: "absolute", right: 8, top: 4, padding: 8 },
  closeText: { color: colors.muted, fontSize: 28, lineHeight: 28 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  type: { color: colors.muted, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 6 },
  meta: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  warn: { color: colors.warn, fontSize: 12, marginBottom: 10 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  primary: {
    backgroundColor: colors.action,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  primaryText: { color: "#041018", fontWeight: "800" },
  secondary: {
    borderColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  secondaryText: { color: colors.text, fontWeight: "700" },
});
