import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Halloween is a purely client-side seasonal theme: it never touches the
// backend user.settings schema (unlike darkMode, which is a real account
// preference synced via PATCH /settings). It rides on top of dark mode —
// enabling it forces dark regardless of the user's own light/dark choice,
// and disabling it falls back to whatever their real setting is.
const STORAGE_KEY = "ll-theme-halloween";
const HalloweenContext = createContext(null);

export const HALLOWEEN_WINDOW = { startMonth: 9, endMonth: 10 }; // Oct 1 – Nov 1 (0-indexed: 9=Oct)

export function isHalloweenSeason(date = new Date()) {
  const m = date.getMonth();
  return m === HALLOWEEN_WINDOW.startMonth; // October only
}

// November and December: the season is over, so a theme someone kept "for the rest of
// October" switches itself off. Before October (previews, dev) it is left alone.
export function isHalloweenOver(date = new Date()) {
  const m = date.getMonth();
  return m === 10 || m === 11;
}

export const HalloweenProvider = ({ children }) => {
  const [enabled, setEnabledState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      return false;
    }
  });

  const setEnabled = (value) => {
    setEnabledState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
    } catch {
      // Private window / blocked storage — theme still applies for this tab.
    }
  };

  useEffect(() => {
    if (enabled && isHalloweenOver()) setEnabled(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle("theme-hw", enabled);
  }, [enabled]);

  const value = useMemo(() => ({ enabled, setEnabled, seasonal: isHalloweenSeason() }), [enabled]);

  return <HalloweenContext.Provider value={value}>{children}</HalloweenContext.Provider>;
};

export const useHalloween = () => {
  const ctx = useContext(HalloweenContext);
  if (!ctx) throw new Error("useHalloween must be used within a HalloweenProvider");
  return ctx;
};
