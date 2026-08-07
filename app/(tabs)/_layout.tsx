import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { colors } from "@/lib/theme";
import { useUnreadMessages } from "@/features/messages/unread";

function TabIcon({
  label,
  focused,
  badge,
}: {
  label: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={{ width: 34, alignItems: "center", justifyContent: "center" }}>
      <Text
        style={{
          fontSize: 16,
          opacity: focused ? 1 : 0.55,
          color: focused ? "#B9ECFF" : colors.muted,
        }}
      >
        {label}
      </Text>
      {badge && badge > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: 0,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            backgroundColor: colors.action,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
            {badge > 9 ? "9+" : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const unreadMessages = useUnreadMessages((s) => s.total);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.line,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#B9ECFF",
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ focused }) => <TabIcon label="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused }) => <TabIcon label="☰" focused={focused} />,
        }}
      />
      {/* Messaging replaces the old Anchor tab. Check-in stays reachable from the
          map FAB, location screens, and the Discover header. */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="✉" focused={focused} badge={unreadMessages} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ focused }) => <TabIcon label="◍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} />,
        }}
      />

      {/* Routable, but not in the tab bar */}
      <Tabs.Screen name="drop-anchor" options={{ href: null, title: "Check in" }} />
      <Tabs.Screen name="events" options={{ href: null, title: "Events" }} />
    </Tabs>
  );
}
