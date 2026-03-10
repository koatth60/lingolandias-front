import React from "react";
import { FiMusic, FiFile, FiFileText, FiDownload, FiVideo } from "react-icons/fi";

const useMessageFormatter = (onFileClick) => {
  const formatMessageWithLinks = (text, isSender) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) =>
      urlRegex.test(part) ? (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`${isSender ? "text-white " : "text-blue-600 underline"}`}
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (date.toDateString() === today.toDateString()) {
      return time;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${time}`;
    } else {
      return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
    }
  };

  const cleanFileName = (fileUrl) => {
    const raw = fileUrl.split("?")[0];
    let full = raw.split("/").pop();
    // Decode percent-encoded chars (%C3%A9 → é)
    try { full = decodeURIComponent(full); } catch { /* keep as-is */ }
    // Fix mojibake: S3 may store UTF-8 bytes as Latin-1 chars (Ã© → é)
    try {
      full = decodeURIComponent(
        full.replace(/[^\x00-\x7F]/g, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
      );
    } catch { /* keep as-is */ }
    // Strip timestamp prefix e.g. "1741234567890-filename.mp3"
    return full.replace(/^\d{10,13}-/, "") || full;
  };

  const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

  const isImageUrl = (url) => {
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    return IMAGE_EXTS.includes(ext);
  };

  const EXT_COLORS = {
    PDF: "#ef4444", DOC: "#2563eb", DOCX: "#2563eb",
    XLS: "#16a34a", XLSX: "#16a34a", TXT: "#6b7280",
    ZIP: "#d97706", RAR: "#d97706", CSV: "#16a34a",
  };

  const renderFileMessage = (fileUrl, isSender) => {
    const ext = fileUrl.split(".").pop().split("?")[0].toLowerCase();
    const fileName = cleanFileName(fileUrl);

    if (IMAGE_EXTS.includes(ext)) {
      return (
        <img
          src={fileUrl}
          alt="shared image"
          onClick={() => onFileClick(fileUrl)}
          className="block w-full max-h-64 object-cover cursor-pointer select-none"
          draggable={false}
        />
      );
    }

    if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
      return (
        <div
          className="rounded-xl overflow-hidden min-w-[230px]"
          style={{
            background: "rgba(158,47,208,0.08)",
            border: "1px solid rgba(158,47,208,0.25)",
          }}
        >
          <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#9E2FD0,#7b22a8)" }}
            >
              <FiMusic size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-gray-800 dark:text-gray-100">
                {fileName}
              </p>
              <p className="text-[10px] uppercase font-medium tracking-wide text-purple-600 dark:text-purple-400">
                {ext} · Audio
              </p>
            </div>
          </div>
          <div className="px-3 pb-2.5">
            <audio
              src={fileUrl}
              controls
              className="w-full"
              style={{ height: "32px", accentColor: "#9E2FD0" }}
            />
          </div>
        </div>
      );
    }

    if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[300px]">
          <video src={fileUrl} controls className="w-full max-h-48 object-contain bg-black" />
          <div
            className="px-2.5 py-1.5 flex items-center gap-1.5"
            style={{ background: "rgba(158,47,208,0.06)" }}
          >
            <FiVideo size={11} className="text-purple-500 dark:text-purple-400" />
            <span className="text-[11px] truncate text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
          </div>
        </div>
      );
    }

    // Generic file download card (PDF, DOC, TXT, ZIP, etc.)
    const extUpper = ext.toUpperCase();
    const extColor = EXT_COLORS[extUpper] || "#9E2FD0";
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;

    return (
      <button
        onClick={() => onFileClick(fileUrl)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-[200px] max-w-[280px] group/file text-left w-full"
        style={{
          background: "rgba(158,47,208,0.07)",
          border: "1px solid rgba(158,47,208,0.22)",
        }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-sm"
          style={{ background: extColor }}
        >
          <FileIconComp size={14} className="text-white mb-0.5" />
          <span className="text-white font-black leading-none" style={{ fontSize: "8px" }}>
            {extUpper.slice(0, 4)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-snug text-gray-800 dark:text-gray-100">
            {fileName}
          </p>
          <p className="text-[10px] uppercase font-medium tracking-wide mt-0.5 text-purple-600 dark:text-purple-400">
            {extUpper} · tap to preview
          </p>
        </div>
        <FiDownload
          size={14}
          className="flex-shrink-0 transition-transform group-hover/file:translate-y-0.5 text-purple-500 dark:text-purple-400"
        />
      </button>
    );
  };

  return {
    formatMessageWithLinks,
    formatTimestamp,
    renderFileMessage,
    isImageUrl,
  };
};

export default useMessageFormatter;