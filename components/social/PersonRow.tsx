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
};

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
});
