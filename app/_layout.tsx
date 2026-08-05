import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { colors } from "@/lib/theme";
import { useRaftOffStore } from "@/features/map/store";
import { newSession, track } from "@/lib/analytics";

const queryClient = new QueryClient();

export default function RootLayout() {
  const expireDue = useRaftOffStore((s) => s.expireDue);

  useEffect(() => {
    newSession();
    track("map_view", { source: "app_boot" });
    expireDue();
    const id = setInterval(expireDue, 30000);
    return () => clearInterval(id);
  }, [expireDue]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="locations/[locationId]"
            options={{ title: "Location feed", presentation: "card" }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
