// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { nextPrompt, readChoice, writeChoice } from "./halloweenChoice";

describe("nextPrompt", () => {
  it("asks first-time visitors in October", () => {
    expect(nextPrompt({ seasonal: true, enabled: false, choice: null })).toBe("invite");
  });
  it("never prompts outside October", () => {
    expect(nextPrompt({ seasonal: false, enabled: false, choice: null })).toBeNull();
    expect(nextPrompt({ seasonal: false, enabled: true, choice: "trying" })).toBeNull();
  });
  it("re-asks the follow-up if they closed the tab while trying it", () => {
    expect(nextPrompt({ seasonal: true, enabled: true, choice: "trying" })).toBe("confirm");
  });
  it("falls back to the invite if 'trying' lost its theme", () => {
    expect(nextPrompt({ seasonal: true, enabled: false, choice: "trying" })).toBe("invite");
  });
  it("stays quiet once they kept it or declined", () => {
    expect(nextPrompt({ seasonal: true, enabled: true, choice: "kept" })).toBeNull();
    expect(nextPrompt({ seasonal: true, enabled: false, choice: "declined" })).toBeNull();
  });
  it("treats someone who enabled it in Settings as already decided", () => {
    expect(nextPrompt({ seasonal: true, enabled: true, choice: null })).toBeNull();
  });
});

describe("choice storage", () => {
  beforeEach(() => localStorage.clear());
  it("round-trips and ignores junk", () => {
    expect(readChoice("u1")).toBeNull();
    writeChoice("u1", "kept");
    expect(readChoice("u1")).toBe("kept");
    localStorage.setItem("ll-hw-choice-u2", "banana");
    expect(readChoice("u2")).toBeNull();
  });
  it("keeps accounts separate", () => {
    writeChoice("a", "declined");
    expect(readChoice("b")).toBeNull();
  });
});
