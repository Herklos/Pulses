import React, { useRef, useEffect } from "react";
import { FlatList, View, Text, RefreshControl } from "react-native";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/lib/types";
import { formatDateKey, getTodayDateKey } from "@/lib/date";

interface Props {
  messages: Message[];
  selfUserId: string;
  isGroup: boolean;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onRefresh?: () => Promise<void>;
}

interface ListItem {
  type: "dateSeparator" | "message";
  dateKey?: string;
  message?: Message;
  key: string;
}

function buildListItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDateKey = "";
  const today = getTodayDateKey();
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));

  for (const msg of messages) {
    const dateKey = msg.timestamp.slice(0, 10);
    if (dateKey !== lastDateKey) {
      lastDateKey = dateKey;
      let label: string;
      if (dateKey === today) {
        label = "Today";
      } else if (dateKey === yesterday) {
        label = "Yesterday";
      } else {
        label = new Date(dateKey + "T12:00:00").toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
        });
      }
      items.push({ type: "dateSeparator", dateKey: label, key: `sep-${dateKey}` });
    }
    items.push({ type: "message", message: msg, key: msg.id });
  }

  return items;
}

export function MessageList({
  messages,
  selfUserId,
  isGroup,
  onEditMessage,
  onDeleteMessage,
  onRefresh,
}: Props) {
  const flatListRef = useRef<FlatList>(null);
  const items = buildListItems(messages);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sm text-gray-400 dark:text-gray-600">
          No messages yet. Say hello!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={items}
      keyExtractor={(item) => item.key}
      className="flex-1"
      contentContainerClassName="py-4"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        ) : undefined
      }
      renderItem={({ item }) => {
        if (item.type === "dateSeparator") {
          return (
            <View className="flex-row items-center px-6 my-4 gap-3">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {item.dateKey}
              </Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>
          );
        }

        const msg = item.message!;
        const isSelf = msg.senderId === selfUserId;
        return (
          <MessageBubble
            message={msg}
            isSelf={isSelf}
            showSenderName={isGroup && !isSelf}
            onEdit={isSelf && onEditMessage ? (newText) => onEditMessage(msg.id, newText) : undefined}
            onDelete={isSelf && onDeleteMessage ? () => onDeleteMessage(msg.id) : undefined}
          />
        );
      }}
    />
  );
}
