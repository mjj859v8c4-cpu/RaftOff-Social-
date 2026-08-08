import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { useAuthStore } from "@/features/auth/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMapboxConfigured } from "@/lib/mapbox/mapHtml";
import { router } from "expo-router";
import {
  exportCommercialInsightsJson,
  getAudienceProfile,
  getConsent,
  getQueueSize,
  setConsent,
  track,
  updateAudienceProfile,
  type AudienceProfile,
} from "@/lib/analytics";
import {
  clearMyStatus,
  countConnections,
  countFollowers,
  countFollowing,
  getActiveStatus,
  listBoatsForUser,
  listMyInterests,
  listInterests,
  listProfilePhotos,
  profileCompletion,
  setMyStatus,
} from "@/features/profiles/api";
import type { Boat, Interest, Post, ProfilePhoto, UserStatus } from "@/types/raftoff";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import { listPostsByAuthor } from "@/features/posts/api";

export default function ProfileScreen() {
  const activeMineId = useRaftOffStore((s) => s.activeMineId);
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const endCheckIn = useRaftOffStore((s) => s.endCheckIn);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lakes = useRaftOffStore((s) => s.lakes);
  const authProfile = useAuthStore((s) => s.profile);
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const userId = session?.user?.id;
  const lakeName =
    lakes.find((l) => l.id === (authProfile?.home_lake_id ?? activeLakeId))?.name ?? "Lake";
  const mine = checkIns.filter((c) => c.user_id === userId);
  const active = checkIns.find((c) => c.id === activeMineId && c.status === "active");

  const [profile, setProfile] = useState<AudienceProfile>({ commercialOk: true });
  const [commercialOn, setCommercialOn] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [interestLabels, setInterestLabels] = useState<string[]>([]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [counts, setCounts] = useState({ connections: 0, followers: 0, following: 0 });
  const [completion, setCompletion] = useState({ percent: 0, missing: [] as string[] });
  const [myStatus, setMyStatusRow] = useState<UserStatus | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  useEffect(() => {
    track("profile_view");
    void refreshProfile();
    void (async () => {
      setProfile(await getAudienceProfile());
      const c = await getConsent();
      setCommercialOn(c.commercialInsights);
      setQueueSize(await getQueueSize());
    })();
  }, [refreshProfile]);

  useEffect(() => {
    if (!userId || !authProfile) return;
    void (async () => {
      try {
        const [myBoats, myInterestIds, catalog, conn, fol, fing, myPhotos, myPosts] =
          await Promise.all([
            listBoatsForUser(userId),
            listMyInterests(userId),
            listInterests(),
            countConnections(userId),
            countFollowers(userId),
            countFollowing(userId),
            listProfilePhotos(userId).catch(() => [] as ProfilePhoto[]),
            listPostsByAuthor(userId).catch(() => [] as Post[]),
          ]);
        setBoats(myBoats);
        const labels = catalog
          .filter((i: Interest) => myInterestIds.includes(i.id))
          .map((i) => i.label);
        setInterestLabels(labels);
        setPhotos(myPhotos);
        setPosts(myPosts);
        setCounts({ connections: conn, followers: fol, following: fing });
        setCompletion(
          profileCompletion(authProfile as never, {
            hasBoat: myBoats.length > 0,
            interestCount: myInterestIds.length,
            photoCount: myPhotos.length,
            connectionCount: conn,
          })
        );
      } catch {
        /* offline / pre-migration */
      }
    })();
  }, [userId, authProfile]);

  useEffect(() => {
    if (!userId) return;
    void getActiveStatus(userId)
      .then(setMyStatusRow)
      .catch(() => {
        /* offline / pre-migration */
      });
  }, [userId]);

  const patchProfile = async (patch: Partial<AudienceProfile>) => {
    await updateAudienceProfile(patch);
    setProfile(await getAudienceProfile());
  };

  const postStatus = async () => {
    const body = statusDraft.trim();
    if (!body) return;
    setStatusBusy(true);
    try {
      const row = await setMyStatus(body, { hours: 24 });
      setMyStatusRow(row);
      setStatusDraft("");
      track("status_set");
    } catch (e) {
      Alert.alert("Could not post status", e instanceof Error ? e.message : "Try again");
    } finally {
      setStatusBusy(false);
    }
  };

  const removeStatus = async () => {
    setStatusBusy(true);
    try {
      await clearMyStatus();
      setMyStatusRow(null);
    } catch (e) {
      Alert.alert("Could not clear status", e instanceof Error ? e.message : "Try again");
    } finally {
      setStatusBusy(false);
    }
  };

  const shareProfile = async () => {
    const handle = authProfile?.username;
    if (!handle) return;
    const url = `https://raftoffsocial.com/u/${handle}`;
    try {
      await Share.share({ message: `Check out my RaftOff profile: ${url}`, url });
      track("share_intent", { target: "own_profile" });
    } catch {
      /* user dismissed share sheet */
    }
  };

  const initials = (authProfile?.display_name ?? "You")
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const primaryBoat = boats.find((b) => b.is_primary) ?? boats[0];
  const tags = authProfile?.identity_tags?.length
    ? authProfile.identity_tags
    : interestLabels.slice(0, 3);

  return (
    <SafeAreaView style={styles.wrap} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      {authProfile?.cover_url ? (
        <Image source={{ uri: authProfile.cover_url }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder} />
      )}

      <View style={styles.body}>
      <View style={styles.identity}>
        {authProfile?.avatar_url ? (
          <Image source={{ uri: authProfile.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{authProfile?.display_name ?? "You"}</Text>
        <Text style={styles.user}>
          @{authProfile?.username ?? "boater"}
          {authProfile?.home_city ? ` · ${authProfile.home_city}` : ""}
        </Text>
        <ProfileBadges badges={authProfile?.badges} />
        <Text style={styles.lakeLine}>📍 {lakeName}</Text>
        {authProfile?.bio ? <Text style={styles.bio}>{authProfile.bio}</Text> : null}
        <View style={styles.chips}>
          {(tags.length ? tags : ["Add interests"]).slice(0, 4).map((t) => (
            <Text key={t} style={styles.chip}>
              {t.replace(/-/g, " ")}
            </Text>
          ))}
        </View>
        <Pressable style={styles.shareLink} onPress={() => void shareProfile()} hitSlop={8}>
          <Text style={styles.shareLinkText}>Share profile ↗</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.editBtn} onPress={() => router.push("/profile/edit" as never)}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </Pressable>
        <Pressable style={styles.msgBtn} onPress={() => router.push("/messages" as never)}>
          <Text style={styles.msgBtnText}>Messages</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <Pressable style={styles.stat} onPress={() => router.push("/connections" as never)}>
          <Text style={styles.statNum}>{counts.connections}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </Pressable>
        <Pressable
          style={styles.stat}
          onPress={() =>
            router.push({ pathname: "/connections", params: { tab: "followers" } } as never)
          }
        >
          <Text style={styles.statNum}>{counts.followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable
          style={styles.stat}
          onPress={() =>
            router.push({ pathname: "/connections", params: { tab: "following" } } as never)
          }
        >
          <Text style={styles.statNum}>{counts.following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
      </View>

      {completion.percent < 100 ? (
        <Pressable style={styles.completion} onPress={() => router.push("/profile/edit" as never)}>
          <Text style={styles.completionTitle}>
            Optional polish · {completion.percent}%
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${completion.percent}%` }]} />
          </View>
          <Text style={styles.completionHint}>
            You’re good to explore — add more whenever you want.
          </Text>
          {completion.missing.slice(0, 1).map((m) => (
            <Text key={m} style={styles.completionHint}>
              ○ {m}
            </Text>
          ))}
        </Pressable>
      ) : null}

      {primaryBoat ? (
        <View style={styles.boatCard}>
          <Text style={styles.boatKicker}>🚤 My boat</Text>
          <Text style={styles.boatName}>{primaryBoat.name ?? primaryBoat.nickname}</Text>
          <Text style={styles.meta}>
            {[primaryBoat.manufacturer ?? primaryBoat.make, primaryBoat.model, primaryBoat.boat_type]
              .filter(Boolean)
              .join(" · ") || "Watercraft"}
            {primaryBoat.home_marina ? ` · ${primaryBoat.home_marina}` : ""}
          </Text>
        </View>
      ) : (
        <Pressable style={styles.boatCard} onPress={() => router.push("/profile/edit" as never)}>
          <Text style={styles.boatKicker}>🚤 My boat</Text>
          <Text style={styles.boatName}>Add your boat</Text>
          <Text style={styles.meta}>Show people what you’re running — no registration needed.</Text>
        </Pressable>
      )}

      {interestLabels.length ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Interests</Text>
          <View style={styles.chips}>
            {interestLabels.map((label) => (
              <Text key={label} style={styles.chip}>
                {label}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      {photos.length ? (
        <>
          <Text style={styles.section}>Gallery</Text>
          <PhotoGallery photos={photos} />
        </>
      ) : null}

      <Text style={styles.section}>Posts</Text>
      {posts.length ? (
        <View style={styles.postsGrid}>
          {posts.slice(0, 9).map((p) => {
            const thumb = p.photo_urls?.[0] ?? p.photo_url;
            return thumb ? (
              <Image key={p.id} source={{ uri: thumb }} style={styles.postTile} />
            ) : (
              <View key={p.id} style={styles.postTileText}>
                <Text numberOfLines={4} style={styles.postTileTextInner}>
                  {p.text}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.hint}>
          Your posts will show up here once you share something on the map or feed.
        </Text>
      )}

      {active ? (
        <View style={styles.active}>
          <Text style={styles.activeTitle}>You’re anchored</Text>
          <Text style={styles.meta}>
            {active.location?.name} · {active.vibe}
          </Text>
          <Pressable
            style={styles.ghost}
            onPress={() => {
              endCheckIn(active.id);
              track("check_in_end", {
                location_slug: active.location?.slug,
                vibe: active.vibe,
              });
            }}
          >
            <Text style={styles.ghostText}>End check-in</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.section}>Status</Text>
      {myStatus ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusBody}>💬 {myStatus.body}</Text>
          <Text style={styles.statusMeta}>
            Visible to connections until {new Date(myStatus.expires_at).toLocaleString()}
          </Text>
          <Pressable style={styles.ghost} disabled={statusBusy} onPress={() => void removeStatus()}>
            <Text style={styles.ghostText}>{statusBusy ? "…" : "Clear status"}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={styles.hint}>
            Share what you’re up to for the next 24 hours — visible on your profile and to
            connections.
          </Text>
          <View style={styles.statusRow}>
            <TextInput
              style={styles.statusInput}
              value={statusDraft}
              onChangeText={setStatusDraft}
              maxLength={140}
              placeholder="Grilling at the sandbar…"
              placeholderTextColor={colors.muted}
            />
            <Pressable
              style={styles.statusPost}
              disabled={statusBusy || !statusDraft.trim()}
              onPress={() => void postStatus()}
            >
              <Text style={styles.statusPostText}>{statusBusy ? "…" : "Post"}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.section}>Privacy defaults</Text>
      <Row label="Public map precision" value="Place / zone" />
      <Row label="Default audience" value="Public" />
      <Row label="Default duration" value="2 hours" />
      <Row label="Background tracking" value="Off" />

      <Text style={styles.section}>Legal & safety</Text>
      <Pressable style={styles.ghost} onPress={() => router.push("/admin" as never)}>
        <Text style={styles.ghostText}>
          {authProfile?.role === "admin" || authProfile?.role === "moderator"
            ? "Open admin / moderation"
            : "Moderation tools (admins)"}
        </Text>
      </Pressable>
      <Text style={styles.hint}>
        Privacy Policy, Terms, and Community Guidelines are published at raftoffsocial.com/privacy,
        /terms, and /guidelines.
      </Text>

      <Pressable
        style={[styles.ghost, { marginTop: 12 }]}
        onPress={() => void signOut().then(() => router.replace("/(auth)/login" as never))}
      >
        <Text style={styles.ghostText}>Sign out</Text>
      </Pressable>

      {/* Analytics / commercial insights live below the social identity content, collapsed by default. */}
      <Pressable
        style={styles.analyticsToggle}
        onPress={() => setAnalyticsOpen((v) => !v)}
        hitSlop={8}
      >
        <Text style={styles.section}>
          {analyticsOpen ? "▾" : "▸"} Analytics & sponsor insights
        </Text>
      </Pressable>

      {analyticsOpen ? (
        <>
          <Text style={styles.hint}>Helps RaftOff match the vibe — and powers sponsor insights.</Text>
          <Text style={styles.label}>I have a boat</Text>
          <View style={styles.rowBtns}>
            {[true, false].map((v) => (
              <Pressable
                key={String(v)}
                style={[styles.pill, profile.hasBoat === v && styles.pillOn]}
                onPress={() => patchProfile({ hasBoat: v })}
              >
                <Text style={[styles.pillText, profile.hasBoat === v && styles.pillTextOn]}>
                  {v ? "Boat owner" : "Guest / crew"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Age range</Text>
          <View style={styles.rowBtns}>
            {(
              [
                ["18_24", "18–24"],
                ["25_34", "25–34"],
                ["35_44", "35–44"],
                ["45_plus", "45+"],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                style={[styles.pill, profile.ageBucket === id && styles.pillOn]}
                onPress={() => patchProfile({ ageBucket: id })}
              >
                <Text style={[styles.pillText, profile.ageBucket === id && styles.pillTextOn]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>How you show up</Text>
          <View style={styles.rowBtns}>
            {(
              [
                ["female", "Woman"],
                ["male", "Man"],
                ["nonbinary", "Non-binary"],
                ["unspecified", "Skip"],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                style={[styles.pill, profile.genderPresentation === id && styles.pillOn]}
                onPress={() => patchProfile({ genderPresentation: id })}
              >
                <Text
                  style={[styles.pillText, profile.genderPresentation === id && styles.pillTextOn]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {profile.hasBoat ? (
            <>
              <Text style={styles.label}>Boat size</Text>
              <View style={styles.rowBtns}>
                {(
                  [
                    ["under_20", "<20'"],
                    ["20_30", "20–30'"],
                    ["30_40", "30–40'"],
                    ["40_plus", "40'+"],
                  ] as const
                ).map(([id, label]) => (
                  <Pressable
                    key={id}
                    style={[styles.pill, profile.boatLengthFtBucket === id && styles.pillOn]}
                    onPress={() => patchProfile({ boatLengthFtBucket: id })}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        profile.boatLengthFtBucket === id && styles.pillTextOn,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Commercial insights</Text>
          <Text style={styles.hint}>
            We capture place-level activity (not your exact GPS) to sell lake insights to marinas
            and brands. Toggle anytime.
          </Text>
          <Pressable
            style={[styles.pill, commercialOn && styles.pillOn]}
            onPress={async () => {
              const next = !commercialOn;
              setCommercialOn(next);
              await setConsent({ commercialInsights: next });
              await patchProfile({ commercialOk: next });
            }}
          >
            <Text style={[styles.pillText, commercialOn && styles.pillTextOn]}>
              Commercial insights: {commercialOn ? "On" : "Off"}
            </Text>
          </Pressable>
          <Row label="Queued events" value={String(queueSize)} />
          <Pressable
            style={styles.ghost}
            onPress={async () => {
              const json = await exportCommercialInsightsJson();
              setExportPreview(json.slice(0, 1200));
              setQueueSize(await getQueueSize());
            }}
          >
            <Text style={styles.ghostText}>Preview sellable insights package</Text>
          </Pressable>
          {exportPreview ? (
            <Text style={styles.export} selectable>
              {exportPreview}
            </Text>
          ) : null}

          <Text style={styles.label}>Backend status</Text>
          <Row label="Supabase" value={isSupabaseConfigured ? "Configured" : "Local demo mode"} />
          <Row label="Mapbox" value={isMapboxConfigured ? "Configured" : "Schematic fallback"} />

          <Text style={styles.label}>Your recent check-ins</Text>
          {mine.length === 0 ? (
            <Text style={styles.meta}>No check-ins yet</Text>
          ) : (
            mine.slice(0, 8).map((c) => (
              <Row
                key={c.id}
                label={`${c.location?.name ?? "Lake"} · ${c.vibe}`}
                value={c.status === "active" ? "Active" : c.status}
              />
            ))
          )}
        </>
      ) : null}

      <Text style={styles.safety}>
        RaftOff does not replace official charts, navigation equipment, weather services, or Coast
        Guard guidance. Exact fishing GPS is never sold.
      </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 48 },
  body: { paddingHorizontal: spacing.lg },
  cover: { width: "100%", height: 130, backgroundColor: colors.bgElevated },
  coverPlaceholder: { width: "100%", height: 110, backgroundColor: "rgba(46,242,200,0.08)" },
  identity: { marginTop: -34, marginBottom: 14 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.bg,
    marginBottom: 10,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.bgElevated,
    borderWidth: 3,
    borderColor: colors.bg,
    marginBottom: 10,
  },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  user: { color: colors.muted, marginBottom: 4 },
  lakeLine: { color: colors.active, fontSize: 13, fontWeight: "600", marginBottom: 6 },
  bio: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  shareLink: { marginTop: 8, alignSelf: "flex-start" },
  shareLinkText: { color: colors.active, fontSize: 12, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  stat: { alignItems: "center" },
  statNum: { color: colors.text, fontWeight: "800", fontSize: 18 },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 2 },
  editBtn: {
    flex: 1,
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  editBtnText: { color: "#fff", fontWeight: "800" },
  msgBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.action,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  msgBtnText: { color: colors.action, fontWeight: "800" },
  completion: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  completionTitle: { color: colors.text, fontWeight: "800", fontSize: 13 },
  barTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: { height: 6, backgroundColor: colors.action },
  completionHint: { color: colors.muted, fontSize: 12 },
  boatCard: {
    borderWidth: 1,
    borderColor: "rgba(232,195,106,0.28)",
    backgroundColor: "rgba(36,28,12,0.35)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  boatKicker: {
    color: colors.food,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  boatName: { color: colors.text, fontWeight: "800", fontSize: 16 },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  kicker: {
    color: colors.food,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  postsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  postTile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  postTileText: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    padding: 8,
    justifyContent: "center",
  },
  postTileTextInner: { color: colors.muted, fontSize: 11, lineHeight: 14 },
  analyticsToggle: { marginTop: 4 },
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
  active: {
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    backgroundColor: "rgba(46,242,200,0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  activeTitle: { color: colors.text, fontWeight: "800" },
  statusCard: {
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    backgroundColor: "rgba(46,242,200,0.08)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  statusBody: { color: colors.text, fontWeight: "700", fontSize: 14 },
  statusMeta: { color: colors.muted, fontSize: 11 },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  statusInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.bgSoft,
    minHeight: 44,
  },
  statusPost: {
    backgroundColor: colors.action,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    minHeight: 44,
  },
  statusPostText: { color: "#fff", fontWeight: "800" },
  section: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 10, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  rowBtns: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillOn: {
    backgroundColor: "rgba(255,77,141,0.18)",
    borderColor: colors.action,
  },
  pillText: { color: colors.muted, fontWeight: "700", fontSize: 13 },
  pillTextOn: { color: colors.actionStrong },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  meta: { color: colors.muted, flex: 1 },
  value: { color: colors.text, fontWeight: "700" },
  ghost: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  ghostText: { color: colors.text, fontWeight: "700" },
  export: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 11,
    fontFamily: "Courier",
    lineHeight: 15,
  },
  safety: { color: colors.muted, fontSize: 12, marginTop: 20, lineHeight: 18 },
});
