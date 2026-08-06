/**
 * Verified Lake St. Clair hotspots
 * Sources: USGS, NOAA Chart 14850/14852, official marina references (Corey Johnson seed)
 */
export type HotspotType =
  | "sandbar"
  | "anchorage"
  | "beach"
  | "marina"
  | "launch"
  | "flats"
  | "channel";

export type CrowdLevel = "Light" | "Moderate" | "Busy" | "Packed";

export type Hotspot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: HotspotType;
  crowdLevel: CrowdLevel;
  boatCount: number;
  topVibe: string | null;
  lakeId: string;
};

export const LAKE_ST_CLAIR_REGION = {
  latitude: 42.505,
  longitude: -82.7,
  latitudeDelta: 0.4,
  longitudeDelta: 0.58,
};

const BASE: Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: HotspotType;
}> = [
  { id: "strawberry-island", name: "Strawberry Island", lat: 42.5981, lng: -82.7094, type: "sandbar" },
  { id: "gull-island", name: "Gull Island", lat: 42.5303, lng: -82.6821, type: "sandbar" },
  { id: "jobbie-nooner-area", name: "Jobbie Nooner Area", lat: 42.538, lng: -82.6766, type: "sandbar" },
  { id: "grassy-island", name: "Grassy Island", lat: 42.6044, lng: -82.6583, type: "sandbar" },
  { id: "anchor-bay", name: "Anchor Bay", lat: 42.65, lng: -82.7166, type: "anchorage" },
  { id: "big-muscamoot-bay", name: "Big Muscamoot Bay", lat: 42.5578, lng: -82.6607, type: "anchorage" },
  { id: "little-muscamoot-bay", name: "Little Muscamoot Bay", lat: 42.5781, lng: -82.626, type: "anchorage" },
  { id: "goose-bay", name: "Goose Bay", lat: 42.5845, lng: -82.6791, type: "anchorage" },
  { id: "fisher-bay", name: "Fisher Bay", lat: 42.6067, lng: -82.651, type: "anchorage" },
  { id: "metro-beach", name: "Metro Beach", lat: 42.5819, lng: -82.8098, type: "beach" },
  { id: "harsens-island", name: "Harsens Island", lat: 42.5895, lng: -82.5885, type: "beach" },
  { id: "grosse-pointe-shoreline", name: "Grosse Pointe Shoreline", lat: 42.3967, lng: -82.8885, type: "beach" },
  { id: "st-clair-shores-marina", name: "St. Clair Shores Marina", lat: 42.493, lng: -82.887, type: "marina" },
  { id: "jefferson-beach-marina", name: "Jefferson Beach Marina", lat: 42.4723, lng: -82.8885, type: "marina" },
  { id: "emerald-city-harbor", name: "Emerald City Harbor", lat: 42.4683, lng: -82.8839, type: "marina" },
  { id: "macray-harbor", name: "MacRay Harbor", lat: 42.568, lng: -82.832, type: "marina" },
  { id: "belle-maer-harbor", name: "Belle Maer Harbor", lat: 42.6145, lng: -82.7865, type: "marina" },
  { id: "harley-ensign-memorial", name: "Harley Ensign Memorial", lat: 42.5933, lng: -82.7747, type: "launch" },
  { id: "selfridge-area", name: "Selfridge Area", lat: 42.605, lng: -82.8347, type: "launch" },
  { id: "fair-haven", name: "Fair Haven", lat: 42.6792, lng: -82.65, type: "launch" },
  { id: "st-clair-flats", name: "St. Clair Flats", lat: 42.5959, lng: -82.6327, type: "flats" },
  { id: "north-channel", name: "North Channel", lat: 42.6102, lng: -82.6075, type: "channel" },
  { id: "middle-channel", name: "Middle Channel", lat: 42.5795, lng: -82.5675, type: "channel" },
  { id: "south-channel", name: "South Channel", lat: 42.5334, lng: -82.6707, type: "channel" },
  { id: "st-clair-river-entrance", name: "St. Clair River Entrance", lat: 42.618, lng: -82.6, type: "channel" },
  { id: "detroit-river-entrance", name: "Detroit River Entrance", lat: 42.372, lng: -82.918, type: "channel" },
];

const DEMO_ACTIVITY: Record<
  string,
  { crowdLevel: CrowdLevel; boatCount: number; topVibe: string | null }
> = {
  "strawberry-island": { crowdLevel: "Busy", boatCount: 18, topVibe: "Party" },
  "gull-island": { crowdLevel: "Moderate", boatCount: 9, topVibe: "Chill" },
  "jobbie-nooner-area": { crowdLevel: "Light", boatCount: 3, topVibe: null },
  "metro-beach": { crowdLevel: "Moderate", boatCount: 11, topVibe: "Family" },
  "jefferson-beach-marina": { crowdLevel: "Busy", boatCount: 14, topVibe: "Food & Drinks" },
  "st-clair-shores-marina": { crowdLevel: "Moderate", boatCount: 8, topVibe: "Chill" },
  "anchor-bay": { crowdLevel: "Light", boatCount: 5, topVibe: "Watersports" },
  "big-muscamoot-bay": { crowdLevel: "Moderate", boatCount: 7, topVibe: "Fishing" },
};

/** Stable fallback boat count from slug (no Math.random — keeps demos reproducible) */
function fallbackBoatCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return 1 + (Math.abs(hash) % 4);
}

export function hotspotTypeToLocationType(
  t: HotspotType
): import("@/types/raftoff").LocationType {
  switch (t) {
    case "sandbar":
      return "social_sandbar";
    case "anchorage":
      return "social_bay";
    case "beach":
      return "park";
    case "marina":
      return "marina";
    case "launch":
      return "boat_launch";
    case "flats":
      return "region";
    case "channel":
      return "channel";
  }
}

export function buildLakeStClairHotspots(): Hotspot[] {
  return BASE.map((b) => {
    const activity = DEMO_ACTIVITY[b.id] ?? {
      crowdLevel: "Light" as CrowdLevel,
      boatCount: fallbackBoatCount(b.id),
      topVibe: null,
    };
    return {
      ...b,
      lakeId: "lake-st-clair",
      crowdLevel: activity.crowdLevel,
      boatCount: activity.boatCount,
      topVibe: activity.topVibe,
    };
  });
}
