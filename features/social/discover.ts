/**
 * People Discovery (Phase 2) — real DB-backed sections + search + suggested
 * connection scoring (§29). All queries go through SECURITY INVOKER/DEFINER
 * RPCs defined in supabase/migrations/20260807240000_discover_social.sql so
 * blocked pairs and discovery opt-outs are always respected server-side.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import type { Profile } from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

export type DiscoverPerson = Pick<
  Profile,
  "id" | "username" | "display_name" | "avatar_url" | "bio" | "home_city" | "is_verified" | "badges"
> & {
  home_lake_id?: string | null;
  home_marina?: string | null;
  shared_interests?: number;
  mutual_count?: number;
  same_lake?: boolean;
  score?: number;
  created_at?: string;
};

export async function peopleOnMyLake(limit = 20): Promise<DiscoverPerson[]> {
  const { data, error } = await client().rpc("people_on_my_lake", {
    p_limit: limit,
    p_new_only: false,
  });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}

export async function peopleNewToLake(limit = 20): Promise<DiscoverPerson[]> {
  const { data, error } = await client().rpc("people_on_my_lake", {
    p_limit: limit,
    p_new_only: true,
  });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}

export async function peopleWithSharedInterests(limit = 20): Promise<DiscoverPerson[]> {
  const { data, error } = await client().rpc("people_shared_interests", { p_limit: limit });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}

export async function peopleByIdentityTag(tag: string, limit = 20): Promise<DiscoverPerson[]> {
  const { data, error } = await client().rpc("people_by_identity_tag", {
    p_tag: tag,
    p_limit: limit,
  });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}

/** Suggested connection scoring (§29): same lake + shared interests + mutuals + has photo. */
export async function suggestedConnections(limit = 20): Promise<DiscoverPerson[]> {
  const { data, error } = await client().rpc("suggested_connections", { p_limit: limit });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}

/** Search people by name, username, lake, boat, marina, or interest. */
export async function searchPeople(query: string, limit = 25): Promise<DiscoverPerson[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const { data, error } = await client().rpc("search_people", {
    p_query: term,
    p_limit: limit,
  });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DiscoverPerson[];
}
