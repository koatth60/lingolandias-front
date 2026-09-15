// Tracks whichever conversation/room is currently open on screen, so a
// notification for that same room can be suppressed (no toast/sound/unread
// bump for something you're already looking at). Set by whichever chat
// surface is currently mounted — CallChatWindow, messages.jsx — and read by
// NotificationsListener plus messages.jsx's own unread-count logic.
export const activeRoomRef = { current: null };
