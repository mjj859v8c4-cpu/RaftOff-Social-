/**
 * Notifications — connection requests/accepts, new followers, post likes,
 * comments, and nearby check-ins from connections. Rows are written by RPCs
 * (server side, e.g. accept_connection_request, follow_profile), by triggers
 * (post likes/comments, checkin_nearby — see
 * supabase/migrations/20260808230000_notifications_checkin_nearby.sql), or by
 * the acting user directly (see notifications RLS in
 * supabase/migrations/20260807240000_discover_social.sql).
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import type { AppNotification } from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

const ACTOR_SELECT = "actor:actor_id(id, username, display_name, avatar_url)";

export async function listMyNotifications(
  userId: string,
  limit = 60
): Promise<AppNotification[]> {
  const { data, error } = await client()
    .from("notifications")
    .select(`*, ${ACTOR_SELECT}`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as unknown as AppNotification[];
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await client()
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new ApiError(error.message, error.code);
  return count ?? 0;
}

export async function markNotificationRead(id: string) {
  const { error } = await client()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new ApiError(error.message, error.code);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await client()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw new ApiError(error.message, error.code);
}

export async function deleteNotification(id: string) {
  const { error } = await client().from("notifications").delete().eq("id", id);
  if (error) throw new ApiError(error.message, error.code);
}
