import { create } from "zustand";
import type { ConversationMeta } from "@/lib/types";

interface ActiveConversationState {
  conversationId: string | null;
  conversationKey: string | null;
  meta: ConversationMeta | null;
}

interface ActiveConversationActions {
  open(conversationId: string, conversationKey: string): void;
  close(): void;
  setMeta(meta: ConversationMeta): void;
}

export const useActiveConversationStore = create<
  ActiveConversationState & ActiveConversationActions
>((set) => ({
  conversationId: null,
  conversationKey: null,
  meta: null,

  open(conversationId, conversationKey) {
    set({ conversationId, conversationKey, meta: null });
  },

  close() {
    set({ conversationId: null, conversationKey: null, meta: null });
  },

  setMeta(meta) {
    set({ meta });
  },
}));
