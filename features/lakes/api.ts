/**
 * Lake community hub — member count + roster off the existing lake_members
 * table (see 20260807200000_social_profiles.sql).
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

export async function countLakeMembers(lakeId: string): Promise<number> {
  const { count, error } = await client()
    .from("lake_members")
    .select("*", { count: "exact", head: true })
    .eq("lake_id", lakeId);
  if (error) throw new ApiError(error.message, error.code);
  return count ?? 0;
}

export async function listLakeMembers(lakeId: string, limit = 24): Promise<Profile[]> {
  const { data, error } = await client()
    .from("lake_members")
    .select(
      "profile_id, joined_at, profiles:profile_id(id, username, display_name, avatar_url, bio, home_city, is_verified, badges)"
    )
    .eq("lake_id", lakeId)
    .order("joined_at", { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? [])
    .map((row: any) => row.profiles as Profile)
    .filter(Boolean);
}
