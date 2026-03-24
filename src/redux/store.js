import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import userReducer, { updateUserSettings, logout } from '../redux/userSlice';
import sidebarReducer from '../redux/sidebarSlice';
import messageReducer from '../redux/messageSlice'; // Existing messages reducer
import chatReducer from '../redux/chatSlice'; // New chat reducer
import filePreviewReducer from './filePreviewSlice';
import schedulesReducer from './schedulesSlice';

// Intercept failed settings saves and notify the user
const settingsListener = createListenerMiddleware();
settingsListener.startListening({
  actionCreator: updateUserSettings.rejected,
  effect: (action, listenerApi) => {
    const status = action.payload?.status;
    if (status === 401 || status === 403) {
      toast.error('Your session has expired. Please log in again.', { toastId: 'session-expired' });
      listenerApi.dispatch(logout());
    } else {
      toast.error('Could not save settings. Please try again.', { toastId: 'settings-error' });
    }
  },
});

const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
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
    chat: chatReducer,
    filePreview: filePreviewReducer,
    schedules: schedulesReducer,
  },
  preloadedState: persistedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(settingsListener.middleware),
});

store.subscribe(() => {
  const { status, error, ...userRest } = store.getState().user;
  debouncedSaveState({
    user: userRest,
    sidebar: store.getState().sidebar,
    messages: store.getState().messages,
    chat: store.getState().chat,
  });
});

// Call this before window.location.reload() so debounce doesn't lose state
export const flushStateNow = () => {
  const { status, error, ...userRest } = store.getState().user;
  saveState({
    user: userRest,
    sidebar: store.getState().sidebar,
    messages: store.getState().messages,
    chat: store.getState().chat,
  });
};

export default store;