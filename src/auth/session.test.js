// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("react-toastify", () => ({ toast: { error: vi.fn() } }));
vi.mock("../socket", () => ({ socket: { disconnect: vi.fn() } }));
vi.mock("../state/messageCache", () => ({ messageCache: { clear: vi.fn() } }));
vi.mock("../state/conversationListCache", () => ({ conversationListCache: { clear: vi.fn() } }));

const { performLogout, handleUnauthorized, installSession } = await import("./session.js");
const { socket } = await import("../socket");
const { messageCache } = await import("../state/messageCache");
const { logout } = await import("../redux/userSlice");

const makeStore = () => {
  const store = { dispatch: vi.fn(), getState: () => ({ user: { userInfo: { user: { id: "u" } } } }) };
  return store;
};

describe("performLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("token", "tok");
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("does the whole job in one place: socket, state, caches, server", () => {
    const dispatch = vi.fn();
    performLogout(dispatch);
    expect(socket.disconnect).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(logout());
    expect(messageCache.clear).toHaveBeenCalled();
    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer tok");
  });
});

describe("handleUnauthorized", () => {
  let store;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    store = makeStore();
    installSession(store);
    localStorage.setItem("token", "current");
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("logs out on a 401 for the current token", () => {
    handleUnauthorized("https://api/conversations", "current");
    expect(store.dispatch).toHaveBeenCalledWith(logout());
    vi.advanceTimersByTime(3000);
  });

  it("ignores a late 401 for a token that has since been replaced", () => {
    handleUnauthorized("https://api/conversations", "old-token");
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it("ignores 401s from the login and refresh routes", () => {
    handleUnauthorized("https://api/auth/login", "current");
    handleUnauthorized("https://api/auth/refresh", "current");
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
