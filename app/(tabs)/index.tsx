import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useConversationsStore } from "@/store/useConversationsStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { ConversationListItem } from "@/components/ConversationListItem";
import { EmptyState } from "@/components/EmptyState";
import type { ConversationIndexEntry } from "@/lib/types";

export default function ChatsScreen() {
  const router = useRouter();
  const conversations = useConversationsStore((s) => s.conversations);
  const openConversation = useActiveConversationStore((s) => s.open);

  function handleOpenConversation(conv: ConversationIndexEntry) {
    openConversation(conv.conversationId, conv.conversationKey);
    router.push(`/conversation/${conv.conversationId}`);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Chats
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/new-conversation")}
          className="w-9 h-9 bg-indigo-600 rounded-full items-center justify-center"
          activeOpacity={0.8}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Start a new chat by tapping the + button, or join one via an invite link."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={({ item }) => (
            <ConversationListItem
              conversation={item}
              onPress={() => handleOpenConversation(item)}
            />
          )}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
          )}
        />
      )}
    </SafeAreaView>
  );
}
