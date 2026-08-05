import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type Props = {
  lakeName: string;
  activeCheckIns: number;
  activeHotspots: number;
  topSpot: string | null;
  updatedLabel: string;
};

export function LakeSummaryCard({
  lakeName,
  activeCheckIns,
  activeHotspots,
  topSpot,
  updatedLabel,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.lake}>{lakeName}</Text>
      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.kicker}>Live</Text>
          <Text style={styles.value}>{activeCheckIns} check-ins</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.kicker}>Hotspots</Text>
          <Text style={styles.value}>{activeHotspots}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.kicker}>Top spot</Text>
          <Text style={styles.value} numberOfLines={1}>
            {topSpot ?? "—"}
          </Text>
        </View>
      </View>
      <Text style={styles.updated}>Updated {updatedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(11, 21, 32, 0.92)",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  lake: { color: colors.text, fontWeight: "700", fontSize: 16, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  cell: {
    flex: 1,
    backgroundColor: colors.bgSoft,
    borderRadius: 10,
    padding: 8,
  },
  kicker: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: { color: colors.text, fontSize: 12, fontWeight: "600" },
  updated: { color: colors.muted, fontSize: 11, marginTop: 8 },
});
