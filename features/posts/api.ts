/**
 * Posts — creation, photos, saves. Read/like/comment paths that already exist
 * in lib/api/production.ts (used by the map store) are left as the single
 * source of truth; this module only adds what was missing.
 */
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { ApiError } from "@/lib/api/production";
import { uploadPhoto, pickAndCompressImage } from "@/lib/media/upload";
import { clampLimit } from "@/lib/pagination";
import { track } from "@/lib/analytics";
import { assertOnline } from "@/lib/network";
import type { Post } from "@/types/raftoff";

function client() {
  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return sb;
}

const POST_SELECT =
  "*, profiles:author_id(id, username, display_name, avatar_url), locations:location_id(id, slug, name, type), reactions(count), comments(count)";

function mapPostRow(row: any): Post {
  return {
    ...row,
    profile: row.profiles,
    location: row.locations,
    like_count: row.reactions?.[0]?.count ?? 0,
    comment_count: row.comments?.[0]?.count ?? 0,
  } as Post;
}

/** Pick, compress, and upload a photo for a new post. Returns the public URL. */
export async function pickAndUploadPostPhoto(userId: string): Promise<string | null> {
  const compressed = await pickAndCompressImage({ allowsEditing: false });
  if (!compressed) return null;
  const { url } = await uploadPhoto({
    userId,
    bucket: "post-photos",
    uri: compressed.uri,
    purpose: "post",
    skipCompress: true,
  });
  return url;
}

export async function createPost(input: {
  authorId: string;
  lakeId: string;
  locationId?: string | null;
  text?: string;
  photoUrls?: string[];
  audience?: "public" | "followers" | "friends" | "crew" | "private";
}): Promise<Post> {
  assertOnline();
  const text = (input.text ?? "").trim();
  if (!text && !(input.photoUrls ?? []).length) {
    throw new ApiError("Write something or add a photo", "validation");
  }
  const { data, error } = await client()
    .from("posts")
    .insert({
      author_id: input.authorId,
      lake_id: input.lakeId,
      location_id: input.locationId ?? null,
      post_type: "standard",
      text: text || null,
      photo_url: input.photoUrls?.[0] ?? null,
      photo_urls: input.photoUrls ?? [],
      audience: input.audience ?? "public",
    })
    .select(POST_SELECT)
    .single();
  if (error) throw new ApiError(error.message, error.code);
  track("create_post", { lakeId: input.lakeId, hasPhoto: !!input.photoUrls?.length });
  return mapPostRow(data);
}

export async function deletePost(postId: string, authorId: string) {
  const { error } = await client()
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", authorId);
  if (error) throw new ApiError(error.message, error.code);
}

/** Save / bookmark a post */
export async function isPostSaved(postId: string, profileId: string): Promise<boolean> {
  const { data, error } = await client()
    .from("post_saves")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, error.code);
  return !!data;
}

export async function toggleSavePost(postId: string, profileId: string): Promise<{ saved: boolean }> {
  const sb = client();
  const existing = await sb
    .from("post_saves")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing.data) {
    const { error } = await sb
      .from("post_saves")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", profileId);
    if (error) throw new ApiError(error.message, error.code);
    return { saved: false };
  }
  const { error } = await sb.from("post_saves").insert({ post_id: postId, profile_id: profileId });
  if (error) throw new ApiError(error.message, error.code);
  track("save_post", { postId });
  return { saved: true };
}

export async function listSavedPosts(profileId: string, limit?: number): Promise<Post[]> {
  const capped = clampLimit(limit);
  const { data, error } = await client()
    .from("post_saves")
    .select(`created_at, posts:post_id(${POST_SELECT})`)
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(capped);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? [])
    .map((row: any) => row.posts)
    .filter(Boolean)
    .map(mapPostRow);
}

export async function getSavedPostIds(profileId: string, postIds: string[]): Promise<Set<string>> {
  if (!postIds.length) return new Set();
  const { data, error } = await client()
    .from("post_saves")
    .select("post_id")
    .eq("profile_id", profileId)
    .in("post_id", postIds);
  if (error) throw new ApiError(error.message, error.code);
  return new Set((data ?? []).map((r) => r.post_id as string));
}

export async function listPostsByAuthor(authorId: string, limit?: number): Promise<Post[]> {
  const capped = clampLimit(limit);
  const { data, error } = await client()
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .is("deleted_at", null)
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false })
    .limit(capped);
  if (error) throw new ApiError(error.message, error.code);
  return (data ?? []).map(mapPostRow);
}
