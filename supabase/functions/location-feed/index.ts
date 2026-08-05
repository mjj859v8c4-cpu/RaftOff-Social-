import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

/**
 * Permission-aware location feed endpoint stub.
 * Production must enforce audience, blocks, moderation, precision, and expiration server-side.
 */
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const locationId = url.searchParams.get("locationId");
  const tab = url.searchParams.get("tab") ?? "live";
  const limit = Number(url.searchParams.get("limit") ?? "20");

  if (!locationId) {
    return new Response(JSON.stringify({ error: "locationId required" }), { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!supabaseUrl || !anon) {
    return new Response(JSON.stringify({ error: "Missing env" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: authHeader } },
  });

  await supabase.rpc("expire_check_ins");

  const { data: location, error: locErr } = await supabase
    .from("locations")
    .select("*")
    .eq("id", locationId)
    .maybeSingle();

  if (locErr) {
    return new Response(JSON.stringify({ error: locErr.message }), { status: 500 });
  }

  let checkInsQuery = supabase
    .from("check_ins")
    .select("id,user_id,location_id,vibe,message,audience,precision,starts_at,expires_at,status")
    .eq("location_id", locationId)
    .neq("precision", "hidden")
    .eq("audience", "public")
    .limit(limit);

  if (tab === "live") {
    checkInsQuery = checkInsQuery.eq("status", "active").gt("expires_at", new Date().toISOString());
  }

  const { data: checkIns, error: ciErr } = await checkInsQuery;
  if (ciErr) {
    return new Response(JSON.stringify({ error: ciErr.message }), { status: 500 });
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id,author_id,location_id,post_type,text,audience,created_at,moderation_status")
    .eq("location_id", locationId)
    .eq("moderation_status", "visible")
    .is("deleted_at", null)
    .eq("audience", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  return new Response(
    JSON.stringify({
      location,
      tab,
      checkIns: checkIns ?? [],
      posts: posts ?? [],
      // Never include private_position
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
