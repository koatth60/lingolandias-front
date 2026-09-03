import { createSlice } from '@reduxjs/toolkit';

// Single source of truth for per-conversation unread counts — replaces three
// previously-independent, unsynchronized counters (chatSlice.unreadCountsByRoom,
// chatSlice.studentUnreadCount, and each component's own local re-fetch of
// GET /conversations). Both dashboard.jsx (always mounted, drives the sidebar
// badge) and messages.jsx (drives the chat list rows) read/write this same
// state, so the two can never disagree the way they used to.
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadByConversation: {},
    mutedByConversation: {},
  },
  reducers: {
    // Bulk-merges a fresh GET /conversations response — the server already
    // returns 0 for a muted conversation's unreadCount, so this alone keeps
    // totals correct; mutedByConversation is only needed separately to gate
    // the notification sound off a bare conversationId (see dashboard.jsx).
    setConversationsSnapshot: (state, action) => {
      (action.payload || []).forEach((c) => {
        if (!c?.id) return;
        state.unreadByConversation[c.id] = c.unreadCount || 0;
        state.mutedByConversation[c.id] = !!c.muted;
      });
    },
    incrementConversationUnread: (state, action) => {
      const id = action.payload;
      if (state.mutedByConversation[id]) return;
      state.unreadByConversation[id] = (state.unreadByConversation[id] || 0) + 1;
    },
    clearConversationUnread: (state, action) => {
      state.unreadByConversation[action.payload] = 0;
    },
    setConversationMuted: (state, action) => {
      const { id, muted } = action.payload;
      state.mutedByConversation[id] = muted;
      if (muted) state.unreadByConversation[id] = 0;
    },
    removeConversation: (state, action) => {
      delete state.unreadByConversation[action.payload];
      delete state.mutedByConversation[action.payload];
    },
  },
});

export const {
  setConversationsSnapshot,
  incrementConversationUnread,
  clearConversationUnread,
  setConversationMuted,
  removeConversation,
} = notificationsSlice.actions;

export const selectTotalUnread = (state) =>
  Object.values(state.notifications.unreadByConversation).reduce((sum, c) => sum + c, 0);

// Curried so it works as `useSelector(selectUnreadForConversation(id))` —
// used by the classroom's own chat toggle button, which needs just the one
// conversation's count rather than the app-wide total.
export const selectUnreadForConversation = (conversationId) => (state) =>
  (conversationId && state.notifications.unreadByConversation[conversationId]) || 0;

export default notificationsSlice.reducer;
