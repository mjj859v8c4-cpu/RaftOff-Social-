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
import { getConnectionStatuses, getPeopleDetails, listIncomingRequests, type PersonDetail } from "@/features/profiles/api";
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
import { PersonCard, PersonRow, type PersonRowData } from "@/components/social/PersonRow";
import type { ConnectionStatus } from "@/types/raftoff";

type StatusMap = Record<string, { status: ConnectionStatus; requestId?: string }>;
type DetailMap = Record<string, PersonDetail>;

type Section = {
  key: string;
  title: string;
  subtitle?: string;
  people: DiscoverPerson[];
};

export default function DiscoverScreen() {
  const meId = useAuthStore((s) => s.session?.user?.id);
  const myProfile = useAuthStore((s) => s.profile);
  const lakes = useRaftOffStore((s) => s.lakes);
  const lakeName =
    lakes.find((l) => l.id === myProfile?.home_lake_id)?.name ??
    lakes.find((l) => l.id === useRaftOffStore.getState().activeLakeId)?.name ??
    "your lake";
  const lakeNameById = useMemo(
    () => Object.fromEntries(lakes.map((l) => [l.id, l.name])) as Record<string, string>,
    [lakes]
  );

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoverPerson[]>([]);
  const [searching, setSearching] = useState(false);

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statuses, setStatuses] = useState<StatusMap>({});
  const [details, setDetails] = useState<DetailMap>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const applyDetails = useCallback(async (people: DiscoverPerson[]) => {
    if (!people.length) return;
    try {
      const map = await getPeopleDetails(people.map((p) => p.id));
      setDetails((prev) => ({ ...prev, ...map }));
    } catch {
      // Non-fatal — rows fall back to lake/handle subtitle without chips.
    }
  }, []);

  const toRowData = useCallback(
    (p: DiscoverPerson, extra?: string | null): PersonRowData => {
      const detail = details[p.id];
      const lakeFromId = p.home_lake_id ? lakeNameById[p.home_lake_id] : null;
      return {
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        is_verified: p.is_verified,
        subtitle: extra ?? (p.home_city ? p.home_city : `@${p.username}`),
        lakeName: lakeFromId ?? null,
        boatLabel: detail?.boatLabel ?? null,
        interestLabels: detail?.interestLabels ?? [],
        mutualCount: p.mutual_count,
      };
    },
    [details, lakeNameById]
  );

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

      const mutual = suggested.filter((p) => (p.mutual_count ?? 0) > 0);
      const mutualIds = new Set(mutual.map((p) => p.id));
      const suggestedRest = suggested.filter((p) => !mutualIds.has(p.id));

      const next: Section[] = [
        {
          key: "mutual",
          title: "Mutual connections",
          subtitle: "People who know people you know",
          people: mutual,
        },
        { key: "suggested", title: "Suggested for you", people: suggestedRest },
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
      await Promise.all([applyStatuses(allPeople), applyDetails(allPeople)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load discovery");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [meId, lakeName, applyStatuses, applyDetails]);

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
        await Promise.all([applyStatuses(found), applyDetails(found)]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [applyStatuses, applyDetails]
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
            style={styles.checkInBtn}
            hitSlop={10}
            onPress={() => router.push("/(tabs)/drop-anchor" as never)}
          >
            <Text style={styles.checkInBtnText}>⚓ Check in</Text>
          </Pressable>
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
            !searching ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.empty}>No boaters match “{query.trim()}”.</Text>
                <Text style={styles.emptySub}>
                  Try a first name, @handle, home lake, marina, boat name, or interest.
                </Text>
              </View>
            ) : null
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
              <Text style={styles.introTitle}>No one to show here yet</Text>
              <Text style={styles.introBody}>
                {lakeName === "your lake"
                  ? "Set a home lake and pick a few interests on your profile — that’s how we match you with people nearby."
                  : `We couldn’t find anyone on ${lakeName} yet. Add a boat, interests, or a bio so people can find you too, and check back soon.`}
              </Text>
              <Pressable style={styles.entryPrimary} onPress={() => router.push("/profile/edit" as never)}>
                <Text style={styles.entryPrimaryTitle}>Complete your profile</Text>
                <Text style={styles.entryPrimaryBody}>Boat, interests & lake unlock better matches</Text>
              </Pressable>
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
                {section.subtitle ? <Text style={styles.sectionSubtitle}>{section.subtitle}</Text> : null}
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
  topActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkInBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  checkInBtnText: { color: colors.text, fontWeight: "800", fontSize: 12 },
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
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: spacing.lg,
    marginTop: -6,
  },
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
  entryPrimary: {
    borderWidth: 1,
    borderColor: "rgba(255,61,130,0.4)",
    borderRadius: 14,
    padding: 14,
    gap: 3,
    backgroundColor: "rgba(255,61,130,0.12)",
  },
  entryPrimaryTitle: { color: colors.text, fontWeight: "800" },
  entryPrimaryBody: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center" },
  emptyWrap: { gap: 6, marginTop: 30, paddingHorizontal: spacing.lg },
  emptySub: { color: colors.muted, textAlign: "center", fontSize: 12, opacity: 0.85 },
  error: { color: "#ff8fa8", paddingHorizontal: spacing.lg, marginBottom: 4 },
});
