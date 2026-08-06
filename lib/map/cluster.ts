/**
 * Simple grid-based marker clustering for map pins.
 * Reduces marker count at low zoom; expands when zoomed in.
 */
export type ClusterPoint = {
  id: string;
  lat: number;
  lng: number;
  weight?: number;
  meta?: Record<string, unknown>;
};

export type ClusterResult =
  | { type: "point"; id: string; lat: number; lng: number; meta?: Record<string, unknown> }
  | {
      type: "cluster";
      id: string;
      lat: number;
      lng: number;
      count: number;
      points: ClusterPoint[];
    };

export function clusterMarkers(
  points: ClusterPoint[],
  zoom: number,
  options?: { minZoomToExpand?: number }
): ClusterResult[] {
  const expandAt = options?.minZoomToExpand ?? 11.5;
  if (zoom >= expandAt || points.length <= 12) {
    return points.map((p) => ({
      type: "point" as const,
      id: p.id,
      lat: p.lat,
      lng: p.lng,
      meta: p.meta,
    }));
  }

  // Cell size shrinks as zoom increases
  const cell = Math.max(0.02, 0.35 / Math.pow(2, Math.max(zoom - 8, 0)));
  const buckets = new Map<string, ClusterPoint[]>();

  for (const p of points) {
    const key = `${Math.floor(p.lat / cell)}_${Math.floor(p.lng / cell)}`;
    const list = buckets.get(key) ?? [];
    list.push(p);
    buckets.set(key, list);
  }

  const results: ClusterResult[] = [];
  for (const [key, list] of buckets) {
    if (list.length === 1) {
      const p = list[0];
      results.push({ type: "point", id: p.id, lat: p.lat, lng: p.lng, meta: p.meta });
      continue;
    }
    const lat = list.reduce((s, p) => s + p.lat, 0) / list.length;
    const lng = list.reduce((s, p) => s + p.lng, 0) / list.length;
    results.push({
      type: "cluster",
      id: `cluster-${key}`,
      lat,
      lng,
      count: list.length,
      points: list,
    });
  }
  return results;
}
