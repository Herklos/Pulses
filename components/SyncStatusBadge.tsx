import React from "react";
import { View } from "react-native";
import { useStore } from "zustand";
import {
  deriveSyncStatus,
  type SyncStatus,
  type StarfishStore,
} from "@drakkar.software/starfish-client/zustand";
import { getMessageStore } from "@/lib/sync/message-sync";
import type { StoreApi } from "zustand";

function getStatusColor(status: SyncStatus | "idle"): string {
  switch (status) {
    case "synced":
      return "#22c55e";
    case "pending":
      return "#f59e0b";
    case "syncing":
      return "#6366f1";
    case "error":
      return "#ef4444";
    case "offline":
    case "idle":
    default:
      return "#9ca3af";
  }
}

function ActiveSyncBadge({ store }: { store: StoreApi<StarfishStore> }) {
  const syncing = useStore(store, (s) => s.syncing);
  const dirty = useStore(store, (s) => s.dirty);
  const error = useStore(store, (s) => s.error);
  const online = useStore(store, (s) => s.online);
  const status = deriveSyncStatus({ syncing, dirty, error, online, data: {} });

  return (
    <View
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor(status) }}
    />
  );
}

export function SyncStatusBadge() {
  const msgStore = getMessageStore();
  if (!msgStore) {
    return (
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getStatusColor("idle") }}
      />
    );
  }
  return <ActiveSyncBadge store={msgStore} />;
}
