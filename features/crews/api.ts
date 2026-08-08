/**
 * Crews — minimal browse/join stub on top of the existing crews / crew_members
 * tables (see 20260807200000_social_profiles.sql).
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import { track } from "@/lib/analytics";
import type { Crew } from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "crew"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function listCrews(lakeId?: string): Promise<Crew[]> {
  let query = client()
    .from("crews")
    .select("*, crew_members(count)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });
  if (lakeId) query = query.eq("lake_id", lakeId);
  const { data, error } = await query;
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((row: any) => ({
    ...row,
    member_count: row.crew_members?.[0]?.count ?? 0,
  })) as Crew[];
}

export async function listMyCrewIds(profileId: string): Promise<string[]> {
  const { data, error } = await client()
    .from("crew_members")
    .select("crew_id")
    .eq("profile_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((r) => r.crew_id as string);
}

export async function joinCrew(crewId: string, profileId: string) {
  const { error } = await client()
    .from("crew_members")
    .insert({ crew_id: crewId, profile_id: profileId });
  if (error) throw new ApiError(error.message, error.code);
  track("join_crew", { crewId });
}

export async function leaveCrew(crewId: string, profileId: string) {
  const { error } = await client()
    .from("crew_members")
    .delete()
    .eq("crew_id", crewId)
    .eq("profile_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
  track("leave_crew", { crewId });
}

export async function createCrew(input: {
  name: string;
  description?: string;
  lakeId?: string | null;
  createdBy: string;
}): Promise<Crew> {
  const name = input.name.trim();
  if (!name) throw new ApiError("Crew name is required", "validation");
  const sb = client();
  const { data, error } = await sb
    .from("crews")
    .insert({
      name,
      slug: slugify(name),
      description: input.description?.trim() || null,
      lake_id: input.lakeId ?? null,
      created_by: input.createdBy,
      visibility: "public",
    })
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  const { error: joinErr } = await sb
    .from("crew_members")
    .insert({ crew_id: data.id, profile_id: input.createdBy, role: "owner" });
  if (joinErr) throw new ApiError(joinErr.message, joinErr.code);
  track("create_crew", { crewId: data.id });
  return { ...(data as Crew), member_count: 1, joined: true };
}
