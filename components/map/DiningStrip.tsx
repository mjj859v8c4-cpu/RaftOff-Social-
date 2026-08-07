import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import type { Location } from "@/types/raftoff";

type Props = {
  items: Location[];
  onSelect: (id: string) => void;
};

function partnerTier(item: Location): "featured" | "listed" | null {
  const tier = item.attributes?.partnerTier;
  if (tier === "featured" || tier === "listed") return tier;
  if (item.attributes?.partner) return "listed";
  return null;
}

export function DiningStrip({ items, onSelect }: Props) {
  const sorted = [...items].sort((a, b) => {
    const ta = partnerTier(a);
    const tb = partnerTier(b);
    if (ta === "featured" && tb !== "featured") return -1;
    if (tb === "featured" && ta !== "featured") return 1;
    if (ta && !tb) return -1;
    if (tb && !ta) return 1;
    return a.name.localeCompare(b.name);
  });

  if (!sorted.length) return null;

  const featuredCount = sorted.filter((i) => partnerTier(i) === "featured").length;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Bars & restaurants on RaftOff</Text>
        <Text style={styles.count}>
          {featuredCount} featured · {sorted.length} partners
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sorted.map((item) => {
          const cat = String(item.attributes?.diningCategory ?? "dining").replace(/_/g, " ");
          const tier = partnerTier(item);
          const note = String(item.description ?? item.attributes?.regionHint ?? "Waterfront");
          return (
            <Pressable
              key={item.id}
              style={[styles.card, tier === "featured" && styles.cardFeatured]}
              onPress={() => onSelect(item.id)}
            >
              <Text style={[styles.tier, tier === "listed" && styles.tierListed]}>
                {tier === "featured" ? "Featured partner" : tier === "listed" ? "On RaftOff" : cat}
              </Text>
              <Text style={styles.kicker}>{cat}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>
                {note}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: spacing.sm },
  head: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    flex: 1,
  },
  count: { color: colors.muted, fontSize: 11 },
  row: { gap: 10, paddingHorizontal: spacing.lg },
  card: {
    width: 168,
    backgroundColor: "rgba(18,32,51,0.95)",
    borderColor: "rgba(232,195,106,0.28)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 128,
  },
  cardFeatured: {
    borderColor: "rgba(245,197,66,0.55)",
  },
  tier: {
    color: "#f5c542",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tierListed: { color: "#f0a04b" },
  kicker: {
    color: colors.food,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  name: { color: colors.text, fontWeight: "700", fontSize: 13, lineHeight: 17 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
