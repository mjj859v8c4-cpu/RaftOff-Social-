/**
 * Connection-network activity feed — merges posts, new boats, and temporary
 * statuses from a profile's connections into one reverse-chronological list.
 * This extends the existing lake feed; it never touches the map.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import { clampLimit } from "@/lib/pagination";
import { listConnections } from "@/features/profiles/api";
import type { ActivityItem, Boat, Post, Profile, UserStatus } from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

const POST_SELECT =
  "*, profiles:author_id(id, username, display_name, avatar_url), locations:location_id(id, slug, name, type), reactions(count), comments(count)";
const PROFILE_CARD = "id, username, display_name, avatar_url, home_city, is_verified, badges";

function mapPost(row: any): Post {
  return {
    ...row,
    profile: row.profiles,
    location: row.locations,
    like_count: row.reactions?.[0]?.count ?? 0,
    comment_count: row.comments?.[0]?.count ?? 0,
  } as Post;
}

/** Recent activity from a profile's connections (and their own posts). */
export async function listConnectionActivity(
  profileId: string,
  limit?: number
): Promise<ActivityItem[]> {
  const sb = client();
  const capped = clampLimit(limit);
  const connectionIds = await listConnections(profileId);
  const audienceIds = [profileId, ...connectionIds];
  if (audienceIds.length <= 1) return [];

  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [postsRes, boatsRes, statusesRes] = await Promise.all([
    sb
      .from("posts")
      .select(POST_SELECT)
      .in("author_id", audienceIds)
      .is("deleted_at", null)
      .eq("moderation_status", "visible")
      .eq("audience", "public")
      .order("created_at", { ascending: false })
      .limit(capped),
    sb
      .from("boats")
      .select(`*, profiles:owner_id(${PROFILE_CARD})`)
      .in("owner_id", connectionIds.length ? connectionIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("visibility", "public")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(capped),
    sb
      .from("user_statuses")
      .select(`*, profiles:profile_id(${PROFILE_CARD})`)
      .in("profile_id", connectionIds.length ? connectionIds : ["00000000-0000-0000-0000-000000000000"])
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(capped),
  ]);

  if (postsRes.error) throw new ApiError(postsRes.error.message, postsRes.error.code);
  if (boatsRes.error) throw new ApiError(boatsRes.error.message, boatsRes.error.code);
  if (statusesRes.error) throw new ApiError(statusesRes.error.message, statusesRes.error.code);

  const items: ActivityItem[] = [];

  for (const row of postsRes.data ?? []) {
    const post = mapPost(row);
    items.push({ kind: "post", id: `post:${post.id}`, created_at: post.created_at, actor: post.profile, post });
  }
  for (const row of boatsRes.data ?? []) {
    const boat = { ...row, profiles: undefined } as Boat;
    items.push({
      kind: "boat",
      id: `boat:${row.id}`,
      created_at: row.created_at,
      actor: row.profiles as unknown as Profile,
      boat,
    });
  }
  for (const row of statusesRes.data ?? []) {
    const status = { ...row, profiles: undefined } as UserStatus;
    items.push({
      kind: "status",
      id: `status:${row.id}`,
      created_at: row.created_at,
      actor: row.profiles as unknown as Profile,
      status,
    });
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items.slice(0, capped);
}

/** Quick status composer — backed by the set_my_status / clear_my_status RPCs. */
export async function setMyStatus(body: string, hours = 6, locationId?: string | null) {
  const { data, error } = await client().rpc("set_my_status", {
    p_body: body,
    p_hours: hours,
    p_location_id: locationId ?? null,
  });
  if (error) throw new ApiError(error.message, error.code);
  return data as UserStatus;
}

export async function clearMyStatus() {
  const { error } = await client().rpc("clear_my_status");
  if (error) throw new ApiError(error.message, error.code);
}

export async function getMyActiveStatus(profileId: string): Promise<UserStatus | null> {
  const { data, error } = await client()
    .from("user_statuses")
    .select("*")
    .eq("profile_id", profileId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return (data as UserStatus) ?? null;
}
