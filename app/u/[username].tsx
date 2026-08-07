import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import {
  countConnections,
  countFollowers,
  getProfileByUsername,
  listBoatsForUser,
  listMyInterests,
  listInterests,
  requestConnection,
} from "@/features/profiles/api";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import type { Boat, Profile } from "@/types/raftoff";
import { ReportBlockModal } from "@/components/moderation/ReportBlockModal";

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const me = useAuthStore((s) => s.session?.user?.id);
  const lakes = useRaftOffStore((s) => s.lakes);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [counts, setCounts] = useState({ connections: 0, followers: 0 });
  const [loading, setLoading] = useState(true);
  const [connectState, setConnectState] = useState<"idle" | "requested" | "error">("idle");
  const [modOpen, setModOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    void (async () => {
      setLoading(true);
      try {
        const p = await getProfileByUsername(String(username));
        setProfile(p);
        if (!p) {
          setError("Profile not found");
          return;
        }
        const [boats, interestIds, catalog, conn, fol] = await Promise.all([
          listBoatsForUser(p.id),
          listMyInterests(p.id),
          listInterests(),
          countConnections(p.id),
          countFollowers(p.id),
        ]);
        setBoat(boats.find((b) => b.is_primary) ?? boats[0] ?? null);
        setInterests(
          catalog.filter((i) => interestIds.includes(i.id)).map((i) => i.label)
        );
        setCounts({ connections: conn, followers: fol });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.action} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  const lakeName = lakes.find((l) => l.id === profile.home_lake_id)?.name ?? "Michigan lakes";
  const isSelf = me === profile.id;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      {profile.cover_url ? (
        <Image source={{ uri: profile.cover_url }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}
      <View style={styles.header}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {(profile.display_name ?? "?").slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {profile.display_name}
          {profile.is_verified ? " ✓" : ""}
        </Text>
        <Text style={styles.handle}>@{profile.username}</Text>
        <Text style={styles.lake}>📍 {lakeName}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <Text style={styles.stats}>
          {counts.connections} Connections · {counts.followers} Followers
        </Text>
      </View>

      {!isSelf && me ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.connect}
            disabled={connectState === "requested"}
            onPress={() => {
              void requestConnection(me, profile.id)
                .then(() => setConnectState("requested"))
                .catch(() => setConnectState("error"));
            }}
          >
            <Text style={styles.connectText}>
              {connectState === "requested" ? "Requested" : "Connect"}
            </Text>
          </Pressable>
          <Pressable style={styles.more} onPress={() => setModOpen(true)}>
            <Text style={styles.moreText}>•••</Text>
          </Pressable>
        </View>
      ) : null}

      {boat && profile.show_boat !== false ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>My boat</Text>
          <Text style={styles.cardTitle}>{boat.name ?? boat.nickname}</Text>
          <Text style={styles.meta}>
            {[boat.manufacturer ?? boat.make, boat.model, boat.boat_type].filter(Boolean).join(" · ")}
          </Text>
        </View>
      ) : null}

      {interests.length ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Interests</Text>
          <View style={styles.chips}>
            {interests.map((i) => (
              <Text key={i} style={styles.chip}>
                {i}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {(profile.identity_tags ?? []).length ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Water life</Text>
          <View style={styles.chips}>
            {profile.identity_tags!.map((t) => (
              <Text key={t} style={styles.chip}>
                {t.replace(/-/g, " ")}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <Text style={styles.share}>
        Share: raftoffsocial.com/u/{profile.username}
      </Text>

      <ReportBlockModal
        visible={modOpen}
        onClose={() => setModOpen(false)}
        targetUserId={profile.id}
        targetType="user"
        targetId={profile.id}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 48 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  error: { color: colors.danger },
  cover: { width: "100%", height: 140 },
  coverPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "rgba(46,242,200,0.08)",
  },
  header: { padding: spacing.lg, marginTop: -28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.bg,
    marginBottom: 10,
  },
  avatarFallback: {
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  name: { color: colors.text, fontSize: 24, fontWeight: "800" },
  handle: { color: colors.muted, marginTop: 2 },
  lake: { color: colors.active, marginTop: 8, fontWeight: "600" },
  bio: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  stats: { color: colors.text, marginTop: 12, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: spacing.lg, marginBottom: 12 },
  connect: {
    flex: 1,
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectText: { color: "#fff", fontWeight: "800" },
  more: {
    width: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: { color: colors.text, fontWeight: "800" },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  kicker: {
    color: colors.food,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cardTitle: { color: colors.text, fontWeight: "800", fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    color: colors.active,
    fontSize: 11,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  share: { color: colors.muted, fontSize: 12, padding: spacing.lg },
});
