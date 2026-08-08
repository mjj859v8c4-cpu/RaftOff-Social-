import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

type HotSpot = {
  name: string;
  count: number;
};

type Props = {
  lakeName: string;
  activeCheckIns: number;
  activeHotspots: number;
  topSpot: string | null;
  updatedLabel: string;
  hotSpots?: HotSpot[];
};

function intensityBars(count: number, max: number) {
  if (!max) return 1;
  const ratio = count / max;
  if (ratio >= 0.85) return 5;
  if (ratio >= 0.65) return 4;
  if (ratio >= 0.45) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

export function LakeSummaryCard({
  lakeName,
  activeCheckIns,
  activeHotspots,
  topSpot,
  updatedLabel,
  hotSpots = [],
}: Props) {
  const ranked = hotSpots.slice(0, 3);
  const maxCount = ranked[0]?.count ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.lake}>{lakeName}</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={styles.kicker}>Check-ins</Text>
          <Text style={styles.value}>{activeCheckIns}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.kicker}>Hotspots</Text>
          <Text style={styles.value}>{activeHotspots}</Text>
        </View>
        <View style={styles.cell}>
          <Text style={styles.kicker}>#1 spot</Text>
          <Text style={styles.value} numberOfLines={1}>
            {topSpot ?? "—"}
          </Text>
        </View>
      </View>

      {ranked.length > 0 ? (
        <View style={styles.hotBlock}>
          <Text style={styles.hotTitle}>🔥 What&apos;s Hot</Text>
          {ranked.map((spot, i) => {
            const level = intensityBars(spot.count, maxCount);
            return (
              <View key={spot.name} style={styles.hotRow}>
                <Text style={styles.hotRank}>{i + 1}</Text>
                <View style={styles.hotBody}>
                  <View style={styles.hotNameRow}>
                    <Text style={styles.hotName} numberOfLines={1}>
                      {spot.name}
                    </Text>
                    <Text style={styles.hotCount}>{spot.count}</Text>
                  </View>
                  <View style={styles.bars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <View
                        key={n}
                        style={[
                          styles.bar,
                          n <= level && styles.barOn,
                          n <= level && { height: 3 + n * 2 },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <Text style={styles.updated}>Updated {updatedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(11, 21, 32, 0.92)",
    borderColor: "rgba(255, 61, 130, 0.35)",
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.md,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  lake: { color: colors.text, fontWeight: "700", fontSize: 16 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.active,
  },
  liveText: {
    color: colors.active,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
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
  hotBlock: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  hotTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },
  hotRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  hotRank: {
    width: 16,
    color: colors.actionStrong,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  hotBody: { flex: 1 },
  hotNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 3,
  },
  hotName: { flex: 1, color: colors.text, fontSize: 11, fontWeight: "700" },
  hotCount: { color: colors.muted, fontSize: 10, fontWeight: "600", marginLeft: 6 },
  bars: { flexDirection: "row", gap: 2, alignItems: "flex-end", height: 12 },
  bar: {
    flex: 1,
    maxWidth: 14,
    height: 3,
    borderRadius: 1,
    backgroundColor: "rgba(247, 244, 255, 0.12)",
  },
  barOn: {
    backgroundColor: colors.action,
  },
  updated: { color: colors.muted, fontSize: 11, marginTop: 8 },
});
