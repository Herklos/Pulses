import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationsStore } from "@/store/useConversationsStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { pushConversationMeta } from "@/lib/sync/conversation-sync";
import type { ConversationIndexEntry, ConversationMeta } from "@/lib/types";

function generateConversationKey(): string {
  const bytes = Crypto.getRandomBytes(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function NewConversationScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId)!;
  const displayName = useAuthStore((s) => s.displayName);
  const addConversation = useConversationsStore((s) => s.addConversation);
  const openConversation = useActiveConversationStore((s) => s.open);

  const [name, setName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a conversation name.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const conversationId = Crypto.randomUUID();
      const conversationKey = generateConversationKey();
      const now = new Date().toISOString();

      const meta: ConversationMeta = {
        conversationId,
        name: trimmedName,
        isGroup,
        members: [
          {
            userId,
            displayName,
            role: "admin",
            joinedAt: now,
          },
        ],
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        activeDateKeys: [],
      };

      // Push conversation meta to server
      await pushConversationMeta(conversationId, conversationKey, meta);

      // Add to local conversation index
      const entry: ConversationIndexEntry = {
        conversationId,
        conversationKey,
        name: trimmedName,
        isGroup,
        lastMessageAt: now,
        lastMessagePreview: "",
        createdAt: now,
      };
      addConversation(entry);

      // Navigate to chat
      openConversation(conversationId, conversationKey);
      router.replace(`/conversation/${conversationId}`);
    } catch (e) {
      setError("Failed to create conversation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center"
          >
            <X size={22} color="#6b7280" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-semibold text-gray-900 dark:text-white">
            New Conversation
          </Text>
          <View className="w-9" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isGroup ? "Group name" : "Conversation name"}
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
              value={name}
              onChangeText={setName}
              placeholder={
                isGroup ? "e.g. Weekend Crew" : "e.g. Alice"
              }
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>

          {/* Group toggle */}
          <View className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-4">
            <View className="gap-0.5">
              <Text className="font-medium text-gray-900 dark:text-white">
                Group conversation
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Allows multiple people to join
              </Text>
            </View>
            <Switch
              value={isGroup}
              onValueChange={setIsGroup}
              trackColor={{ false: "#d1d5db", true: "#6366f1" }}
              thumbColor="white"
            />
          </View>

          {/* Info box */}
          <View className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
            <Text className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              A unique encryption key will be generated for this conversation.
              Share the invite link with others so they can join and decrypt
              messages.
            </Text>
          </View>

          {error ? (
            <Text className="text-red-500 text-sm">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleCreate}
            className="bg-indigo-600 rounded-xl py-4 items-center"
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create Conversation
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
