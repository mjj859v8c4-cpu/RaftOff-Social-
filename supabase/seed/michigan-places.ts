import type { LocationType, SeedLocation } from "../../types/raftoff";
import { MICHIGAN_LAKES } from "./michigan-lakes";

export type DiningCategory =
  | "bar"
  | "restaurant"
  | "waterfront_dining"
  | "nightlife";

/** B2B listing tier — featured = ad pitch; listed = free “on RaftOff” presence */
export type PartnerTier = "featured" | "listed";

type DiningSeed = {
  lakeSlug: string;
  slug: string;
  name: string;
  type: "restaurant" | "marina";
  category: DiningCategory;
  lat: number;
  lng: number;
  note: string;
  /** Sales pitch: business is on the RaftOff map */
  partner?: boolean;
  partnerTier?: PartnerTier;
  /** Short pitch line shown in sheets / partner strip */
  pitch?: string;
};

/**
 * Waterfront bars & restaurants — public business points near popular lakes.
 * Exact dockage/hours still need operator verification before production claims.
 */
export const MICHIGAN_DINING: DiningSeed[] = [
  // —— Lake St. Clair / Metro (partner pitch list) ——
  {
    lakeSlug: "lake-st-clair",
    slug: "scotty-simpsons",
    name: "Scotty Simpson’s Fish & Chips",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.4732,
    lng: -82.8794,
    note: "Nautical Mile classic · St. Clair Shores",
    partner: true,
    partnerTier: "featured",
    pitch: "Dock-and-dine landmark on the Mile — featured partner placement.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "bliss-nautical-mile",
    name: "Bliss",
    type: "restaurant",
    category: "nightlife",
    lat: 42.4761,
    lng: -82.8812,
    note: "Nautical Mile nightlife · Jefferson",
    partner: true,
    partnerTier: "featured",
    pitch: "Prime nightlife pin — reach boaters before they pick a dock.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "brownies-on-the-lake",
    name: "Brownie’s on the Lake",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.4788,
    lng: -82.8825,
    note: "St. Clair Shores waterfront",
    partner: true,
    partnerTier: "featured",
    pitch: "Waterfront patio energy — featured in Bars & food.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "lucianos-on-the-mile",
    name: "Luciano’s Italian Restaurant",
    type: "restaurant",
    category: "restaurant",
    lat: 42.4745,
    lng: -82.8801,
    note: "Nautical Mile dining",
    partner: true,
    partnerTier: "listed",
    pitch: "Listed on RaftOff — upgrade to Featured for map & strip priority.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "mad-crab-scs",
    name: "Mad Crab",
    type: "restaurant",
    category: "restaurant",
    lat: 42.4812,
    lng: -82.884,
    note: "St. Clair Shores seafood",
    partner: true,
    partnerTier: "listed",
    pitch: "Seafood stop for crews coming off the lake.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "pat-obriens-scs",
    name: "Pat O’Brien’s Bar & Grill",
    type: "restaurant",
    category: "bar",
    lat: 42.4705,
    lng: -82.8778,
    note: "St. Clair Shores bar",
    partner: true,
    partnerTier: "listed",
    pitch: "Après-anchor bar pin for Mile traffic.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "lakeside-bar-grill",
    name: "Lakeside Bar & Grill",
    type: "restaurant",
    category: "bar",
    lat: 42.492,
    lng: -82.8865,
    note: "Near Jefferson Beach corridor",
    partner: true,
    partnerTier: "listed",
    pitch: "Marina-adjacent listing for dockside crews.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "deck-at-macray",
    name: "The Deck at MacRay Harbor",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.5685,
    lng: -82.8315,
    note: "MacRay Harbor · Harrison Twp",
    partner: true,
    partnerTier: "featured",
    pitch: "Harbor patio — featured dock-and-dine placement.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "cj-barrymores",
    name: "C.J. Barrymore’s",
    type: "restaurant",
    category: "nightlife",
    lat: 42.5895,
    lng: -82.8355,
    note: "Harrison Township · near lake corridor",
    partner: true,
    partnerTier: "listed",
    pitch: "Large-venue nightlife pin for lake-day spillover.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "the-wharf-st-clair",
    name: "The Wharf Restaurant",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.8265,
    lng: -82.4865,
    note: "St. Clair riverfront",
    partner: true,
    partnerTier: "featured",
    pitch: "Riverfront dining — north-lake featured partner.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "gilberts-lodge",
    name: "Gilbert’s Lodge",
    type: "restaurant",
    category: "restaurant",
    lat: 42.824,
    lng: -82.489,
    note: "St. Clair",
    partner: true,
    partnerTier: "listed",
    pitch: "Town dining listing for St. Clair day-trippers.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "tin-fish-new-baltimore",
    name: "Tin Fish",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.6815,
    lng: -82.7368,
    note: "New Baltimore · Anchor Bay",
    partner: true,
    partnerTier: "featured",
    pitch: "Anchor Bay waterfront — featured for north-bay boaters.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "pinkeys-boulevard-inn",
    name: "Pinkey’s Boulevard Inn",
    type: "restaurant",
    category: "restaurant",
    lat: 42.821,
    lng: -82.4925,
    note: "St. Clair",
    partner: true,
    partnerTier: "listed",
    pitch: "Historic inn dining — listed partner presence.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "surfside-bar-grill",
    name: "Surfside Bar & Grill",
    type: "restaurant",
    category: "bar",
    lat: 42.6155,
    lng: -82.7875,
    note: "Near Belle Maer / Anchor Bay",
    partner: true,
    partnerTier: "listed",
    pitch: "Bay-side bar listing for post-raft crews.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "on-the-bay",
    name: "On the Bay",
    type: "restaurant",
    category: "bar",
    lat: 42.648,
    lng: -82.708,
    note: "Anchor Bay social zone",
    partner: false,
    pitch: "Raft-ups and weekend scene — social check-in zone.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "shortys-bar-grill",
    name: "Shorty's Bar & Grill",
    type: "restaurant",
    category: "bar",
    lat: 42.6842,
    lng: -82.7385,
    note: "New Baltimore · Anchor Bay",
    partner: true,
    partnerTier: "listed",
    pitch: "Anchor Bay après-boat stop.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "fin-eatery",
    name: "Fin's Eatery",
    type: "restaurant",
    category: "restaurant",
    lat: 42.6828,
    lng: -82.7358,
    note: "New Baltimore riverfront",
    partner: true,
    partnerTier: "listed",
    pitch: "Riverfront dinner after a bay day.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "waterfront-grosse-pointe",
    name: "The Waterfront Restaurant",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.3855,
    lng: -82.9125,
    note: "Grosse Pointe Park lakefront",
    partner: true,
    partnerTier: "featured",
    pitch: "South-shore lakefront featured partner.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "mikes-on-the-water",
    name: "Mike's on the Water",
    type: "restaurant",
    category: "bar",
    lat: 42.4795,
    lng: -82.8838,
    note: "St. Clair Shores Nautical Mile",
    partner: true,
    partnerTier: "listed",
    pitch: "Mile traffic bar pin.",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "captains-club-algonac",
    name: "Captain's Club",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.6185,
    lng: -82.5625,
    note: "Algonac riverfront",
    partner: true,
    partnerTier: "featured",
    pitch: "Riverfront club — north-channel partner.",
  },

  // Grand Traverse Bay / TC
  {
    lakeSlug: "grand-traverse-bay",
    slug: "the-dockside-tc",
    name: "Dockside / Open Space TC waterfront",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 44.764,
    lng: -85.621,
    note: "Traverse City bayfront",
  },
  {
    lakeSlug: "grand-traverse-bay",
    slug: "mode-s-cafe-waterfront",
    name: "Mode’s Bum Steer area waterfront",
    type: "restaurant",
    category: "bar",
    lat: 44.763,
    lng: -85.62,
    note: "TC nightlife near the bay",
  },
  {
    lakeSlug: "grand-traverse-bay",
    slug: "old-mission-peninsula-dining",
    name: "Old Mission Peninsula tasting & dining",
    type: "restaurant",
    category: "restaurant",
    lat: 44.92,
    lng: -85.52,
    note: "Peninsula overlooks West Arm",
  },

  // Torch
  {
    lakeSlug: "torch-lake",
    slug: "torch-lake-cafe",
    name: "Torch Lake Café / Clam Lake area",
    type: "restaurant",
    category: "restaurant",
    lat: 44.93,
    lng: -85.28,
    note: "South Torch corridor dining",
  },
  {
    lakeSlug: "torch-lake",
    slug: "short-s-bellaire",
    name: "Short’s Brewing (Bellaire nearby)",
    type: "restaurant",
    category: "bar",
    lat: 44.98,
    lng: -85.21,
    note: "Popular après-lake stop",
  },

  // Higgins / Houghton
  {
    lakeSlug: "higgins-lake",
    slug: "higgins-lake-bar",
    name: "Higgins Lake shoreline grill",
    type: "restaurant",
    category: "bar",
    lat: 44.47,
    lng: -84.71,
    note: "Near south shore traffic",
  },
  {
    lakeSlug: "houghton-lake",
    slug: "houghton-lake-dockside",
    name: "Houghton Lake dockside dining",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 44.31,
    lng: -84.76,
    note: "West shore restaurant row",
  },
  {
    lakeSlug: "houghton-lake",
    slug: "houghton-lake-pub",
    name: "Houghton Lake pub & patio",
    type: "restaurant",
    category: "bar",
    lat: 44.33,
    lng: -84.7,
    note: "Town-side après fish",
  },

  // Charlevoix / Walloon
  {
    lakeSlug: "lake-charlevoix",
    slug: "charlevoix-bridge-street",
    name: "Charlevoix Bridge Street dining",
    type: "restaurant",
    category: "restaurant",
    lat: 45.318,
    lng: -85.258,
    note: "Steps from Round Lake / channel",
  },
  {
    lakeSlug: "lake-charlevoix",
    slug: "charlevoix-waterfront-bar",
    name: "Charlevoix waterfront bar",
    type: "restaurant",
    category: "bar",
    lat: 45.317,
    lng: -85.26,
    note: "Channel-view nightlife",
  },
  {
    lakeSlug: "walloon-lake",
    slug: "walloon-lake-inn-dining",
    name: "Walloon Lake village dining",
    type: "restaurant",
    category: "restaurant",
    lat: 45.266,
    lng: -84.937,
    note: "Village waterfront cluster",
  },

  // Burt / Mullett
  {
    lakeSlug: "burt-lake",
    slug: "indian-river-dining",
    name: "Indian River waterfront dining",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 45.412,
    lng: -84.613,
    note: "Inland Waterway hub",
  },
  {
    lakeSlug: "mullett-lake",
    slug: "topinabee-dining",
    name: "Topinabee shoreline dining",
    type: "restaurant",
    category: "restaurant",
    lat: 45.48,
    lng: -84.59,
    note: "West Mullett stops",
  },

  // Crystal / Gull / Cass
  {
    lakeSlug: "crystal-lake",
    slug: "beulah-waterfront",
    name: "Beulah waterfront restaurants",
    type: "restaurant",
    category: "restaurant",
    lat: 44.625,
    lng: -86.091,
    note: "Crystal Lake / Betsie corridor",
  },
  {
    lakeSlug: "crystal-lake",
    slug: "frankfort-bar",
    name: "Frankfort downtown bars",
    type: "restaurant",
    category: "bar",
    lat: 44.634,
    lng: -86.234,
    note: "Lake Michigan + Crystal day trips",
  },
  {
    lakeSlug: "gull-lake",
    slug: "gull-lake-view",
    name: "Gull Lake waterfront dining",
    type: "restaurant",
    category: "waterfront_dining",
    lat: 42.395,
    lng: -85.41,
    note: "SW Michigan lake classic",
  },
  {
    lakeSlug: "cass-lake",
    slug: "cass-lake-dockside",
    name: "Cass Lake area dockside eats",
    type: "restaurant",
    category: "restaurant",
    lat: 42.615,
    lng: -83.355,
    note: "Oakland County lake circuit",
  },
];

/** St. Clair partners only — used by web demo + sales pitch */
export const ST_CLAIR_PARTNER_DINING = MICHIGAN_DINING.filter(
  (d) => d.lakeSlug === "lake-st-clair" && d.partner
);

/** Social / recreation pins per lake (display coords = public approximate place centers). */
type PlaceSeed = {
  lakeSlug: string;
  slug: string;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
  note?: string;
};

export const MICHIGAN_PLACES: PlaceSeed[] = [
  // St Clair highlights
  {
    lakeSlug: "lake-st-clair",
    slug: "strawberry-island",
    name: "Strawberry Island / Sandbar",
    type: "social_sandbar",
    lat: 42.62,
    lng: -82.72,
    note: "Anchor Bay social",
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "gull-island-sc",
    name: "Gull Island",
    type: "social_island",
    lat: 42.55,
    lng: -82.62,
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "metro-beach-offshore",
    name: "Metro Beach offshore",
    type: "social_zone",
    lat: 42.58,
    lng: -82.81,
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "nautical-mile",
    name: "Nautical Mile",
    type: "waterfront_district",
    lat: 42.475,
    lng: -82.88,
  },
  {
    lakeSlug: "lake-st-clair",
    slug: "st-clair-flats-zone",
    name: "St. Clair Flats",
    type: "region",
    lat: 42.57,
    lng: -82.58,
  },

  // GTB
  {
    lakeSlug: "grand-traverse-bay",
    slug: "west-arm-raftup",
    name: "West Arm raft-up zone",
    type: "social_zone",
    lat: 44.85,
    lng: -85.62,
  },
  {
    lakeSlug: "grand-traverse-bay",
    slug: "east-arm-anchorage",
    name: "East Arm anchorage",
    type: "social_zone",
    lat: 44.92,
    lng: -85.45,
  },
  {
    lakeSlug: "grand-traverse-bay",
    slug: "tc-clinche-park",
    name: "Clinche Park / TC shoreline",
    type: "park",
    lat: 44.77,
    lng: -85.62,
  },

  // Torch
  {
    lakeSlug: "torch-lake",
    slug: "torch-sandbar",
    name: "Torch Lake sandbar",
    type: "social_sandbar",
    lat: 44.95,
    lng: -85.3,
  },
  {
    lakeSlug: "torch-lake",
    slug: "torch-north-end",
    name: "North Torch gathering zone",
    type: "social_zone",
    lat: 45.08,
    lng: -85.28,
  },

  // Higgins / Houghton
  {
    lakeSlug: "higgins-lake",
    slug: "higgins-south-state-park",
    name: "South Higgins State Park zone",
    type: "park",
    lat: 44.43,
    lng: -84.71,
  },
  {
    lakeSlug: "higgins-lake",
    slug: "higgins-north-park",
    name: "North Higgins recreation area",
    type: "park",
    lat: 44.5,
    lng: -84.73,
  },
  {
    lakeSlug: "houghton-lake",
    slug: "houghton-middle-ground",
    name: "Houghton mid-lake social zone",
    type: "social_zone",
    lat: 44.32,
    lng: -84.72,
  },

  // Charlevoix / Walloon
  {
    lakeSlug: "lake-charlevoix",
    slug: "charlevoix-round-lake",
    name: "Round Lake / channel",
    type: "channel",
    lat: 45.317,
    lng: -85.26,
  },
  {
    lakeSlug: "lake-charlevoix",
    slug: "charlevoix-south-arm",
    name: "South Arm raft-up",
    type: "social_zone",
    lat: 45.22,
    lng: -85.15,
  },
  {
    lakeSlug: "walloon-lake",
    slug: "walloon-village-dock",
    name: "Walloon Village docks",
    type: "marina",
    lat: 45.266,
    lng: -84.94,
  },

  // Burt / Mullett
  {
    lakeSlug: "burt-lake",
    slug: "burt-lake-state-park",
    name: "Burt Lake State Park",
    type: "park",
    lat: 45.45,
    lng: -84.68,
  },
  {
    lakeSlug: "mullett-lake",
    slug: "aloja-point-zone",
    name: "Aloha / east Mullett zone",
    type: "social_zone",
    lat: 45.52,
    lng: -84.5,
  },

  // Crystal / Gull / Cass
  {
    lakeSlug: "crystal-lake",
    slug: "crystal-beulah-beach",
    name: "Beulah beach zone",
    type: "park",
    lat: 44.627,
    lng: -86.095,
  },
  {
    lakeSlug: "gull-lake",
    slug: "gull-lake-narrows",
    name: "Gull Lake Narrows",
    type: "social_zone",
    lat: 42.39,
    lng: -85.4,
  },
  {
    lakeSlug: "cass-lake",
    slug: "cass-lake-dodge-park",
    name: "Dodge #4 / Cass recreation",
    type: "park",
    lat: 42.605,
    lng: -83.35,
  },
];

export function buildMichiganSeedLocations(): (SeedLocation & {
  lakeId: string;
  displayLat: number;
  displayLng: number;
})[] {
  const lakeIdBySlug = Object.fromEntries(MICHIGAN_LAKES.map((l) => [l.slug, l.id]));

  const places = MICHIGAN_PLACES.map((p) => ({
    lakeId: lakeIdBySlug[p.lakeSlug] ?? p.lakeSlug,
    slug: p.slug,
    name: p.name,
    type: p.type,
    coordinates: null as null,
    boundaryGeoJson: null as null,
    verificationStatus: "needs_review" as const,
    sourceUrl: null,
    attributes: {
      supportsCheckIn: true,
      supportsLocationFeed: true,
      regionHint: p.note,
      group: "places",
    },
    displayLat: p.lat,
    displayLng: p.lng,
  }));

  const dining = MICHIGAN_DINING.map((d) => ({
    lakeId: lakeIdBySlug[d.lakeSlug] ?? d.lakeSlug,
    slug: d.slug,
    name: d.name,
    type: "restaurant" as LocationType,
    coordinates: null as null,
    boundaryGeoJson: null as null,
    verificationStatus: (d.partner ? "verified" : "needs_review") as
      | "verified"
      | "needs_review",
    sourceUrl: null,
    attributes: {
      supportsCheckIn: true,
      supportsLocationFeed: true,
      regionHint: d.note,
      group: "dining",
      diningCategory: d.category,
      partner: !!d.partner,
      partnerTier: d.partnerTier ?? null,
      pitch: d.pitch ?? null,
    },
    displayLat: d.lat,
    displayLng: d.lng,
  }));

  return [...places, ...dining];
}
