import { useQuery } from "@tanstack/react-query";
import { buildLakeStClairHotspots, type Hotspot } from "@/supabase/seed/lake-st-clair-hotspots";
import { useRaftOffStore } from "@/features/map/store";

export type LakeSummary = {
  totalBoats: number;
  activeHotspots: number;
  topHotspot: string | null;
};

function withLiveCounts(hotspots: Hotspot[], checkIns: { location_id?: string | null; status: string; expires_at: string; location?: { slug?: string } | null }[]): Hotspot[] {
  const now = Date.now();
  const active = checkIns.filter(
    (c) => c.status === "active" && new Date(c.expires_at).getTime() > now
  );

  return hotspots.map((h) => {
    const count = active.filter(
      (c) => c.location?.slug === h.id || c.location_id === `loc-${h.id}`
    ).length;
    if (!count) return h;
    const boatCount = Math.max(h.boatCount, count);
    let crowdLevel = h.crowdLevel;
    if (boatCount >= 20) crowdLevel = "Packed";
    else if (boatCount >= 12) crowdLevel = "Busy";
    else if (boatCount >= 6) crowdLevel = "Moderate";
    else crowdLevel = "Light";
    return { ...h, boatCount, crowdLevel };
  });
}

export function useListHotspots() {
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);

  return useQuery({
    queryKey: ["hotspots", activeLakeId, checkIns.length],
    queryFn: async () => {
      if (activeLakeId !== "lake-st-clair") {
        // For other lakes, synthesize from location pins with display coords
        const locations = useRaftOffStore.getState().locationsForActiveLake();
        return locations
          .filter((l) => l.latitude != null && l.longitude != null)
          .slice(0, 30)
          .map((l) => ({
            id: l.slug,
            name: l.name,
            lat: l.latitude as number,
            lng: l.longitude as number,
            type: (l.type.includes("marina")
              ? "marina"
              : l.type.includes("fishing")
                ? "flats"
                : l.type.startsWith("social")
                  ? "sandbar"
                  : "anchorage") as Hotspot["type"],
            crowdLevel: ((l.active_check_ins ?? 0) >= 6
              ? "Busy"
              : (l.active_check_ins ?? 0) >= 2
                ? "Moderate"
                : "Light") as Hotspot["crowdLevel"],
            boatCount: l.active_check_ins ?? 0,
            topVibe: l.dominant_vibe,
            lakeId: l.lake_id,
          }));
      }
      return withLiveCounts(buildLakeStClairHotspots(), checkIns);
    },
  });
}

export function useGetLakeSummary() {
  const { data: hotspots } = useListHotspots();
  const summary = useRaftOffStore((s) => s.getSummary);

  return useQuery({
    queryKey: ["lake-summary", hotspots?.length, summary().updated_at],
    queryFn: async (): Promise<LakeSummary> => {
      const s = summary();
      const list = hotspots ?? [];
      const totalBoats = list.reduce((sum, h) => sum + h.boatCount, 0);
      const activeHotspots = list.filter((h) => h.boatCount > 0).length;
      const top = [...list].sort((a, b) => b.boatCount - a.boatCount)[0];
      return {
        totalBoats: totalBoats || s.active_check_ins,
        activeHotspots: activeHotspots || s.active_hotspots,
        topHotspot: top?.name ?? s.top_spot,
      };
    },
  });
}
