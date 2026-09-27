import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import userReducer, { updateUserSettings } from '../redux/userSlice';
import { installSession, performLogout } from '../auth/session';
import sidebarReducer from '../redux/sidebarSlice';
import messageReducer from '../redux/messageSlice'; // Existing messages reducer
import filePreviewReducer from './filePreviewSlice';
import schedulesReducer from './schedulesSlice';
import notificationsReducer from './notificationsSlice';

// Intercept failed settings saves and notify the user
const settingsListener = createListenerMiddleware();
settingsListener.startListening({
  actionCreator: updateUserSettings.rejected,
  effect: (action, listenerApi) => {
    const status = action.payload?.status;
    if (status === 401 || status === 403) {
      toast.error('Your session has expired. Please log in again.', { toastId: 'session-expired' });
      performLogout(listenerApi.dispatch, { notifyServer: false });
    } else {
      toast.error('Could not save settings. Please try again.', { toastId: 'settings-error' });
    }
  },
});

// Until 2026-09-26 the login response carried password hashes (the user's and
// every assigned student's), and they were persisted here with the rest of
// userInfo. The server no longer sends them; this also scrubs copies already
// sitting in browsers, and anything that might slip through later.
const stripPasswords = (value, depth = 0) => {
  if (!value || typeof value !== 'object' || depth > 6) return value;
  if (Array.isArray(value)) {
    value.forEach((item) => stripPasswords(item, depth + 1));
    return value;
  }
  delete value.password;
  Object.values(value).forEach((child) => stripPasswords(child, depth + 1));
  return value;
};

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state, (key, val) => (key === 'password' ? undefined : val));
    localStorage.setItem('state', serializedState);
  } catch (e) {
    console.error('Could not save state', e);
  }
};

const debounce = (fn, wait) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

const debouncedSaveState = debounce(saveState, 500);

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    const state = JSON.parse(serializedState);
    // Strip transient fields — these must always reset to slice defaults on page load
    if (state?.user) {
      delete state.user.status;
      delete state.user.error;
      stripPasswords(state.user.userInfo);
      // localStorage 'token' is where the sliding refresh writes; the copy in
      // userInfo could be the one from login weeks ago. No token at all
      // means the session was ended (possibly from another tab).
      const token = localStorage.getItem('token');
      if (state.user.userInfo) {
        if (token) state.user.userInfo.token = token;
        else state.user.userInfo = null;
      }
    }
    // 'chat' is a retired slice (see redux/chatSlice.js's deletion) — every
    // existing user's localStorage still has it from before, and handing a
    // key with no matching reducer to configureStore as preloadedState logs
    // an "Unexpected key 'chat'" warning on every single load. Drop it here
    // rather than leaving that warning for the lifetime of the browser
    // profile that wrote it.
    if (state && 'chat' in state) {
      delete state.chat;
    }
    return state;
  } catch (e) {
    console.error('Could not load state', e);
    return undefined;
  }
};

const persistedState = loadState();

const store = configureStore({
  reducer: {
    user: userReducer,
    sidebar: sidebarReducer,
    messages: messageReducer,
    filePreview: filePreviewReducer,
    schedules: schedulesReducer,
    notifications: notificationsReducer,
  },
  preloadedState: persistedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(settingsListener.middleware),
});

store.subscribe(() => {
  const { status, error, ...userRest } = store.getState().user;
  // A tab still holding a user after the token was removed elsewhere must
  // not write that user back — that is how a logout in one tab used to be
  // undone by the next dispatch in another.
  if (userRest.userInfo && !localStorage.getItem('token')) return;
  debouncedSaveState({
    user: userRest,
    sidebar: store.getState().sidebar,
    messages: store.getState().messages,
  });
});

// Call this before window.location.reload() so debounce doesn't lose state
export const flushStateNow = () => {
  const { status, error, ...userRest } = store.getState().user;
  saveState({
    user: userRest,
    sidebar: store.getState().sidebar,
    messages: store.getState().messages,
  });
};

installSession(store);

export default store;