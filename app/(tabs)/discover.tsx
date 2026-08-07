import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import { searchProfiles } from "@/features/profiles/api";
import type { Profile } from "@/types/raftoff";

export default function DiscoverScreen() {
  const meId = useAuthStore((s) => s.session?.user?.id);
  const lakes = useRaftOffStore((s) => s.lakes);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lakeName = lakes.find((l) => l.id === activeLakeId)?.name ?? "your lake";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    async (text: string) => {
      const term = text.trim();
      if (term.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      setError(null);
      try {
        const found = await searchProfiles(term, 25);
        setResults(found.filter((p) => p.id !== meId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [meId]
  );

  useEffect(() => {
    const handle = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Text style={styles.title}>Discover</Text>
        <Pressable
          style={styles.checkIn}
          onPress={() => router.push("/(tabs)/drop-anchor" as never)}
        >
          <Text style={styles.checkInText}>⚓ Check in</Text>
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search people by name, @handle, city or marina"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          searching ? <ActivityIndicator color={colors.action} style={{ marginBottom: 12 }} /> : null
        }
        ListEmptyComponent={
          query.trim().length >= 2 && !searching ? (
            <Text style={styles.empty}>No boaters match “{query.trim()}”.</Text>
          ) : (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Find your crew on {lakeName}</Text>
              <Text style={styles.introBody}>
                Search for boaters by name or handle, or jump into the places where people are
                already out.
              </Text>
              <Pressable
                style={styles.entry}
                onPress={() => router.push("/(tabs)/map" as never)}
              >
                <Text style={styles.entryTitle}>Who’s on the water</Text>
                <Text style={styles.entryBody}>See live check-ins on the map</Text>
              </Pressable>
              <Pressable
                style={styles.entry}
                onPress={() => router.push("/connections" as never)}
              >
                <Text style={styles.entryTitle}>Your connections</Text>
                <Text style={styles.entryBody}>Requests, connections, and messages</Text>
              </Pressable>
              <Pressable
                style={styles.entry}
                onPress={() => router.push("/(tabs)/events" as never)}
              >
                <Text style={styles.entryTitle}>Events on the lake</Text>
                <Text style={styles.entryBody}>Raft-ups, meetups, and poker runs</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/u/${item.username}` as never)}
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>
                  {(item.display_name ?? "?").slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.display_name}
                {item.is_verified ? " ✓" : ""}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                @{item.username}
                {item.home_city ? ` · ${item.home_city}` : ""}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  title: { color: colors.text, fontWeight: "800", fontSize: 20 },
  checkIn: {
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkInText: { color: colors.action, fontWeight: "800", fontSize: 12 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: 8 },
  search: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.bgElevated,
  },
  list: { padding: spacing.lg, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgElevated },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  name: { color: colors.text, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.muted, fontSize: 22 },
  intro: { gap: 10, paddingTop: 8 },
  introTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  introBody: { color: colors.muted, lineHeight: 20, marginBottom: 6 },
  entry: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    gap: 3,
    backgroundColor: colors.bgElevated,
  },
  entryTitle: { color: colors.text, fontWeight: "800" },
  entryBody: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 30 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginBottom: 4 },
});
