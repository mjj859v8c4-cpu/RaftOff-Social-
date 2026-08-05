import { colors } from "@/lib/theme";
import type { LocationType } from "@/types/raftoff";

export function pinColorForType(type: LocationType): string {
  switch (type) {
    case "social_sandbar":
    case "social_island":
    case "social_bay":
    case "social_zone":
      return colors.pinSocial;
    case "event_zone":
      return colors.pinEvent;
    case "fishing_zone":
      return colors.pinFishing;
    case "marina":
    case "boat_launch":
    case "park":
    case "waterfront_district":
    case "fuel":
    case "bait":
    case "marine_service":
      return colors.pinService;
    case "restaurant":
      return colors.food;
    case "region":
    case "channel":
    case "channel_mouth":
      return colors.muted;
    default:
      return colors.action;
  }
}

export function isPinType(type: LocationType): boolean {
  return ![
    "region",
    "channel",
    // channel mouths can be pins
  ].includes(type) || type === "channel_mouth";
}

export function shouldShowAsPin(type: LocationType): boolean {
  return !["region", "channel"].includes(type);
}

/** Hotspot score per PDF §11 */
export function hotspotScore(input: {
  uniqueBoats: number;
  uniquePeople: number;
  postsLast2h: number;
  activeEventBonus: number;
  staleDecay: number;
}): number {
  return (
    input.uniqueBoats * 5 +
    input.uniquePeople * 2 +
    input.postsLast2h * 1 +
    input.activeEventBonus -
    input.staleDecay
  );
}
