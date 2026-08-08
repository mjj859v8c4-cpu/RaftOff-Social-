import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@/lib/theme";
import { Avatar } from "./Avatar";
import { ConnectButton } from "./ConnectButton";
import type { ConnectionStatus } from "@/types/raftoff";

export type PersonRowData = {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  subtitle?: string | null;
  /** Home lake name, when known — surfaced as a small chip. */
  lakeName?: string | null;
  /** Primary boat nickname/name, when known — surfaced as a small chip. */
  boatLabel?: string | null;
  /** Shared/known interest labels — surfaced as chips (first couple shown). */
  interestLabels?: string[];
  /** Mutual connection count, when known (§29 suggested-connections scoring). */
  mutualCount?: number;
};

/** Small pills for lake / boat / interests / mutual count — shared by row + card. */
function InfoChips({
  person,
  compact,
}: {
  person: PersonRowData;
  compact?: boolean;
}) {
  const items: { key: string; label: string }[] = [];
  if (person.lakeName) items.push({ key: "lake", label: `📍 ${person.lakeName}` });
  if (person.boatLabel) items.push({ key: "boat", label: `🚤 ${person.boatLabel}` });
  for (const interest of (person.interestLabels ?? []).slice(0, compact ? 1 : 2)) {
    items.push({ key: `interest-${interest}`, label: interest });
  }
  const shown = items.slice(0, compact ? 2 : 3);
  const hasMutual = !!person.mutualCount && person.mutualCount > 0;

  if (!shown.length && !hasMutual) return null;

  return (
    <View style={[styles.chipRow, compact && styles.chipRowCompact]}>
      {shown.map((item) => (
        <Text key={item.key} style={styles.infoChip} numberOfLines={1}>
          {item.label}
        </Text>
      ))}
      {hasMutual ? (
        <Text style={styles.mutualChip}>
          {person.mutualCount} mutual{person.mutualCount === 1 ? "" : "s"}
        </Text>
      ) : null}
    </View>
  );
}

/** Full-width row used in vertical discovery/section lists. */
export function PersonRow({
  person,
  meId,
  status,
  requestId,
  onStatusChange,
}: {
  person: PersonRowData;
  meId?: string | null;
  status: ConnectionStatus;
  requestId?: string;
  onStatusChange: (next: { status: ConnectionStatus; requestId?: string }) => void;
}) {
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/u/${person.username}` as never)}>
      <Avatar uri={person.avatar_url} name={person.display_name} size={46} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {person.display_name}
          {person.is_verified ? " ✓" : ""}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {person.subtitle ?? `@${person.username}`}
        </Text>
        <InfoChips person={person} />
      </View>
      {meId ? (
        <ConnectButton
          meId={meId}
          targetId={person.id}
          status={status}
          requestId={requestId}
          onChange={onStatusChange}
          compact
        />
      ) : null}
    </Pressable>
  );
}

/** Narrow card used in horizontal-scrolling section carousels. */
export function PersonCard({
  person,
  meId,
  status,
  requestId,
  onStatusChange,
}: {
  person: PersonRowData;
  meId?: string | null;
  status: ConnectionStatus;
  requestId?: string;
  onStatusChange: (next: { status: ConnectionStatus; requestId?: string }) => void;
}) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/u/${person.username}` as never)}>
      <Avatar uri={person.avatar_url} name={person.display_name} size={56} />
      <Text style={styles.cardName} numberOfLines={1}>
        {person.display_name}
        {person.is_verified ? " ✓" : ""}
      </Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>
        {person.subtitle ?? `@${person.username}`}
      </Text>
      <InfoChips person={person} compact />
      {meId ? (
        <ConnectButton
          meId={meId}
          targetId={person.id}
          status={status}
          requestId={requestId}
          onChange={onStatusChange}
          compact
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  info: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontWeight: "800", fontSize: 14.5 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  card: {
    width: 132,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: "center",
    gap: 6,
  },
  cardName: { color: colors.text, fontWeight: "800", fontSize: 13, textAlign: "center" },
  cardSubtitle: { color: colors.muted, fontSize: 11, textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 5 },
  chipRowCompact: { justifyContent: "center" },
  infoChip: {
    color: colors.muted,
    fontSize: 10.5,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
    maxWidth: 130,
  },
  mutualChip: {
    color: colors.active,
    fontSize: 10.5,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "rgba(46,242,200,0.35)",
    backgroundColor: "rgba(46,242,200,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
});
