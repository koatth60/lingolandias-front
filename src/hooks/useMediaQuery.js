import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query. Used where a layout used to render the same
 * component twice (a desktop copy and a mobile copy) and hide one with CSS:
 * both copies ran their effects, sockets and fetches at the same time.
 */
const useMediaQuery = (query) => {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};

export default useMediaQuery;
