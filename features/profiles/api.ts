/**
 * Profile / watercraft / interests / connections — Supabase-backed.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import type {
  Boat,
  ConnectionRequest,
  ConnectionStatus,
  ConversationPreview,
  DirectMessage,
  Interest,
  Profile,
  ProfilePhoto,
} from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

const PROFILE_SELECT = `
  id, username, display_name, avatar_url, cover_url, bio, home_lake_id, home_city,
  home_marina, email, role, is_verified, identity_tags, badges, primary_boat_id,
  profile_visibility, message_privacy, show_on_water, show_marina, show_boat,
  show_online, allow_connection_requests, onboarding_completed, profile_kind,
  created_at, updated_at
`;

const PROFILE_CARD =
  "id, username, display_name, avatar_url, bio, home_city, home_lake_id, is_verified, badges";

/** Ensure a profiles row exists for the signed-in user (covers race / missing trigger). */
export async function ensureMyProfile(input?: {
  displayName?: string;
  email?: string | null;
}): Promise<Profile> {
  const sb = client();
  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();
  if (userErr || !user) throw new ApiError(userErr?.message ?? "Not signed in", "auth");

  const existing = await sb
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();
  if (existing.error) throw new ApiError(existing.error.message, existing.error.code);
  if (existing.data) return existing.data as Profile;

  const base =
    (user.email?.split("@")[0] ?? "boater").toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    "boater";
  const username = `${base}_${user.id.replace(/-/g, "").slice(0, 6)}`;
  const display =
    input?.displayName?.trim() ||
    (user.user_metadata?.display_name as string | undefined) ||
    base ||
    "Boater";

  const { data, error } = await sb
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username,
        display_name: display,
        email: input?.email ?? user.email ?? null,
        role: "user",
        badges: ["founding-member"],
        onboarding_completed: false,
      },
      { onConflict: "id" }
    )
    .select(PROFILE_SELECT)
    .single();
  if (error) throw new ApiError(error.message, error.code);
  return data as Profile;
}

export async function getFullProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return (data as Profile) ?? null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("username", username.replace(/^@/, "").toLowerCase())
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return (data as Profile) ?? null;
}

export type ProfileUpdate = Partial<{
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  home_lake_id: string | null;
  home_city: string | null;
  home_marina: string | null;
  identity_tags: string[];
  primary_boat_id: string | null;
  profile_visibility: string;
  message_privacy: string;
  show_on_water: boolean;
  show_marina: boolean;
  show_boat: boolean;
  show_online: boolean;
  allow_connection_requests: boolean;
  onboarding_completed: boolean;
}>;

export async function updateMyProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const payload: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (typeof patch.username === "string") {
    payload.username = patch.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);
  }
  const { data, error } = await client()
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select(PROFILE_SELECT)
    .single();
  if (error) throw new ApiError(error.message, error.code);
  return data as Profile;
}

export async function listInterests(): Promise<Interest[]> {
  const { data, error } = await client()
    .from("interests")
    .select("id, label, category, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as Interest[];
}

export async function listIdentityTags(): Promise<{ id: string; label: string }[]> {
  const { data, error } = await client()
    .from("identity_tag_catalog")
    .select("id, label")
    .order("sort_order", { ascending: true });
  if (error) throw new ApiError(error.message, error.code);
  return data ?? [];
}

export async function listMyInterests(profileId: string): Promise<string[]> {
  const { data, error } = await client()
    .from("profile_interests")
    .select("interest_id")
    .eq("profile_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((r) => r.interest_id as string);
}

export async function setMyInterests(profileId: string, interestIds: string[]) {
  const sb = client();
  const { error: delErr } = await sb.from("profile_interests").delete().eq("profile_id", profileId);
  if (delErr) throw new ApiError(delErr.message, delErr.code);
  if (!interestIds.length) return;
  const rows = interestIds.map((interest_id) => ({ profile_id: profileId, interest_id }));
  const { error } = await sb.from("profile_interests").insert(rows);
  if (error) throw new ApiError(error.message, error.code);
}

export async function listBoatsForUser(userId: string): Promise<Boat[]> {
  const { data, error } = await client()
    .from("boats")
    .select("*")
    .eq("owner_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as Boat[];
}

export async function upsertMyBoat(input: {
  id?: string;
  ownerId: string;
  nickname: string;
  name?: string;
  boatType?: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  lengthFt?: number;
  primaryColor?: string;
  description?: string;
  homeMarina?: string;
  photoUrl?: string;
  isPrimary?: boolean;
}): Promise<Boat> {
  const sb = client();
  if (input.isPrimary) {
    await sb.from("boats").update({ is_primary: false }).eq("owner_id", input.ownerId);
  }
  const payload = {
    id: input.id,
    owner_id: input.ownerId,
    nickname: input.nickname,
    name: input.name ?? input.nickname,
    boat_type: input.boatType ?? null,
    manufacturer: input.manufacturer ?? null,
    make: input.manufacturer ?? null,
    model: input.model ?? null,
    year: input.year ?? null,
    length_ft: input.lengthFt ?? null,
    primary_color: input.primaryColor ?? null,
    description: input.description ?? null,
    home_marina: input.homeMarina ?? null,
    photo_url: input.photoUrl ?? null,
    is_primary: !!input.isPrimary,
    visibility: "public",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb.from("boats").upsert(payload).select("*").single();
  if (error) throw new ApiError(error.message, error.code);
  if (input.isPrimary && data?.id) {
    await sb.from("profiles").update({ primary_boat_id: data.id }).eq("id", input.ownerId);
  }
  return data as Boat;
}

export async function deleteMyBoat(boatId: string, ownerId: string) {
  const { error } = await client().from("boats").delete().eq("id", boatId).eq("owner_id", ownerId);
  if (error) throw new ApiError(error.message, error.code);
}

export async function listProfilePhotos(profileId: string): Promise<ProfilePhoto[]> {
  const { data, error } = await client()
    .from("profile_photos")
    .select("*")
    .eq("profile_id", profileId)
    .order("sort_order", { ascending: true });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as ProfilePhoto[];
}

export async function addProfilePhoto(profileId: string, url: string, caption?: string) {
  const { count } = await client()
    .from("profile_photos")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileId);
  if ((count ?? 0) >= 12) throw new ApiError("Gallery limit is 12 photos", "limit");
  const { data, error } = await client()
    .from("profile_photos")
    .insert({
      profile_id: profileId,
      url,
      caption: caption ?? null,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  return data as ProfilePhoto;
}

export async function deleteProfilePhoto(photoId: string, profileId: string) {
  const { error } = await client()
    .from("profile_photos")
    .delete()
    .eq("id", photoId)
    .eq("profile_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
}

export function profileCompletion(profile: Profile, opts: {
  hasBoat: boolean;
  interestCount: number;
  photoCount: number;
  connectionCount?: number;
}): { percent: number; missing: string[] } {
  const checks: { ok: boolean; label: string }[] = [
    { ok: !!profile.avatar_url, label: "Add a profile photo" },
    { ok: !!profile.home_lake_id, label: "Choose your home lake" },
    { ok: !!profile.bio && profile.bio.trim().length > 8, label: "Write a short bio" },
    { ok: opts.interestCount >= 3, label: "Pick at least 3 interests" },
    { ok: opts.hasBoat, label: "Add your boat" },
    { ok: opts.photoCount >= 1, label: "Add a gallery photo" },
    { ok: (opts.connectionCount ?? 0) >= 1, label: "Connect with someone" },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

/** Connections */
export async function requestConnection(requesterId: string, recipientId: string, message?: string) {
  const { error } = await client().from("connection_requests").insert({
    requester_id: requesterId,
    recipient_id: recipientId,
    message: message ?? null,
    status: "pending",
  });
  if (error) throw new ApiError(error.message, error.code);
  await client().from("notifications").insert({
    user_id: recipientId,
    actor_id: requesterId,
    type: "connection_request",
    title: "New connection request",
    body: "Someone wants to connect on RaftOff.",
    target_type: "profile",
    target_id: requesterId,
  });
}

export async function acceptConnection(requestId: string) {
  const { error } = await client().rpc("accept_connection_request", { request_id: requestId });
  if (error) throw new ApiError(error.message, error.code);
}

export async function declineConnection(requestId: string, recipientId: string) {
  const { error } = await client()
    .from("connection_requests")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("recipient_id", recipientId);
  if (error) throw new ApiError(error.message, error.code);
}

export async function listConnections(profileId: string): Promise<string[]> {
  const { data, error } = await client()
    .from("connections")
    .select("profile_a, profile_b")
    .or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map((r) =>
    r.profile_a === profileId ? (r.profile_b as string) : (r.profile_a as string)
  );
}

export async function countConnections(profileId: string): Promise<number> {
  const { count, error } = await client()
    .from("connections")
    .select("*", { count: "exact", head: true })
    .or(`profile_a.eq.${profileId},profile_b.eq.${profileId}`);
  if (error) throw new ApiError(error.message, error.code);
  return count ?? 0;
}

export async function countFollowers(profileId: string): Promise<number> {
  const { count, error } = await client()
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
  return count ?? 0;
}

export async function countFollowing(profileId: string): Promise<number> {
  const { count, error } = await client()
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profileId);
  if (error) throw new ApiError(error.message, error.code);
  return count ?? 0;
}

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const q = query.trim().replace(/%/g, "");
  if (!q) return [];
  const { data, error } = await client()
    .from("profiles")
    .select(PROFILE_SELECT)
    .or(
      `username.ilike.%${q}%,display_name.ilike.%${q}%,home_city.ilike.%${q}%,home_marina.ilike.%${q}%`
    )
    .eq("is_blocked", false)
    .limit(limit);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as Profile[];
}

export async function getConnectionStatus(
  meId: string,
  otherId: string
): Promise<{ status: ConnectionStatus; requestId?: string }> {
  if (meId === otherId) return { status: "self" };
  const a = meId < otherId ? meId : otherId;
  const b = meId < otherId ? otherId : meId;
  const connected = await client()
    .from("connections")
    .select("profile_a")
    .eq("profile_a", a)
    .eq("profile_b", b)
    .maybeSingle();
  if (connected.error) throw new ApiError(connected.error.message, connected.error.code);
  if (connected.data) return { status: "connected" };

  const [out, inn] = await Promise.all([
    client()
      .from("connection_requests")
      .select("id")
      .eq("status", "pending")
      .eq("requester_id", meId)
      .eq("recipient_id", otherId)
      .maybeSingle(),
    client()
      .from("connection_requests")
      .select("id")
      .eq("status", "pending")
      .eq("requester_id", otherId)
      .eq("recipient_id", meId)
      .maybeSingle(),
  ]);
  if (out.error) throw new ApiError(out.error.message, out.error.code);
  if (inn.error) throw new ApiError(inn.error.message, inn.error.code);
  if (out.data) return { status: "pending_out", requestId: out.data.id as string };
  if (inn.data) return { status: "pending_in", requestId: inn.data.id as string };
  return { status: "none" };
}

export async function listIncomingRequests(userId: string): Promise<ConnectionRequest[]> {
  const { data, error } = await client()
    .from("connection_requests")
    .select(
      `id, requester_id, recipient_id, status, message, created_at, responded_at,
       requester:requester_id(${PROFILE_CARD})`
    )
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as unknown as ConnectionRequest[];
}

export async function listOutgoingRequests(userId: string): Promise<ConnectionRequest[]> {
  const { data, error } = await client()
    .from("connection_requests")
    .select(
      `id, requester_id, recipient_id, status, message, created_at, responded_at,
       recipient:recipient_id(${PROFILE_CARD})`
    )
    .eq("requester_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as unknown as ConnectionRequest[];
}

export async function listConnectionProfiles(profileId: string): Promise<Profile[]> {
  const ids = await listConnections(profileId);
  if (!ids.length) return [];
  const { data, error } = await client()
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", ids);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as Profile[];
}

export async function cancelConnectionRequest(requestId: string, requesterId: string) {
  const { error } = await client()
    .from("connection_requests")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requester_id", requesterId);
  if (error) throw new ApiError(error.message, error.code);
}

/** Direct messages */
export async function getOrCreateDm(otherUserId: string): Promise<string> {
  const { data, error } = await client().rpc("get_or_create_dm", { other_id: otherUserId });
  if (error) throw new ApiError(error.message, error.code);
  return data as string;
}

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  const { data: memberships, error } = await client()
    .from("conversation_members")
    .select("conversation_id, conversations(id, updated_at)")
    .eq("profile_id", userId);
  if (error) throw new ApiError(error.message, error.code);
  const rows = memberships ?? [];
  if (!rows.length) return [];

  const previews: ConversationPreview[] = [];
  for (const row of rows) {
    const conv = row.conversations as unknown as { id: string; updated_at: string } | null;
    if (!conv?.id) continue;
    const { data: members, error: memErr } = await client()
      .from("conversation_members")
      .select(`profile_id, profiles:profile_id(${PROFILE_CARD})`)
      .eq("conversation_id", conv.id);
    if (memErr) throw new ApiError(memErr.message, memErr.code);
    const peerRow = (members ?? []).find((m) => m.profile_id !== userId);
    const peer = (peerRow?.profiles as unknown as Profile) ?? null;
    if (!peer) continue;
    const { data: lastMsgs, error: msgErr } = await client()
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (msgErr) throw new ApiError(msgErr.message, msgErr.code);
    previews.push({
      id: conv.id,
      updated_at: conv.updated_at,
      peer,
      lastMessage: (lastMsgs?.[0] as DirectMessage) ?? null,
    });
  }
  return previews.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export async function listMessages(
  conversationId: string,
  limit = 80
): Promise<DirectMessage[]> {
  const { data, error } = await client()
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []) as DirectMessage[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string
): Promise<DirectMessage> {
  const text = body.trim();
  if (!text) throw new ApiError("Message is empty", "validation");
  const { data, error } = await client()
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: text.slice(0, 2000),
    })
    .select("id, conversation_id, sender_id, body, created_at, read_at")
    .single();
  if (error) throw new ApiError(error.message, error.code);
  await client()
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return data as DirectMessage;
}

export async function markConversationRead(conversationId: string, userId: string) {
  const { error } = await client()
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", userId);
  if (error) throw new ApiError(error.message, error.code);
}
