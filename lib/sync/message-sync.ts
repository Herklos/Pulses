import {
  SyncManager,
  consoleSyncLogger,
  createUnionMerge,
  createDebouncedSync,
  startAdaptivePolling,
  type AdaptivePollingControls,
} from "@drakkar.software/starfish-client";
import {
  createStarfishStore,
  type StarfishStore,
} from "@drakkar.software/starfish-client/zustand";
import type { StoreApi } from "zustand/vanilla";
import { getClient } from "@/lib/starfish";
import { getTodayDateKey } from "@/lib/date";
import { useMessagesStore } from "@/store/useMessagesStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import { showMessageNotification } from "@/lib/notifications";
import type { DayMessages } from "@/lib/types";

let store: StoreApi<StarfishStore> | null = null;
let debouncedNotify: (() => void) | null = null;
let debouncedCancel: (() => void) | null = null;
let syncManager: SyncManager | null = null;
let pollingControls: AdaptivePollingControls | null = null;

export async function openConversationSync(
  conversationId: string,
  conversationKey: string,
): Promise<void> {
  // Tear down previous if switching conversations
  closeConversationSync();

  const dateKey = getTodayDateKey();
  const client = getClient();

  syncManager = new SyncManager({
    client,
    pullPath: `/pull/conv/${conversationId}/msg/${dateKey}`,
    pushPath: `/push/conv/${conversationId}/msg/${dateKey}`,
    encryptionSecret: conversationKey,
    encryptionSalt: conversationId,
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
        const selfId = useAuthStore.getState().userId;
        const convMeta = useActiveConversationStore.getState().meta;
        const existingIds = new Set(
          useMessagesStore.getState().messages.map((m) => m.id),
        );

        const newFromOthers = dayMessages.messages.filter(
          (m) => !existingIds.has(m.id) && m.senderId !== selfId && !m.deleted,
        );
        if (newFromOthers.length > 0) {
          const last = newFromOthers[newFromOthers.length - 1];
          showMessageNotification(
            last.senderName,
            last.text,
            convMeta?.name ?? conversationId,
            conversationId,
          );
        }

        useMessagesStore.getState().mergeMessages(dayMessages.messages);
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
      useMessagesStore.getState().mergeMessages(data.messages);
    }
  } catch {
    // No messages yet for today — that's fine
  }

  // Poll every ~5 seconds while conversation is open.
  // Guard against null store: closeConversationSync() may run while this
  // async function is still awaiting, leaving store=null by the time the
  // interval fires.
  pollingControls = startAdaptivePolling(
    () => store?.getState().pull() ?? Promise.resolve(),
    () =>
      store
        ? { online: store.getState().online, syncing: store.getState().syncing }
        : { online: false, syncing: false },
    { intervalMs: 5000 },
  );
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
  pollingControls?.stop();
  pollingControls = null;
  syncManager = null;
  debouncedNotify = null;
  debouncedCancel = null;
  store = null;
}
