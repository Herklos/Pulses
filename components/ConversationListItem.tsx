import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";
import { Avatar } from "./Avatar";
import type { ConversationIndexEntry } from "@/lib/types";
import { formatTime } from "@/lib/date";

interface Props {
  conversation: ConversationIndexEntry;
  onPress(): void;
}

export function ConversationListItem({ conversation, onPress }: Props) {
  const timeStr = formatTime(conversation.lastMessageAt);

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
            className="flex-1 font-semibold text-base text-gray-900 dark:text-white"
            numberOfLines={1}
          >
            {conversation.name}
          </Text>
          {conversation.isGroup && (
            <Users size={14} color="#9ca3af" />
          )}
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            {timeStr}
          </Text>
        </View>
        {conversation.lastMessagePreview ? (
          <Text
            className="text-sm text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {conversation.lastMessagePreview}
          </Text>
        ) : (
          <Text className="text-sm text-indigo-400 dark:text-indigo-500 italic">
            No messages yet
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
