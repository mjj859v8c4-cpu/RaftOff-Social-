import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LakeMap } from "@/components/LakeMap";
import { DiningStrip } from "@/components/map/DiningStrip";
import { LakeSwitcher } from "@/components/map/LakeSwitcher";
import { useRaftOffStore } from "@/features/map/store";
import { colors, spacing } from "@/lib/theme";

export default function MapScreen() {
  const router = useRouter();
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const setActiveLakeId = useRaftOffStore((s) => s.setActiveLakeId);
  const diningNearWater = useRaftOffStore((s) => s.diningForActiveLake());
  const selectLocation = useRaftOffStore((s) => s.selectLocation);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <LakeSwitcher value={activeLakeId} onChange={setActiveLakeId} />
        <Text style={styles.safety}>
          Not a navigation tool — always use official charts and local knowledge.
        </Text>
      </View>
      <View style={styles.mapWrap}>
        <LakeMap />
      </View>
      <DiningStrip
        items={diningNearWater}
        onSelect={(id) => {
          selectLocation(id);
          router.push(`/locations/${id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  safety: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  mapWrap: { flex: 1 },
});
