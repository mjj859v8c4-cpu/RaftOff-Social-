import { useQuery } from "@tanstack/react-query";
import { useRaftOffStore } from "@/features/map/store";
import type { Location } from "@/types/raftoff";

export type Hotspot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  crowdLevel: "Light" | "Moderate" | "Busy" | "Packed";
  boatCount: number;
  topVibe: string | null;
  lakeId: string;
};

export type LakeSummaryView = {
  totalBoats: number;
  activeHotspots: number;
  topHotspot: string | null;
};

function crowdFromCount(n: number): Hotspot["crowdLevel"] {
  if (n >= 20) return "Packed";
  if (n >= 12) return "Busy";
  if (n >= 6) return "Moderate";
  return "Light";
}

function locationToHotspot(l: Location, boatCount: number): Hotspot | null {
  if (l.latitude == null || l.longitude == null) return null;
  return {
    id: l.id,
    name: l.name,
    lat: l.latitude,
    lng: l.longitude,
    type: l.type,
    crowdLevel: crowdFromCount(boatCount),
    boatCount,
    topVibe: l.dominant_vibe ?? null,
    lakeId: l.lake_id,
  };
}

export function useListHotspots() {
  const locations = useRaftOffStore((s) => s.locations);
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const status = useRaftOffStore((s) => s.status);

  return useQuery({
    queryKey: ["hotspots", activeLakeId, locations.length, checkIns.length, status],
    queryFn: async (): Promise<Hotspot[]> => {
      const counts = new Map<string, number>();
      for (const c of checkIns) {
        if (!c.location_id || c.status !== "active") continue;
        counts.set(c.location_id, (counts.get(c.location_id) ?? 0) + 1);
      }
      return locations
        .map((l) => locationToHotspot(l, counts.get(l.id) ?? l.active_check_ins ?? 0))
        .filter((h): h is Hotspot => Boolean(h));
    },
    staleTime: 30_000,
  });
}

export function useGetLakeSummary() {
  const summary = useRaftOffStore((s) => s.summary);
  const { data: hotspots } = useListHotspots();

  return useQuery({
    queryKey: ["lake-summary", summary?.updated_at, hotspots?.length],
    queryFn: async (): Promise<LakeSummaryView> => {
      const list = hotspots ?? [];
      const activeHotspots = list.filter((h) => h.boatCount > 0).length;
      const top = [...list].sort((a, b) => b.boatCount - a.boatCount)[0];
      return {
        totalBoats: summary?.active_check_ins ?? list.reduce((s, h) => s + h.boatCount, 0),
        activeHotspots: activeHotspots || summary?.active_hotspots || 0,
        topHotspot: top?.name ?? summary?.top_spot ?? null,
      };
    },
    staleTime: 30_000,
  });
}
