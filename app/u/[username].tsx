import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import {
  acceptConnection,
  countConnections,
  countFollowers,
  countFollowing,
  followProfile,
  getActiveStatus,
  getConnectionStatus,
  getOrCreateDm,
  getProfileByUsername,
  getPublicActiveCheckIn,
  isFollowing as checkIsFollowing,
  listBoatsForUser,
  listMyInterests,
  listInterests,
  listProfilePhotos,
  requestConnection,
  unfollowProfile,
} from "@/features/profiles/api";
import { useAuthStore } from "@/features/auth/store";
import { useRaftOffStore } from "@/features/map/store";
import type { Boat, ConnectionStatus, Post, Profile, ProfilePhoto, UserStatus } from "@/types/raftoff";
import { ReportBlockModal } from "@/components/moderation/ReportBlockModal";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import { ProfileQrModal } from "@/components/profile/ProfileQrModal";
import { RecentPosts } from "@/components/profile/RecentPosts";
import { listPostsByAuthor } from "@/features/posts/api";
import { describeDmError } from "@/features/messages/errors";
import { track } from "@/lib/analytics";
import { SafetyBanner } from "@/components/safety/SafetyBanner";

function memberSince(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const me = useAuthStore((s) => s.session?.user?.id);
  const lakes = useRaftOffStore((s) => s.lakes);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeStatus, setActiveStatus] = useState<UserStatus | null>(null);
  const [onWater, setOnWater] = useState<{
    location_id: string;
    location_name: string | null;
    vibe: string | null;
  } | null>(null);
  const [counts, setCounts] = useState({ connections: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("none");
  const [requestId, setRequestId] = useState<string | undefined>();
  const [actionBusy, setActionBusy] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [modOpen, setModOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
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
        const [
          boats,
          interestIds,
          catalog,
          conn,
          fol,
          followingCount,
          connectionStatus,
          iFollow,
          galleryPhotos,
          personStatus,
          activeCheckIn,
          recentPosts,
        ] = await Promise.all([
          listBoatsForUser(p.id),
          listMyInterests(p.id),
          listInterests(),
          countConnections(p.id),
          countFollowers(p.id),
          countFollowing(p.id),
          me ? getConnectionStatus(me, p.id) : Promise.resolve({ status: "none" as const }),
          me && me !== p.id ? checkIsFollowing(me, p.id).catch(() => false) : Promise.resolve(false),
          listProfilePhotos(p.id).catch(() => [] as ProfilePhoto[]),
          getActiveStatus(p.id).catch(() => null),
          getPublicActiveCheckIn(p.id).catch(() => null),
          listPostsByAuthor(p.id).catch(() => [] as Post[]),
        ]);
        setBoat(boats.find((b) => b.is_primary) ?? boats[0] ?? null);
        setInterests(
          catalog.filter((i) => interestIds.includes(i.id)).map((i) => i.label)
        );
        setPhotos(galleryPhotos);
        setPosts(recentPosts);
        setCounts({ connections: conn, followers: fol, following: followingCount });
        setConnStatus(connectionStatus.status);
        setRequestId("requestId" in connectionStatus ? connectionStatus.requestId : undefined);
        setFollowing(iFollow);
        setActiveStatus(personStatus);
        setOnWater(activeCheckIn);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [username, me]);

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

  const openSocialList = (tab: "connections" | "followers" | "following") => {
    router.push({
      pathname: "/connections",
      params: {
        tab,
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
      },
    } as never);
  };

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
        <ProfileBadges badges={profile.badges} />
        <Text style={styles.lake}>📍 {lakeName}</Text>
        {onWater ? (
          <Pressable
            style={styles.onWaterPill}
            onPress={() => router.push(`/locations/${onWater.location_id}` as never)}
          >
            <View style={styles.onWaterDot} />
            <Text style={styles.onWaterPillText}>
              On the water{onWater.location_name ? ` · ${onWater.location_name}` : ""}
              {onWater.vibe ? ` · ${onWater.vibe}` : ""}
            </Text>
          </Pressable>
        ) : null}
        {activeStatus ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>💬 {activeStatus.body}</Text>
          </View>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {!isSelf ? (
          <View style={styles.safety}>
            <SafetyBanner variant="profile" />
          </View>
        ) : null}
      </View>

      {!isSelf && me ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.followBtn, following && styles.followBtnOn]}
            disabled={followBusy}
            onPress={() => {
              setFollowBusy(true);
              const next = !following;
              void (next ? followProfile(profile.id) : unfollowProfile(profile.id))
                .then(() => {
                  setFollowing(next);
                  setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
                })
                .catch(() => setError(next ? "Could not follow" : "Could not unfollow"))
                .finally(() => setFollowBusy(false));
            }}
          >
            <Text style={[styles.followBtnText, following && styles.followBtnTextOn]}>
              {followBusy ? "…" : following ? "Following" : "Follow"}
            </Text>
          </Pressable>
          {connStatus === "connected" ? (
            <Pressable
              style={styles.connect}
              disabled={actionBusy}
              onPress={() => {
                setActionBusy(true);
                setError(null);
                void getOrCreateDm(profile.id)
                  .then((id) => router.push(`/messages/${id}` as never))
                  .catch((e) => setError(describeDmError(e)))
                  .finally(() => setActionBusy(false));
              }}
            >
              <Text style={styles.connectText}>{actionBusy ? "…" : "Message"}</Text>
            </Pressable>
          ) : connStatus === "pending_out" ? (
            <View style={[styles.connect, styles.connectMuted]}>
              <Text style={styles.connectText}>Requested</Text>
            </View>
          ) : connStatus === "pending_in" && requestId ? (
            <Pressable
              style={styles.connect}
              disabled={actionBusy}
              onPress={() => {
                setActionBusy(true);
                void acceptConnection(requestId)
                  .then(() => {
                    setConnStatus("connected");
                    setRequestId(undefined);
                  })
                  .catch(() => setError("Could not accept"))
                  .finally(() => setActionBusy(false));
              }}
            >
              <Text style={styles.connectText}>{actionBusy ? "…" : "Accept"}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.connect}
              disabled={actionBusy || profile.allow_connection_requests === false}
              onPress={() => {
                setActionBusy(true);
                void requestConnection(me, profile.id)
                  .then(() => setConnStatus("pending_out"))
                  .catch(() => setError("Could not send request"))
                  .finally(() => setActionBusy(false));
              }}
            >
              <Text style={styles.connectText}>{actionBusy ? "…" : "Connect"}</Text>
            </Pressable>
          )}
          <Pressable style={styles.more} onPress={() => setModOpen(true)}>
            <Text style={styles.moreText}>•••</Text>
          </Pressable>
        </View>
      ) : null}
      {isSelf ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.connect}
            onPress={() => router.push("/profile/edit" as never)}
          >
            <Text style={styles.connectText}>Edit Profile</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.statsWrap}>
        <View style={styles.statsRow}>
          <Pressable style={styles.statPress} onPress={() => openSocialList("connections")}>
            <Text style={styles.statsText}>
              <Text style={styles.statsNum}>{counts.connections}</Text> Connections
            </Text>
          </Pressable>
          <Pressable style={styles.statPress} onPress={() => openSocialList("followers")}>
            <Text style={styles.statsText}>
              <Text style={styles.statsNum}>{counts.followers}</Text> Followers
            </Text>
          </Pressable>
          <Pressable style={styles.statPress} onPress={() => openSocialList("following")}>
            <Text style={styles.statsText}>
              <Text style={styles.statsNum}>{counts.following}</Text> Following
            </Text>
          </Pressable>
        </View>
        {memberSince(profile.created_at) ? (
          <Text style={styles.memberSince}>Member since {memberSince(profile.created_at)}</Text>
        ) : null}
      </View>

      {error && profile ? <Text style={styles.inlineError}>{error}</Text> : null}

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

      {photos.length ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Gallery</Text>
          <PhotoGallery photos={photos} />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.kicker}>Recent posts</Text>
        {posts.length ? (
          <RecentPosts posts={posts} />
        ) : (
          <Text style={styles.meta}>No posts yet — check back after they drop anchor or share.</Text>
        )}
      </View>

      <View style={styles.shareActions}>
        <Pressable
          style={styles.shareRow}
          onPress={() => {
            const url = `https://raftoffsocial.com/u/${profile.username}`;
            track("share_intent", { target: "public_profile" });
            void Share.share({ message: `Check out ${profile.display_name} on RaftOff: ${url}`, url });
          }}
        >
          <Text style={styles.share}>Share profile · raftoffsocial.com/u/{profile.username} ↗</Text>
        </Pressable>
        <Pressable style={styles.qrRow} onPress={() => setQrOpen(true)}>
          <Text style={styles.share}>Show QR code ▦</Text>
        </Pressable>
      </View>

      <ReportBlockModal
        visible={modOpen}
        onClose={() => setModOpen(false)}
        targetUserId={profile.id}
        targetType="user"
        targetId={profile.id}
      />
      <ProfileQrModal
        visible={qrOpen}
        username={profile.username}
        displayName={profile.display_name}
        onClose={() => setQrOpen(false)}
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
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    backgroundColor: "rgba(46,242,200,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  onWaterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(110,200,255,0.4)",
    backgroundColor: "rgba(110,200,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  onWaterDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.chill,
  },
  onWaterPillText: { color: colors.chill, fontSize: 13, fontWeight: "700" },
  bio: { color: colors.muted, marginTop: 10, lineHeight: 20 },
  safety: { marginTop: 10 },
  statsWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  statPress: { paddingVertical: 2 },
  statsText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  statsNum: { color: colors.text, fontWeight: "800" },
  memberSince: { color: colors.muted, fontSize: 12, marginTop: 8 },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: spacing.lg, marginBottom: 12 },
  connect: {
    flex: 1,
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectMuted: { backgroundColor: "rgba(255,61,130,0.35)" },
  connectText: { color: "#fff", fontWeight: "800" },
  followBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  followBtnOn: { borderColor: "rgba(46,242,200,0.4)", backgroundColor: "rgba(46,242,200,0.1)" },
  followBtnText: { color: colors.text, fontWeight: "800" },
  followBtnTextOn: { color: colors.active },
  inlineError: { color: colors.danger, paddingHorizontal: spacing.lg, marginBottom: 8 },
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
  shareActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  shareRow: { paddingVertical: spacing.xs },
  qrRow: { paddingVertical: spacing.xs },
  share: { color: colors.active, fontSize: 12, fontWeight: "700" },
});
