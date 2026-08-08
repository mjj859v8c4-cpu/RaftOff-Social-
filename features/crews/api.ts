/**
 * Crews — public browse/join + private crews with linked group chat.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import { track } from "@/lib/analytics";
import type { Crew, Profile } from "@/types/raftoff";

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

export async function listCrews(lakeId?: string, profileId?: string): Promise<Crew[]> {
  let query = client()
    .from("crews")
    .select("*, crew_members(count)")
    .order("created_at", { ascending: false });
  if (lakeId) query = query.eq("lake_id", lakeId);

  const { data, error } = await query;
  if (error) throw new ApiError(error.message, error.code);

  let myIds = new Set<string>();
  let roles: Record<string, string> = {};
  if (profileId) {
    const { data: mine } = await client()
      .from("crew_members")
      .select("crew_id, role")
      .eq("profile_id", profileId);
    for (const row of mine ?? []) {
      myIds.add(row.crew_id as string);
      roles[row.crew_id as string] = row.role as string;
    }
  }

  return (data ?? [])
    .filter((row: any) => row.visibility === "public" || myIds.has(row.id))
    .map((row: any) => ({
      ...row,
      member_count: row.crew_members?.[0]?.count ?? 0,
      joined: myIds.has(row.id),
      my_role: roles[row.id] ?? null,
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

export async function listCrewMembers(crewId: string): Promise<Profile[]> {
  const { data, error } = await client()
    .from("crew_members")
    .select(
      "profile_id, profiles:profile_id(id, username, display_name, avatar_url, is_verified, badges)"
    )
    .eq("crew_id", crewId);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? [])
    .map((r) => r.profiles as unknown as Profile)
    .filter(Boolean);
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
  visibility?: "public" | "private";
}): Promise<Crew> {
  const name = input.name.trim();
  if (!name) throw new ApiError("Crew name is required", "validation");

  if (input.visibility === "private") {
    const { data, error } = await client().rpc("create_private_crew", {
      p_name: name,
      p_description: input.description?.trim() || null,
      p_lake_id: input.lakeId ?? null,
    });
    if (error) throw new ApiError(error.message, error.code);
    const crewId = data as string;
    const { data: crew, error: fetchErr } = await client()
      .from("crews")
      .select("*")
      .eq("id", crewId)
      .single();
    if (fetchErr) throw new ApiError(fetchErr.message, fetchErr.code);
    track("create_crew", { crewId, visibility: "private" });
    return { ...(crew as Crew), member_count: 1, joined: true, my_role: "owner" };
  }

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
  track("create_crew", { crewId: data.id, visibility: "public" });
  return { ...(data as Crew), member_count: 1, joined: true, my_role: "owner" };
}

export async function inviteToCrew(crewId: string, profileId: string) {
  const { error } = await client().rpc("invite_to_crew", {
    p_crew_id: crewId,
    p_profile_id: profileId,
  });
  if (error) throw new ApiError(error.message, error.code);
}

export async function getCrewChatId(crewId: string): Promise<string | null> {
  const { data, error } = await client()
    .from("crews")
    .select("conversation_id")
    .eq("id", crewId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return (data?.conversation_id as string) ?? null;
}
