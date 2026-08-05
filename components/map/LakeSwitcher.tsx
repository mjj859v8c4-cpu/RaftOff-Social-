import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "@/lib/theme";
import { MICHIGAN_LAKES } from "@/supabase/seed/michigan-lakes";

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function LakeSwitcher({ value, onChange }: Props) {
  const lakes = [...MICHIGAN_LAKES].sort((a, b) => b.popularity - a.popularity);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {lakes.map((lake) => {
        const active = value === lake.id;
        return (
          <Pressable
            key={lake.id}
            onPress={() => onChange(lake.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.name, active && styles.nameActive]}>{lake.name}</Text>
            <Text style={[styles.region, active && styles.regionActive]}>{lake.region}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(18,32,51,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 120,
  },
  chipActive: {
    backgroundColor: "rgba(46,183,224,0.18)",
    borderColor: "rgba(46,183,224,0.55)",
  },
  name: { color: colors.text, fontWeight: "800", fontSize: 13 },
  nameActive: { color: "#B9ECFF" },
  region: { color: colors.muted, fontSize: 11, marginTop: 2 },
  regionActive: { color: "rgba(185,236,255,0.75)" },
});
