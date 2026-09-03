import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./i18n/index.js";

// Registered unconditionally (not just when a user opts into push
// notifications in Settings) — a controlling service worker is one of the
// requirements for Chrome to ever offer "Install Lingolandias" at all. Safe
// to double-register: Settings.jsx's own subscribeToPush() also calls
// register("/sw.js") when a user later opts into push, and registering the
// same script twice just returns the existing registration.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}

// Chrome fires "beforeinstallprompt" exactly once per page load, as soon as
// it decides the page is installable — which can be well before the user
// ever navigates to Settings (where useInstallPrompt.js's listener lives).
// A listener that only attaches once that component mounts misses the event
// entirely: the browser's own address-bar install icon still works (it has
// its own separate hook into the same signal), but our in-app "Install"
// button in Settings never lights up. Capturing it here, before React even
// renders, and stashing it on window means useInstallPrompt can pick it up
// no matter how late the user opens Settings.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__deferredInstallPrompt = e;
});
window.addEventListener("appinstalled", () => {
  window.__deferredInstallPrompt = null;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <div className="relative">
          <App />
        </div>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
