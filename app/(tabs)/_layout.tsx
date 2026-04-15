import React from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { MessageCircle, User } from "lucide-react-native";
import { useConversationsStore } from "@/store/useConversationsStore";

function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#6366f1",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
      }}
    >
      <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>
        {count > 99 ? "99+" : String(count)}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const unreadCounts = useConversationsStore((s) => s.unreadCounts);
  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopColor: "#e5e7eb",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <View>
              <MessageCircle size={size} color={color} />
              <UnreadBadge count={totalUnread} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
