// Tracks the chat room currently open in useSocketManager.
// Used by GlobalNotificationHandler to avoid double-playing the sound
// for the room whose chat window is already visible.
export const activeRoomRef = { current: null };
