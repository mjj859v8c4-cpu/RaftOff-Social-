import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { useNetworkStatus } from "@/lib/network";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.action} size="large" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Text style={styles.link} onPress={onRetry}>
          Try again
        </Text>
      ) : null}
    </View>
  );
}

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  if (isConnected) return null;
  return (
    <View style={styles.offline}>
      <Text style={styles.offlineText}>You’re offline — showing cached lake data when available.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
    backgroundColor: colors.bg,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 18 },
  text: { color: colors.muted, textAlign: "center" },
  link: { color: colors.action, fontWeight: "700", marginTop: 8 },
  offline: {
    backgroundColor: "#422006",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  offlineText: { color: "#FDE68A", fontSize: 12, textAlign: "center" },
});
