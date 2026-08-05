import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

/**
 * Scheduled / invoked expiration worker.
 * Sets status=expired for due check-ins and can be wired to recalculate aggregates.
 */
Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), { status: 500 });
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("expire_check_ins");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ expired: data ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
