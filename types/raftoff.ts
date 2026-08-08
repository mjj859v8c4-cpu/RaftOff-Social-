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
  cover_url?: string | null;
  bio?: string | null;
  home_lake_id?: string | null;
  home_city?: string | null;
  home_marina?: string | null;
  email?: string | null;
  role?: string;
  is_verified?: boolean;
  identity_tags?: string[];
  badges?: string[];
  primary_boat_id?: string | null;
  profile_visibility?: "everyone" | "members" | "connections" | string;
  message_privacy?: "everyone" | "following" | "connections" | string;
  show_on_water?: boolean;
  show_marina?: boolean;
  show_boat?: boolean;
  show_online?: boolean;
  allow_connection_requests?: boolean;
  show_in_discovery?: boolean;
  onboarding_completed?: boolean;
  profile_kind?: "personal" | "business" | "creator" | string;
  created_at?: string;
  updated_at?: string;
}

export interface Boat {
  id: string;
  owner_id: string;
  nickname: string;
  name?: string | null;
  boat_type?: string | null;
  manufacturer?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  length_ft?: number | null;
  primary_color?: string | null;
  description?: string | null;
  home_marina?: string | null;
  photo_url?: string | null;
  visibility?: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Interest {
  id: string;
  label: string;
  category: string;
  sort_order?: number;
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  url: string;
  caption?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface ConnectionRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | string;
  message?: string | null;
  created_at?: string;
  responded_at?: string | null;
  requester?: Profile;
  recipient?: Profile;
}

export type ConnectionStatus =
  | "self"
  | "none"
  | "pending_out"
  | "pending_in"
  | "connected";

export type NotificationType =
  | "connection_request"
  | "connection_accepted"
  | "new_follower"
  | "post_like"
  | "post_comment"
  | "checkin_nearby"
  | string;

export interface AppNotification {
  id: string;
  user_id: string;
  actor_id?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  read_at?: string | null;
  created_at: string;
  actor?: Profile | null;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  sender?: Profile;
}

export type ConversationKind = "dm" | "group";

export interface ConversationPreview {
  id: string;
  updated_at: string;
  kind: ConversationKind;
  title?: string | null;
  peer?: Profile | null;
  memberCount?: number;
  crewId?: string | null;
  lastMessage?: DirectMessage | null;
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
  photo_url?: string | null;
  photo_urls?: string[];
  audience: Audience;
  moderation_status: string;
  created_at: string;
  profile?: Profile;
  location?: Location;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  text: string;
  created_at: string;
  deleted_at?: string | null;
  profile?: Profile;
}

export interface UserStatus {
  id: string;
  profile_id: string;
  lake_id?: string | null;
  location_id?: string | null;
  body: string;
  expires_at: string;
  created_at: string;
  profile?: Profile;
}

/** Connection-network feed item — posts, boats, and statuses from people you're connected to. */
export type ActivityItem =
  | { kind: "post"; id: string; created_at: string; actor?: Profile; post: Post }
  | { kind: "boat"; id: string; created_at: string; actor?: Profile; boat: Boat }
  | { kind: "status"; id: string; created_at: string; actor?: Profile; status: UserStatus };

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
  interested_count?: number;
  going?: boolean;
  interested?: boolean;
  location?: Location;
}

export interface Crew {
  id: string;
  lake_id?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  cover_url?: string | null;
  visibility: "public" | "private" | string;
  conversation_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  member_count?: number;
  joined?: boolean;
  my_role?: string | null;
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
    diningCategory?: "bar" | "restaurant" | "waterfront_dining" | "nightlife";
    partner?: boolean;
    partnerTier?: string | null;
    pitch?: string | null;
  };
  /** UI-only schematic map position (0–1). Not GPS. */
  schematic?: { x: number; y: number };
}
