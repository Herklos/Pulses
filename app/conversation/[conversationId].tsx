import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Users } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationsStore } from "@/store/useConversationsStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { useMessagesStore } from "@/store/useMessagesStore";
import {
  openConversationSync,
  closeConversationSync,
  notifyMessageSync,
} from "@/lib/sync/message-sync";
import {
  pullConversationMeta,
  pushConversationMeta,
  pullDayMessages,
} from "@/lib/sync/conversation-sync";
import { MessageList } from "@/components/MessageList";
import { MessageComposer } from "@/components/MessageComposer";
import { SyncStatusBadge } from "@/components/SyncStatusBadge";
import { getTodayDateKey, formatDateKey } from "@/lib/date";
import type { Message } from "@/lib/types";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();

  const userId = useAuthStore((s) => s.userId)!;
  const displayName = useAuthStore((s) => s.displayName);
  const historyDays = useAuthStore((s) => s.historyDays);

  const conversations = useConversationsStore((s) => s.conversations);
  const updateConversation = useConversationsStore((s) => s.updateConversation);

  const openConversation = useActiveConversationStore((s) => s.open);
  const activeConvId = useActiveConversationStore((s) => s.conversationId);
  const activeConvKey = useActiveConversationStore((s) => s.conversationKey);
  const meta = useActiveConversationStore((s) => s.meta);
  const setMeta = useActiveConversationStore((s) => s.setMeta);

  const messages = useMessagesStore((s) => s.messages);
  const loading = useMessagesStore((s) => s.loading);
  const clearMessages = useMessagesStore((s) => s.clear);

  // Find conversation data from index
  const convEntry = conversations.find((c) => c.conversationId === conversationId);
  const convKey = activeConvKey ?? convEntry?.conversationKey ?? null;
  const convName = meta?.name ?? convEntry?.name ?? "Chat";
  const isGroup = meta?.isGroup ?? convEntry?.isGroup ?? false;

  // Ensure active conversation is set (handles page refresh / direct navigation)
  useEffect(() => {
    if (!conversationId || !convKey) return;
    if (activeConvId !== conversationId) {
      openConversation(conversationId, convKey);
    }
  }, [conversationId, convKey]);

  // Open message sync and pull metadata when conversation is ready
  useEffect(() => {
    if (!conversationId || !convKey) return;

    clearMessages();
    openConversationSync(conversationId, convKey).catch(console.error);

    // Pull conversation meta, then load historical day messages
    pullConversationMeta(conversationId, convKey)
      .then(async (result) => {
        if (!result) return;
        setMeta(result.meta);

        // Compute cutoff: only load days within the historyDays window
        const today = getTodayDateKey();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - historyDays);
        const cutoffKey = formatDateKey(cutoff);

        const currentlyLoaded = useMessagesStore.getState().loadedDateKeys;
        const keysToFetch = result.meta.activeDateKeys.filter(
          (k) => k !== today && k >= cutoffKey && !currentlyLoaded.includes(k),
        );

        if (keysToFetch.length > 0) {
          const days = await Promise.all(
            keysToFetch.map((dateKey) =>
              pullDayMessages(conversationId, convKey, dateKey),
            ),
          );
          const store = useMessagesStore.getState();
          for (let i = 0; i < keysToFetch.length; i++) {
            const day = days[i];
            if (day?.messages) {
              store.mergeMessages(day.messages);
            }
            store.markDateKeyLoaded(keysToFetch[i]);
          }
        }
      })
      .catch(console.error);

    return () => {
      closeConversationSync();
    };
  }, [conversationId, convKey, historyDays]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversationId || !convKey) return;

      const now = new Date().toISOString();
      const message: Message = {
        id: Crypto.randomUUID(),
        conversationId,
        senderId: userId,
        senderName: displayName,
        text,
        timestamp: now,
      };

      // Add optimistically to local store
      useMessagesStore.getState().addMessage(message);

      // Push to server via debounced sync
      notifyMessageSync();

      // Update conversation index with preview
      updateConversation(conversationId, {
        lastMessageAt: now,
        lastMessagePreview: text.slice(0, 60),
      });

      // Ensure today's dateKey is in conv-meta.activeDateKeys
      if (meta) {
        const todayKey = getTodayDateKey();
        if (!meta.activeDateKeys.includes(todayKey)) {
          const updated = {
            ...meta,
            activeDateKeys: [...meta.activeDateKeys, todayKey],
            updatedAt: now,
          };
          setMeta(updated);
          pushConversationMeta(conversationId, convKey, updated).catch(
            console.error,
          );
        }
      }
    },
    [conversationId, convKey, userId, displayName, meta],
  );

  if (!convKey) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 items-center justify-center">
        <Text className="text-gray-500">Conversation not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-2 py-2 border-b border-gray-100 dark:border-gray-800 gap-1">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={22} color="#6b7280" />
        </TouchableOpacity>

        <View className="flex-1 px-1">
          <Text className="font-semibold text-base text-gray-900 dark:text-white" numberOfLines={1}>
            {convName}
          </Text>
          {meta && (
            <Text className="text-xs text-gray-400 dark:text-gray-500">
              {meta.members.length} member{meta.members.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        <SyncStatusBadge />

        <TouchableOpacity
          onPress={() =>
            router.push(`/conversation/${conversationId}/members`)
          }
          className="w-10 h-10 items-center justify-center"
        >
          <Users size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366f1" />
        </View>
      ) : (
        <MessageList
          messages={messages}
          selfUserId={userId}
          isGroup={isGroup}
        />
      )}

      {/* Composer */}
      <MessageComposer onSend={handleSend} />
    </SafeAreaView>
  );
}
