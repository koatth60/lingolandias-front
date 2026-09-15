const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Error thrown by uploadChatFile with a stable `code` the UI can turn into a
 * translated message. Callers should never surface `message` directly.
 */
export class UploadError extends Error {
  constructor(code, cause) {
    super(code);
    this.name = "UploadError";
    this.code = code;
    this.cause = cause;
  }
}

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * PUT straight to S3 with progress. fetch() can't report upload progress, so
 * this is XHR — a teacher sending a 700 MB class recording needs to see that
 * something is happening.
 */
const putToS3 = (uploadUrl, file, onProgress, signal) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError("upload_failed", `S3 responded ${xhr.status}`));
    };
    xhr.onerror = () =>
      // A failure with no status at all is almost always the bucket's CORS
      // rules refusing the PUT, which the caller can recover from by falling
      // back to the server-side route.
      reject(new UploadError("direct_upload_blocked", "network/CORS error on PUT"));
    xhr.onabort = () => reject(new UploadError("aborted"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(file);
  });

/** Legacy multipart route — the file passes through nginx and the API. */
const uploadViaBackend = (file, onProgress, signal) =>
  new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URL}/upload/chat-upload`, true);
    const token = localStorage.getItem("token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status === 413) {
        reject(new UploadError("too_large_for_server"));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new UploadError(xhr.status === 400 ? "file_type_blocked" : "upload_failed"));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText).fileUrl);
      } catch (err) {
        reject(new UploadError("upload_failed", err));
      }
    };
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.onabort = () => reject(new UploadError("aborted"));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });

/**
 * Uploads a chat attachment and resolves with its public URL.
 *
 * Primary path is a presigned PUT straight to S3, which is what makes the
 * size limit go away: the bytes never pass through nginx (whose
 * client_max_body_size capped this at a few MB) or through the Node process
 * (which used to buffer the entire file in memory). The old multipart
 * endpoint stays as a fallback for the case where the bucket's CORS rules
 * refuse a direct PUT.
 *
 * Rejects with an UploadError carrying a `code`; callers are expected to show
 * it. The previous implementation swallowed every failure in a console.error
 * and cleared the attachment, which is why "I sent the PDF and nothing
 * happened" was the reported symptom rather than any error message.
 */
export const uploadChatFile = async (file, { onProgress, signal } = {}) => {
  let presign;
  try {
    const res = await fetch(`${BACKEND_URL}/upload/chat-presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
      signal,
    });
    if (res.status === 400) throw new UploadError("file_type_blocked");
    if (res.status === 401) throw new UploadError("session_expired");
    if (!res.ok) throw new UploadError("presign_failed");
    presign = await res.json();
  } catch (err) {
    if (err instanceof UploadError && err.code !== "presign_failed") throw err;
    // Couldn't get a presigned URL at all — fall back rather than fail.
    return uploadViaBackend(file, onProgress, signal);
  }

  try {
    await putToS3(presign.uploadUrl, file, onProgress, signal);
    return presign.fileUrl;
  } catch (err) {
    if (err instanceof UploadError && err.code === "aborted") throw err;
    if (err instanceof UploadError && err.code === "direct_upload_blocked") {
      return uploadViaBackend(file, onProgress, signal);
    }
    throw err;
  }
};

/** Human-readable size for progress/error text. */
export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
};
