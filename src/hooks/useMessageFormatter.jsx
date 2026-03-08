import React from "react";

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

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const cleanFileName = (fileUrl) => {
    let fileName = fileUrl.split("/").pop().split(".")[0];
    fileName = fileName.replace(/^\d+-|^\d+$/g, "");
    fileName = removeAccents(fileName);
    fileName = fileName.replace(/[-\s]+/g, " ").trim();
    return fileName;
  };

  const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

  const isImageUrl = (url) => {
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    return IMAGE_EXTS.includes(ext);
  };

  const renderFileMessage = (fileUrl, isSender) => {
    const fileExtension = fileUrl.split(".").pop().split("?")[0].toLowerCase();
    const fileName = cleanFileName(fileUrl);

    if (["mp3", "wav", "ogg"].includes(fileExtension)) {
      return (
        <audio controls className="max-w-full">
          <source src={fileUrl} type={`audio/${fileExtension}`} />
        </audio>
      );
    }

    if (IMAGE_EXTS.includes(fileExtension)) {
      // Image rendered as a clean thumbnail — no extra wrapper needed here;
      // the bubble container in chatWindow strips padding for image messages.
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

    // Generic file link
    return (
      <span
        onClick={() => onFileClick(fileUrl)}
        className={`cursor-pointer underline break-all ${isSender ? "text-white/90" : "text-blue-600 dark:text-blue-400"}`}
      >
        📎 {fileName}.{fileExtension}
      </span>
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