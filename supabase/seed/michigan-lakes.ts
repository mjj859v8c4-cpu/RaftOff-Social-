export type MichiganLake = {
  id: string;
  slug: string;
  name: string;
  region: string;
  popularity: number;
  timezone: string;
  center: { latitude: number; longitude: number };
  zoom: number;
  bounds: {
    ne: { latitude: number; longitude: number };
    sw: { latitude: number; longitude: number };
  };
  blurb: string;
};

/**
 * Popular Michigan lakes for RaftOff launch expansion.
 * Centers/bounds are public geographic lake extents (not private fishing holes).
 */
export const MICHIGAN_LAKES: MichiganLake[] = [
  {
    id: "lake-st-clair",
    slug: "lake-st-clair",
    name: "Lake St. Clair",
    region: "Metro Detroit",
    popularity: 100,
    timezone: "America/Detroit",
    center: { latitude: 42.505, longitude: -82.7 },
    zoom: 9.7,
    bounds: {
      ne: { latitude: 42.705, longitude: -82.42 },
      sw: { latitude: 42.33, longitude: -82.98 },
    },
    blurb: "Anchor Bay, Flats, and the Metro Detroit social circuit.",
  },
  {
    id: "lake-michigan-gtb",
    slug: "grand-traverse-bay",
    name: "Grand Traverse Bay",
    region: "Traverse City",
    popularity: 96,
    timezone: "America/Detroit",
    center: { latitude: 44.9, longitude: -85.55 },
    zoom: 9,
    bounds: {
      ne: { latitude: 45.25, longitude: -85.25 },
      sw: { latitude: 44.6, longitude: -85.85 },
    },
    blurb: "West & East arms, TC waterfront, and bay sailing culture.",
  },
  {
    id: "torch-lake",
    slug: "torch-lake",
    name: "Torch Lake",
    region: "Antrim County",
    popularity: 95,
    timezone: "America/Detroit",
    center: { latitude: 44.98, longitude: -85.3 },
    zoom: 10.2,
    bounds: {
      ne: { latitude: 45.15, longitude: -85.18 },
      sw: { latitude: 44.82, longitude: -85.42 },
    },
    blurb: "Caribbean-blue water, sandbars, and summer raft-ups.",
  },
  {
    id: "higgins-lake",
    slug: "higgins-lake",
    name: "Higgins Lake",
    region: "Roscommon",
    popularity: 90,
    timezone: "America/Detroit",
    center: { latitude: 44.46, longitude: -84.72 },
    zoom: 11,
    bounds: {
      ne: { latitude: 44.53, longitude: -84.64 },
      sw: { latitude: 44.4, longitude: -84.8 },
    },
    blurb: "Crystal-clear northern classic — state parks and busy weekends.",
  },
  {
    id: "houghton-lake",
    slug: "houghton-lake",
    name: "Houghton Lake",
    region: "Roscommon",
    popularity: 88,
    timezone: "America/Detroit",
    center: { latitude: 44.32, longitude: -84.72 },
    zoom: 10.5,
    bounds: {
      ne: { latitude: 44.4, longitude: -84.58 },
      sw: { latitude: 44.24, longitude: -84.86 },
    },
    blurb: "Michigan’s largest inland lake — fishing, resorts, and shoreline bars.",
  },
  {
    id: "lake-charlevoix",
    slug: "lake-charlevoix",
    name: "Lake Charlevoix",
    region: "Charlevoix",
    popularity: 92,
    timezone: "America/Detroit",
    center: { latitude: 45.27, longitude: -85.18 },
    zoom: 10.4,
    bounds: {
      ne: { latitude: 45.35, longitude: -85.0 },
      sw: { latitude: 45.18, longitude: -85.35 },
    },
    blurb: "Irregular shoreline, Round Lake link, and Charlevoix nightlife.",
  },
  {
    id: "walloon-lake",
    slug: "walloon-lake",
    name: "Walloon Lake",
    region: "Petoskey",
    popularity: 86,
    timezone: "America/Detroit",
    center: { latitude: 45.27, longitude: -84.94 },
    zoom: 11.2,
    bounds: {
      ne: { latitude: 45.33, longitude: -84.88 },
      sw: { latitude: 45.21, longitude: -85.0 },
    },
    blurb: "Quiet beauty near Petoskey with strong summer social traffic.",
  },
  {
    id: "burt-lake",
    slug: "burt-lake",
    name: "Burt Lake",
    region: "Cheboygan",
    popularity: 84,
    timezone: "America/Detroit",
    center: { latitude: 45.48, longitude: -84.66 },
    zoom: 10.8,
    bounds: {
      ne: { latitude: 45.58, longitude: -84.56 },
      sw: { latitude: 45.38, longitude: -84.76 },
    },
    blurb: "Inland Waterway hub — boat, fish, and dock-to-dinner.",
  },
  {
    id: "mullett-lake",
    slug: "mullett-lake",
    name: "Mullett Lake",
    region: "Cheboygan",
    popularity: 82,
    timezone: "America/Detroit",
    center: { latitude: 45.52, longitude: -84.55 },
    zoom: 10.8,
    bounds: {
      ne: { latitude: 45.62, longitude: -84.44 },
      sw: { latitude: 45.42, longitude: -84.66 },
    },
    blurb: "Paired with Burt on the Inland Waterway circuit.",
  },
  {
    id: "crystal-lake-benzie",
    slug: "crystal-lake",
    name: "Crystal Lake",
    region: "Benzie County",
    popularity: 89,
    timezone: "America/Detroit",
    center: { latitude: 44.66, longitude: -86.16 },
    zoom: 11,
    bounds: {
      ne: { latitude: 44.72, longitude: -86.05 },
      sw: { latitude: 44.6, longitude: -86.27 },
    },
    blurb: "Near Frankfort — clear water and Beulah shoreline energy.",
  },
  {
    id: "gull-lake",
    slug: "gull-lake",
    name: "Gull Lake",
    region: "Kalamazoo",
    popularity: 85,
    timezone: "America/Detroit",
    center: { latitude: 42.39, longitude: -85.4 },
    zoom: 11.4,
    bounds: {
      ne: { latitude: 42.44, longitude: -85.35 },
      sw: { latitude: 42.34, longitude: -85.45 },
    },
    blurb: "Southwest Michigan favorite with restaurants right on the water.",
  },
  {
    id: "cass-lake",
    slug: "cass-lake",
    name: "Cass Lake",
    region: "Oakland County",
    popularity: 87,
    timezone: "America/Detroit",
    center: { latitude: 42.61, longitude: -83.36 },
    zoom: 12,
    bounds: {
      ne: { latitude: 42.64, longitude: -83.32 },
      sw: { latitude: 42.58, longitude: -83.4 },
    },
    blurb: "Metro Detroit inland scene — parks, launches, and nearby dining.",
  },
];

export function getLakeById(id: string): MichiganLake {
  return MICHIGAN_LAKES.find((l) => l.id === id) ?? MICHIGAN_LAKES[0];
}
