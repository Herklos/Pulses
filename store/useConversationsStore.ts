import { create } from "zustand";
import type { ConversationIndexEntry } from "@/lib/types";
import { notifyIndexSync } from "@/lib/sync/index-sync";

interface ConversationsState {
  conversations: ConversationIndexEntry[];
  loading: boolean;
}

interface ConversationsActions {
  setConversations(entries: ConversationIndexEntry[]): void;
  addConversation(entry: ConversationIndexEntry): void;
  updateConversation(
    conversationId: string,
    updates: Partial<ConversationIndexEntry>,
  ): void;
  removeConversation(conversationId: string): void;
  setLoading(loading: boolean): void;
}

export const useConversationsStore = create<
  ConversationsState & ConversationsActions
>((set, get) => ({
  conversations: [],
  loading: false,

  setConversations(entries) {
    set({
      conversations: [...entries].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      ),
    });
  },

  addConversation(entry) {
    const exists = get().conversations.find(
      (c) => c.conversationId === entry.conversationId,
    );
    if (exists) return;
    set((state) => ({
      conversations: [entry, ...state.conversations],
    }));
    notifyIndexSync();
  },

  updateConversation(conversationId, updates) {
    set((state) => ({
      conversations: state.conversations
        .map((c) =>
          c.conversationId === conversationId ? { ...c, ...updates } : c,
        )
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        ),
    }));
    notifyIndexSync();
  },

  removeConversation(conversationId) {
    set((state) => ({
      conversations: state.conversations.filter(
        (c) => c.conversationId !== conversationId,
      ),
    }));
    notifyIndexSync();
  },

  setLoading(loading) {
    set({ loading });
  },
}));
