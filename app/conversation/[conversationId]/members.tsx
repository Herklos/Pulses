import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Share,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Link } from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationsStore } from "@/store/useConversationsStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { MemberList } from "@/components/MemberList";
import { buildInviteUrl } from "@/lib/invite";

export default function MembersScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId)!;
  const displayName = useAuthStore((s) => s.displayName);

  const meta = useActiveConversationStore((s) => s.meta);
  const convKey = useActiveConversationStore((s) => s.conversationKey);
  const conversations = useConversationsStore((s) => s.conversations);
  const convEntry = conversations.find((c) => c.conversationId === conversationId);

  const convName =
    meta?.name ?? convEntry?.name ?? "Conversation";
  const activeKey = convKey ?? convEntry?.conversationKey ?? null;
  const members = meta?.members ?? [];

  const [sharing, setSharing] = useState(false);

  async function handleShareInvite() {
    if (!conversationId || !activeKey) return;
    setSharing(true);
    try {
      const url = buildInviteUrl(conversationId, activeKey, displayName);
      await Share.share({
        message: `Join me on Pulses: ${url}`,
        url,
      });
    } catch {
      // User dismissed the share sheet
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-1 gap-0.5">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Members
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {convName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center"
        >
          <X size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Members list */}
      {members.length > 0 ? (
        <MemberList members={members} selfUserId={userId} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 dark:text-gray-600">
            Loading members…
          </Text>
        </View>
      )}

      {/* Invite button */}
      <View className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={handleShareInvite}
          disabled={!activeKey || sharing}
          className="flex-row items-center justify-center gap-2 bg-indigo-600 rounded-xl py-4"
          activeOpacity={0.85}
        >
          {sharing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Link size={18} color="white" />
              <Text className="text-white font-semibold text-base">
                Share Invite Link
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text className="text-xs text-center text-gray-400 dark:text-gray-600 mt-2">
          Anyone with this link can join and read messages.
        </Text>
      </View>
    </SafeAreaView>
  );
}
