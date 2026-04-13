// Mock notifyIndexSync to prevent errors about undefined sync managers
jest.mock("@/lib/sync/index-sync", () => ({
  notifyIndexSync: jest.fn(),
  initIndexSync: jest.fn(),
  teardownIndexSync: jest.fn(),
}));

import { useConversationsStore } from "@/store/useConversationsStore";
import { notifyIndexSync } from "@/lib/sync/index-sync";
import type { ConversationIndexEntry } from "@/lib/types";

function makeEntry(overrides: Partial<ConversationIndexEntry> = {}): ConversationIndexEntry {
  return {
    conversationId: "conv-1",
    conversationKey: "k".repeat(64),
    name: "Test Conversation",
    isGroup: false,
    lastMessageAt: "2024-06-01T12:00:00Z",
    lastMessagePreview: "Hello",
    createdAt: "2024-06-01T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  useConversationsStore.setState({ conversations: [], loading: false });
  jest.clearAllMocks();
});

describe("setConversations", () => {
  it("sets conversations sorted by lastMessageAt descending", () => {
    const older = makeEntry({ conversationId: "a", lastMessageAt: "2024-01-01T08:00:00Z" });
    const newer = makeEntry({ conversationId: "b", lastMessageAt: "2024-01-01T12:00:00Z" });
    useConversationsStore.getState().setConversations([older, newer]);
    const { conversations } = useConversationsStore.getState();
    expect(conversations[0].conversationId).toBe("b");
    expect(conversations[1].conversationId).toBe("a");
  });

  it("handles an empty array", () => {
    useConversationsStore.getState().setConversations([]);
    expect(useConversationsStore.getState().conversations).toHaveLength(0);
  });

  it("does not call notifyIndexSync", () => {
    useConversationsStore.getState().setConversations([makeEntry()]);
    expect(notifyIndexSync).not.toHaveBeenCalled();
  });
});

describe("addConversation", () => {
  it("adds a new conversation to the list", () => {
    const entry = makeEntry({ conversationId: "new" });
    useConversationsStore.getState().addConversation(entry);
    expect(useConversationsStore.getState().conversations).toHaveLength(1);
    expect(useConversationsStore.getState().conversations[0].conversationId).toBe("new");
  });

  it("does not add a duplicate conversation (same conversationId)", () => {
    const entry = makeEntry({ conversationId: "dup", name: "Original" });
    useConversationsStore.getState().addConversation(entry);
    useConversationsStore.getState().addConversation({ ...entry, name: "Duplicate" });
    const { conversations } = useConversationsStore.getState();
    expect(conversations).toHaveLength(1);
    expect(conversations[0].name).toBe("Original");
  });

  it("calls notifyIndexSync after adding", () => {
    useConversationsStore.getState().addConversation(makeEntry());
    expect(notifyIndexSync).toHaveBeenCalledTimes(1);
  });
});

describe("updateConversation", () => {
  it("updates fields of an existing conversation", () => {
    useConversationsStore.getState().addConversation(makeEntry({ conversationId: "c1", name: "Old" }));
    useConversationsStore.getState().updateConversation("c1", { name: "New" });
    const updated = useConversationsStore
      .getState()
      .conversations.find((c) => c.conversationId === "c1");
    expect(updated?.name).toBe("New");
  });

  it("re-sorts conversations after updating lastMessageAt", () => {
    useConversationsStore.getState().setConversations([
      makeEntry({ conversationId: "a", lastMessageAt: "2024-01-01T12:00:00Z" }),
      makeEntry({ conversationId: "b", lastMessageAt: "2024-01-01T08:00:00Z" }),
    ]);
    // Make "b" newer
    useConversationsStore.getState().updateConversation("b", {
      lastMessageAt: "2024-01-02T00:00:00Z",
    });
    const { conversations } = useConversationsStore.getState();
    expect(conversations[0].conversationId).toBe("b");
  });

  it("calls notifyIndexSync after updating", () => {
    useConversationsStore
      .getState()
      .setConversations([makeEntry({ conversationId: "c1" })]);
    jest.clearAllMocks();
    useConversationsStore.getState().updateConversation("c1", { name: "Updated" });
    expect(notifyIndexSync).toHaveBeenCalledTimes(1);
  });

  it("is a no-op for an unknown conversationId", () => {
    useConversationsStore.getState().setConversations([makeEntry({ conversationId: "real" })]);
    useConversationsStore.getState().updateConversation("ghost", { name: "Ghost" });
    const { conversations } = useConversationsStore.getState();
    expect(conversations[0].conversationId).toBe("real");
    expect(conversations[0].name).toBe("Test Conversation");
  });
});

describe("removeConversation", () => {
  it("removes the conversation with the given id", () => {
    useConversationsStore.getState().setConversations([
      makeEntry({ conversationId: "keep" }),
      makeEntry({ conversationId: "remove" }),
    ]);
    useConversationsStore.getState().removeConversation("remove");
    const { conversations } = useConversationsStore.getState();
    expect(conversations).toHaveLength(1);
    expect(conversations[0].conversationId).toBe("keep");
  });

  it("calls notifyIndexSync after removing", () => {
    useConversationsStore.getState().setConversations([makeEntry({ conversationId: "c1" })]);
    jest.clearAllMocks();
    useConversationsStore.getState().removeConversation("c1");
    expect(notifyIndexSync).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the id does not exist", () => {
    useConversationsStore.getState().setConversations([makeEntry()]);
    useConversationsStore.getState().removeConversation("nonexistent");
    expect(useConversationsStore.getState().conversations).toHaveLength(1);
  });
});
