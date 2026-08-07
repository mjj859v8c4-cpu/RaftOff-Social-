import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/lib/theme";
import {
  acceptConnection,
  cancelConnectionRequest,
  requestConnection,
} from "@/features/profiles/api";
import type { ConnectionStatus } from "@/types/raftoff";

/**
 * Connect / Requested / Accept / Connected button used across Discover,
 * Connections, and profile screens. Status is controlled by the parent so
 * lists can batch-fetch statuses once instead of one query per row.
 */
export function ConnectButton({
  meId,
  targetId,
  status,
  requestId,
  onChange,
  compact = false,
}: {
  meId: string;
  targetId: string;
  status: ConnectionStatus;
  requestId?: string;
  onChange: (next: { status: ConnectionStatus; requestId?: string }) => void;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (status === "self") return null;

  const run = async (fn: () => Promise<void>, next: { status: ConnectionStatus; requestId?: string }) => {
    setBusy(true);
    setError(false);
    try {
      await fn();
      onChange(next);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (status === "connected") {
    return (
      <Pressable style={[styles.btn, styles.connected, compact && styles.compact]} disabled>
        <Text style={[styles.text, styles.connectedText]}>{error ? "!" : "Connected"}</Text>
      </Pressable>
    );
  }

  if (status === "pending_in" && requestId) {
    return (
      <Pressable
        style={[styles.btn, compact && styles.compact]}
        disabled={busy}
        onPress={() => void run(() => acceptConnection(requestId), { status: "connected" })}
      >
        {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.text}>Accept</Text>}
      </Pressable>
    );
  }

  if (status === "pending_out") {
    return (
      <Pressable
        style={[styles.btn, styles.pending, compact && styles.compact]}
        disabled={busy}
        onPress={() =>
          requestId
            ? void run(() => cancelConnectionRequest(requestId, meId), { status: "none" })
            : undefined
        }
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.muted} />
        ) : (
          <Text style={[styles.text, styles.pendingText]}>Requested</Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.btn, compact && styles.compact]}
      disabled={busy}
      onPress={() => void run(() => requestConnection(meId, targetId), { status: "pending_out" })}
    >
      {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.text}>Connect</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.action,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 92,
  },
  compact: { paddingHorizontal: 12, paddingVertical: 7, minWidth: 76 },
  pending: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line },
  connected: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(46,242,200,0.4)" },
  text: { color: "#fff", fontWeight: "800", fontSize: 12.5 },
  pendingText: { color: colors.muted },
  connectedText: { color: colors.active },
});
