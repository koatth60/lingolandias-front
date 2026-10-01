// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { HalloweenProvider } from "../../context/HalloweenContext";
import HalloweenInvite from "./HalloweenInvite";

// Keys come back as-is, so the assertions pin the i18n keys, not the wording.
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k) => k }) }));

const makeStore = (user) =>
  configureStore({ reducer: { user: () => ({ userInfo: { user } }) } });

const mount = (user = { id: "u1" }) =>
  render(
    <Provider store={makeStore(user)}>
      <HalloweenProvider>
        <HalloweenInvite />
      </HalloweenProvider>
    </Provider>
  );

describe("Halloween invite flow", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1, 9, 0)); // Oct 1
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("invites on sign-in, then asks keep-or-revert after trying it; Keep persists", () => {
    mount();
    expect(screen.getByText("halloween.inviteTitle")).toBeTruthy();
    expect(document.documentElement.classList.contains("theme-hw")).toBe(false);

    fireEvent.click(screen.getByText("halloween.try"));
    expect(document.documentElement.classList.contains("theme-hw")).toBe(true);
    expect(screen.getByText("halloween.confirmTitle")).toBeTruthy();

    fireEvent.click(screen.getByText("halloween.keep"));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.documentElement.classList.contains("theme-hw")).toBe(true);
    expect(localStorage.getItem("ll-hw-choice-u1")).toBe("kept");

    cleanup();
    mount(); // next login: stays quiet, theme stays on
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.documentElement.classList.contains("theme-hw")).toBe(true);
  });

  it("Back to my theme turns it off and never asks again", () => {
    mount();
    fireEvent.click(screen.getByText("halloween.try"));
    fireEvent.click(screen.getByText("halloween.revert"));
    expect(document.documentElement.classList.contains("theme-hw")).toBe(false);
    expect(localStorage.getItem("ll-hw-choice-u1")).toBe("declined");
    cleanup();
    mount();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("Not now declines without touching the theme", () => {
    mount();
    fireEvent.click(screen.getByText("halloween.notNow"));
    expect(document.documentElement.classList.contains("theme-hw")).toBe(false);
    expect(localStorage.getItem("ll-hw-choice-u1")).toBe("declined");
  });

  it("Escape dismisses the invite but not the follow-up", () => {
    mount();
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();

    cleanup();
    localStorage.clear();
    mount();
    fireEvent.click(screen.getByText("halloween.try"));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.getByText("halloween.confirmTitle")).toBeTruthy();
  });

  it("re-asks the follow-up if they left while trying it", () => {
    mount();
    fireEvent.click(screen.getByText("halloween.try"));
    cleanup(); // closed the tab without answering
    mount();
    expect(screen.getByText("halloween.confirmTitle")).toBeTruthy();
  });

  it("shows nothing outside October", () => {
    vi.setSystemTime(new Date(2026, 10, 3)); // Nov 3
    mount();
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("switches a kept theme off once October is over", () => {
    localStorage.setItem("ll-theme-halloween", "on");
    localStorage.setItem("ll-hw-choice-u1", "kept");
    vi.setSystemTime(new Date(2026, 10, 2)); // Nov 2
    mount();
    expect(document.documentElement.classList.contains("theme-hw")).toBe(false);
    expect(localStorage.getItem("ll-theme-halloween")).toBe("off");
  });

  it("does not prompt before anyone is signed in", () => {
    mount(null);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});
