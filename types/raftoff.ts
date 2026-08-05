export type LocationType =
  | "social_sandbar"
  | "social_island"
  | "social_bay"
  | "social_zone"
  | "event_zone"
  | "region"
  | "channel"
  | "channel_mouth"
  | "fishing_zone"
  | "park"
  | "waterfront_district"
  | "boat_launch"
  | "marina"
  | "restaurant"
  | "fuel"
  | "bait"
  | "marine_service";

export type VerificationStatus = "needs_review" | "unverified" | "verified" | "rejected";

export type Audience = "public" | "followers" | "friends" | "crew" | "private";
export type Precision = "location" | "approx" | "exact_group" | "hidden";
export type CheckInStatus = "active" | "ended" | "expired";

export interface Lake {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  status: string;
}

export interface Location {
  id: string;
  lake_id: string;
  slug: string;
  name: string;
  type: LocationType;
  description?: string | null;
  public_access?: boolean | null;
  resident_only?: boolean;
  fee_required?: boolean | null;
  seasonal?: boolean;
  attributes?: Record<string, unknown>;
  source_url?: string | null;
  verified_at?: string | null;
  verification_status: VerificationStatus;
  status: string;
  /** Public display only — never private fishing GPS */
  latitude?: number | null;
  longitude?: number | null;
  active_check_ins?: number;
  dominant_vibe?: string | null;
  last_activity_at?: string | null;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface CheckIn {
  id: string;
  user_id: string;
  boat_id?: string | null;
  lake_id: string;
  location_id?: string | null;
  vibe: string;
  message?: string | null;
  audience: Audience;
  precision: Precision;
  starts_at: string;
  expires_at: string;
  ended_at?: string | null;
  status: CheckInStatus;
  profile?: Profile;
  location?: Location;
}

export interface Post {
  id: string;
  author_id: string;
  lake_id: string;
  location_id?: string | null;
  check_in_id?: string | null;
  event_id?: string | null;
  post_type: string;
  text?: string | null;
  audience: Audience;
  moderation_status: string;
  created_at: string;
  profile?: Profile;
  location?: Location;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

export interface LakeEvent {
  id: string;
  organizer_id: string;
  lake_id: string;
  location_id?: string | null;
  title: string;
  description?: string | null;
  category: string;
  starts_at: string;
  ends_at?: string | null;
  visibility: string;
  status: string;
  rsvp_count?: number;
  going?: boolean;
  location?: Location;
}

export interface LakeSummary {
  lake_name: string;
  active_check_ins: number;
  active_boats: number | null;
  active_hotspots: number;
  top_spot: string | null;
  updated_at: string;
}

export interface SeedLocation {
  slug: string;
  name: string;
  type: LocationType;
  coordinates: null | { lat: number; lng: number };
  boundaryGeoJson: null;
  verificationStatus: VerificationStatus;
  sourceUrl: string | null;
  attributes: {
    defaultVibes?: string[];
    supportsCheckIn?: boolean;
    supportsLocationFeed?: boolean;
    group?: string;
    regionHint?: string;
    publicAccess?: boolean;
    residentOnly?: boolean;
    diningCategory?: "bar" | "restaurant" | "waterfront_dining";
  };
  /** UI-only schematic map position (0–1). Not GPS. */
  schematic?: { x: number; y: number };
}
