import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

/** Known profile badge ids → short labels shown on profiles */
const BADGE_LABELS: Record<string, string> = {
  creator: "Creator",
  founder: "Founder",
  "co-founder": "Co-founder",
  "founding-member": "Founding",
};

const BADGE_ORDER = ["creator", "founder", "co-founder", "founding-member"];

function labelFor(id: string): string {
  return BADGE_LABELS[id] ?? id.replace(/-/g, " ");
}

function isCreatorish(id: string): boolean {
  return id === "creator" || id === "founder" || id === "co-founder";
}

export function ProfileBadges({ badges }: { badges?: string[] | null }) {
  if (!badges?.length) return null;

  const ordered = [
    ...BADGE_ORDER.filter((id) => badges.includes(id)),
    ...badges.filter((id) => !BADGE_ORDER.includes(id)),
  ];

  return (
    <View style={styles.row} accessibilityRole="text">
      {ordered.map((id) => (
        <Text
          key={id}
          style={[styles.badge, isCreatorish(id) ? styles.creator : styles.member]}
        >
          {labelFor(id)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
  },
  creator: {
    color: colors.actionStrong,
    borderColor: "rgba(255, 61, 130, 0.55)",
    backgroundColor: "rgba(255, 61, 130, 0.14)",
  },
  member: {
    color: colors.active,
    borderColor: "rgba(46, 242, 200, 0.35)",
    backgroundColor: "rgba(46, 242, 200, 0.1)",
  },
});
