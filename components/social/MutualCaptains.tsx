import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import type { Profile } from "@/types/raftoff";

type Props = {
  mutuals: Profile[];
  totalCount: number;
  compact?: boolean;
};

/** Overlapping avatars + "X mutual captains" near Connect on profiles. */
export function MutualCaptains({ mutuals, totalCount, compact }: Props) {
  if (totalCount <= 0 || !mutuals.length) return null;

  const shown = mutuals.slice(0, 4);
  const overflow = Math.max(0, totalCount - shown.length);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.avatarRow}>
        {shown.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/u/${p.username}` as never)}
            style={styles.avatarWrap}
            hitSlop={4}
          >
            {p.avatar_url ? (
              <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {(p.display_name ?? "?").slice(0, 2).toUpperCase()}
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
      <Text style={styles.label}>
        {totalCount} mutual captain{totalCount === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    marginBottom: 10,
  },
  wrapCompact: { paddingHorizontal: 0, marginBottom: 8 },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { marginRight: -8 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.bg,
    backgroundColor: colors.bgElevated,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.action,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 9 },
  avatarMore: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginLeft: -8,
  },
  avatarMoreText: { color: colors.text, fontWeight: "800", fontSize: 9 },
  label: { color: colors.active, fontSize: 12, fontWeight: "700", flexShrink: 1 },
});
