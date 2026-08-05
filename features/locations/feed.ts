import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export async function fetchLocationFeedRemote(
  locationId: string,
  tab: "live" | "recent" | "fishing" | "events" | "info",
  cursor?: string
) {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    return { mode: "local" as const };
  }

  // Direct permission-aware table reads for MVP wiring.
  // Edge Function `location-feed` is available for hardened production routing.
  let checkInsQuery = supabase
    .from("check_ins")
    .select("id,user_id,location_id,vibe,message,audience,precision,starts_at,expires_at,status")
    .eq("location_id", locationId)
    .neq("precision", "hidden")
    .eq("audience", "public")
    .limit(20);

  if (tab === "live") {
    checkInsQuery = checkInsQuery
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());
  }

  const [checkIns, posts, location] = await Promise.all([
    checkInsQuery,
    supabase
      .from("posts")
      .select("id,author_id,location_id,post_type,text,audience,created_at,moderation_status")
      .eq("location_id", locationId)
      .eq("moderation_status", "visible")
      .is("deleted_at", null)
      .eq("audience", "public")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("locations").select("*").eq("id", locationId).maybeSingle(),
  ]);

  if (checkIns.error) throw checkIns.error;
  if (posts.error) throw posts.error;
  if (location.error) throw location.error;

  return {
    mode: "remote" as const,
    tab,
    cursor: cursor ?? null,
    location: location.data,
    checkIns: checkIns.data ?? [],
    posts: posts.data ?? [],
  };
}
