import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const CROWD_COLORS: Record<string, string> = {
  Light: "#22C55E",
  Moderate: "#EAB308",
  Busy: "#F97316",
  Packed: "#EF4444",
};

type Props = {
  level: string;
  boatCount: number;
};

export function CrowdBadge({ level, boatCount }: Props) {
  const colors = useColors();
  const accent = CROWD_COLORS[level] ?? colors.primary;

  return (
    <View style={[styles.badge, { borderColor: accent, backgroundColor: accent + "22" }]}>
      <Text style={[styles.count, { color: accent }]}>{boatCount}</Text>
      <Text style={[styles.level, { color: colors.mutedForeground }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 56,
  },
  count: { fontSize: 15, fontWeight: "700" },
  level: { fontSize: 10, fontWeight: "600", marginTop: 1 },
});
