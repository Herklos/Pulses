import { create } from "zustand";
import type { Message } from "@/lib/types";

interface MessagesState {
  messages: Message[];
  loading: boolean;
  /** Date keys (YYYY-MM-DD) whose messages are already loaded into this store */
  loadedDateKeys: string[];
}

interface MessagesActions {
  setMessages(messages: Message[]): void;
  addMessage(message: Message): void;
  /** Upsert messages by id — incoming version wins (handles edits/deletions) */
  mergeMessages(incoming: Message[]): void;
  markDateKeyLoaded(dateKey: string): void;
  clear(): void;
  setLoading(loading: boolean): void;
}

export const useMessagesStore = create<MessagesState & MessagesActions>(
  (set, get) => ({
    messages: [],
    loading: false,
    loadedDateKeys: [],

    setMessages(messages) {
      // Sort by timestamp ascending for display
      const sorted = [...messages].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      set({ messages: sorted });
    },

    addMessage(message) {
      const existing = get().messages.find((m) => m.id === message.id);
      if (existing) return;
      set((state) => ({
        messages: [...state.messages, message].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        ),
      }));
    },

    mergeMessages(incoming) {
      if (incoming.length === 0) return;
      set((state) => {
        const byId = new Map(state.messages.map((m) => [m.id, m]));
        for (const m of incoming) byId.set(m.id, m); // incoming wins (handles edits)
        const merged = Array.from(byId.values()).sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        return { messages: merged };
      });
    },

    markDateKeyLoaded(dateKey) {
      if (get().loadedDateKeys.includes(dateKey)) return;
      set((state) => ({ loadedDateKeys: [...state.loadedDateKeys, dateKey] }));
    },

    clear() {
      set({ messages: [], loadedDateKeys: [] });
    },

    setLoading(loading) {
      set({ loading });
    },
  }),
);
