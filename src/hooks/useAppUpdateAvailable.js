import { useEffect, useRef, useState } from "react";

// Detects a new deploy by periodically re-fetching index.html (bypassing
// cache) and comparing it against the copy captured when the app first
// loaded. A changed index.html means new hashed asset filenames are live —
// exactly the situation where an already-open tab keeps running old code
// until reloaded. No server changes needed: nginx already serves index.html
// with no-cache headers (it has to, for the hashed-asset scheme to work at
// all), so a plain fetch always reflects the current deploy.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

const useAppUpdateAvailable = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const baselineHtmlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchIndexHtml = async () => {
      try {
        const res = await fetch(`/index.html?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return null;
        return await res.text();
      } catch {
        return null;
      }
    };

    const captureBaseline = async () => {
      const html = await fetchIndexHtml();
      if (!cancelled && html && !baselineHtmlRef.current) baselineHtmlRef.current = html;
    };
    captureBaseline();

    const checkForUpdate = async () => {
      // Skip while backgrounded — no point spending a request on a tab
      // nobody's looking at, and it'd only be able to show the banner once
      // they come back anyway.
      if (!baselineHtmlRef.current || document.visibilityState !== "visible") return;
      const html = await fetchIndexHtml();
      if (!cancelled && html && html !== baselineHtmlRef.current) {
        setUpdateAvailable(true);
      }
    };

    const intervalId = setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    const handleVisibility = () => { if (document.visibilityState === "visible") checkForUpdate(); };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return updateAvailable;
};

export default useAppUpdateAvailable;
