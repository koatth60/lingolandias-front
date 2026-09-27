import { describe, it, expect } from "vitest";
import { applyIncomingMessage } from "./conversationListPatch";

/**
 * Phase 3 (2026-09-27): messages.jsx used to re-fetch the whole
 * /conversations list from the server on every single new message anywhere
 * (and on every message the user sent themselves) just to bump one row's
 * preview and move it to the top. applyIncomingMessage replaces that with an
 * in-place patch of the already-loaded list.
 */

const makeList = () => [
  { id: "conv-a", pinned: false, lastActivityAt: "2026-09-27T10:00:00.000Z", unreadCount: 0 },
  { id: "conv-b", pinned: false, lastActivityAt: "2026-09-27T09:00:00.000Z", unreadCount: 2 },
  { id: "conv-c", pinned: true, lastActivityAt: "2026-09-27T08:00:00.000Z", unreadCount: 0 },
];

describe("applyIncomingMessage", () => {
  it("returns null when the conversation is not in the loaded list", () => {
    const result = applyIncomingMessage(makeList(), {
      conversationId: "conv-unknown",
      content: "hi",
      senderId: "u1",
      senderName: "Ana",
      timestamp: "2026-09-27T11:00:00.000Z",
      isOwn: false,
      activeRoomId: null,
    });
    expect(result).toBeNull();
  });

  it("bumps unread count and moves the conversation to the top for a message from someone else", () => {
    const result = applyIncomingMessage(makeList(), {
      conversationId: "conv-b",
      content: "new message",
      senderId: "u1",
      senderName: "Ana",
      timestamp: "2026-09-27T11:00:00.000Z",
      isOwn: false,
      activeRoomId: null,
    });
    // conv-c stays first: pinned always sorts above unpinned regardless of activity.
    expect(result.map((c) => c.id)).toEqual(["conv-c", "conv-b", "conv-a"]);
    const patched = result.find((c) => c.id === "conv-b");
    expect(patched.unreadCount).toBe(3);
    expect(patched.lastMessage).toEqual({
      content: "new message", senderId: "u1", username: "Ana", timestamp: "2026-09-27T11:00:00.000Z",
    });
  });

  it("does not bump unread count for the conversation currently open", () => {
    const result = applyIncomingMessage(makeList(), {
      conversationId: "conv-b",
      content: "new message",
      senderId: "u1",
      senderName: "Ana",
      timestamp: "2026-09-27T11:00:00.000Z",
      isOwn: false,
      activeRoomId: "conv-b",
    });
    expect(result.find((c) => c.id === "conv-b").unreadCount).toBe(2);
  });

  it("does not bump unread count for the user's own message", () => {
    const result = applyIncomingMessage(makeList(), {
      conversationId: "conv-a",
      content: "sent by me",
      senderId: "me",
      senderName: "Me",
      timestamp: "2026-09-27T11:00:00.000Z",
      isOwn: true,
      activeRoomId: null,
    });
    expect(result.find((c) => c.id === "conv-a").unreadCount).toBe(0);
  });

  it("leaves the rest of the row untouched (id, pinned, any other field)", () => {
    const list = [{ id: "conv-a", pinned: false, lastActivityAt: "2026-09-27T10:00:00.000Z", unreadCount: 0, name: "Ana Lopez", otherUser: { id: "u1" } }];
    const result = applyIncomingMessage(list, {
      conversationId: "conv-a",
      content: "hi",
      senderId: "u1",
      senderName: "Ana",
      timestamp: "2026-09-27T11:00:00.000Z",
      isOwn: false,
      activeRoomId: null,
    });
    expect(result[0].name).toBe("Ana Lopez");
    expect(result[0].otherUser).toEqual({ id: "u1" });
  });
});
