import { Platform } from "react-native";
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
import { setupCrossTabSync } from "@drakkar.software/starfish-client/broadcast";
import type { StoreApi } from "zustand/vanilla";
import { getClient } from "@/lib/starfish";
import { useConversationsStore } from "@/store/useConversationsStore";
import type { UserIndex } from "@/lib/types";

interface IndexSyncCreds {
  userId: string;
  authToken: string;
  encryptionSecret: string;
}

let store: StoreApi<StarfishStore> | null = null;
let debouncedNotify: (() => void) | null = null;
let debouncedCancel: (() => void) | null = null;
let syncManager: SyncManager | null = null;
let pollingControls: AdaptivePollingControls | null = null;
let cleanupCrossTab: (() => void) | null = null;

export async function initIndexSync(creds: IndexSyncCreds): Promise<void> {
  const client = getClient();

  syncManager = new SyncManager({
    client,
    pullPath: `/pull/user-index/${creds.userId}`,
    pushPath: `/push/user-index/${creds.userId}`,
    encryptionSecret: creds.encryptionSecret,
    encryptionSalt: creds.userId,
    onConflict: createUnionMerge({ timestampKey: "updatedAt" }),
    maxRetries: 3,
    loggerName: "index-sync",
    logger: consoleSyncLogger,
  });

  store = createStarfishStore({
    name: "index-sync",
    syncManager,
    storage: false,
    onRemoteUpdate: (data) => {
      const index = data as unknown as UserIndex;
      if (index?.conversations) {
        useConversationsStore.getState().setConversations(index.conversations);
      }
    },
  });

  const debounced = createDebouncedSync(store, {
    delayMs: 2000,
    serialize: () => {
      const conversations = useConversationsStore.getState().conversations;
      const index: UserIndex = {
        version: 1,
        conversations,
        updatedAt: new Date().toISOString(),
      };
      return index as unknown as Record<string, unknown>;
    },
  });

  debouncedNotify = debounced.notify;
  debouncedCancel = debounced.cancel;

  // Initial pull to hydrate conversation list
  try {
    await syncManager.pull();
    const data = syncManager.getData() as unknown as UserIndex | null;
    if (data?.conversations) {
      useConversationsStore.getState().setConversations(data.conversations);
    }
  } catch {
    // Server might not have the document yet — that's fine
  }

  // Set up cross-tab sync on web (BroadcastChannel / localStorage fallback)
  if (Platform.OS === "web") {
    cleanupCrossTab = setupCrossTabSync(store, "index-sync");
  }

  // Start polling every ~10 seconds.
  // Guard against null store in case teardownIndexSync() runs while this
  // async function is still awaiting the initial pull.
  pollingControls = startAdaptivePolling(
    () => store?.getState().pull() ?? Promise.resolve(),
    () =>
      store
        ? { online: store.getState().online, syncing: store.getState().syncing }
        : { online: false, syncing: false },
    { intervalMs: 10000 },
  );
}

export function getIndexStore(): StoreApi<StarfishStore> | null {
  return store;
}

/** Called after any mutation to the conversations list */
export function notifyIndexSync(): void {
  debouncedNotify?.();
}

export function teardownIndexSync(): void {
  debouncedCancel?.();
  pollingControls?.stop();
  cleanupCrossTab?.();
  pollingControls = null;
  syncManager = null;
  debouncedNotify = null;
  debouncedCancel = null;
  cleanupCrossTab = null;
  store = null;
}
