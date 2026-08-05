import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { getLakeById } from "@/supabase/seed/michigan-lakes";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isMapboxConfigured } from "@/lib/mapbox/mapHtml";
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

export default function ProfileScreen() {
  const activeMineId = useRaftOffStore((s) => s.activeMineId);
  const checkIns = useRaftOffStore((s) => s.checkIns);
  const endCheckIn = useRaftOffStore((s) => s.endCheckIn);
  const activeLakeId = useRaftOffStore((s) => s.activeLakeId);
  const lake = getLakeById(activeLakeId);
  const mine = checkIns.filter((c) => c.user_id === "demo-user");
  const active = checkIns.find((c) => c.id === activeMineId && c.status === "active");

  const [profile, setProfile] = useState<AudienceProfile>({ commercialOk: true });
  const [commercialOn, setCommercialOn] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  useEffect(() => {
    track("profile_view");
    void (async () => {
      setProfile(await getAudienceProfile());
      const c = await getConsent();
      setCommercialOn(c.commercialInsights);
      setQueueSize(await getQueueSize());
    })();
  }, []);

  const patchProfile = async (patch: Partial<AudienceProfile>) => {
    await updateAudienceProfile(patch);
    setProfile(await getAudienceProfile());
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>YO</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>You</Text>
          <Text style={styles.user}>@raftoff_you · {lake.name}</Text>
          <View style={styles.chips}>
            <Text style={styles.chip}>Sandbar</Text>
            <Text style={styles.chip}>Raft-ups</Text>
            <Text style={styles.chip}>Nights out</Text>
          </View>
        </View>
      </View>

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

      <Text style={styles.section}>Your scene</Text>
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

      <Text style={styles.section}>Privacy defaults</Text>
      <Row label="Public map precision" value="Place / zone" />
      <Row label="Default audience" value="Public" />
      <Row label="Default duration" value="2 hours" />
      <Row label="Background tracking" value="Off" />

      <Text style={styles.section}>Insights & sponsors</Text>
      <Text style={styles.hint}>
        We capture place-level activity (not your exact GPS) to sell lake insights to marinas and
        brands. Toggle anytime.
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

      <Text style={styles.section}>Backend status</Text>
      <Row label="Supabase" value={isSupabaseConfigured ? "Configured" : "Local demo mode"} />
      <Row label="Mapbox" value={isMapboxConfigured ? "Configured" : "Schematic fallback"} />

      <Text style={styles.section}>Your recent check-ins</Text>
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

      <Text style={styles.safety}>
        RaftOff does not replace official charts, navigation equipment, weather services, or Coast
        Guard guidance. Exact fishing GPS is never sold.
      </Text>
    </ScrollView>
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
  content: { padding: spacing.lg, paddingBottom: 48 },
  header: { flexDirection: "row", gap: 12, marginBottom: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.action,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800" },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  user: { color: colors.muted, marginBottom: 6 },
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
