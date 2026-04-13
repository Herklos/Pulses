import React from "react";
import { View, Text } from "react-native";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/date";

interface Props {
  message: Message;
  isSelf: boolean;
  showSenderName: boolean; // true in group chats for messages from others
}

export function MessageBubble({ message, isSelf, showSenderName }: Props) {
  if (message.deleted) {
    return (
      <View
        className={`flex-row mb-1 px-4 ${isSelf ? "justify-end" : "justify-start"}`}
      >
        <Text className="text-xs italic text-gray-400 dark:text-gray-600">
          Message deleted
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`flex-row mb-1 px-4 ${isSelf ? "justify-end" : "justify-start"}`}
    >
      <View
        style={{ maxWidth: "75%" }}
        className={`rounded-2xl px-3.5 py-2.5 gap-1 ${
          isSelf
            ? "bg-indigo-600 rounded-tr-sm"
            : "bg-gray-100 dark:bg-gray-800 rounded-tl-sm"
        }`}
      >
        {showSenderName && !isSelf && (
          <Text className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">
            {message.senderName}
          </Text>
        )}
        <Text
          className={`text-sm leading-relaxed ${
            isSelf ? "text-white" : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {message.text}
        </Text>
        <Text
          className={`text-xs self-end ${
            isSelf ? "text-indigo-200" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {formatTime(message.timestamp)}
          {message.editedAt ? " · edited" : ""}
        </Text>
      </View>
    </View>
  );
}
