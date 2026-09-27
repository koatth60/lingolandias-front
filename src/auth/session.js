import { toast } from "react-toastify";
import { logout } from "../redux/userSlice";
import { socket } from "../socket";
import { messageCache } from "../state/messageCache";
import { conversationListCache } from "../state/conversationListCache";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * The one way to end a session. There used to be four logout paths (navbar,
 * dashboard sidebar, Settings, token expiry) that each did a different subset
 * of the work: only the navbar cleared the message caches, Settings never
 * told the server and never disconnected the socket (so the next person to
 * log in on that browser kept talking as the previous user), and nothing
 * reset the unread counters.
 *
 * Navigation is left to the caller; RequireAuth also sends anyone without a
 * token to /login on its own.
 */
export const performLogout = (dispatch, { notifyServer = true } = {}) => {
  // Read first: logout() below removes it, and the server identifies who is
  // logging out from this token.
  const token = localStorage.getItem("token");

  socket.disconnect();
  dispatch(logout());
  messageCache.clear();
  conversationListCache.clear();

  if (notifyServer && token) {
    fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      // Survives the page navigating away right after.
      keepalive: true,
    }).catch(() => {});
  }
};

// Requests whose 401 means "wrong credentials" or is already part of logging
// out, not "your session died".
const AUTH_ROUTES = ["/auth/login", "/auth/logout", "/auth/refresh", "/auth/reset-password", "/auth/forgot-password"];

let store = null;
let expiring = false;

/**
 * Called by the fetch/axios wrappers in api.js on any 401 from our backend.
 * Before this there was no global handling: an invalid or revoked token just
 * made every screen quietly render empty until the token's own 30-day expiry.
 */
export const handleUnauthorized = (url, sentToken) => {
  if (!store || expiring) return;
  if (typeof url === "string" && AUTH_ROUTES.some((route) => url.includes(route))) return;
  const current = localStorage.getItem("token");
  // A late response for a token that has since been replaced (refresh, or a
  // new login in another tab) says nothing about the current session.
  if (!current || (sentToken && sentToken !== current)) return;
  expiring = true;
  toast.error("Your session has expired. Please log in again.", { toastId: "session-expired" });
  performLogout(store.dispatch, { notifyServer: false });
  setTimeout(() => {
    expiring = false;
  }, 2000);
};

/**
 * Wires the store in and keeps every tab of the app on the same session:
 * logging out in one tab (or the installed desktop app) logs out the others,
 * instead of the other tab writing its still-logged-in state back to
 * localStorage and silently resurrecting the session.
 */
export const installSession = (appStore) => {
  store = appStore;
  window.addEventListener("storage", (event) => {
    if (event.key !== "token") return;
    const loggedIn = !!store.getState().user.userInfo;
    if (!event.newValue && loggedIn) {
      socket.disconnect();
      store.dispatch(logout());
      messageCache.clear();
      conversationListCache.clear();
    }
  });
};
