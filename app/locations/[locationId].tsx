import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors, spacing, vibes } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { Avatar } from "@/components/social/Avatar";
import { MiniProfileModal } from "@/components/profile/MiniProfileModal";

const TABS = ["live", "recent", "fishing", "events", "info"] as const;

export default function LocationFeedScreen() {
  const { locationId } = useLocalSearchParams<{ locationId: string }>();
  const getLocationFeed = useRaftOffStore((s) => s.getLocationFeed);
  const [tab, setTab] = useState<(typeof TABS)[number]>("live");
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);

  const feed = useMemo(() => getLocationFeed(locationId), [getLocationFeed, locationId]);
  const location = feed.location;

  if (!location) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.meta}>Location not found.</Text>
      </View>
    );
  }

  const vibe = vibes.find((v) => v.id === location.dominant_vibe);

  return (
    <>
      <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
        <Text style={styles.type}>{location.type.replace(/_/g, " ")}</Text>
        <Text style={styles.title}>{location.name}</Text>
        <Text style={styles.meta}>
          {location.active_check_ins ?? 0} active ·{" "}
          {vibe ? `${vibe.label} vibe` : "No dominant vibe"} ·{" "}
          {location.last_activity_at ? "Live now / recent" : "Quiet — still a real place"}
        </Text>
        {location.description ? <Text style={styles.meta}>{location.description}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            style={styles.primary}
            onPress={() =>
              router.push({ pathname: "/(tabs)/drop-anchor", params: { locationId: location.id } })
            }
          >
            <Text style={styles.primaryText}>Drop Anchor</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              <Text style={styles.tabText}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === "info" ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Info</Text>
            <Text style={styles.meta}>
              Verification: {location.verification_status}. Coordinates are not public until reviewed.
              Access notes, amenities, and corrections will load from Supabase once connected.
            </Text>
            {location.resident_only ? (
              <Text style={styles.warn}>Resident-only access may apply — verify before launching.</Text>
            ) : null}
          </View>
        ) : null}

        {tab === "live" || tab === "recent" || tab === "fishing" ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>
              {tab === "live" ? "Here now" : tab === "fishing" ? "Fishing reports" : "Recent"}
            </Text>
            {feed.checkIns.map((c) => (
              <Pressable
                key={c.id}
                style={styles.item}
                onPress={() => c.user_id && setOpenProfileId(c.user_id)}
              >
                <View style={styles.itemRow}>
                  <Avatar
                    uri={c.profile?.avatar_url}
                    name={c.profile?.display_name}
                    size={36}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>
                      {c.profile?.display_name ?? "Boater"} · {c.vibe}
                      {c.status === "active" ? " · live" : " · earlier"}
                    </Text>
                    {c.message ? <Text style={styles.meta}>{c.message}</Text> : null}
                  </View>
                </View>
              </Pressable>
            ))}
            {feed.posts.map((p) => (
              <View key={p.id} style={styles.item}>
                <Text style={styles.itemTitle}>{p.profile?.display_name}</Text>
                <Text style={styles.meta}>{p.text}</Text>
              </View>
            ))}
            {!feed.checkIns.length && !feed.posts.length ? (
              <Text style={styles.meta}>
                No activity in this tab yet. Place info and upcoming events still make this useful.
              </Text>
            ) : null}
          </View>
        ) : null}

        {tab === "events" ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Events</Text>
            {feed.events.length === 0 ? (
              <Text style={styles.meta}>No upcoming events at this location.</Text>
            ) : (
              feed.events.map((e) => (
                <View key={e.id} style={styles.item}>
                  <Text style={styles.itemTitle}>{e.title}</Text>
                  <Text style={styles.meta}>{new Date(e.starts_at).toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <MiniProfileModal
        visible={!!openProfileId}
        profileId={openProfileId}
        onClose={() => setOpenProfileId(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  type: { color: colors.muted, textTransform: "capitalize", fontWeight: "700", fontSize: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginVertical: 6 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  warn: { color: colors.warn, marginTop: 8 },
  actions: { flexDirection: "row", gap: 8, marginVertical: 12 },
  primary: {
    backgroundColor: colors.action,
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  primaryText: { color: "#041018", fontWeight: "800" },
  tabs: { gap: 8, marginBottom: 12 },
  tab: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSoft,
  },
  tabOn: {
    borderColor: "rgba(46,183,224,0.6)",
    backgroundColor: "rgba(46,183,224,0.15)",
  },
  tabText: { color: colors.text, fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  block: { marginTop: 8 },
  blockTitle: { color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 8 },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 10,
  },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemTitle: { color: colors.text, fontWeight: "700", marginBottom: 4 },
});
