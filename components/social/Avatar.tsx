import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";

export function Avatar({
  uri,
  name,
  size = 48,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
}) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, dim]} />;
  }
  return (
    <View style={[styles.avatar, styles.fallback, dim]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
        {(name ?? "?").trim().slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.bgElevated },
  fallback: { backgroundColor: colors.action, alignItems: "center", justifyContent: "center" },
  initials: { color: "#fff", fontWeight: "800" },
});
