import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { getConnectionStatuses, listIncomingRequests } from "@/features/profiles/api";
import { countUnreadNotifications } from "@/features/notifications/api";
import {
  peopleByIdentityTag,
  peopleNewToLake,
  peopleOnMyLake,
  peopleWithSharedInterests,
  searchPeople,
  suggestedConnections,
  type DiscoverPerson,
} from "@/features/social/discover";
import { PersonCard, PersonRow } from "@/components/social/PersonRow";
import type { ConnectionStatus } from "@/types/raftoff";

type StatusMap = Record<string, { status: ConnectionStatus; requestId?: string }>;

type Section = {
  key: string;
  title: string;
  subtitle?: string;
  people: DiscoverPerson[];
};

function toRowData(p: DiscoverPerson, extra?: string | null) {
  return {
    id: p.id,
    username: p.username,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    is_verified: p.is_verified,
    subtitle: extra ?? (p.home_city ? p.home_city : `@${p.username}`),
  };
}

export default function DiscoverScreen() {
  const meId = useAuthStore((s) => s.session?.user?.id);
  const myProfile = useAuthStore((s) => s.profile);
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeName =
    lakes.find((l) => l.id === myProfile?.home_lake_id)?.name ??
    lakes.find((l) => l.id === useRaftOffStore.getState().activeLakeId)?.name ??
    "your lake";

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoverPerson[]>([]);
  const [searching, setSearching] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const applyStatuses = useCallback(
    async (people: DiscoverPerson[]) => {
      if (!meId || !people.length) return;
      try {
        const map = await getConnectionStatuses(meId, people.map((p) => p.id));
        setStatuses((prev) => ({ ...prev, ...map }));
      } catch {
        // Non-fatal — buttons fall back to "Connect" and self-correct on tap.
      }
    },
    [meId]
  );

  const load = useCallback(async () => {
    if (!meId) return;
    setError(null);
    try {
      const [suggested, onLake, shared, newToLake, fishermen, boaters, jetSki, incoming, unread] =
        await Promise.all([
          suggestedConnections(12).catch(() => []),
          peopleOnMyLake(12).catch(() => []),
          peopleWithSharedInterests(12).catch(() => []),
          peopleNewToLake(12).catch(() => []),
          peopleByIdentityTag("fisherman", 10).catch(() => []),
          peopleByIdentityTag("boater", 10).catch(() => []),
          peopleByIdentityTag("jet-ski-rider", 10).catch(() => []),
          listIncomingRequests(meId).catch(() => []),
          countUnreadNotifications(meId).catch(() => 0),
        ]);

      const next: Section[] = [
        { key: "suggested", title: "Suggested for you", people: suggested },
        { key: "lake", title: `People on ${lakeName}`, people: onLake },
        { key: "interests", title: "Similar interests", people: shared },
        {
          key: "identity",
          title: "Fishermen, boaters & jet skiers",
          people: [...fishermen, ...boaters, ...jetSki].filter(
            (p, i, arr) => arr.findIndex((q) => q.id === p.id) === i
          ),
        },
        { key: "new", title: `New to ${lakeName}`, people: newToLake },
      ].filter((s) => s.people.length > 0);

      setSections(next);
      setPendingCount(incoming.length);
      setUnreadNotifs(unread);

      const allPeople = next.flatMap((s) => s.people);
      await applyStatuses(allPeople);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discovery");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meId, lakeName, applyStatuses]);

  useEffect(() => {
    void load();
  }, [load]);

  const runSearch = useCallback(
    async (text: string) => {
      const term = text.trim();
      if (term.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const found = await searchPeople(term, 25);
        setSearchResults(found);
        await applyStatuses(found);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [applyStatuses]
  );

  useEffect(() => {
    const handle = setTimeout(() => void runSearch(query), 300);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const setPersonStatus = useCallback(
    (id: string) => (next: { status: ConnectionStatus; requestId?: string }) => {
      setStatuses((prev) => ({ ...prev, [id]: next }));
    },
    []
  );

  const isSearchMode = query.trim().length >= 2;

  const bellBadge = useMemo(() => (unreadNotifs > 9 ? "9+" : unreadNotifs || null), [unreadNotifs]);
  const requestBadge = useMemo(() => (pendingCount > 9 ? "9+" : pendingCount || null), [pendingCount]);

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
      <View style={styles.top}>
        <Text style={styles.title}>Discover</Text>
        <View style={styles.topActions}>
          <Pressable
            style={styles.iconBtn}
            hitSlop={10}
            onPress={() => router.push("/connections" as never)}
          >
            <Text style={styles.icon}>👥</Text>
            {requestBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requestBadge}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            hitSlop={10}
            onPress={() => router.push("/notifications" as never)}
          >
            <Text style={styles.icon}>🔔</Text>
            {bellBadge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{bellBadge}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, @handle, lake, boat, marina, interest"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isSearchMode ? (
        <FlatList
          data={searchResults}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.searchList}
          ListHeaderComponent={
            searching ? <ActivityIndicator color={colors.action} style={{ marginBottom: 12 }} /> : null
          }
          ListEmptyComponent={
            !searching ? <Text style={styles.empty}>No boaters match “{query.trim()}”.</Text> : null
          }
          renderItem={({ item }) => (
            <PersonRow
              person={toRowData(item)}
              meId={meId}
              status={statuses[item.id]?.status ?? "none"}
              requestId={statuses[item.id]?.requestId}
              onStatusChange={setPersonStatus(item.id)}
            />
          )}
        />
      ) : loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.sections}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.action} />}
        >
          {sections.length === 0 ? (
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Find your crew on {lakeName}</Text>
              <Text style={styles.introBody}>
                Add a home lake and a few interests on your profile to unlock personalized
                suggestions here.
              </Text>
              <Pressable style={styles.entry} onPress={() => router.push("/(tabs)/map" as never)}>
                <Text style={styles.entryTitle}>Who’s on the water</Text>
                <Text style={styles.entryBody}>See live check-ins on the map</Text>
              </Pressable>
              <Pressable style={styles.entry} onPress={() => router.push("/connections" as never)}>
                <Text style={styles.entryTitle}>Your connections</Text>
                <Text style={styles.entryBody}>Requests, connections, and messages</Text>
              </Pressable>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.key} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <FlatList
                  data={section.people}
                  keyExtractor={(p) => p.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardRow}
                  renderItem={({ item }) => (
                    <PersonCard
                      person={toRowData(item)}
                      meId={meId}
                      status={statuses[item.id]?.status ?? "none"}
                      requestId={statuses[item.id]?.requestId}
                      onStatusChange={setPersonStatus(item.id)}
                    />
                  )}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  topActions: { flexDirection: "row", gap: 14 },
  iconBtn: { alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 20 },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
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
  searchList: { padding: spacing.lg, paddingTop: 4, paddingBottom: 40, flexGrow: 1 },
  sections: { paddingTop: 4, paddingBottom: 40, gap: 18 },
  section: { gap: 10 },
  sectionTitle: { color: colors.text, fontWeight: "800", fontSize: 15, paddingHorizontal: spacing.lg },
  cardRow: { paddingHorizontal: spacing.lg, gap: 10 },
  intro: { gap: 10, paddingTop: 8, paddingHorizontal: spacing.lg },
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
