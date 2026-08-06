import { useListHotspots, useGetLakeSummary } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
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
import { useRaftOffStore } from "@/features/map/store";
import { getLakeFrame } from "@/lib/geo/lakeFrames";
import { clusterMarkers } from "@/lib/map/cluster";

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
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeRow = lakes.find((l) => l.id === activeLakeId);
  const frame = getLakeFrame(lakeRow?.slug ?? "lake-st-clair");
  const { data: hotspots, isLoading } = useListHotspots();
  const { data: summary } = useGetLakeSummary();

  const region = {
    latitude: frame.center.latitude,
    longitude: frame.center.longitude,
    latitudeDelta: Math.max(
      0.08,
      (frame.bounds.ne.latitude - frame.bounds.sw.latitude) * 1.15
    ),
    longitudeDelta: Math.max(
      0.08,
      (frame.bounds.ne.longitude - frame.bounds.sw.longitude) * 1.15
    ),
  };

  const clustered = useMemo(() => {
    const points = (hotspots ?? []).map((h) => ({
      id: h.id,
      lat: h.lat,
      lng: h.lng,
      meta: h as unknown as Record<string, unknown>,
    }));
    // Native MapView starts around lake frame zoom ~9–10
    return clusterMarkers(points, frame.zoom);
  }, [hotspots, frame.zoom]);

  return (
    <View style={styles.container}>
      <MapView
        key={activeLakeId ?? "lake"}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="hybrid"
      >
        {clustered.map((item) => {
          if (item.type === "cluster") {
            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
              >
                <View style={[styles.cluster, { backgroundColor: colors.primary }]}>
                  <Text style={styles.clusterText}>{item.count}</Text>
                </View>
              </Marker>
            );
          }
          const spot = item.meta as {
            crowdLevel?: string;
            name?: string;
            boatCount?: number;
          };
          const pinColor = CROWD_COLORS[spot.crowdLevel ?? ""] ?? colors.primary;
          return (
            <Marker
              key={item.id}
              coordinate={{ latitude: item.lat, longitude: item.lng }}
              onCalloutPress={() => router.push(`/locations/${item.id}`)}
            >
              <View style={[styles.pin, { backgroundColor: pinColor }]}>
                <Feather name="anchor" size={11} color="#fff" />
              </View>
              <Callout tooltip onPress={() => router.push(`/locations/${item.id}`)}>
                <View
                  style={[
                    styles.callout,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.calloutTitle, { color: colors.foreground }]}>
                    {spot.name}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                    {spot.boatCount ?? 0} boats · {spot.crowdLevel}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.hud, { top: insets.top + 8 }]}>
        <Text style={styles.hudTitle}>{lakeRow?.name ?? frame.name}</Text>
        <Text style={styles.hudSub}>
          {summary
            ? `${summary.totalBoats} active · ${summary.activeHotspots} hotspots`
            : "Live lake map"}
          {summary?.topHotspot ? ` · Hot: ${summary.topHotspot}` : ""}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push("/(tabs)/drop-anchor")}
      >
        <Feather name="anchor" size={18} color="#fff" />
        <Text style={styles.fabText}>Drop Anchor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050A0F" },
  map: { flex: 1 },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  cluster: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    paddingHorizontal: 8,
  },
  clusterText: { color: "#fff", fontWeight: "800" },
  callout: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 140,
  },
  calloutTitle: { fontWeight: "800", marginBottom: 2 },
  hud: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "rgba(5,12,18,0.72)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  hudTitle: { color: "#F4FBFF", fontWeight: "800", fontSize: 16 },
  hudSub: { color: "rgba(244,251,255,0.8)", marginTop: 2, fontSize: 12 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#FF3D82",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  fabText: { color: "#fff", fontWeight: "800" },
});
