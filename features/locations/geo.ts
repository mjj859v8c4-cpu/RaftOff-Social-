import type { Location } from "@/types/raftoff";
import { lakeStClairBounds } from "@/lib/theme";

/**
 * PostGIS-style helpers for when Supabase is connected.
 * Local schematic positions map onto the Lake St. Clair camera bounds for Mapbox display.
 */
export function schematicToLatLng(schematic: { x: number; y: number }) {
  const { ne, sw } = lakeStClairBounds;
  const longitude = sw.longitude + schematic.x * (ne.longitude - sw.longitude);
  const latitude = ne.latitude - schematic.y * (ne.latitude - sw.latitude);
  return { latitude, longitude };
}

export function locationsInViewport(
  locations: Location[],
  bbox: { west: number; south: number; east: number; north: number }
): Location[] {
  return locations.filter((loc) => {
    const schematic = loc.attributes?.schematic as { x: number; y: number } | undefined;
    if (!schematic) return false;
    const { latitude, longitude } = schematicToLatLng(schematic);
    return (
      longitude >= bbox.west &&
      longitude <= bbox.east &&
      latitude >= bbox.south &&
      latitude <= bbox.north
    );
  });
}

export function nearestLocations(
  locations: Location[],
  point: { latitude: number; longitude: number },
  limit = 5
): Location[] {
  return [...locations]
    .map((loc) => {
      const schematic = loc.attributes?.schematic as { x: number; y: number } | undefined;
      if (!schematic) return { loc, d: Number.POSITIVE_INFINITY };
      const p = schematicToLatLng(schematic);
      const d =
        (p.latitude - point.latitude) ** 2 + (p.longitude - point.longitude) ** 2;
      return { loc, d };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.loc);
}

export const LOCATION_FEED_SQL = `
-- Permission-aware location feed (apply via secure function in Supabase)
-- GET semantics: /locations/:id/feed?tab=&cursor=&limit=
create or replace function public.location_feed(
  p_location_id uuid,
  p_tab text default 'live',
  p_limit int default 20
)
returns jsonb
language plpgsql
security definer
stable
as $$
begin
  perform public.expire_check_ins();
  -- Full audience/block/moderation enforcement belongs here before production.
  return jsonb_build_object(
    'location_id', p_location_id,
    'tab', p_tab,
    'limit', p_limit
  );
end;
$$;
`;
