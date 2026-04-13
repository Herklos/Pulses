import {
  SyncManager,
  consoleSyncLogger,
  createUnionMerge,
  createDebouncedSync,
} from "@drakkar.software/starfish-client";
import {
  createStarfishStore,
  type StarfishStore,
} from "@drakkar.software/starfish-client/zustand";
import type { StoreApi } from "zustand/vanilla";
import { getClient } from "@/lib/starfish";
import { createConversationEncryptor } from "@/lib/crypto";
import { getTodayDateKey } from "@/lib/date";
import { useMessagesStore } from "@/store/useMessagesStore";
import type { DayMessages } from "@/lib/types";

let store: StoreApi<StarfishStore> | null = null;
let debouncedNotify: (() => void) | null = null;
let debouncedCancel: (() => void) | null = null;
let syncManager: SyncManager | null = null;
let activeConvId: string | null = null;
let activeConvKey: string | null = null;

export async function openConversationSync(
  conversationId: string,
  conversationKey: string,
): Promise<void> {
  // Tear down previous if switching conversations
  closeConversationSync();

  activeConvId = conversationId;
  activeConvKey = conversationKey;
  const dateKey = getTodayDateKey();
  const client = getClient();
  const encryptor = createConversationEncryptor(conversationKey, conversationId);

  syncManager = new SyncManager({
    client,
    pullPath: `/pull/conv/${conversationId}/msg/${dateKey}`,
    pushPath: `/push/conv/${conversationId}/msg/${dateKey}`,
    encryptor,
    onConflict: createUnionMerge({ timestampKey: "timestamp" }),
    maxRetries: 5,
    loggerName: `msg-sync-${conversationId}`,
    logger: consoleSyncLogger,
  });

  store = createStarfishStore({
    name: `msg-sync-${conversationId}`,
    syncManager,
    storage: false,
    onRemoteUpdate: (data) => {
      const dayMessages = data as DayMessages;
      if (dayMessages?.messages) {
        useMessagesStore.getState().setMessages(dayMessages.messages);
      }
    },
  });

  const debounced = createDebouncedSync(store, {
    delayMs: 1500,
    serialize: () => {
      const messages = useMessagesStore.getState().messages;
      const dayMessages: DayMessages = {
        conversationId,
        dateKey,
        messages,
        updatedAt: new Date().toISOString(),
      };
      return dayMessages;
    },
  });

  debouncedNotify = debounced.notify;
  debouncedCancel = debounced.cancel;

  // Initial pull
  try {
    await syncManager.pull();
    const data = syncManager.getData() as DayMessages | null;
    if (data?.messages) {
      useMessagesStore.getState().setMessages(data.messages);
    }
  } catch {
    // No messages yet for today — that's fine
  }

  // Poll every ~5 seconds while conversation is open
  syncManager.startAdaptivePolling({
    intervalMs: 5000,
    onUpdate: (data) => {
      const dayMessages = data as DayMessages;
      if (dayMessages?.messages) {
        useMessagesStore.getState().setMessages(dayMessages.messages);
      }
    },
  });
}

export function getMessageStore(): StoreApi<StarfishStore> | null {
  return store;
}

/** Called after adding a message to trigger a debounced push */
export function notifyMessageSync(): void {
  debouncedNotify?.();
}

export function closeConversationSync(): void {
  debouncedCancel?.();
  syncManager?.stopAdaptivePolling?.();
  syncManager = null;
  debouncedNotify = null;
  debouncedCancel = null;
  store = null;
  activeConvId = null;
  activeConvKey = null;
}
