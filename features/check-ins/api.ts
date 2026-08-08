import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { DropAnchorInput } from "@/lib/validation";
import { track } from "@/lib/analytics";

/**
 * Server-backed Drop Anchor when Supabase is configured.
 * Falls back to local store in the UI layer when offline / demo mode.
 */
export async function createCheckInRemote(input: DropAnchorInput, userId: string) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    return { mode: "local" as const };
  }

  const expiresAt = new Date(Date.now() + input.durationMinutes * 60_000).toISOString();

  const { data, error } = await supabase
    .from("check_ins")
    .insert({
      user_id: userId,
      lake_id: input.locationId, // replaced by caller with real lake_id in production wiring
      location_id: input.locationId,
      vibe: input.vibe,
      message: input.message || null,
      audience: input.audience,
      precision: input.precision === "location" ? "location" : input.precision,
      expires_at: expiresAt,
      status: "active",
    })
    .select("*")
    .single();

  if (error) throw error;

  if (input.postToFeed && input.precision !== "hidden") {
    await supabase.from("posts").insert({
      author_id: userId,
      lake_id: data.lake_id,
      location_id: input.locationId,
      check_in_id: data.id,
      post_type: "check_in",
      text: input.message || null,
      audience: input.audience,
    });
  }

  track("drop_anchor", { locationId: input.locationId, vibe: input.vibe });
  track("check_in", {
    location_id: input.locationId,
    vibe: input.vibe,
    audience: input.audience,
    precision: input.precision,
  });
  return { mode: "remote" as const, checkIn: data };
}

export async function endCheckInRemote(checkInId: string) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) return { mode: "local" as const };
  const { error } = await supabase
    .from("check_ins")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", checkInId);
  if (error) throw error;
  return { mode: "remote" as const };
}
