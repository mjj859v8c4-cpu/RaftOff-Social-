import { useEffect, useState } from "react";
import * as Network from "expo-network";
import { AppState } from "react-native";
import { logger } from "@/lib/logging";

export type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
};

const listeners = new Set<(status: NetworkStatus) => void>();
let current: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  type: null,
};

async function refresh() {
  try {
    const state = await Network.getNetworkStateAsync();
    current = {
      isConnected: Boolean(state.isConnected),
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? null,
    };
    listeners.forEach((l) => l(current));
  } catch (e) {
    logger.warn("network.refresh", e);
  }
}

let started = false;
function ensureStarted() {
  if (started) return;
  started = true;
  refresh();
  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") refresh();
  });
  const id = setInterval(refresh, 15000);
  // keep process alive references
  void sub;
  void id;
}

export function getNetworkStatus() {
  ensureStarted();
  return current;
}

export function useNetworkStatus() {
  ensureStarted();
  const [status, setStatus] = useState(current);
  useEffect(() => {
    listeners.add(setStatus);
    refresh();
    return () => {
      listeners.delete(setStatus);
    };
  }, []);
  return status;
}

export function assertOnline() {
  if (!current.isConnected) {
    throw new Error("You’re offline. Reconnect to sync with the lake.");
  }
}
