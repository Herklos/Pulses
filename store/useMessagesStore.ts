import { create } from "zustand";
import type { Message } from "@/lib/types";

interface MessagesState {
  messages: Message[];
  loading: boolean;
}

interface MessagesActions {
  setMessages(messages: Message[]): void;
  addMessage(message: Message): void;
  clear(): void;
  setLoading(loading: boolean): void;
}

export const useMessagesStore = create<MessagesState & MessagesActions>(
  (set, get) => ({
    messages: [],
    loading: false,

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

    clear() {
      set({ messages: [] });
    },

    setLoading(loading) {
      set({ loading });
    },
  }),
);
