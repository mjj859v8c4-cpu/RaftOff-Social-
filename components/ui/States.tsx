import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
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

/** Encouraging empty state — optional icon + CTA button (e.g. "Find people"). */
export function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  onPressCta,
  inline,
}: {
  icon?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  /** Render without flex:1 centering — for use inside a scroll view / list. */
  inline?: boolean;
}) {
  return (
    <View style={inline ? styles.inlineEmpty : styles.center}>
      {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.text}>{body}</Text>
      {ctaLabel && onPressCta ? (
        <Pressable style={styles.emptyCta} onPress={onPressCta} hitSlop={8}>
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
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
  inlineEmpty: { alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  emptyIcon: { fontSize: 32, marginBottom: 2 },
  emptyCta: {
    marginTop: 6,
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyCtaText: { color: "#fff", fontWeight: "800" },
  offline: {
    backgroundColor: "#422006",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  offlineText: { color: "#FDE68A", fontSize: 12, textAlign: "center" },
});
