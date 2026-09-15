// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * chatSlice was deleted, but every existing user's browser already has a
 * persisted blob under localStorage['state'] with a 'chat' key inside it
 * (redux/store.js writes the whole store there on every change). Handing
 * that stale key to configureStore as preloadedState, with no 'chat' reducer
 * left to claim it, is exactly what Redux's combineReducers warns about
 * ("Unexpected key 'chat' found in preloadedState") — on every single page
 * load, for the lifetime of that browser profile, unless loadState() strips
 * it. The easy case (empty localStorage) never exercises this at all, which
 * is why it has to be tested with a seeded 'chat' key, not without one.
 *
 * store.js runs its localStorage read as a side effect of being imported, so
 * each case seeds localStorage and then imports the module fresh.
 */

const STATE_KEY = "state";

const freshStore = async () => {
  vi.resetModules();
  const mod = await import("./store.js");
  return mod.default;
};

describe("redux/store.js — rehydrating a real (pre-existing) user", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not warn about an unexpected 'chat' key for a user whose localStorage predates the slice's removal", async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        user: { userInfo: null, status: "idle", error: null },
        sidebar: { collapsed: false },
        messages: { unreadByRoom: {} },
        // The exact shape chatSlice used to persist — this is what every
        // real user's browser already has on disk.
        chat: { lastMessagesByRoom: {}, unreadCountsByRoom: { "room-1": 3 }, studentUnreadCount: 2 },
      })
    );

    await freshStore();

    const warnedAboutChat = [...console.error.mock.calls, ...console.warn.mock.calls]
      .flat()
      .some((arg) => typeof arg === "string" && arg.includes("chat"));
    expect(warnedAboutChat).toBe(false);
  });

  it("the rehydrated store has no chat slice at all", async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        user: { userInfo: null },
        chat: { unreadCountsByRoom: { "room-1": 3 } },
      })
    );

    const store = await freshStore();

    expect(store.getState().chat).toBeUndefined();
    expect("chat" in store.getState()).toBe(false);
  });

  it("leaves every other persisted slice intact — this is a targeted strip, not a wipe", async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        user: { userInfo: { user: { id: "u1", name: "Agata" } } },
        sidebar: { collapsed: true },
        messages: { unreadByRoom: { room1: 2 } },
        chat: { unreadCountsByRoom: { room1: 5 } },
      })
    );

    const store = await freshStore();
    const state = store.getState();

    expect(state.user.userInfo.user.name).toBe("Agata");
    expect(state.sidebar.collapsed).toBe(true);
    expect(state.messages.unreadByRoom.room1).toBe(2);
  });

  it("a brand-new user (no localStorage at all) still starts up clean — the easy case, kept as a sanity check", async () => {
    // localStorage.clear() already ran in beforeEach; nothing to seed.
    const store = await freshStore();

    expect(store.getState().chat).toBeUndefined();
    const warnedAboutChat = [...console.error.mock.calls, ...console.warn.mock.calls]
      .flat()
      .some((arg) => typeof arg === "string" && arg.includes("chat"));
    expect(warnedAboutChat).toBe(false);
  });

  it("a blob with no 'chat' key at all (already-migrated user) is untouched and unwarned", async () => {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ user: { userInfo: null }, sidebar: { collapsed: false } })
    );

    const store = await freshStore();

    expect(store.getState().sidebar.collapsed).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("persisting after this runs never writes 'chat' back to localStorage", async () => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ chat: { unreadCountsByRoom: {} } }));
    const store = await freshStore();

    // Any dispatch triggers store.subscribe's debounced save; use a real
    // action rather than reaching into internals.
    const { updateUserSettings } = await import("./userSlice.js");
    store.dispatch(updateUserSettings.pending("req-1", undefined));

    await new Promise((resolve) => setTimeout(resolve, 600)); // past the 500ms debounce

    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    expect("chat" in saved).toBe(false);
  });
});
