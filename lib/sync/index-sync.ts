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
import { createUserIndexEncryptor } from "@/lib/crypto";
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

export async function initIndexSync(creds: IndexSyncCreds): Promise<void> {
  const client = getClient();
  const encryptor = createUserIndexEncryptor({
    passphrase: "",
    userId: creds.userId,
    authToken: creds.authToken,
    encryptionSecret: creds.encryptionSecret,
  });

  syncManager = new SyncManager({
    client,
    pullPath: `/pull/user-index/${creds.userId}`,
    pushPath: `/push/user-index/${creds.userId}`,
    encryptor,
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
      const index = data as UserIndex;
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
      return index;
    },
  });

  debouncedNotify = debounced.notify;
  debouncedCancel = debounced.cancel;

  // Initial pull to hydrate conversation list
  try {
    await syncManager.pull();
    const data = syncManager.getData() as UserIndex | null;
    if (data?.conversations) {
      useConversationsStore.getState().setConversations(data.conversations);
    }
  } catch {
    // Server might not have the document yet — that's fine
  }

  // Start polling every ~10 seconds
  syncManager.startAdaptivePolling({
    onUpdate: (data) => {
      const index = data as UserIndex;
      if (index?.conversations) {
        useConversationsStore.getState().setConversations(index.conversations);
      }
    },
  });
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
  syncManager?.stopAdaptivePolling?.();
  syncManager = null;
  debouncedNotify = null;
  debouncedCancel = null;
  store = null;
}
