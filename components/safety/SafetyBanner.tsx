import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";

const COPY = {
  check_in:
    "Location sharing is optional and temporary. Meet carefully — report or block anytime.",
  message:
    "Keep it friendly. Report or block from their profile if something feels off.",
  profile:
    "Profiles are public. Meet carefully in person — report or block from •••.",
} as const;

export type SafetyBannerVariant = keyof typeof COPY;

export function SafetyBanner({ variant }: { variant: SafetyBannerVariant }) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.text}>{COPY[variant]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "rgba(255, 200, 87, 0.25)",
    backgroundColor: "rgba(255, 200, 87, 0.08)",
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  text: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
