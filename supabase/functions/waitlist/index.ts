import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing env" }), { status: 500 });
  }

  let body: { email?: string; source?: string; lake?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Valid email required" }), { status: 400 });
  }

  const supabase = createClient(url, key);
  const { data: allowed } = await supabase.rpc("check_rate_limit", {
    p_key: `waitlist:${email}`,
    p_limit: 5,
    p_window_seconds: 86400,
  });
  if (allowed === false) {
    return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 });
  }

  const now = new Date();
  const { error } = await supabase.from("analytics_events").insert({
    event_id: `waitlist_${crypto.randomUUID()}`,
    name: "waitlist_signup",
    ts: now.toISOString(),
    session_id: "marketing",
    anon_id: email,
    platform: "web",
    hour_bucket: now.getUTCHours(),
    dow: now.getUTCDay(),
    commercial_ok: false,
    props: {
      email,
      source: body.source ?? "marketing",
      lake: body.lake ?? null,
    },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
