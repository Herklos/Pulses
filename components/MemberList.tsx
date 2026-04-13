import React from "react";
import { View, Text, FlatList } from "react-native";
import { Shield, User } from "lucide-react-native";
import { Avatar } from "./Avatar";
import type { ConversationMember } from "@/lib/types";

interface Props {
  members: ConversationMember[];
  selfUserId: string;
}

export function MemberList({ members, selfUserId }: Props) {
  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.userId}
      renderItem={({ item }) => (
        <View className="flex-row items-center px-4 py-3 gap-3">
          <Avatar name={item.displayName} size={40} />
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-medium text-gray-900 dark:text-white">
                {item.displayName}
              </Text>
              {item.userId === selfUserId && (
                <Text className="text-xs text-indigo-500">(you)</Text>
              )}
            </View>
            <Text className="text-xs text-gray-400 dark:text-gray-500">
              Joined{" "}
              {new Date(item.joinedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          {item.role === "admin" ? (
            <View className="flex-row items-center gap-1 bg-indigo-50 dark:bg-indigo-950 rounded-full px-2 py-0.5">
              <Shield size={11} color="#6366f1" />
              <Text className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Admin
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
              <User size={11} color="#9ca3af" />
              <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Member
              </Text>
            </View>
          )}
        </View>
      )}
      ItemSeparatorComponent={() => (
        <View className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
      )}
    />
  );
}
