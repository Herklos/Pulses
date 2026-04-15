import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";
import { Avatar } from "./Avatar";
import type { ConversationIndexEntry } from "@/lib/types";
import { formatTime } from "@/lib/date";

interface Props {
  conversation: ConversationIndexEntry;
  unreadCount?: number;
  onPress(): void;
}

export function ConversationListItem({ conversation, unreadCount = 0, onPress }: Props) {
  const timeStr = formatTime(conversation.lastMessageAt);
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 bg-white dark:bg-gray-950 gap-3"
      activeOpacity={0.7}
    >
      <Avatar name={conversation.name} size={48} />

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text
            className={`flex-1 text-base text-gray-900 dark:text-white ${hasUnread ? "font-bold" : "font-semibold"}`}
            numberOfLines={1}
          >
            {conversation.name}
          </Text>
          {conversation.isGroup && (
            <Users size={14} color="#9ca3af" />
          )}
          <Text className={`text-xs ${hasUnread ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-400 dark:text-gray-500"}`}>
            {timeStr}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {conversation.lastMessagePreview ? (
            <Text
              className={`flex-1 text-sm ${hasUnread ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"}`}
              numberOfLines={1}
            >
              {conversation.lastMessagePreview}
            </Text>
          ) : (
            <Text className="flex-1 text-sm italic text-indigo-400 dark:text-indigo-500">
              No messages yet
            </Text>
          )}
          {hasUnread && (
            <View className="min-w-[20px] h-5 bg-indigo-600 rounded-full items-center justify-center px-1.5">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 99 ? "99+" : String(unreadCount)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
