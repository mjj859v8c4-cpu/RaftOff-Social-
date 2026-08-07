import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { assertOnline } from "@/lib/network";
import { logger } from "@/lib/logging";
import { ApiError } from "@/lib/api/production";
import { track } from "@/lib/analytics";

export type PhotoBucket =
  | "profile-photos"
  | "boat-photos"
  | "check-in-photos"
  | "event-photos"
  | "post-photos";

function client() {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured) {
    throw new ApiError("Supabase is not configured", "not_configured");
  }
  return supabase;
}

/** Compress image before upload (max edge 1600px, JPEG ~0.7) */
export async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result;
}

export async function pickAndCompressImage(options?: { allowsEditing?: boolean }) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new ApiError("Photo library permission is required", "permission");
  }
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? true,
    quality: 1,
  });
  if (picked.canceled || !picked.assets[0]) return null;
  return compressImage(picked.assets[0].uri);
}

async function uriToBlob(uri: string) {
  const res = await fetch(uri);
  return res.blob();
}

export async function uploadPhoto(input: {
  userId: string;
  bucket: PhotoBucket;
  uri: string;
  purpose: "profile" | "boat" | "check_in" | "event" | "post";
  entityType?: string;
  entityId?: string;
}) {
  assertOnline();
  const supabase = client();
  const compressed = await compressImage(input.uri);
  const path = `${input.userId}/${Date.now()}.jpg`;
  const blob = await uriToBlob(compressed.uri);

  const { error: uploadError } = await supabase.storage
    .from(input.bucket)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    logger.error("media.upload", uploadError);
    throw new ApiError(uploadError.message);
  }

  const { data: publicUrl } = supabase.storage.from(input.bucket).getPublicUrl(path);

  await supabase.from("media_assets").insert({
    owner_id: input.userId,
    bucket: input.bucket,
    path,
    mime_type: "image/jpeg",
    byte_size: blob.size,
    width: compressed.width,
    height: compressed.height,
    purpose: input.purpose,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
  });

  track("upload_photo", { bucket: input.bucket, purpose: input.purpose });
  return { path, url: publicUrl.publicUrl };
}
