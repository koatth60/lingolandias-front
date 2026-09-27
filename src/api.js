import axios from "axios";
import { handleUnauthorized } from "./auth/session";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const bearerOf = (value) =>
  typeof value === "string" && value.startsWith("Bearer ") ? value.slice(7) : null;

// ── Axios interceptor ──
// Automatically adds Authorization header to every axios request to our
// backend. It used to attach the JWT to any URL, including third parties.
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const url = config.url || "";
  if (token && url.startsWith(BACKEND_URL) && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 from our backend means the session is gone (expired, revoked, or the
// user no longer exists) — log out once, everywhere, instead of leaving every
// screen to fail quietly on its own.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || "";
    if (error?.response?.status === 401 && url.startsWith(BACKEND_URL)) {
      handleUnauthorized(url, bearerOf(error.config.headers?.Authorization));
    }
    return Promise.reject(error);
  },
);

// ── Fetch interceptor ──
// Wraps the native fetch to auto-add Authorization header for
// requests to our backend. Leaves external requests untouched.
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const isBackend = typeof url === "string" && url.startsWith(BACKEND_URL);
  let sentToken = null;
  if (isBackend) {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem("token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
      options = { ...options, headers };
    }
    sentToken = bearerOf(headers.get("Authorization"));
  }
  const request = originalFetch.call(this, url, options);
  if (!isBackend) return request;
  return request.then((response) => {
    if (response.status === 401) handleUnauthorized(url, sentToken);
    return response;
  });
};
