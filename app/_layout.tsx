import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { useAuthStore } from "@/features/auth/store";
import { newSession, track } from "@/lib/analytics";
import { initCrashReporting, setUserContext } from "@/lib/crashReporting";
import { OfflineBanner, LoadingState, ErrorState } from "@/components/ui/States";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { logger } from "@/lib/logging";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const ready = useAuthStore((s) => s.ready);
  const session = useAuthStore((s) => s.session);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const profile = useAuthStore((s) => s.profile);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setUserContext(
      profile
        ? { id: profile.id, email: profile.email, username: profile.username }
        : null
    );
  }, [profile]);

  useEffect(() => {
    if (!ready) return;
    const root = String(segments[0] ?? "");
    const inAuthGroup = root.includes("auth");
    if (!session && !inAuthGroup && isSupabaseConfigured) {
      router.replace("/(auth)/login" as never);
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/map" as never);
    }
  }, [ready, session, segments, router]);

  if (!ready) return <LoadingState label="Starting RaftOff…" />;
  return <>{children}</>;
}

export default function RootLayout() {
  const hydrate = useRaftOffStore((s) => s.hydrate);
  const status = useRaftOffStore((s) => s.status);
  const error = useRaftOffStore((s) => s.error);
  const refreshLake = useRaftOffStore((s) => s.refreshLake);

  useEffect(() => {
    initCrashReporting();
    newSession();
    track("map_view", { source: "app_boot" });
    void hydrate().catch((e) => logger.error("hydrate", e));
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGate>
          <ErrorBoundary>
          <View style={styles.root}>
            <OfflineBanner />
            {status === "error" && error ? (
              <ErrorState message={error} onRetry={() => void refreshLake()} />
            ) : null}
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen
                name="locations/[locationId]"
                options={{ title: "Location feed", presentation: "card" }}
              />
              <Stack.Screen
                name="profile/edit"
                options={{ headerShown: false, presentation: "modal" }}
              />
              <Stack.Screen
                name="u/[username]"
                options={{ title: "Profile", presentation: "card" }}
              />
              <Stack.Screen name="admin/index" options={{ title: "Admin" }} />
            </Stack>
          </View>
          </ErrorBoundary>
        </AuthGate>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
