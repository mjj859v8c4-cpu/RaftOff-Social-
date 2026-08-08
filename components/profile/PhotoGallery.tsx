import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LazyImage } from "@/components/ui/LazyImage";
import { colors } from "@/lib/theme";
import type { ProfilePhoto } from "@/types/raftoff";
import { GalleryLightbox } from "@/components/profile/GalleryLightbox";

type Props = {
  photos: ProfilePhoto[];
  /** Enables add / delete / reorder controls (Edit Profile only). */
  editable?: boolean;
  uploading?: boolean;
  maxPhotos?: number;
  onAddPhoto?: () => void;
  onDeletePhoto?: (photo: ProfilePhoto) => void;
  onMovePhoto?: (photo: ProfilePhoto, direction: "left" | "right") => void;
};

const TILE = 92;

/** Gallery grid used on own profile, public profile, and Edit Profile (§25). */
export function PhotoGallery({
  photos,
  editable,
  uploading,
  maxPhotos = 12,
  onAddPhoto,
  onDeletePhoto,
  onMovePhoto,
}: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos.length && !editable) return null;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((photo, i) => (
          <View key={photo.id} style={styles.tileWrap}>
            <Pressable onPress={() => setLightboxIndex(i)}>
              <LazyImage uri={photo.url} style={styles.tile} />
            </Pressable>
            {editable ? (
              <>
                <Pressable
                  style={styles.deleteBadge}
                  hitSlop={8}
                  onPress={() => onDeletePhoto?.(photo)}
                >
                  <Text style={styles.deleteBadgeText}>✕</Text>
                </Pressable>
                <View style={styles.moveRow}>
                  <Pressable
                    style={[styles.moveBtn, i === 0 && styles.moveBtnDisabled]}
                    disabled={i === 0}
                    hitSlop={6}
                    onPress={() => onMovePhoto?.(photo, "left")}
                  >
                    <Text style={styles.moveBtnText}>‹</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.moveBtn, i === photos.length - 1 && styles.moveBtnDisabled]}
                    disabled={i === photos.length - 1}
                    hitSlop={6}
                    onPress={() => onMovePhoto?.(photo, "right")}
                  >
                    <Text style={styles.moveBtnText}>›</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        ))}

        {editable && photos.length < maxPhotos ? (
          <Pressable style={styles.addTile} onPress={onAddPhoto} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.action} />
            ) : (
              <>
                <Text style={styles.addTileIcon}>+</Text>
                <Text style={styles.addTileText}>Add</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </ScrollView>

      {editable ? (
        <Text style={styles.hint}>
          {photos.length}/{maxPhotos} photos · tap a photo to view, use ‹ › to reorder
        </Text>
      ) : null}

      <GalleryLightbox
        photos={photos}
        initialIndex={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  tileWrap: { width: TILE },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  deleteBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  moveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  moveBtn: {
    width: 26,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  moveBtnDisabled: { opacity: 0.3 },
  moveBtnText: { color: colors.text, fontWeight: "800" },
  addTile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,61,130,0.08)",
  },
  addTileIcon: { color: colors.action, fontSize: 22, fontWeight: "800", lineHeight: 24 },
  addTileText: { color: colors.action, fontSize: 11, fontWeight: "700" },
  hint: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
