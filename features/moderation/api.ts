import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { assertOnline } from "@/lib/network";
import { track } from "@/lib/analytics";
import { ApiError } from "@/lib/api/production";

function client() {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return supabase;
}

/** Report categories — must match `reports_category_check` in Supabase migrations. */
export const REPORT_CATEGORIES = [
  ["spam", "Spam"],
  ["harassment", "Harassment"],
  ["fake_profile", "Fake profile"],
  ["inappropriate_content", "Inappropriate"],
  ["unsafe_activity", "Unsafe on the water"],
  ["other", "Other"],
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number][0];

export async function blockUser(blockerId: string, blockedId: string) {
  assertOnline();
  if (blockerId === blockedId) throw new ApiError("Cannot block yourself");
  const { error } = await client().from("blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (error) throw new ApiError(error.message, error.code);
  track("block_user", { blockedId });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  assertOnline();
  const { error } = await client()
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw new ApiError(error.message, error.code);
}

export async function listBlockedUsers(blockerId: string) {
  assertOnline();
  const { data, error } = await client()
    .from("blocks")
    .select("blocked_id, created_at, profiles:blocked_id(id, username, display_name, avatar_url)")
    .eq("blocker_id", blockerId);
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

export async function reportContent(input: {
  reporterId: string;
  targetType: "user" | "post" | "comment" | "event" | "check_in";
  targetId: string;
  reason: string;
  category?: ReportCategory | null;
}) {
  assertOnline();
  const { data, error } = await client()
    .from("reports")
    .insert({
      reporter_id: input.reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason.trim(),
      category: input.category ?? null,
      status: "open",
    })
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  track("report_content", { targetType: input.targetType, category: input.category ?? "unset" });
  return data;
}

/** Admin / moderator */
export async function listOpenReports() {
  assertOnline();
  const { data, error } = await client()
    .from("reports")
    .select("*, profiles:reporter_id(id, username, display_name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

export async function resolveReport(input: {
  reportId: string;
  reviewerId: string;
  status: "resolved" | "dismissed";
  notes?: string;
  hidePostId?: string;
}) {
  assertOnline();
  const supabase = client();
  const { error } = await supabase
    .from("reports")
    .update({
      status: input.status,
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .eq("id", input.reportId);
  if (error) throw new ApiError(error.message, error.code);

  if (input.hidePostId) {
    await supabase
      .from("posts")
      .update({ moderation_status: "hidden" })
      .eq("id", input.hidePostId);
  }

  await supabase.from("moderation_actions").insert({
    actor_id: input.reviewerId,
    action: input.hidePostId ? "hide_post" : "resolve_report",
    target_type: "report",
    target_id: input.reportId,
    reason: input.notes ?? null,
  });
}

export async function setUserBlocked(adminId: string, userId: string, blocked: boolean) {
  assertOnline();
  const { error } = await client()
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", userId);
  if (error) throw new ApiError(error.message, error.code);
  await client().from("moderation_actions").insert({
    actor_id: adminId,
    action: blocked ? "ban_user" : "unban_user",
    target_type: "user",
    target_id: userId,
  });
}

export async function hidePost(adminId: string, postId: string, reason?: string) {
  assertOnline();
  const { error } = await client()
    .from("posts")
    .update({ moderation_status: "hidden" })
    .eq("id", postId);
  if (error) throw new ApiError(error.message, error.code);
  await client().from("moderation_actions").insert({
    actor_id: adminId,
    action: "hide_post",
    target_type: "post",
    target_id: postId,
    reason: reason ?? null,
  });
}
