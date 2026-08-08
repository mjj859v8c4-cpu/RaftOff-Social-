import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { assertOnline } from "@/lib/network";
import { logger } from "@/lib/logging";
import { track } from "@/lib/analytics";
import type {
  CheckIn,
  Lake,
  LakeEvent,
  LakeSummary,
  Location,
  Post,
  Profile,
} from "@/types/raftoff";
import type { DropAnchorInput } from "@/lib/validation";
import { clampLimit, FEED_PAGE_SIZE } from "@/lib/pagination";

export class ApiError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

function client() {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return supabase;
}

async function enforceRateLimit(key: string, limit: number, windowSeconds = 3600) {
  const supabase = client();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    logger.warn("rate_limit.rpc", error);
    return;
  }
  if (data === false) {
    throw new ApiError("Too many requests. Try again later.", "rate_limited");
  }
}

function mapLocation(row: any): Location {
  const coords = row.point_coords as { lat?: number; lng?: number } | null;
  return {
    id: row.id,
    lake_id: row.lake_id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    description: row.description,
    public_access: row.public_access,
    resident_only: row.resident_only,
    fee_required: row.fee_required,
    seasonal: row.seasonal,
    attributes: row.attributes ?? {},
    source_url: row.source_url,
    verified_at: row.verified_at,
    verification_status: row.verification_status,
    status: row.status,
    latitude: coords?.lat ?? row.latitude ?? null,
    longitude: coords?.lng ?? row.longitude ?? null,
    active_check_ins: row.active_check_ins ?? 0,
    dominant_vibe: row.dominant_vibe ?? null,
    last_activity_at: row.last_activity_at ?? null,
  };
}

/** Lakes */
export async function listLakes(): Promise<Lake[]> {
  assertOnline();
  const { data, error } = await client()
    .from("lakes")
    .select("id, slug, name, timezone, status")
    .eq("status", "active")
    .order("name");
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

/** Locations in a lake (bbox optional for map viewport) */
export async function listLocations(opts: {
  lakeId: string;
  west?: number;
  south?: number;
  east?: number;
  north?: number;
}): Promise<Location[]> {
  assertOnline();
  const supabase = client();

  if (
    opts.west != null &&
    opts.south != null &&
    opts.east != null &&
    opts.north != null
  ) {
    const { data, error } = await supabase.rpc("locations_in_bbox", {
      p_lake_id: opts.lakeId,
      west: opts.west,
      south: opts.south,
      east: opts.east,
      north: opts.north,
    });
    if (!error && data) {
      return (data as any[]).map(mapLocation);
    }
  }

  const { data, error } = await supabase
    .from("locations")
    .select(
      "id, lake_id, slug, name, type, description, public_access, resident_only, fee_required, seasonal, attributes, source_url, verified_at, verification_status, status, point"
    )
    .eq("lake_id", opts.lakeId)
    .eq("status", "active");

  if (error) throw new ApiError(error.message, error.code);

  return (data ?? []).map((row: any) => {
    // PostGIS may return WKT/GeoJSON depending on config; parse safely
    let lat: number | null = null;
    let lng: number | null = null;
    if (row.point && typeof row.point === "object" && "coordinates" in row.point) {
      lng = row.point.coordinates[0];
      lat = row.point.coordinates[1];
    }
    return mapLocation({ ...row, latitude: lat, longitude: lng });
  });
}

export async function getLakeSummary(lakeId: string): Promise<LakeSummary> {
  assertOnline();
  const supabase = client();
  const [{ data: lake }, { data: checkIns }, { data: locations }] = await Promise.all([
    supabase.from("lakes").select("name").eq("id", lakeId).single(),
    supabase
      .from("check_ins_public")
      .select("id, location_id, vibe")
      .eq("lake_id", lakeId),
    supabase.from("locations").select("id, name").eq("lake_id", lakeId).eq("status", "active"),
  ]);

  const active = checkIns ?? [];
  const counts = new Map<string, number>();
  const vibes = new Map<string, number>();
  for (const c of active) {
    if (c.location_id) counts.set(c.location_id, (counts.get(c.location_id) ?? 0) + 1);
    if (c.vibe) vibes.set(c.vibe, (vibes.get(c.vibe) ?? 0) + 1);
  }
  const topLocId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSpot = locations?.find((l) => l.id === topLocId)?.name ?? null;

  return {
    lake_name: lake?.name ?? "Lake",
    active_check_ins: active.length,
    active_boats: null,
    active_hotspots: counts.size,
    top_spot: topSpot,
    updated_at: new Date().toISOString(),
  };
}

/** Check-ins */
export async function createCheckIn(
  input: DropAnchorInput & { lakeId: string; userId: string; photoUrl?: string | null }
): Promise<CheckIn> {
  assertOnline();
  await enforceRateLimit(`user:${input.userId}:check_in`, 20, 3600);
  const expiresAt = new Date(Date.now() + input.durationMinutes * 60_000).toISOString();

  const { data, error } = await client()
    .from("check_ins")
    .insert({
      user_id: input.userId,
      lake_id: input.lakeId,
      location_id: input.locationId,
      vibe: input.vibe,
      message: input.message || null,
      audience: input.audience,
      precision: input.precision,
      expires_at: expiresAt,
      status: "active",
      photo_url: input.photoUrl ?? null,
    })
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, error.code);

  if (input.postToFeed && input.precision !== "hidden") {
    await client().from("posts").insert({
      author_id: input.userId,
      lake_id: input.lakeId,
      location_id: input.locationId,
      check_in_id: data.id,
      post_type: "check_in",
      text: input.message || null,
      audience: input.audience,
      photo_url: input.photoUrl ?? null,
    });
  }

  track("drop_anchor", { locationId: input.locationId, vibe: input.vibe });
  track("check_in", {
    location_id: input.locationId,
    vibe: input.vibe,
    audience: input.audience,
    precision: input.precision,
  });
  return data as CheckIn;
}

/** Manual checkout — server-enforced ownership + active-only guard (§10). */
export async function endCheckIn(checkInId: string) {
  assertOnline();
  const { error } = await client().rpc("end_check_in", { p_check_in_id: checkInId });
  if (error) throw new ApiError(error.message, error.code);
}

export async function listActiveCheckIns(lakeId: string): Promise<CheckIn[]> {
  assertOnline();
  const { data, error } = await client()
    .from("check_ins_public")
    .select("*, profiles:user_id(id, username, display_name, avatar_url), locations:location_id(id, slug, name, type)")
    .eq("lake_id", lakeId);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((row: any) => ({
    ...row,
    profile: row.profiles,
    location: row.locations,
  })) as CheckIn[];
}

/** Feed / posts */
export async function listLakeFeed(lakeId: string, limit?: number): Promise<Post[]> {
  assertOnline();
  const capped = clampLimit(limit, FEED_PAGE_SIZE);
  const { data, error } = await client()
    .from("posts")
    .select(
      "*, profiles:author_id(id, username, display_name, avatar_url), locations:location_id(id, slug, name, type), reactions(count), comments(count)"
    )
    .eq("lake_id", lakeId)
    .is("deleted_at", null)
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false })
    .limit(capped);

  if (error) throw new ApiError(error.message, error.code);

  return (data ?? []).map((row: any) => ({
    ...row,
    profile: row.profiles,
    location: row.locations,
    like_count: row.reactions?.[0]?.count ?? 0,
    comment_count: row.comments?.[0]?.count ?? 0,
  })) as Post[];
}

export async function toggleLike(postId: string, userId: string) {
  assertOnline();
  await enforceRateLimit(`user:${userId}:like`, 120, 3600);
  const supabase = client();
  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("reaction", "like")
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) throw new ApiError(error.message, error.code);
    track("unlike_post", { postId });
    return { liked: false };
  }

  const { error } = await supabase.from("reactions").insert({
    post_id: postId,
    user_id: userId,
    reaction: "like",
  });
  if (error) throw new ApiError(error.message, error.code);
  track("like_post", { postId });
  return { liked: true };
}

export async function addComment(postId: string, userId: string, text: string) {
  assertOnline();
  await enforceRateLimit(`user:${userId}:comment`, 60, 3600);
  const { data, error } = await client()
    .from("comments")
    .insert({ post_id: postId, author_id: userId, text: text.trim() })
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  track("comment_post", { postId });
  return data;
}

export async function listComments(postId: string, limit?: number) {
  assertOnline();
  const capped = clampLimit(limit);
  const { data, error } = await client()
    .from("comments")
    .select("*, profiles:author_id(id, username, display_name, avatar_url)")
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(capped);
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

/** Events */
export async function listEvents(lakeId: string): Promise<LakeEvent[]> {
  assertOnline();
  const { data, error } = await client()
    .from("events")
    .select("*, locations:location_id(id, slug, name, type), rsvps(count)")
    .eq("lake_id", lakeId)
    .neq("status", "canceled")
    .order("starts_at", { ascending: true });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((row: any) => ({
    ...row,
    location: row.locations,
    rsvp_count: row.rsvps?.[0]?.count ?? 0,
  })) as LakeEvent[];
}

export async function createEvent(input: {
  organizerId: string;
  lakeId: string;
  locationId?: string;
  title: string;
  description?: string;
  category: string;
  startsAt: string;
  endsAt?: string;
  coverPhotoUrl?: string;
}) {
  assertOnline();
  await enforceRateLimit(`user:${input.organizerId}:event`, 10, 86400);
  const { data, error } = await client()
    .from("events")
    .insert({
      organizer_id: input.organizerId,
      lake_id: input.lakeId,
      location_id: input.locationId ?? null,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      cover_photo_url: input.coverPhotoUrl ?? null,
      visibility: "public",
      status: "scheduled",
    })
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  track("create_event", { eventId: data.id });
  return data as LakeEvent;
}

export async function rsvpEvent(eventId: string, userId: string, going: boolean) {
  assertOnline();
  const supabase = client();
  if (!going) {
    const { error } = await supabase
      .from("rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    if (error) throw new ApiError(error.message, error.code);
    return { going: false };
  }
  const { error } = await supabase.from("rsvps").upsert({
    event_id: eventId,
    user_id: userId,
    state: "going",
  });
  if (error) throw new ApiError(error.message, error.code);
  track("rsvp_event", { eventId });
  return { going: true };
}

/** Boats */
export async function listMyBoats(userId: string) {
  assertOnline();
  const { data, error } = await client().from("boats").select("*").eq("owner_id", userId);
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

export async function upsertBoat(input: {
  id?: string;
  ownerId: string;
  nickname: string;
  boatType?: string;
  photoUrl?: string;
  lengthFt?: number;
}) {
  assertOnline();
  const payload = {
    id: input.id,
    owner_id: input.ownerId,
    nickname: input.nickname,
    boat_type: input.boatType ?? null,
    photo_url: input.photoUrl ?? null,
    length_ft: input.lengthFt ?? null,
    visibility: "public",
  };
  const { data, error } = await client().from("boats").upsert(payload).select("*").single();
  if (error) throw new ApiError(error.message, error.code);
  return data;
}

/** Followers */
export async function followUser(followerId: string, followingId: string) {
  assertOnline();
  const { error } = await client().from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) throw new ApiError(error.message, error.code);
  track("follow_user", { followingId });
}

export async function unfollowUser(followerId: string, followingId: string) {
  assertOnline();
  const { error } = await client()
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw new ApiError(error.message, error.code);
}

/** Notifications */
export async function listNotifications(userId: string) {
  assertOnline();
  const { data, error } = await client()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  assertOnline();
  const { error } = await client()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new ApiError(error.message, error.code);
}

/** Profiles */
export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "display_name" | "bio" | "avatar_url" | "username">> & {
    home_lake_id?: string | null;
  }
) {
  assertOnline();
  const { data, error } = await client()
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  return data as Profile;
}

export async function getProfile(userId: string) {
  assertOnline();
  const { data, error } = await client()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return data as Profile | null;
}
