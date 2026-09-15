import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { uploadChatFile, UploadError } from "./uploadApi.js";

/**
 * The contract these cover: whatever content type is sent to /upload/chat-presign
 * must be the exact same value the browser then puts in the PUT's Content-Type
 * header. The backend signs the presigned URL with it, so any disagreement
 * between the two sides is a signature problem waiting to happen — and the
 * case where the two sides disagreed was precisely the one where the browser
 * could not infer a type (`file.type === ""`).
 */

// Captures every presign request body and every PUT the code makes.
let presignBodies;
let putCalls;
let backendUploads;
let presignResponse;
let putStatus;

const makeFile = (name, type, size = 10) => {
  const file = new File([new Uint8Array(size)], name, type ? { type } : undefined);
  // File size is read-only; tests that care about a specific size override it.
  Object.defineProperty(file, "size", { value: size });
  return file;
};

class FakeXHR {
  constructor() {
    this.headers = {};
    this.upload = {};
    this.status = 200;
    this.responseText = "";
  }
  open(method, url) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(name, value) {
    this.headers[name] = value;
  }
  send(body) {
    if (this.method === "PUT") {
      putCalls.push({ url: this.url, headers: this.headers, body });
      this.status = putStatus;
      this.onload();
      return;
    }
    // POST to our own /upload/chat-upload fallback route.
    backendUploads.push({ url: this.url, body });
    this.status = 200;
    this.responseText = JSON.stringify({ fileUrl: "https://s3.example/fallback.bin" });
    this.onload();
  }
}

beforeEach(() => {
  presignBodies = [];
  putCalls = [];
  backendUploads = [];
  putStatus = 200;
  presignResponse = {
    status: 201,
    body: {
      uploadUrl: "https://s3.example/signed",
      key: "chat-uploads/1-file.bin",
      fileUrl: "https://s3.example/chat-uploads/1-file.bin",
    },
  };

  vi.stubGlobal("localStorage", {
    getItem: () => "test-token",
    setItem: () => {},
  });
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
  vi.stubGlobal("fetch", async (url, options) => {
    presignBodies.push(JSON.parse(options.body));
    return {
      ok: presignResponse.status < 300,
      status: presignResponse.status,
      json: async () => presignResponse.body,
    };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("uploadChatFile — content type agreement", () => {
  it("falls back to application/octet-stream when the browser cannot type the file", async () => {
    // .xyz, .mkv, .srt, .pages and .pptx on some systems all land here.
    await uploadChatFile(makeFile("clase.xyz", ""));

    expect(presignBodies[0].contentType).toBe("application/octet-stream");
  });

  it("sends the SAME content type to the presign and in the PUT header", async () => {
    await uploadChatFile(makeFile("clase.xyz", ""));

    expect(putCalls).toHaveLength(1);
    expect(putCalls[0].headers["Content-Type"]).toBe(presignBodies[0].contentType);
  });

  it("always sets a Content-Type header, even for an untyped file", async () => {
    await uploadChatFile(makeFile("subtitulos.srt", ""));

    // Previously the header was only set `if (file.type)`, leaving the PUT
    // with no Content-Type while the presign had been signed with one.
    expect(putCalls[0].headers["Content-Type"]).toBeTruthy();
  });

  it("passes a real browser-supplied type through unchanged on both sides", async () => {
    await uploadChatFile(makeFile("leccion.pdf", "application/pdf"));

    expect(presignBodies[0].contentType).toBe("application/pdf");
    expect(putCalls[0].headers["Content-Type"]).toBe("application/pdf");
  });

  it("declares the file size so the backend can sign a bounded upload", async () => {
    await uploadChatFile(makeFile("video.mp4", "video/mp4", 12345));

    expect(presignBodies[0].size).toBe(12345);
  });
});

describe("uploadChatFile — failures", () => {
  it("surfaces the server's own error code for an oversized file", async () => {
    presignResponse = { status: 400, body: { code: "file_too_large" } };

    await expect(uploadChatFile(makeFile("enorme.mp4", "video/mp4"))).rejects.toMatchObject({
      code: "file_too_large",
    });
  });

  it("surfaces a rate-limit rejection instead of silently retrying", async () => {
    presignResponse = { status: 429, body: {} };

    await expect(uploadChatFile(makeFile("a.pdf", "application/pdf"))).rejects.toMatchObject({
      code: "too_many_uploads",
    });
  });

  it("falls back to the server route when S3 refuses the PUT", async () => {
    // A 403 used to map to "upload_failed", the one code that did NOT trigger
    // the fallback, so the attachment died with no second attempt.
    putStatus = 403;

    const url = await uploadChatFile(makeFile("a.pdf", "application/pdf"));

    expect(backendUploads).toHaveLength(1);
    expect(url).toBe("https://s3.example/fallback.bin");
  });

  it("rejects with an UploadError carrying a code the UI can translate", async () => {
    presignResponse = { status: 400, body: { code: "file_type_blocked" } };

    await expect(
      uploadChatFile(makeFile("malware.exe", "application/octet-stream")),
    ).rejects.toBeInstanceOf(UploadError);
  });
});
