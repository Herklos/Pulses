import { useActiveConversationStore } from "@/store/useActiveConversationStore";
import type { ConversationMeta } from "@/lib/types";

const CONV_ID = "conv-123";
const CONV_KEY = "a".repeat(64);

function makeMeta(overrides: Partial<ConversationMeta> = {}): ConversationMeta {
  return {
    conversationId: CONV_ID,
    name: "Test Conv",
    isGroup: false,
    members: [],
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    activeDateKeys: [],
    ...overrides,
  };
}

beforeEach(() => {
  useActiveConversationStore.setState({
    conversationId: null,
    conversationKey: null,
    meta: null,
  });
});

describe("open", () => {
  it("sets conversationId and conversationKey", () => {
    useActiveConversationStore.getState().open(CONV_ID, CONV_KEY);
    const state = useActiveConversationStore.getState();
    expect(state.conversationId).toBe(CONV_ID);
    expect(state.conversationKey).toBe(CONV_KEY);
  });

  it("clears meta when opening a new conversation", () => {
    useActiveConversationStore
      .getState()
      .setMeta(makeMeta({ name: "Old" }));
    useActiveConversationStore.getState().open(CONV_ID, CONV_KEY);
    expect(useActiveConversationStore.getState().meta).toBeNull();
  });
});

describe("close", () => {
  it("resets all state to null", () => {
    useActiveConversationStore.getState().open(CONV_ID, CONV_KEY);
    useActiveConversationStore.getState().setMeta(makeMeta());
    useActiveConversationStore.getState().close();
    const state = useActiveConversationStore.getState();
    expect(state.conversationId).toBeNull();
    expect(state.conversationKey).toBeNull();
    expect(state.meta).toBeNull();
  });
});

describe("setMeta", () => {
  it("stores the provided meta object", () => {
    const meta = makeMeta({ name: "My Group", isGroup: true });
    useActiveConversationStore.getState().setMeta(meta);
    expect(useActiveConversationStore.getState().meta).toEqual(meta);
  });

  it("replaces previously set meta", () => {
    useActiveConversationStore.getState().setMeta(makeMeta({ name: "First" }));
    useActiveConversationStore.getState().setMeta(makeMeta({ name: "Second" }));
    expect(useActiveConversationStore.getState().meta?.name).toBe("Second");
  });
});
