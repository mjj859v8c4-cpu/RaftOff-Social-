import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { useAuthStore } from "@/features/auth/store";
import {
  getConnectionStatus,
  getMiniProfile,
  getOrCreateDm,
  listMutualConnections,
  mutualConnectionCount,
  requestConnection,
} from "@/features/profiles/api";
import type { Boat, ConnectionStatus, Profile, UserStatus } from "@/types/raftoff";
import { ProfileBadges } from "@/components/profile/ProfileBadges";
import { MutualCaptains } from "@/components/social/MutualCaptains";
import { describeDmError } from "@/features/messages/errors";

type Props = {
  visible: boolean;
  profileId: string | null;
  onClose: () => void;
};

/** Tap target from the map's Location Sheet — a quick look before opening the full profile. */
export function MiniProfileModal({ visible, profileId, onClose }: Props) {
  const me = useAuthStore((s) => s.session?.user?.id);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("none");
  const [mutuals, setMutuals] = useState<Profile[]>([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !profileId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const [mini, conn, mutualList, mCount] = await Promise.all([
          getMiniProfile(profileId),
          me ? getConnectionStatus(me, profileId) : Promise.resolve({ status: "none" as const }),
          me && me !== profileId
            ? listMutualConnections(profileId, 4).catch(() => [] as Profile[])
            : Promise.resolve([] as Profile[]),
          me && me !== profileId
            ? mutualConnectionCount(profileId).catch(() => 0)
            : Promise.resolve(0),
        ]);
        if (cancelled) return;
        setProfile(mini.profile);
        setBoat(mini.boat);
        setInterests(mini.interestLabels);
        setStatus(mini.status);
        setConnStatus(conn.status);
        setMutuals(mutualList);
        setMutualCount(mCount);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, profileId, me]);

  const close = () => {
    setProfile(null);
    setBoat(null);
    setInterests([]);
    setStatus(null);
    setConnStatus("none");
    setMutuals([]);
    setMutualCount(0);
    onClose();
  };

  const isSelf = me === profileId;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {loading ? (
            <ActivityIndicator color={colors.action} style={{ paddingVertical: 30 }} />
          ) : !profile ? (
            <Text style={styles.error}>{error ?? "Profile not found"}</Text>
          ) : (
            <>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {profile.display_name}
                    {profile.is_verified ? " ✓" : ""}
                  </Text>
                  <Text style={styles.handle}>@{profile.username}</Text>
                  <ProfileBadges badges={profile.badges} />
                </View>
              </View>

              {status ? (
                <View style={styles.statusPill}>
                  <Text style={styles.statusText}>💬 {status.body}</Text>
                </View>
              ) : null}

              {boat && profile.show_boat !== false ? (
                <View style={styles.row}>
                  <Text style={styles.kicker}>Boat</Text>
                  <Text style={styles.value}>{boat.name ?? boat.nickname}</Text>
                </View>
              ) : null}

              {interests.length ? (
                <View style={styles.chips}>
                  {interests.slice(0, 5).map((i) => (
                    <Text key={i} style={styles.chip}>
                      {i}
                    </Text>
                  ))}
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              {!isSelf && me && mutualCount > 0 ? (
                <MutualCaptains mutuals={mutuals} totalCount={mutualCount} compact />
              ) : null}

              <View style={styles.actions}>
                {!isSelf && me ? (
                  connStatus === "connected" ? (
                    <>
                      <Pressable
                        style={styles.primary}
                        disabled={busy}
                        onPress={() => {
                          setBusy(true);
                          setError(null);
                          void getOrCreateDm(profile.id)
                            .then((id) => {
                              close();
                              router.push(`/messages/${id}` as never);
                            })
                            .catch((e) => setError(describeDmError(e)))
                            .finally(() => setBusy(false));
                        }}
                      >
                        <Text style={styles.primaryText}>{busy ? "…" : "Message"}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondary}
                        onPress={() => {
                          close();
                          router.push(`/u/${profile.username}` as never);
                        }}
                      >
                        <Text style={styles.secondaryText}>View Profile</Text>
                      </Pressable>
                    </>
                  ) : connStatus === "pending_out" ? (
                    <>
                      <View style={[styles.primary, styles.primaryMuted]}>
                        <Text style={styles.primaryText}>Requested</Text>
                      </View>
                      <Pressable
                        style={styles.secondary}
                        onPress={() => {
                          close();
                          router.push(`/u/${profile.username}` as never);
                        }}
                      >
                        <Text style={styles.secondaryText}>View Profile</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable
                        style={styles.primary}
                        disabled={busy || profile.allow_connection_requests === false}
                        onPress={() => {
                          if (!me) return;
                          setBusy(true);
                          void requestConnection(me, profile.id)
                            .then(() => setConnStatus("pending_out"))
                            .catch((e) =>
                              setError(e instanceof Error ? e.message : "Could not send request")
                            )
                            .finally(() => setBusy(false));
                        }}
                      >
                        <Text style={styles.primaryText}>{busy ? "…" : "Connect"}</Text>
                      </Pressable>
                      <Pressable
                        style={styles.secondary}
                        onPress={() => {
                          close();
                          router.push(`/u/${profile.username}` as never);
                        }}
                      >
                        <Text style={styles.secondaryText}>View Profile</Text>
                      </Pressable>
                    </>
                  )
                ) : (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => {
                      close();
                      router.push(`/u/${profile.username}` as never);
                    }}
                  >
                    <Text style={styles.secondaryText}>View Profile</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0B1520",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 180,
  },
  header: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bgElevated },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.action },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  name: { color: colors.text, fontSize: 18, fontWeight: "800" },
  handle: { color: colors.muted, fontSize: 13, marginTop: 1 },
  statusPill: {
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    backgroundColor: "rgba(46,242,200,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: { color: colors.text, fontSize: 13 },
  row: { flexDirection: "row", gap: 8, alignItems: "baseline" },
  kicker: {
    color: colors.food,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: { color: colors.text, fontWeight: "700", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
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
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: colors.text, fontWeight: "800" },
  primary: {
    flex: 1,
    backgroundColor: colors.action,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryMuted: { backgroundColor: "rgba(255,61,130,0.35)" },
  primaryText: { color: "#fff", fontWeight: "800" },
  error: { color: colors.danger, textAlign: "center", paddingVertical: 10 },
});
