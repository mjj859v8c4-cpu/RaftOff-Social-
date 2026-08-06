/**
 * Map camera frames by lake slug — public geography only (not demo activity).
 * Lake entity IDs come from Supabase; framing uses slug.
 */
export type LakeFrame = {
  slug: string;
  name: string;
  region: string;
  center: { latitude: number; longitude: number };
  zoom: number;
  bounds: {
    ne: { latitude: number; longitude: number };
    sw: { latitude: number; longitude: number };
  };
};

export const LAKE_FRAMES: Record<string, LakeFrame> = {
  "lake-st-clair": {
    slug: "lake-st-clair",
    name: "Lake St. Clair",
    region: "Metro Detroit",
    center: { latitude: 42.505, longitude: -82.7 },
    zoom: 9.7,
    bounds: {
      ne: { latitude: 42.705, longitude: -82.42 },
      sw: { latitude: 42.33, longitude: -82.98 },
    },
  },
  "grand-traverse-bay": {
    slug: "grand-traverse-bay",
    name: "Grand Traverse Bay",
    region: "Traverse City",
    center: { latitude: 44.9, longitude: -85.55 },
    zoom: 9,
    bounds: {
      ne: { latitude: 45.35, longitude: -85.2 },
      sw: { latitude: 44.55, longitude: -85.9 },
    },
  },
};

export function getLakeFrame(slugOrName: string | null | undefined): LakeFrame {
  if (!slugOrName) return LAKE_FRAMES["lake-st-clair"];
  const bySlug = LAKE_FRAMES[slugOrName];
  if (bySlug) return bySlug;
  const match = Object.values(LAKE_FRAMES).find(
    (f) => f.name === slugOrName || f.slug === slugOrName
  );
  return match ?? LAKE_FRAMES["lake-st-clair"];
}
