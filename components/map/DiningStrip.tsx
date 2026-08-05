import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import type { Location } from "@/types/raftoff";

type Props = {
  items: Location[];
  onSelect: (id: string) => void;
};

export function DiningStrip({ items, onSelect }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Bars & restaurants</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const cat = (item.attributes?.diningCategory as string | undefined) ?? "dining";
          return (
            <Pressable key={item.id} style={styles.card} onPress={() => onSelect(item.id)}>
              <Text style={styles.kicker}>{cat.replace(/_/g, " ")}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.description ?? "Waterfront"}
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
  title: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: spacing.lg,
  },
  row: { gap: 10, paddingHorizontal: spacing.lg },
  card: {
    width: 168,
    backgroundColor: "rgba(18,32,51,0.95)",
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  kicker: {
    color: colors.food,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  name: { color: colors.text, fontWeight: "700", fontSize: 13, lineHeight: 17 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
