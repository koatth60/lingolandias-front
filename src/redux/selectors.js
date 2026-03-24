import { createSelector } from '@reduxjs/toolkit';

// ── User selectors ──────────────────────────────────────────────────────────

const selectUserState = (state) => state.user;

export const selectUserInfo = createSelector(
  selectUserState,
  (user) => user.userInfo?.user ?? null
);

export const selectUserSettings = createSelector(
  selectUserInfo,
  (user) => user?.settings ?? null
);

export const selectIsDarkMode = createSelector(
  selectUserInfo,
  (user) => user?.settings?.darkMode ?? false
);

export const selectSavedLanguage = createSelector(
  selectUserInfo,
  (user) => user?.settings?.language ?? 'en'
);

export const selectIsAdmin = createSelector(
  selectUserInfo,
  (user) => user?.isAdmin ?? false
);

// ── Chat selectors ───────────────────────────────────────────────────────────

const selectChatState = (state) => state.chat;

export const selectChatRooms = createSelector(
  selectChatState,
  (chat) => chat.rooms ?? []
);

export const selectUnreadCounts = createSelector(
  selectChatState,
  (chat) => chat.unreadCounts ?? {}
);

// ── Messages selectors ────────────────────────────────────────────────────────

const selectMessagesState = (state) => state.messages;

export const selectUnreadMessages = createSelector(
  selectMessagesState,
  (messages) => messages.unreadMessages ?? []
);

// ── Schedules selectors ───────────────────────────────────────────────────────

const selectSchedulesState = (state) => state.schedules;

export const selectAllSchedules = createSelector(
  selectSchedulesState,
  (schedules) => schedules.allSchedules ?? []
);

export const selectAllUsers = createSelector(
  selectSchedulesState,
  (schedules) => schedules.allUsers ?? []
);
