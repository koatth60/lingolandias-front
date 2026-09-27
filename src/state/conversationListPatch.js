// Patches one row of a locally-held conversation list in response to a live
// message event, instead of the caller re-fetching the whole /conversations
// page from the server on every single message sent anywhere on the
// platform (messages.jsx used to do exactly that on both
// 'newConversationMessage' and the sender's own 'conversationMessage').
//
// Returns null when the conversation isn't in the list the caller already
// has loaded (a page not yet fetched, or a brand-new conversation) — the
// caller falls back to a real fetch only in that case.
export function applyIncomingMessage(prev, { conversationId, content, senderId, senderName, timestamp, isOwn, activeRoomId }) {
  const idx = prev.findIndex((c) => c.id === conversationId);
  if (idx === -1) return null;
  const isOpenRightNow = conversationId === activeRoomId;
  const next = prev.map((c, i) => (i !== idx ? c : {
    ...c,
    lastMessage: { content, senderId, username: senderName, timestamp },
    lastActivityAt: timestamp,
    unreadCount: isOwn || isOpenRightNow ? c.unreadCount : (c.unreadCount || 0) + 1,
  }));
  return next.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });
}
