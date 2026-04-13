import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { MessageCircle } from "lucide-react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { generatePassphrase } from "@/lib/identity";
import { PassphraseDisplay } from "@/components/PassphraseDisplay";
import { PassphraseInput } from "@/components/PassphraseInput";

type Mode = "choose" | "create" | "login";

export default function LoginScreen() {
  const router = useRouter();
  const createIdentity = useAuthStore((s) => s.createIdentity);
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<Mode>("choose");
  const [displayName, setDisplayName] = useState("");
  const [generatedPassphrase, setGeneratedPassphrase] = useState("");
  const [loginPassphrase, setLoginPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleStartCreate() {
    const phrase = generatePassphrase();
    setGeneratedPassphrase(phrase);
    setMode("create");
  }

  async function handleCreateConfirm() {
    if (!displayName.trim()) {
      setError("Please enter a display name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createIdentity(displayName.trim());
      router.replace("/(tabs)");
    } catch (e) {
      setError("Failed to create identity. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!loginPassphrase.trim()) {
      setError("Please enter your passphrase.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(loginPassphrase.trim());
      router.replace("/(tabs)");
    } catch (e) {
      setError("Invalid passphrase. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-4">
            <MessageCircle size={32} color="white" />
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            Pulses
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            End-to-end encrypted messaging
          </Text>
        </View>

        {/* Choose mode */}
        {mode === "choose" && (
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleStartCreate}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold text-base">
                Create New Identity
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("login")}
              className="border border-gray-300 dark:border-gray-700 rounded-xl py-4 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-gray-900 dark:text-white font-semibold text-base">
                Log In With Passphrase
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create identity */}
        {mode === "create" && (
          <View className="gap-5">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Create Your Identity
            </Text>

            <PassphraseDisplay passphrase={generatedPassphrase} />

            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your display name
              </Text>
              <TextInput
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should others see you?"
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateConfirm}
              />
            </View>

            {error ? (
              <Text className="text-red-500 text-sm">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleCreateConfirm}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  I've Saved My Passphrase — Continue
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode("choose")}>
              <Text className="text-indigo-600 text-sm text-center">
                ← Back
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Login */}
        {mode === "login" && (
          <View className="gap-5">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Log In
            </Text>

            <View className="gap-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your passphrase
              </Text>
              <PassphraseInput
                value={loginPassphrase}
                onChangeText={setLoginPassphrase}
              />
            </View>

            {error ? (
              <Text className="text-red-500 text-sm">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              className="bg-indigo-600 rounded-xl py-4 items-center"
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode("choose")}>
              <Text className="text-indigo-600 text-sm text-center">
                ← Back
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
