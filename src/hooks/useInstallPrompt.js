import { useCallback, useEffect, useState } from "react";

// Chrome/Edge only fire "beforeinstallprompt" if the page passes the
// installability checklist (manifest + icons + a controlling service worker,
// served over HTTPS) AND it hasn't already been installed. Capturing the
// event ourselves (instead of relying on the browser's own hidden
// address-bar icon) lets Settings show a real, always-visible "Install"
// button — much more discoverable for someone who's never used a PWA before.
const useInstallPrompt = () => {
  // main.jsx attaches its own "beforeinstallprompt" listener at app boot
  // (before this hook — or even React — ever mounts) and stashes the event
  // on window, since the browser only fires it once per page load and it
  // can easily happen before someone navigates to Settings. Read whatever
  // it already captured as the initial value instead of starting at null.
  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__deferredInstallPrompt || null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true
  );

  useEffect(() => {
    // Covers the case where this hook mounts before main.jsx's listener has
    // fired yet (normal first render) as well as a late capture that lands
    // after this effect subscribed.
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      window.__deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    if (window.__deferredInstallPrompt) setDeferredPrompt(window.__deferredInstallPrompt);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    window.__deferredInstallPrompt = null;
    setDeferredPrompt(null);
    return outcome; // "accepted" | "dismissed"
  }, [deferredPrompt]);

  return {
    // true once the browser has actually offered the install event — this is
    // the ONLY reliable "can we show our own install button" signal
    // (Chrome/Edge/Brave on Windows, Mac, Linux, Android). Safari/iOS and
    // Firefox never fire this event at all; there's no button to show there,
    // the site just keeps working as a normal page.
    canInstall: !!deferredPrompt,
    isInstalled,
    promptInstall,
  };
};

export default useInstallPrompt;
