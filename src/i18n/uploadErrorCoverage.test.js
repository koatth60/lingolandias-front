import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

import en from "./locales/en.json";
import es from "./locales/es.json";
import pl from "./locales/pl.json";

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), "utf8");

/**
 * An upload failure is shown to the user by looking up
 * `chatWindow.uploadError.<code>`. A code with no entry renders as the raw key
 * ("chatWindow.uploadError.presign_failed") unless a defaultValue catches it —
 * so this locks two things: every reachable code is translated in all three
 * languages, and every render site passes a fallback.
 *
 * Codes come from two places, which is how they get missed: some are thrown
 * literally in uploadApi.js, others are adopted verbatim from the backend's
 * 400 response body.
 */
// Codes the backend can return in a 400 body, which uploadApi adopts verbatim.
// Listed here rather than scraped so these tests run without the backend repo
// checked out; the cross-check below catches drift when it is present.
const SERVER_CODES = ["file_type_blocked", "file_too_large"];

// Only resolvable in a full local checkout (both repos side by side).
const BACKEND_CONTROLLER =
  "../../../../lingo-server-nest/src/upload-files/upload-files.controller.ts";

const collectCodes = () => {
  const client = read("../data/uploadApi.js");
  const literal = [...client.matchAll(/UploadError\("([a-z_]+)"/g)].map((m) => m[1]);
  return [...new Set([...literal, ...SERVER_CODES, "upload_failed"])].sort();
};

const LOCALES = { en, es, pl };

describe("upload error messages", () => {
  const codes = collectCodes();

  it("finds every code the upload path can produce", () => {
    // Guards the guard: if the scrape stops matching, this test would
    // otherwise pass vacuously.
    expect(codes.length).toBeGreaterThanOrEqual(8);
    expect(codes).toContain("too_many_uploads");
    expect(codes).toContain("file_too_large");
  });

  Object.entries(LOCALES).forEach(([lang, bundle]) => {
    it(`${lang} translates every code`, () => {
      const messages = bundle.chatWindow?.uploadError || {};
      const missing = codes.filter((c) => !messages[c]?.trim());
      expect(missing).toEqual([]);
    });

    it(`${lang} never echoes the code back as the message`, () => {
      const messages = bundle.chatWindow?.uploadError || {};
      const echoed = codes.filter((c) => messages[c] === c);
      expect(echoed).toEqual([]);
    });
  });

  it("keeps the three languages in sync with each other", () => {
    const keys = Object.entries(LOCALES).map(([lang, b]) => [
      lang,
      Object.keys(b.chatWindow?.uploadError || {}).sort(),
    ]);
    const [, reference] = keys[0];
    keys.forEach(([lang, k]) => expect(k, `${lang} differs`).toEqual(reference));
  });

  it("stays in sync with the codes the backend actually returns", () => {
    let server;
    try {
      server = read(BACKEND_CONTROLLER);
    } catch {
      // Backend repo not checked out next to this one (CI, or a frontend-only
      // clone). SERVER_CODES is then taken on trust rather than failing.
      return;
    }
    const actual = [...server.matchAll(/code:\s*'([a-z_]+)'/g)].map((m) => m[1]);
    const untranslated = [...new Set(actual)].filter((c) => !codes.includes(c));
    expect(untranslated, "backend returns a code the frontend cannot translate").toEqual([]);
  });

  it("passes a defaultValue everywhere a code is rendered", () => {
    // Belt and braces: even an unknown code from a future backend version
    // must not surface as a raw i18n key in the UI.
    ["../components/messages/UploadStatus.jsx", "../components/messages/ChatWindowComponent.jsx"]
      .forEach((file) => {
        const source = read(file);
        const uses = [...source.matchAll(/t\(`chatWindow\.uploadError\.\$\{[^}]+\}`[^)]*\)/g)];
        uses.forEach((use) => {
          expect(use[0], `${file} renders a code without a fallback`).toContain("defaultValue");
        });
      });
  });
});
