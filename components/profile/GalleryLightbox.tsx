import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "@/lib/theme";
import type { ProfilePhoto } from "@/types/raftoff";

type Props = {
  photos: ProfilePhoto[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

/** Full-screen swipeable viewer for a profile's gallery (§25 enlarge). */
export function GalleryLightbox({ photos, initialIndex, visible, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const width = Dimensions.get("window").width;

  if (!photos.length) return null;
  const active = photos[Math.min(index, photos.length - 1)];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * width, y: 0 }}
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(Math.max(0, Math.min(next, photos.length - 1)));
          }}
        >
          {photos.map((p) => (
            <View key={p.id} style={[styles.page, { width }]}>
              <Image source={{ uri: p.url }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>

        <Pressable style={styles.close} onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {photos.length > 1 ? (
          <Text style={styles.counter}>
            {index + 1} / {photos.length}
          </Text>
        ) : null}

        {active?.caption ? <Text style={styles.caption}>{active.caption}</Text> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "rgba(5,4,10,0.96)" },
  page: { alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  close: {
    position: "absolute",
    top: 56,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  counter: {
    position: "absolute",
    top: 64,
    alignSelf: "center",
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  caption: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    maxWidth: "84%",
    color: colors.text,
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
