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

export type ConversationHeader = {
  kind: "dm" | "group";
  title: string;
  peer: Profile | null;
  memberCount: number;
  crewId?: string | null;
};

/** Thread header — 1:1 peer or group/crew title. */
export async function getConversationHeader(
  conversationId: string,
  meId: string
): Promise<ConversationHeader | null> {
  const { data: conv, error } = await client()
    .from("conversations")
    .select("id, kind, title, crew_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  if (!conv) return null;

  const { data: members, error: memErr } = await client()
    .from("conversation_members")
    .select(`profile_id, profiles:profile_id(${PEER_SELECT})`)
    .eq("conversation_id", conversationId);
  if (memErr) throw new ApiError(memErr.message, memErr.code);

  const kind = (conv.kind ?? "dm") as "dm" | "group";
  const memberCount = members?.length ?? 0;
  const peerRow = (members ?? []).find((m) => m.profile_id !== meId);
  const peer = (peerRow?.profiles as unknown as Profile) ?? null;
  const title =
    kind === "group"
      ? (conv.title as string) || "Crew chat"
      : peer?.display_name ?? "Chat";

  return {
    kind,
    title,
    peer,
    memberCount,
    crewId: (conv.crew_id as string) ?? null,
  };
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
