import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors } from "@/lib/theme";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Live now" },
  { id: "social", label: "Social" },
  { id: "dining", label: "Bars & food" },
  { id: "fishing", label: "Fishing" },
  { id: "services", label: "Marinas & parks" },
];

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function MapFilters({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {FILTERS.map((f) => {
        const active = value === f.id;
        return (
          <Pressable
            key={f.id}
            onPress={() => onChange(f.id)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{f.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(18,32,51,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "rgba(46,183,224,0.18)",
    borderColor: "rgba(46,183,224,0.55)",
  },
  text: { color: colors.muted, fontWeight: "700", fontSize: 12 },
  textActive: { color: "#B9ECFF" },
});
