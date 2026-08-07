import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing, vibes } from "@/lib/theme";
import type { CheckIn, Location } from "@/types/raftoff";
import { pinColorForType } from "@/features/map/markers";
import { MiniProfileModal } from "@/components/profile/MiniProfileModal";

type Props = {
  location: Location;
  /** Active check-ins at this location — already privacy-filtered (show_on_water) server-side. */
  checkIns?: CheckIn[];
  /** Set when the signed-in user is checked in here — shows a manual checkout button. */
  myCheckInId?: string | null;
  onClose: () => void;
  onOpenFeed: () => void;
  onDropAnchor: () => void;
  onEndCheckIn?: () => void;
};

const MAX_AVATARS = 8;

export function LocationSheet({
  location,
  checkIns = [],
  myCheckInId,
  onClose,
  onOpenFeed,
  onDropAnchor,
  onEndCheckIn,
}: Props) {
  const vibe = vibes.find((v) => v.id === location.dominant_vibe);
  const isDining = location.type === "restaurant" || location.attributes?.group === "dining";
  const diningCat = String(location.attributes?.diningCategory ?? "dining").replace(/_/g, " ");
  const tier = location.attributes?.partnerTier;
  const isPartner = !!location.attributes?.partner || tier === "featured" || tier === "listed";
  const pitch = typeof location.attributes?.pitch === "string" ? location.attributes.pitch : null;
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);

  // De-dupe by user in case of stale duplicate rows; each avatar taps to a mini-profile.
  const peopleHere = Array.from(
    new Map(checkIns.filter((c) => c.profile).map((c) => [c.user_id, c])).values()
  );
  const active = peopleHere.length || location.active_check_ins || 0;
  const overflow = Math.max(0, peopleHere.length - MAX_AVATARS);

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

      {peopleHere.length ? (
        <View style={styles.peopleRow}>
          {peopleHere.slice(0, MAX_AVATARS).map((c) => (
            <Pressable
              key={c.user_id}
              onPress={() => setOpenProfileId(c.user_id)}
              style={styles.avatarWrap}
              hitSlop={4}
            >
              {c.profile?.avatar_url ? (
                <Image source={{ uri: c.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {(c.profile?.display_name ?? "?").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
          {overflow > 0 ? (
            <View style={[styles.avatar, styles.avatarMore]}>
              <Text style={styles.avatarMoreText}>+{overflow}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {location.verification_status === "needs_review" ? (
        <Text style={styles.warn}>Approximate pin — details pending verification</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable style={styles.primary} onPress={onOpenFeed}>
          <Text style={styles.primaryText}>{isDining ? "Open place feed" : "View Live Feed"}</Text>
        </Pressable>
        {myCheckInId ? (
          <Pressable style={styles.secondary} onPress={onEndCheckIn}>
            <Text style={styles.secondaryText}>End check-in</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondary} onPress={onDropAnchor}>
            <Text style={styles.secondaryText}>
              {isDining ? "I’m here" : "Drop Anchor Here"}
            </Text>
          </Pressable>
        )}
      </View>

      <MiniProfileModal
        visible={!!openProfileId}
        profileId={openProfileId}
        onClose={() => setOpenProfileId(null)}
      />
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
  peopleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatarWrap: { marginRight: -8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(8,14,22,0.94)",
    backgroundColor: colors.bgElevated,
  },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.action },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  avatarMore: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginLeft: -8,
  },
  avatarMoreText: { color: colors.text, fontWeight: "800", fontSize: 10 },
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
