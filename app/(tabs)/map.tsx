import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LakeMapView } from "@/components/map/LakeMapView";
import { LocationSheet } from "@/components/map/LocationSheet";
import { MapFilters } from "@/components/map/MapFilters";
import { LakeSummaryCard } from "@/components/map/LakeSummaryCard";
import { DiningStrip } from "@/components/map/DiningStrip";
import { LakeSwitcher } from "@/components/map/LakeSwitcher";
import { useRaftOffStore } from "@/features/map/store";
import { colors, spacing } from "@/lib/theme";
import { LoadingState } from "@/components/ui/States";

export default function MapScreen() {
  const router = useRouter();
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const setActiveLakeId = useRaftOffStore((s) => s.setActiveLakeId);
  const locations = useRaftOffStore((s) => s.locationsForActiveLake());
  const diningNearWater = useRaftOffStore((s) => s.diningForActiveLake());
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const activeMineId = useRaftOffStore((s) => s.activeMineId);
  const endCheckIn = useRaftOffStore((s) => s.endCheckIn);
  const selectedLocationId = useRaftOffStore((s) => s.selectedLocationId);
  const selectLocation = useRaftOffStore((s) => s.selectLocation);
  const status = useRaftOffStore((s) => s.status);
  const summary = useRaftOffStore((s) => s.getSummary());
  const cacheUpdatedAt = useRaftOffStore((s) => s.cacheUpdatedAt);
  const [vibeFilter, setVibeFilter] = useState("all");

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  const locationCheckIns = useMemo(
    () =>
      selectedLocation
        ? checkIns.filter((c) => c.location_id === selectedLocation.id && c.status === "active")
        : [],
    [checkIns, selectedLocation]
  );

  const myCheckInHere =
    !!activeMineId && locationCheckIns.some((c) => c.id === activeMineId);

  if (status === "loading" && !activeLakeId) {
    return <LoadingState label="Loading lakes…" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <LakeSwitcher value={activeLakeId} onChange={setActiveLakeId} />
        <MapFilters value={vibeFilter} onChange={setVibeFilter} />
      </View>

      <View style={styles.mapWrap}>
        <LakeMapView
          lakeId={activeLakeId ?? ""}
          locations={locations}
          selectedId={selectedLocationId}
          vibeFilter={vibeFilter}
          onSelect={(id) => selectLocation(id)}
          onMapPress={() => selectLocation(null)}
        />

        <View pointerEvents="box-none" style={styles.overlayTop}>
          <LakeSummaryCard
            lakeName={summary.lake_name}
            activeCheckIns={summary.active_check_ins}
            activeHotspots={summary.active_hotspots}
            topSpot={summary.top_spot}
            updatedLabel={
              cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleTimeString() : "now"
            }
          />
        </View>

        <Pressable
          style={[
            styles.fab,
            { bottom: selectedLocation || diningNearWater.length ? 190 : spacing.md },
          ]}
          onPress={() => router.push("/(tabs)/drop-anchor")}
        >
          <Text style={styles.fabText}>⚓ Drop Anchor</Text>
        </Pressable>

        {selectedLocation ? (
          <LocationSheet
            location={selectedLocation}
            checkIns={locationCheckIns}
            myCheckInId={myCheckInHere ? activeMineId : null}
            onClose={() => selectLocation(null)}
            onOpenFeed={() => router.push(`/locations/${selectedLocation.id}`)}
            onDropAnchor={() =>
              router.push({
                pathname: "/(tabs)/drop-anchor",
                params: { locationId: selectedLocation.id },
              })
            }
            onEndCheckIn={() => activeMineId && endCheckIn(activeMineId)}
          />
        ) : diningNearWater.length ? (
          <View style={styles.diningWrap}>
            <DiningStrip
              items={diningNearWater}
              onSelect={(id) => selectLocation(id)}
            />
          </View>
        ) : null}
      </View>

      <Text style={styles.safety}>
        Not a navigation tool — always use official charts and local knowledge. Exact fishing
        GPS is never shown.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  mapWrap: { flex: 1 },
  overlayTop: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
  },
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.action,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: "#041018", fontWeight: "800" },
  diningWrap: { position: "absolute", left: 0, right: 0, bottom: spacing.md },
  safety: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
