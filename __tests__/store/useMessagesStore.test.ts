import { useMessagesStore } from "@/store/useMessagesStore";
import type { Message } from "@/lib/types";

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    senderId: "user-1",
    senderName: "Alice",
    text: "Hello",
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  useMessagesStore.setState({ messages: [], loading: false });
});

describe("setMessages", () => {
  it("sets messages and sorts them by timestamp ascending", () => {
    const newer = makeMessage({ id: "b", timestamp: "2024-01-01T12:00:00Z" });
    const older = makeMessage({ id: "a", timestamp: "2024-01-01T08:00:00Z" });
    useMessagesStore.getState().setMessages([newer, older]);
    const { messages } = useMessagesStore.getState();
    expect(messages[0].id).toBe("a");
    expect(messages[1].id).toBe("b");
  });

  it("replaces existing messages", () => {
    useMessagesStore
      .getState()
      .setMessages([makeMessage({ id: "old", text: "old" })]);
    useMessagesStore
      .getState()
      .setMessages([makeMessage({ id: "new", text: "new" })]);
    const { messages } = useMessagesStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe("new");
  });

  it("handles an empty array", () => {
    useMessagesStore.getState().setMessages([]);
    expect(useMessagesStore.getState().messages).toHaveLength(0);
  });
});

describe("addMessage", () => {
  it("adds a new message", () => {
    const msg = makeMessage({ id: "m1" });
    useMessagesStore.getState().addMessage(msg);
    expect(useMessagesStore.getState().messages).toHaveLength(1);
    expect(useMessagesStore.getState().messages[0].id).toBe("m1");
  });

  it("ignores a message with a duplicate id", () => {
    const msg = makeMessage({ id: "dup", text: "first" });
    useMessagesStore.getState().addMessage(msg);
    useMessagesStore.getState().addMessage({ ...msg, text: "second" });
    const { messages } = useMessagesStore.getState();
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("first");
  });

  it("maintains ascending timestamp order when inserting out-of-order", () => {
    useMessagesStore
      .getState()
      .addMessage(makeMessage({ id: "b", timestamp: "2024-01-01T12:00:00Z" }));
    useMessagesStore
      .getState()
      .addMessage(makeMessage({ id: "a", timestamp: "2024-01-01T08:00:00Z" }));
    const { messages } = useMessagesStore.getState();
    expect(messages[0].id).toBe("a");
    expect(messages[1].id).toBe("b");
  });
});

describe("clear", () => {
  it("empties the messages array", () => {
    useMessagesStore.getState().setMessages([makeMessage()]);
    useMessagesStore.getState().clear();
    expect(useMessagesStore.getState().messages).toHaveLength(0);
  });
});

describe("setLoading", () => {
  it("updates the loading flag", () => {
    useMessagesStore.getState().setLoading(true);
    expect(useMessagesStore.getState().loading).toBe(true);
    useMessagesStore.getState().setLoading(false);
    expect(useMessagesStore.getState().loading).toBe(false);
  });
});
