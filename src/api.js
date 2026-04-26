import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ── Axios interceptor ──
// Automatically adds Authorization header to every axios request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Fetch interceptor ──
// Wraps the native fetch to auto-add Authorization header for
// requests to our backend. Leaves external requests untouched.
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  if (typeof url === "string" && url.startsWith(BACKEND_URL)) {
    const token = localStorage.getItem("token");
    if (token) {
      const headers = new Headers(options.headers || {});
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      options = { ...options, headers };
    }
  }
  return originalFetch.call(this, url, options);
};
