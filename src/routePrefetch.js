// Maps each sidebar route to the dynamic import() behind its lazy-loaded
// page component (see App.jsx, which imports its lazy() functions from
// here too, so there's only ever one list to keep in sync). The sidebar
// (dashboard.jsx) calls prefetchRoute() on hover/focus/touchstart — a few
// hundred ms before a click usually lands — so by the time the click fires,
// the chunk is often already downloaded and the page swaps in instantly
// instead of showing a loading flash. Calling it again once a chunk is
// already loaded is a harmless no-op (the browser's module cache
// short-circuits it), and calling it for a chunk nobody ever clicks costs
// nothing beyond that one wasted request — deliberately NOT done eagerly
// for every route on app load, since some users are on slow/metered
// connections where downloading everything up front would hurt more than
// the loading flash it's meant to avoid.
export const routeImports = {
  "/home": () => import("./sections/home"),
  "/profile": () => import("./sections/profile"),
  "/admin": () => import("./components/admin/admin"),
  "/schedule": () => import("./components/schedule/schedule"),
  "/messages": () => import("./sections/messages"),
  "/support": () => import("./sections/support"),
  "/help-center": () => import("./components/help-center/HelpCenter"),
  "/settings": () => import("./components/settings/Settings"),
  "/trello": () => import("./sections/trello"),
  "/admin-trello": () => import("./sections/adminTrello"),
  "/admin-meeting-logs": () => import("./sections/adminMeetingLogs"),
  "/analytics": () => import("./sections/analytics"),
  "/recordings": () => import("./sections/recordings"),
};

export const prefetchRoute = (path) => {
  routeImports[path]?.();
};
