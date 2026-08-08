/**
 * Reads that belong to the Messages section itself. Thread/list CRUD still
 * lives in features/profiles/api.ts alongside the connection graph.
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

const PEER_SELECT = "id, username, display_name, avatar_url, is_verified, badges, home_city";

/** The other member of a 1:1 conversation — powers the chat thread header. */
export async function getConversationPeer(
  conversationId: string,
  meId: string
): Promise<Profile | null> {
  const { data, error } = await client()
    .from("conversation_members")
    .select(`profile_id, profiles:profile_id(${PEER_SELECT})`)
    .eq("conversation_id", conversationId)
    .neq("profile_id", meId)
    .limit(1)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return (data?.profiles as unknown as Profile) ?? null;
}

/** True when either side has blocked the other — the composer closes in-thread. */
export async function isBlockedPair(meId: string, otherId: string): Promise<boolean> {
  const { data, error } = await client()
    .from("blocks")
    .select("blocker_id")
    .or(
      `and(blocker_id.eq.${meId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${meId})`
    )
    .limit(1);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).length > 0;
}
