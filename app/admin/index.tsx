import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import {
  hidePost,
  listOpenReports,
  resolveReport,
  setUserBlocked,
} from "@/features/moderation/api";
import { logger } from "@/lib/logging";

export default function AdminScreen() {
  const profile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await listOpenReports());
    } catch (e) {
      logger.error("admin.load", e);
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!session) return <Redirect href={"/(auth)/login" as never} />;
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.wrap}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.meta}>Moderator access required.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <Text style={styles.title}>Moderation</Text>
      <Text style={styles.meta}>{reports.length} open reports</Text>
      <TextInput
        style={styles.input}
        placeholder="Resolution notes"
        placeholderTextColor={colors.muted}
        value={notes}
        onChangeText={setNotes}
      />
      {loading ? <ActivityIndicator color={colors.action} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.target_type} · {item.reason}
            </Text>
            <Text style={styles.meta}>
              by @{item.profiles?.username ?? "unknown"} · {item.target_id}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={styles.btn}
                onPress={() =>
                  resolveReport({
                    reportId: item.id,
                    reviewerId: session.user.id,
                    status: "resolved",
                    notes,
                    hidePostId: item.target_type === "post" ? item.target_id : undefined,
                  }).then(load)
                }
              >
                <Text style={styles.btnText}>Resolve</Text>
              </Pressable>
              <Pressable
                style={styles.ghost}
                onPress={() =>
                  resolveReport({
                    reportId: item.id,
                    reviewerId: session.user.id,
                    status: "dismissed",
                    notes,
                  }).then(load)
                }
              >
                <Text style={styles.btnText}>Dismiss</Text>
              </Pressable>
              {item.target_type === "user" ? (
                <Pressable
                  style={styles.danger}
                  onPress={() =>
                    setUserBlocked(session.user.id, item.target_id, true).then(load)
                  }
                >
                  <Text style={styles.btnText}>Ban</Text>
                </Pressable>
              ) : null}
              {item.target_type === "post" ? (
                <Pressable
                  style={styles.danger}
                  onPress={() => hidePost(session.user.id, item.target_id, notes).then(load)}
                >
                  <Text style={styles.btnText}>Hide</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.meta}>Queue clear.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  meta: { color: colors.muted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: "#1F3344",
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: "#0E1A24",
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#1F3344",
  },
  cardTitle: { color: colors.text, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  btn: { backgroundColor: colors.action, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  ghost: { backgroundColor: "#1F3344", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  danger: { backgroundColor: "#B91C1C", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  error: { color: "#F87171", marginBottom: 8 },
});
