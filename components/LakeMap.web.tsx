import { useListHotspots, useGetLakeSummary } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { CrowdBadge } from "@/components/CrowdBadge";
import { useRaftOffStore } from "@/features/map/store";
import { getLakeById } from "@/supabase/seed/michigan-lakes";

const CROWD_COLORS: Record<string, string> = {
  Light: "#22C55E",
  Moderate: "#EAB308",
  Busy: "#F97316",
  Packed: "#EF4444",
};

export function LakeMap() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lake = getLakeById(activeLakeId);
  const { data: hotspots, isLoading } = useListHotspots();
  const { data: summary } = useGetLakeSummary();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            // LakeSwitcher + safe area live above this component on the Map tab.
            paddingTop: 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {lake?.name ?? "Lake St. Clair"}
        </Text>
        {summary ? (
          <View style={styles.statsRow}>
            <Text style={[styles.stat, { color: colors.primary }]}>
              {summary.totalBoats} boats out
            </Text>
            <Text style={[styles.dot, { color: colors.mutedForeground }]}>{" · "}</Text>
            <Text style={[styles.stat, { color: colors.primary }]}>
              {summary.activeHotspots} hotspots
            </Text>
            {summary.topHotspot ? (
              <>
                <Text style={[styles.dot, { color: colors.mutedForeground }]}>{" · "}</Text>
                <Text style={[styles.topSpot, { color: colors.secondary }]}>
                  {summary.topHotspot}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 118 }]}
          showsVerticalScrollIndicator={false}
        >
          {(hotspots ?? []).map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/locations/loc-${spot.id}`)}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: CROWD_COLORS[spot.crowdLevel] ?? colors.primary,
                  },
                ]}
              >
                <Feather name="anchor" size={11} color="#fff" />
              </View>
              <View style={styles.cardMid}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{spot.name}</Text>
                <Text style={[styles.cardType, { color: colors.mutedForeground }]}>
                  {spot.type.charAt(0).toUpperCase() + spot.type.slice(1)}
                  {spot.topVibe ? ` · ${spot.topVibe}` : ""}
                </Text>
              </View>
              <CrowdBadge level={spot.crowdLevel} boatCount={spot.boatCount} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 118,
            backgroundColor: colors.primary,
          },
        ]}
        onPress={() => router.push("/(tabs)/drop-anchor")}
        activeOpacity={0.85}
      >
        <Feather name="anchor" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  stat: { fontSize: 13, fontWeight: "500" },
  dot: { fontSize: 13 },
  topSpot: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pinDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cardMid: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "600" },
  cardType: { fontSize: 12, fontWeight: "400", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
