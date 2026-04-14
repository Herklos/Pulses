import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LogOut, Server, Eye, EyeOff, History, Bell } from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { PassphraseDisplay } from "@/components/PassphraseDisplay";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";

export default function ProfileScreen() {
  const router = useRouter();
  const displayName = useAuthStore((s) => s.displayName);
  const passphrase = useAuthStore((s) => s.passphrase);
  const userId = useAuthStore((s) => s.userId);
  const serverUrl = useAuthStore((s) => s.serverUrl);
  const historyDays = useAuthStore((s) => s.historyDays);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const setServerUrl = useAuthStore((s) => s.setServerUrl);
  const setHistoryDays = useAuthStore((s) => s.setHistoryDays);
  const logout = useAuthStore((s) => s.logout);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [editingServer, setEditingServer] = useState(false);
  const [serverValue, setServerValue] = useState(serverUrl);
  const [editingHistory, setEditingHistory] = useState(false);
  const [historyValue, setHistoryValue] = useState(String(historyDays));
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(
    () => getNotificationPermission(),
  );

  function handleSaveName() {
    if (nameValue.trim()) {
      setDisplayName(nameValue.trim());
    }
    setEditingName(false);
  }

  function handleSaveServer() {
    if (serverValue.trim()) {
      setServerUrl(serverValue.trim());
    }
    setEditingServer(false);
  }

  function handleSaveHistory() {
    const n = parseInt(historyValue, 10);
    if (!isNaN(n) && n > 0) {
      setHistoryDays(n);
    } else {
      setHistoryValue(String(historyDays));
    }
    setEditingHistory(false);
  }

  async function handleEnableNotifications() {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
  }

  async function handleLogout() {
    const message =
      "Make sure you've saved your passphrase before logging out. You won't be able to recover your account without it.";

    if (Platform.OS === "web") {
      if (!window.confirm(`Log Out\n\n${message}`)) return;
      await logout();
      router.replace("/login");
      return;
    }

    Alert.alert("Log Out", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 gap-6"
      >
        {/* Header */}
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile
        </Text>

        {/* Display name */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Display Name
            </Text>
          </View>
          <View className="px-4 py-3 flex-row items-center gap-3">
            {editingName ? (
              <>
                <TextInput
                  className="flex-1 text-base text-gray-900 dark:text-white"
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <Text className="text-indigo-600 font-semibold text-sm">
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="flex-1 text-base text-gray-900 dark:text-white">
                  {displayName}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setNameValue(displayName);
                    setEditingName(true);
                  }}
                >
                  <Text className="text-indigo-600 text-sm">Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {userId && (
            <View className="px-4 pb-3">
              <Text className="text-xs text-gray-400 font-mono">
                ID: {userId}
              </Text>
            </View>
          )}
        </View>

        {/* Server URL */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-row items-center gap-2">
            <Server size={14} color="#9ca3af" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Sync Server
            </Text>
          </View>
          <View className="px-4 py-3 flex-row items-center gap-3">
            {editingServer ? (
              <>
                <TextInput
                  className="flex-1 text-sm font-mono text-gray-900 dark:text-white"
                  value={serverValue}
                  onChangeText={setServerValue}
                  autoFocus
                  autoCapitalize="none"
                  keyboardType="url"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveServer}
                />
                <TouchableOpacity onPress={handleSaveServer}>
                  <Text className="text-indigo-600 font-semibold text-sm">
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text
                  className="flex-1 text-sm font-mono text-gray-700 dark:text-gray-300"
                  numberOfLines={1}
                >
                  {serverUrl}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setServerValue(serverUrl);
                    setEditingServer(true);
                  }}
                >
                  <Text className="text-indigo-600 text-sm">Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Message History */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-row items-center gap-2">
            <History size={14} color="#9ca3af" />
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Message History
            </Text>
          </View>
          <View className="px-4 py-3 flex-row items-center gap-3">
            {editingHistory ? (
              <>
                <TextInput
                  className="flex-1 text-sm font-mono text-gray-900 dark:text-white"
                  value={historyValue}
                  onChangeText={setHistoryValue}
                  autoFocus
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveHistory}
                />
                <TouchableOpacity onPress={handleSaveHistory}>
                  <Text className="text-indigo-600 font-semibold text-sm">
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  Load last{" "}
                  <Text className="font-semibold">{historyDays}</Text>{" "}
                  {historyDays === 1 ? "day" : "days"} of messages per chat
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setHistoryValue(String(historyDays));
                    setEditingHistory(true);
                  }}
                >
                  <Text className="text-indigo-600 text-sm">Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Passphrase */}
        <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Secret Passphrase
            </Text>
            <TouchableOpacity
              onPress={() => setShowPassphrase((v) => !v)}
              className="flex-row items-center gap-1.5"
            >
              {showPassphrase ? (
                <EyeOff size={14} color="#9ca3af" />
              ) : (
                <Eye size={14} color="#9ca3af" />
              )}
              <Text className="text-xs text-gray-400">
                {showPassphrase ? "Hide" : "Reveal"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="p-4">
            {showPassphrase && passphrase ? (
              <PassphraseDisplay passphrase={passphrase} />
            ) : (
              <Text className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your passphrase is your identity. Keep it safe — it cannot be
                recovered if lost.
              </Text>
            )}
          </View>
        </View>

        {/* Notifications (web only) */}
        {Platform.OS === "web" && isNotificationSupported() && (
          <View className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-row items-center gap-2">
              <Bell size={14} color="#9ca3af" />
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Notifications
              </Text>
            </View>
            <View className="px-4 py-3 flex-row items-center gap-3">
              <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                {notifPermission === "granted"
                  ? "Browser notifications enabled"
                  : notifPermission === "denied"
                    ? "Blocked — allow in browser settings"
                    : "Get notified for new messages"}
              </Text>
              {notifPermission !== "granted" && notifPermission !== "denied" && (
                <TouchableOpacity onPress={handleEnableNotifications}>
                  <Text className="text-indigo-600 text-sm">Enable</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 border border-red-200 dark:border-red-900 rounded-xl py-4"
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-semibold text-base">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
