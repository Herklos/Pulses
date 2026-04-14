import React from "react";
import { View } from "react-native";
import { useStore } from "zustand";
import { getMessageStore } from "@/lib/sync/message-sync";
import type { StoreApi } from "zustand";

type Status = "synced" | "pending" | "syncing" | "error" | "offline" | "idle";

function getStatusColor(status: Status): string {
  switch (status) {
    case "synced":
      return "#22c55e"; // green
    case "pending":
      return "#f59e0b"; // amber
    case "syncing":
      return "#6366f1"; // indigo
    case "error":
      return "#ef4444"; // red
    case "offline":
      return "#9ca3af"; // gray
    default:
      return "#9ca3af";
  }
}

interface ActiveBadgeProps {
  store: StoreApi<{ syncing: boolean; dirty: boolean; error: string | null; online: boolean }>;
}

function ActiveSyncBadge({ store }: ActiveBadgeProps) {
  // Use separate primitive selectors — an object-returning selector creates
  // a new reference every call, which causes useSyncExternalStore to loop.
  const syncing = useStore(store, (s) => s.syncing);
  const dirty = useStore(store, (s) => s.dirty);
  const error = useStore(store, (s) => s.error);
  const online = useStore(store, (s) => s.online);

  let status: Status = "idle";
  if (!online) status = "offline";
  else if (error) status = "error";
  else if (syncing) status = "syncing";
  else if (dirty) status = "pending";
  else status = "synced";

  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: getStatusColor(status),
      }}
    />
  );
}

export function SyncStatusBadge() {
  const msgStore = getMessageStore();

  if (!msgStore) {
    return (
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: getStatusColor("idle"),
        }}
      />
    );
  }

  return <ActiveSyncBadge store={msgStore} />;
}
