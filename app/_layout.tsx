import "../global.css";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/useAuthStore";
import { initStarfish, teardownStarfish } from "@/lib/starfish";
import { initIndexSync, teardownIndexSync } from "@/lib/sync/index-sync";

function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authToken = useAuthStore((s) => s.authToken);
  const serverUrl = useAuthStore((s) => s.serverUrl);
  const encryptionSecret = useAuthStore((s) => s.encryptionSecret);
  const userId = useAuthStore((s) => s.userId);
  const segments = useSegments();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "login";
    if (!isAuthenticated && !inAuth) {
      router.replace("/login");
    } else if (isAuthenticated && inAuth) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  // Initialize Starfish client + index sync when authenticated
  useEffect(() => {
    if (!isAuthenticated || !authToken || !serverUrl || !encryptionSecret || !userId) {
      return;
    }
    initStarfish(serverUrl, authToken);
    initIndexSync({ encryptionSecret, userId, authToken }).catch(console.error);
    return () => {
      teardownIndexSync();
      teardownStarfish();
    };
  }, [isAuthenticated, authToken, serverUrl, encryptionSecret, userId]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const loadPersistedAuth = useAuthStore((s) => s.loadPersistedAuth);

  useEffect(() => {
    loadPersistedAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView className="flex-1">
        <StatusBar style="auto" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="join" />
            <Stack.Screen name="new-conversation" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="conversation/[conversationId]" />
            <Stack.Screen
              name="conversation/[conversationId]/members"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </AuthGate>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
