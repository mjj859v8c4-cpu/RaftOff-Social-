import { useListHotspots, useGetLakeSummary } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { LAKE_ST_CLAIR_REGION } from "@/supabase/seed/lake-st-clair-hotspots";
import { useRaftOffStore } from "@/features/map/store";
import { getLakeById, type MichiganLake } from "@/supabase/seed/michigan-lakes";

const CROWD_COLORS: Record<string, string> = {
  Light: "#22C55E",
  Moderate: "#EAB308",
  Busy: "#F97316",
  Packed: "#EF4444",
};

function regionForLake(lake: MichiganLake | undefined) {
  if (!lake || lake.id === "lake-st-clair") return LAKE_ST_CLAIR_REGION;
  const latitudeDelta = Math.max(
    0.08,
    (lake.bounds.ne.latitude - lake.bounds.sw.latitude) * 1.15,
  );
  const longitudeDelta = Math.max(
    0.08,
    (lake.bounds.ne.longitude - lake.bounds.sw.longitude) * 1.15,
  );
  return {
    latitude: lake.center.latitude,
    longitude: lake.center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

export function LakeMap() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lake = getLakeById(activeLakeId);
  const { data: hotspots, isLoading } = useListHotspots();
  const { data: summary } = useGetLakeSummary();
  const region = regionForLake(lake);

  return (
    <View style={styles.container}>
      <MapView
        key={activeLakeId}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="hybrid"
      >
        {hotspots?.map((spot) => {
          const pinColor = CROWD_COLORS[spot.crowdLevel] ?? colors.primary;
          return (
            <Marker
              key={spot.id}
              coordinate={{ latitude: spot.lat, longitude: spot.lng }}
              onCalloutPress={() => router.push(`/locations/loc-${spot.id}`)}
            >
              <View style={[styles.pin, { backgroundColor: pinColor }]}>
                <Feather name="anchor" size={11} color="#fff" />
              </View>
              <Callout tooltip onPress={() => router.push(`/locations/loc-${spot.id}`)}>
                <View
                  style={[
                    styles.callout,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.calloutName, { color: colors.foreground }]}>
                    {spot.name}
                  </Text>
                  <Text style={[styles.calloutSub, { color: colors.mutedForeground }]}>
                    {spot.boatCount} boats · {spot.crowdLevel}
                  </Text>
                  {spot.topVibe ? (
                    <Text style={[styles.calloutVibe, { color: colors.secondary }]}>
                      {spot.topVibe}
                    </Text>
                  ) : null}
                  <Text style={[styles.calloutLink, { color: colors.primary }]}>
                    View details
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {summary ? (
        <View
          style={[
            styles.overlay,
            {
              // LakeSwitcher + safe area live above this component on the Map tab.
              top: 12,
              backgroundColor: colors.card + "F2",
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.lakeTitle, { color: colors.foreground }]}>
            {lake?.name ?? "Lake St. Clair"}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>
                {summary.totalBoats}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                boats out
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>
                {summary.activeHotspots}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                hotspots
              </Text>
            </View>
            {summary.topHotspot ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={[styles.stat, { flex: 2 }]}>
                  <Text
                    style={[styles.statNum, { color: colors.secondary, fontSize: 14 }]}
                    numberOfLines={1}
                  >
                    {summary.topHotspot}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    top spot
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 78,
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
  map: { flex: 1 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  callout: {
    borderRadius: 12,
    padding: 12,
    minWidth: 155,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  calloutName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  calloutSub: { fontSize: 12, fontWeight: "400", marginBottom: 3 },
  calloutVibe: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  calloutLink: { fontSize: 12, fontWeight: "500" },
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  lakeTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
  statLabel: { fontSize: 11, fontWeight: "400", marginTop: 1 },
  divider: { width: 1, height: 28, marginHorizontal: 8 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
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
