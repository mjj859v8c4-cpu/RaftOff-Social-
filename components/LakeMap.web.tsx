import { useListHotspots, useGetLakeSummary } from "@workspace/api-client-react";
import { useRouter } from "expo-router";
import React, { createElement, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useRaftOffStore } from "@/features/map/store";
import { getLakeFrame } from "@/lib/geo/lakeFrames";
import { buildMapHtml, getMapboxToken, type MapMarker } from "@/lib/mapbox/mapHtml";

const CROWD_COLORS: Record<string, string> = {
  Light: "#22C55E",
  Moderate: "#EAB308",
  Busy: "#F97316",
  Packed: "#EF4444",
};

function pinColor(crowdLevel: string, fallback: string) {
  return CROWD_COLORS[crowdLevel] ?? fallback;
}

/**
 * Expo-web LakeMap — iframe + MapLibre/Esri aerial (WebView is not available on web).
 */
export function LakeMap() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const hostRef = useRef<View>(null);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeRow = lakes.find((l) => l.id === activeLakeId);
  const lake = getLakeFrame(lakeRow?.slug ?? "lake-st-clair");
  const { data: hotspots, isLoading } = useListHotspots();
  const { data: summary } = useGetLakeSummary();

  const html = useMemo(() => {
    const markers: MapMarker[] = (hotspots ?? []).map((spot) => ({
      id: spot.id,
      lat: spot.lat,
      lng: spot.lng,
      color: pinColor(spot.crowdLevel, colors.primary),
      active: spot.boatCount > 0,
      label: spot.name,
      kind:
        spot.type.includes("marina") || spot.type.includes("launch")
          ? "service"
          : spot.type.includes("fishing") || spot.type === "region"
            ? "fishing"
            : "social",
      subtitle: `${spot.boatCount} boats · ${spot.crowdLevel}`,
    }));

    return buildMapHtml({
      token: getMapboxToken(),
      center: lake.center,
      zoom: lake.zoom,
      lakeName: lakeRow?.name ?? lake.name,
      markers,
      bounds: lake.bounds,
    });
  }, [hotspots, lake, lakeRow?.name, colors.primary]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      try {
        const raw = typeof event.data === "string" ? event.data : "";
        if (!raw.startsWith("{")) return;
        const data = JSON.parse(raw) as { type?: string; id?: string };
        if (data.type === "select" && data.id) {
          router.push(`/locations/${data.id}`);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  const iframe = createElement("iframe", {
    key: activeLakeId,
    title: `${lake.name} map`,
    srcDoc: html,
    style: {
      border: "none",
      width: "100%",
      height: "100%",
      display: "block",
      background: "#050A0F",
    },
    sandbox: "allow-scripts allow-same-origin",
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} ref={hostRef}>
      <View style={styles.map}>{iframe}</View>

      {summary ? (
        <View
          style={[
            styles.overlay,
            {
              top: 12,
              backgroundColor: colors.card + "F2",
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.lakeTitle, { color: colors.foreground }]}>
            {lake?.name ?? "Lake St. Clair"}
          </Text>
          <Text style={[styles.demoHint, { color: colors.mutedForeground }]}>
            Demo activity · not live boats
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
  map: { flex: 1, backgroundColor: "#050A0F" },
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
  lakeTitle: { fontSize: 17, fontWeight: "700", marginBottom: 2 },
  demoHint: { fontSize: 11, fontWeight: "500", marginBottom: 8 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
  statLabel: { fontSize: 11, fontWeight: "400", marginTop: 1 },
  divider: { width: 1, height: 28, marginHorizontal: 8 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,10,15,0.25)",
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
