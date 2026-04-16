import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationsStore } from "@/store/useConversationsStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { pullConvMembers, pushConvMembers, pullConversationMeta, pushConversationMeta } from "@/lib/sync/conversation-sync";
import { parseConvInviteToken } from "@/lib/identity";
import type { ConversationIndexEntry } from "@/lib/types";

export default function JoinScreen() {
  const { t: token } = useLocalSearchParams<{ t: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId)!;
  const displayName = useAuthStore((s) => s.displayName);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addConversation = useConversationsStore((s) => s.addConversation);
  const updateConversation = useConversationsStore((s) => s.updateConversation);
  const conversations = useConversationsStore((s) => s.conversations);
  const openConversation = useActiveConversationStore((s) => s.open);

  const [status, setStatus] = useState<"loading" | "joining" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [inviteData, setInviteData] = useState<{
    conversationId: string;
    conversationKey: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid invite link.");
      return;
    }

    // Parse the token (already extracted by Expo Router from the deep link)
    const parsed = parseConvInviteToken(token);
    if (!parsed) {
      setStatus("error");
      setErrorMessage("Could not decode invite link.");
      return;
    }
    setInviteData(parsed);
    setStatus("joining");
  }, [token]);

  useEffect(() => {
    if (status === "joining" && inviteData && isAuthenticated) {
      handleJoin();
    }
  }, [status, inviteData, isAuthenticated]);

  async function handleJoin() {
    if (!inviteData) return;
    const { conversationId, conversationKey, name } = inviteData;

    try {
      // Already in the conversation?
      const existing = conversations.find((c) => c.conversationId === conversationId);
      if (existing) {
        openConversation(conversationId, conversationKey);
        router.replace(`/conversation/${conversationId}`);
        return;
      }

      // Add self to conv-members first (grants "group-member" role for conv-meta/messages)
      const membersResult = await pullConvMembers(conversationId);
      const existingMemberIds = membersResult?.members.members ?? [];
      if (!existingMemberIds.includes(userId)) {
        await pushConvMembers(
          conversationId,
          { members: [...existingMemberIds, userId] },
          membersResult?.hash ?? null,
        );
      }

      // Pull and decrypt conversation metadata (now accessible as group-member)
      const result = await pullConversationMeta(conversationId, conversationKey);
      const now = new Date().toISOString();

      if (result) {
        const { meta, hash } = result;

        // Add self to members if not already there
        const alreadyMember = meta.members.some((m) => m.userId === userId);
        if (!alreadyMember) {
          const updatedMeta = {
            ...meta,
            members: [
              ...meta.members,
              { userId, displayName, role: "member" as const, joinedAt: now },
            ],
            updatedAt: now,
          };
          await pushConversationMeta(conversationId, conversationKey, updatedMeta, hash);
        }

        // Add to local index
        const entry: ConversationIndexEntry = {
          conversationId,
          conversationKey,
          name: meta.name,
          isGroup: meta.isGroup,
          lastMessageAt: now,
          lastMessagePreview: "",
          createdAt: meta.createdAt,
        };
        addConversation(entry);
      } else {
        // No meta yet (creator is offline?) — create placeholder entry
        const entry: ConversationIndexEntry = {
          conversationId,
          conversationKey,
          name,
          isGroup: false,
          lastMessageAt: now,
          lastMessagePreview: "",
          createdAt: now,
        };
        addConversation(entry);
      }

      openConversation(conversationId, conversationKey);
      router.replace(`/conversation/${conversationId}`);
    } catch (e) {
      setStatus("error");
      setErrorMessage("Failed to join conversation. Please try again.");
    }
  }

  if (!isAuthenticated) {
    return null; // Auth gate will redirect to login
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 items-center justify-center px-6">
      {status === "loading" || status === "joining" ? (
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-base text-gray-600 dark:text-gray-400">
            Joining conversation…
          </Text>
        </View>
      ) : (
        <View className="items-center gap-6">
          <Text className="text-lg font-semibold text-red-600">
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/(tabs)")}
            className="bg-indigo-600 rounded-xl py-3 px-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
