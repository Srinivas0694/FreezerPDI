// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, F } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: F.sb, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Scan", tabBarIcon: ({ color, size }) => <Ionicons name="qr-code-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: "Live", tabBarIcon: ({ color, size }) => <Ionicons name="pulse-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "History", tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="admin"
        options={{ title: "Labels", tabBarIcon: ({ color, size }) => <Ionicons name="pricetags-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
