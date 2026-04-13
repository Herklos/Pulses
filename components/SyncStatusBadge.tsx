import React from "react";
import { View } from "react-native";
import { useStore } from "zustand";
import { getMessageStore } from "@/lib/sync/message-sync";

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

export function SyncStatusBadge() {
  const msgStore = getMessageStore();
  const syncState = msgStore
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useStore(msgStore, (s) => ({
        syncing: s.syncing,
        dirty: s.dirty,
        error: s.error,
        online: s.online,
      }))
    : null;

  let status: Status = "idle";
  if (syncState) {
    if (!syncState.online) status = "offline";
    else if (syncState.error) status = "error";
    else if (syncState.syncing) status = "syncing";
    else if (syncState.dirty) status = "pending";
    else status = "synced";
  }

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
