// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import useConversationChat from "./useConversationChat.js";

/**
 * Covers the chatError precision fix: chatError is one shared event on one
 * shared socket, emitted by several unrelated gateway handlers, so this
 * listener can receive a rejection that has nothing to do with anything this
 * hook sent. Before this, ANY chatError (other than rate_limited/not_allowed)
 * failed every pending message in the conversation — one real rejection, or
 * even an unrelated join/support-chat failure elsewhere, wrongly failed
 * messages that were never touched.
 */

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../state/messageCache", () => ({
  messageCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    getPersisted: vi.fn().mockResolvedValue(null),
  },
}));

// A minimal stand-in for the socket.io client: enough for on/off/emit and a
// `connected` flag, with a helper to fire a server event from the test.
class FakeSocket {
  constructor() {
    this.connected = true;
    this.listeners = new Map();
  }
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
  }
  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }
  emit() {
    /* outgoing emits are not asserted on in these tests */
  }
  trigger(event, payload) {
    (this.listeners.get(event) || []).forEach((handler) => handler(payload));
  }
}

const USER = { id: "user-1", name: "Agata", email: "agata@example.com" };

describe("useConversationChat — chatError only fails the message it names", () => {
  let socket;

  beforeEach(() => {
    socket = new FakeSocket();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("with two messages pending, a rejection naming one tempId fails only that one", async () => {
    const { result } = renderHook(() => useConversationChat(socket, "conv-1", USER));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sendMessage("first message");
    });
    act(() => {
      result.current.sendMessage("second message");
    });

    expect(result.current.chatMessages).toHaveLength(2);
    const [first, second] = result.current.chatMessages;
    expect(first._pending).toBe(true);
    expect(second._pending).toBe(true);

    // The server rejects only the SECOND message — its own tempId comes back
    // on the chatError, exactly as the gateway now does.
    act(() => {
      socket.trigger("chatError", { reason: "not_a_member", tempId: second.id });
    });

    const [after1, after2] = result.current.chatMessages;
    expect(after1._pending).toBe(true);
    expect(after1._failed).toBeFalsy();
    expect(after2._pending).toBe(false);
    expect(after2._failed).toBe(true);
  });

  it("a chatError with no tempId (an unrelated handler elsewhere) touches nothing pending", async () => {
    const { result } = renderHook(() => useConversationChat(socket, "conv-1", USER));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sendMessage("still sending");
    });
    expect(result.current.chatMessages[0]._pending).toBe(true);

    // e.g. a rejected 'join' or an unrelated supportChat failure — both share
    // the same 'chatError' event name on the same socket.
    act(() => {
      socket.trigger("chatError", { reason: "not_a_member" });
    });

    expect(result.current.chatMessages[0]._pending).toBe(true);
    expect(result.current.chatMessages[0]._failed).toBeFalsy();
  });

  it("rate_limited never fails anything, even with a tempId", async () => {
    const { result } = renderHook(() => useConversationChat(socket, "conv-1", USER));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sendMessage("throttle me");
    });
    const tempId = result.current.chatMessages[0].id;

    act(() => {
      socket.trigger("chatError", { reason: "rate_limited", tempId });
    });

    expect(result.current.chatMessages[0]._pending).toBe(true);
    expect(result.current.chatMessages[0]._failed).toBeFalsy();
  });

  it("not_allowed (an edit/delete rejection) never fails a pending send", async () => {
    const { result } = renderHook(() => useConversationChat(socket, "conv-1", USER));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sendMessage("unrelated to any edit");
    });
    const tempId = result.current.chatMessages[0].id;

    act(() => {
      socket.trigger("chatError", { reason: "not_allowed", messageId: "some-other-message" });
    });

    expect(result.current.chatMessages[0].id).toBe(tempId);
    expect(result.current.chatMessages[0]._pending).toBe(true);
  });

  it("a matched rejection leaves an unrelated later pending message alone", async () => {
    // Same as the first test but confirms order/independence explicitly:
    // failing message A must not depend on message B's position or state.
    const { result } = renderHook(() => useConversationChat(socket, "conv-1", USER));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.sendMessage("A"));
    act(() => result.current.sendMessage("B"));
    act(() => result.current.sendMessage("C"));
    const [a, b, c] = result.current.chatMessages;

    act(() => {
      socket.trigger("chatError", { reason: "server_error", tempId: b.id });
    });

    const [afterA, afterB, afterC] = result.current.chatMessages;
    expect(afterA.id).toBe(a.id);
    expect(afterA._pending).toBe(true);
    expect(afterB.id).toBe(b.id);
    expect(afterB._failed).toBe(true);
    expect(afterC.id).toBe(c.id);
    expect(afterC._pending).toBe(true);
  });
});
