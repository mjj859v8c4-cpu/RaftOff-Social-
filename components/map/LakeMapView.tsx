import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildMapHtml, getMapboxToken, type MapMarker } from "@/lib/mapbox/mapHtml";
import { pinColorForType, shouldShowAsPin } from "@/features/map/markers";
import { getLakeFrame } from "@/lib/geo/lakeFrames";
import type { Location } from "@/types/raftoff";
import { useRaftOffStore } from "@/features/map/store";

type Props = {
  lakeId: string;
  locations: Location[];
  selectedId: string | null;
  vibeFilter: string;
  onSelect: (id: string) => void;
  onMapPress?: () => void;
};

function markerKind(loc: Location): MapMarker["kind"] {
  if (loc.type === "restaurant" || loc.attributes?.group === "dining") return "dining";
  if (loc.type === "fishing_zone") return "fishing";
  if (loc.type === "event_zone") return "event";
  if (["marina", "boat_launch", "park", "waterfront_district"].includes(loc.type))
    return "service";
  if (loc.type.startsWith("social")) return "social";
  return "other";
}

export function LakeMapView({
  lakeId,
  locations,
  selectedId,
  vibeFilter,
  onSelect,
  onMapPress,
}: Props) {
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeRow = lakes.find((l) => l.id === lakeId);
  const lake = getLakeFrame(lakeRow?.slug ?? "lake-st-clair");

  const html = useMemo(() => {
    const markers: MapMarker[] = locations
      .filter((l) => shouldShowAsPin(l.type) || l.type === "restaurant")
      .filter((l) => {
        if (vibeFilter === "all") return true;
        if (vibeFilter === "active") return (l.active_check_ins ?? 0) > 0;
        if (vibeFilter === "fishing") return l.type === "fishing_zone";
        if (vibeFilter === "social")
          return l.type.startsWith("social") || l.type === "event_zone";
        if (vibeFilter === "services")
          return ["marina", "boat_launch", "park", "waterfront_district"].includes(l.type);
        if (vibeFilter === "dining")
          return l.type === "restaurant" || l.attributes?.group === "dining";
        return true;
      })
      .map((l) => {
        const lat =
          l.latitude ??
          (l.attributes?.displayLat as number | undefined) ??
          lake.center.latitude;
        const lng =
          l.longitude ??
          (l.attributes?.displayLng as number | undefined) ??
          lake.center.longitude;
        return {
          id: l.id,
          lat,
          lng,
          color: pinColorForType(l.type),
          active: (l.active_check_ins ?? 0) > 0 || l.id === selectedId,
          label: l.name,
          kind: markerKind(l),
          subtitle: l.attributes?.diningCategory
            ? String(l.attributes.diningCategory).replace(/_/g, " ")
            : l.type.replace(/_/g, " "),
        };
      });

    return buildMapHtml({
      token: getMapboxToken(),
      center: lake.center,
      zoom: lake.zoom,
      lakeName: lakeRow?.name ?? lake.name,
      markers,
      bounds: lake.bounds,
    });
  }, [lake, lakeRow?.name, locations, selectedId, vibeFilter]);

  return (
    <View style={styles.wrap}>
      <WebView
        key={`${lakeId}-${vibeFilter}`}
        originWhitelist={["*"]}
        source={{ html }}
        style={styles.map}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === "select" && data.id) onSelect(data.id);
            if (data.type === "mapclick") onMapPress?.();
          } catch {
            /* ignore */
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: "hidden" },
  map: { flex: 1, backgroundColor: "#050A0F" },
});
