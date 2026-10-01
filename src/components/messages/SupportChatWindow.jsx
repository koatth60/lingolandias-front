import { useState, useEffect, useRef } from "react";
import { socket } from "../../socket";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { FiSend, FiRadio, FiPaperclip, FiX, FiEdit2, FiFile, FiFileText, FiMusic, FiVideo, FiDownload, FiCornerUpLeft } from "react-icons/fi";
import { HiShieldCheck } from "react-icons/hi2";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import MessageOptionsCard from "./MessageOptionsCard";
import AudioPlayer from "./AudioPlayer";
import MessageReactions from "./MessageReactions";
import useMessageFormatter from "../../hooks/useMessageFormatter";
import { fetchUnreadMessages } from "../../redux/messageSlice";
import useNotificationSound from "../../hooks/useNotificationSound";
import { uploadChatFile, snapshotFile } from "../../data/uploadApi.js";
import UploadStatus from "./UploadStatus";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SUPPORT_ROOM = "uuid-support";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "weba"]);
const VIDEO_EXTS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);

const getFileExt = (url) => url.split("?")[0].split(".").pop().toLowerCase();
const getFileName = (url) => {
  const raw = url.split("?")[0];
  let full = raw.split("/").pop();
  try { full = decodeURIComponent(full); } catch { /* keep */ }
  return full.replace(/^\d{10,13}-/, "") || full;
};

const SupportChatWindow = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo?.user);
  const soundEnabled = user?.settings?.notificationSound !== false;

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openMessageId, setOpenMessageId] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [stagedFile, setStagedFile] = useState(null); // { file, previewUrl }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // 0..1 while uploading
  const [uploadErrorCode, setUploadErrorCode] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const typingTimeoutRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const playSound = useNotificationSound();

  const { formatMessageWithLinks } = useMessageFormatter(() => {});

  // Fetch history
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${BACKEND_URL}/chat/global-chats/${SUPPORT_ROOM}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setChatMessages(data.reverse());
    } catch (e) {
      console.error("Support chat fetch error:", e);
    }
  };

  // Mark as read and refresh Redux counter
  const markRead = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${BACKEND_URL}/chat/delete-unread-global-messages`, {
        room: SUPPORT_ROOM,
        userId: user.id,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      dispatch(fetchUnreadMessages(user.id));
    } catch (e) {
      console.error("Error marking support chat as read:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    socket.emit("join", { username: user.name, room: SUPPORT_ROOM });
    fetchMessages();
    markRead();

    const handleSupportChat = (data) => {
      setChatMessages((prev) => [...prev, data]);
      if (data.email !== user?.email && soundEnabledRef.current) {
        playSound();
      }
    };
    const handleSupportChatDeleted = (data) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };
    const handleSupportChatEdited = (data) => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, message: data.newMessage, editedAt: data.editedAt } : m))
      );
    };
    const handleReactionUpdated = (data) => {
      if (data.room !== SUPPORT_ROOM) return;
      setChatMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
      );
    };
    // Typing events carry their room; ignore the ones from other rooms this
    // socket is also in.
    const handleTyping = ({ username: who, room: typingRoom }) => {
      if (typingRoom && typingRoom !== SUPPORT_ROOM) return;
      if (who && who !== user?.name) {
        setTypingUsers((prev) => (prev.includes(who) ? prev : [...prev, who]));
      }
    };
    const handleStopTyping = ({ room: typingRoom } = {}) => {
      if (typingRoom && typingRoom !== SUPPORT_ROOM) return;
      setTypingUsers([]);
    };

    // After a dropped connection the server no longer has this socket in the
    // support room, so live messages silently stopped until a reload. Re-join
    // and refetch whatever arrived in between.
    const handleReconnect = () => {
      socket.emit("join", { username: user.name, room: SUPPORT_ROOM });
      fetchMessages();
    };

    socket.on("connect", handleReconnect);
    socket.on("supportChat", handleSupportChat);
    socket.on("supportChatDeleted", handleSupportChatDeleted);
    socket.on("globalChatEdited", handleSupportChatEdited);
    socket.on("globalChatReactionUpdated", handleReactionUpdated);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.emit("leave", { room: SUPPORT_ROOM });
      socket.off("connect", handleReconnect);
      socket.off("supportChat", handleSupportChat);
      socket.off("supportChatDeleted", handleSupportChatDeleted);
      socket.off("globalChatEdited", handleSupportChatEdited);
      socket.off("globalChatReactionUpdated", handleReactionUpdated);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (editingMsg) {
      setMessage(editingMsg.message);
      textareaRef.current?.focus();
    }
  }, [editingMsg]);

  const resetComposer = () => {
    setMessage("");
    setEditingMsg(null);
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = "32px";
  };

  const sendMessage = async () => {
    if (!socket) return;

    if (editingMsg) {
      const trimmed = message.trim();
      if (!trimmed) return;
      socket.emit("editGlobalChat", { messageId: editingMsg.id, room: SUPPORT_ROOM, newMessage: trimmed });
      setChatMessages((prev) =>
        prev.map((m) => (m.id === editingMsg.id ? { ...m, message: trimmed, editedAt: new Date().toISOString() } : m))
      );
      resetComposer();
      return;
    }

    if (!message.trim() && !stagedFile) return;

    let fileUrl;
    if (stagedFile) {
      setIsUploading(true);
      setUploadErrorCode(null);
      try {
        // Presigned direct-to-S3 upload: no size limit, and the failure is
        // now shown to the user instead of only logged (the attachment used
        // to vanish with no explanation).
        fileUrl = await uploadChatFile(stagedFile.file, {
          onProgress: (ratio) => setUploadProgress(ratio),
        });
        if (stagedFile.previewUrl) URL.revokeObjectURL(stagedFile.previewUrl);
      } catch (err) {
        console.error("Support chat file upload failed:", err);
        setIsUploading(false);
        setUploadProgress(null);
        setUploadErrorCode(err?.code || "upload_failed");
        return;
      }
      setIsUploading(false);
      setUploadProgress(null);
    }

    socket.emit("supportChat", {
      username: user.name,
      email: user.email,
      room: SUPPORT_ROOM,
      message: message.trim(),
      userRole: user.role,
      userUrl: user.avatarUrl || null,
      fileUrl,
      replyTo: replyTo ? { id: replyTo.id, message: replyTo.message, username: replyTo.username } : undefined,
    });
    setStagedFile(null);
    socket.emit("stopTyping", { room: SUPPORT_ROOM });
    resetComposer();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "32px";
      ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`;
    }
    if (socket && user?.name && !editingMsg) {
      socket.emit("typing", { room: SUPPORT_ROOM, username: user.name });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { room: SUPPORT_ROOM });
      }, 2000);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleOptionsMenu = (id) => setOpenMessageId((prev) => (prev === id ? null : id));

  const handleEditClick = (msg) => {
    setOpenMessageId(null);
    setReplyTo(null);
    setEditingMsg(msg);
  };

  const handleCancelEdit = () => resetComposer();

  const handleReplyClick = (msg) => {
    setEditingMsg(null);
    setReplyTo({ id: msg.id, message: msg.fileUrl && !msg.message ? "📎 File" : msg.message, username: msg.username });
    textareaRef.current?.focus();
  };

  const handleCancelReply = () => setReplyTo(null);

  const toggleReaction = (messageId, emoji) => {
    socket.emit("toggleGlobalChatReaction", { messageId, room: SUPPORT_ROOM, emoji, userName: user.name });
  };

  const handleDeleteMessage = async (messageId) => {
    setOpenMessageId(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}/chat/delete-global-chat/${messageId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        console.error("Failed to delete support message:", response.statusText);
        return;
      }
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      socket.emit("deleteSupportChat", { messageId });
    } catch (error) {
      console.error("Error deleting support message:", error);
    }
  };

  // ── File staging (picker + drag&drop) ──
  // In-memory copy first (snapshotFile) so moving or re-saving the original
  // before Send no longer breaks the upload.
  const stageFile = async (picked) => {
    if (!picked) return;
    const file = await snapshotFile(picked);
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setStagedFile({ file, previewUrl });
  };

  const handleFileInputChange = (e) => {
    stageFile(e.target.files?.[0]);
    e.target.value = null;
  };

  const handleRemoveStagedFile = () => {
    if (stagedFile?.previewUrl) URL.revokeObjectURL(stagedFile.previewUrl);
    setStagedFile(null);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    stageFile(e.dataTransfer.files?.[0]);
  };

  // ── File render (inside a message bubble) ──
  const renderFile = (fileUrl, isSender) => {
    const ext = getFileExt(fileUrl);
    const fileName = getFileName(fileUrl);

    if (IMAGE_EXTS.has(ext)) {
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={fileUrl} alt="shared" className="block w-full max-h-64 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity" />
        </a>
      );
    }
    if (AUDIO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl min-w-[200px] px-3 py-2.5 bg-ll-panel border border-ll-line text-ll-ink">
          <div className="flex items-center gap-1.5 mb-2">
            <FiMusic size={12} className="flex-shrink-0 text-ll-ink3" />
            <p className="text-[12px] font-medium truncate flex-1 min-w-0">{fileName}</p>
          </div>
          <AudioPlayer src={fileUrl} variant="voiceNote" isSender={isSender} />
        </div>
      );
    }
    if (VIDEO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[280px] border border-ll-line">
          <video src={fileUrl} controls className="w-full max-h-48 object-contain bg-black" />
          <div className="px-2.5 py-1.5 flex items-center gap-1.5 bg-ll-panel text-ll-ink">
            <FiVideo size={12} className="text-ll-ink3" />
            <span className="text-[12px] truncate">{fileName}</span>
          </div>
        </div>
      );
    }
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl min-w-[190px] max-w-[260px] no-underline bg-ll-panel border border-ll-line text-ll-ink hover:bg-ll-subtle transition-colors">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-ll-violet-tint text-ll-violet-ink">
          <FileIconComp size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium truncate">{fileName}</p>
          <p className="font-mono text-[10.5px] text-ll-ink3">{ext}</p>
        </div>
        <FiDownload size={14} className="flex-shrink-0 text-ll-ink3" />
      </a>
    );
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return time;
    if (d.toDateString() === yest.toDateString()) return `${t("common.yesterday")} ${time}`;
    return `${d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })} ${time}`;
  };

  const getInitials = (name) => {
    if (!name || name === "undefined") return "?";
    const p = name.trim().split(" ");
    return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  };

  const generateColor = (name) => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++)
      h = name.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 60%, 52%)`;
  };

  const isAdmin = (msg) => msg.userRole === "admin";
  const AdminPill = () => (
    <span className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-full text-[11px] font-medium bg-ll-gold-tint text-ll-gold-ink">
      <HiShieldCheck size={11} /> {t("supportChat.adminBadge")}
    </span>
  );
  const COMPOSER_BTN = "flex-shrink-0 w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink3 hover:bg-ll-hover hover:text-ll-ink transition-colors self-end";

  return (
    <div
      className="w-full h-full flex flex-col bg-ll-panel relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Drag-and-drop overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-ll-violet/10 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-xl border-2 border-dashed border-ll-violet bg-ll-panel">
            <FiPaperclip size={22} className="text-ll-violet" />
            <p className="text-sm font-semibold text-ll-violet-ink">{t("chatWindow.dropFilesHere")}</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="relative z-10 flex flex-shrink-0 items-center gap-3 h-[60px] px-4 sm:px-5 bg-ll-panel border-b border-ll-line">
        <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0 bg-ll-gold-tint text-ll-gold-ink">
          <FiRadio size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[14.5px] font-semibold text-ll-ink truncate leading-tight">{t("supportChat.title")}</h2>
          <p className="flex items-center gap-1.5 mt-0.5 text-[12px] text-ll-teal-ink">
            <span className="w-1.5 h-1.5 rounded-full bg-ll-teal" />
            {t("supportChat.staffChannel")}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="ll-chat-body flex-1 overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        <div className="px-3 py-3 sm:px-7 sm:pt-[18px] sm:pb-3">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-ll-gold-tint text-ll-gold-ink">
                <FiRadio size={20} />
              </div>
              <p className="text-[13px] text-ll-ink3 text-center max-w-[220px]">
                {t("supportChat.noUpdates")}
              </p>
            </div>
          )}

          <ul>
            {chatMessages.map((msg, index) => {
              const prev = chatMessages[index - 1];
              const next = chatMessages[index + 1];
              const showTimestamp =
                index === 0 ||
                new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;
              const isSender = msg.email === user?.email;
              // Consecutive messages from one sender (no date divider between)
              // stack tightly; name on the first, avatar on the last.
              const breaksRun = (a, b) => !a || !b || a.email !== b.email
                || new Date(b.timestamp) - new Date(a.timestamp) > 3 * 60 * 1000;
              const isFirstInRun = breaksRun(prev, msg);
              const isLastInRun = breaksRun(msg, next);
              const showUsername = !isSender && isFirstInRun;
              const adminMsg = isAdmin(msg);
              const initials = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);

              return (
                <div key={msg.id || index}>
                  {showTimestamp && (
                    <div className="flex items-center gap-3 mt-3.5 mb-2.5 text-[11.5px] font-medium text-ll-ink3">
                      <div className="flex-1 h-px bg-ll-line" />
                      {formatTimestamp(msg.timestamp)}
                      <div className="flex-1 h-px bg-ll-line" />
                    </div>
                  )}

                  <li className={`group flex items-end gap-2.5 ${isLastInRun ? "mb-2.5" : "mb-[3px]"} ${isSender ? "justify-end" : "justify-start"}`}>
                    {/* Avatar for others, on the run's last bubble */}
                    {!isSender && (
                      <div className="flex-shrink-0 w-7 self-end">
                        {isLastInRun ? (
                          msg.userUrl ? (
                            <img src={msg.userUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
                              style={{ background: adminMsg ? "rgb(var(--ll-gold))" : avatarColor }}>
                              {initials}
                            </div>
                          )
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    )}

                    {isSender ? (
                      <div className="flex flex-col items-end max-w-[88%] sm:max-w-[62%]">
                      <div className="flex items-center gap-2">
                        {/* Reply + options */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-ll-panel border border-ll-line shadow-ll-2
                                        opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleReplyClick(msg)}
                            className="w-[26px] h-[26px] grid place-items-center rounded-md text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink transition-colors">
                            <FiCornerUpLeft size={14} />
                          </button>
                          <div className="relative">
                            <button onClick={() => toggleOptionsMenu(msg.id)}
                              className="w-[26px] h-[26px] grid place-items-center rounded-md text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink transition-colors">
                              <BsThreeDots size={14} />
                            </button>
                            {openMessageId === msg.id && (
                              <div className="absolute bottom-full right-0 mb-1 z-20">
                                <MessageOptionsCard
                                  onEdit={() => handleEditClick(msg)}
                                  onDelete={() => handleDeleteMessage(msg.id)}
                                  onClose={() => setOpenMessageId(null)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Sender bubble */}
                        <div className={`ll-bubble-out rounded-2xl overflow-hidden text-[14px] leading-[1.42] ${isFirstInRun ? "" : "rounded-tr-md"} ${isLastInRun ? "" : "rounded-br-md"}`}
                          style={{ background: "rgb(var(--ll-violet))", color: "rgb(var(--ll-on-violet))" }}>
                          <div className="px-[13px] py-2">
                            {user?.role === "admin" && (
                              <div className="flex items-center gap-1 mb-1 opacity-80 text-[11px] font-medium">
                                <HiShieldCheck size={12} />
                                <span>{t("supportChat.adminBadge")}</span>
                              </div>
                            )}
                            {msg.replyTo && (
                              <div className="mb-1.5 pl-2 border-l-2 border-white/50 rounded bg-white/10 text-xs" style={{ padding: "4px 6px" }}>
                                <p className="font-semibold text-[11px] mb-0.5 text-white/80">{msg.replyTo.username}</p>
                                <p className="line-clamp-2 text-[12px] text-white/70">{msg.replyTo.message}</p>
                              </div>
                            )}
                            {msg.fileUrl && <div className="mb-1.5">{renderFile(msg.fileUrl, true)}</div>}
                            {msg.message && (
                              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, true)}</p>
                            )}
                            {msg.editedAt && (
                              <p className="text-[11px] opacity-70 mt-0.5">{t("chatWindow.edited")}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <MessageReactions
                        reactions={msg.reactions}
                        currentUserId={user?.id}
                        onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                        align="end"
                      />
                      {isLastInRun && (
                        <span className="mt-[3px] mx-1 font-mono text-[10.5px] text-ll-ink3">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      </div>
                    ) : (
                      <div className="max-w-[84%] sm:max-w-[62%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                            <p className="text-[12px] font-semibold truncate text-ll-violet-ink">{msg.username}</p>
                            {adminMsg && <AdminPill />}
                          </div>
                        )}
                        {/* Receiver bubble */}
                        <div className="relative">
                          <div className={`rounded-2xl overflow-hidden text-[14px] leading-[1.42] text-ll-ink ${isFirstInRun ? "" : "rounded-tl-md"} ${isLastInRun ? "" : "rounded-bl-md"} ${adminMsg ? "bg-ll-gold-tint" : ""}`}
                            style={adminMsg ? undefined : { background: "rgb(var(--ll-bubble-in))" }}>
                            <div className="px-[13px] py-2">
                              {msg.replyTo && (
                                <div className="mb-1.5 pl-2 border-l-2 border-ll-violet/60 rounded bg-ll-panel/60 text-xs" style={{ padding: "4px 6px" }}>
                                  <p className="font-semibold text-[11px] mb-0.5 text-ll-violet-ink">{msg.replyTo.username}</p>
                                  <p className="line-clamp-2 text-[12px] text-ll-ink3">{msg.replyTo.message}</p>
                                </div>
                              )}
                              {msg.fileUrl && <div className="mb-1.5">{renderFile(msg.fileUrl, false)}</div>}
                              {msg.message && (
                                <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, false)}</p>
                              )}
                              {msg.editedAt && <p className="text-[11px] text-ll-ink3 mt-0.5">{t("chatWindow.edited")}</p>}
                            </div>
                          </div>
                          {/* Reply trigger — positioned relative to bubble only */}
                          <button
                            onClick={() => handleReplyClick(msg)}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       w-[26px] h-[26px] grid place-items-center rounded-md
                                       bg-ll-panel border border-ll-line shadow-ll-2 text-ll-ink2 hover:text-ll-ink">
                            <FiCornerUpLeft size={14} />
                          </button>
                        </div>
                        <MessageReactions
                          reactions={msg.reactions}
                          currentUserId={user?.id}
                          onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                          align="start"
                        />
                        {isLastInRun && (
                          <span className="block mt-[3px] mx-1 font-mono text-[10.5px] text-ll-ink3">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                </div>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="relative z-10 px-5 pb-1 flex-shrink-0">
          <span className="text-[11.5px] text-ll-ink3">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? t("chatWindow.isTyping") : t("chatWindow.areTyping")}
            <span className="inline-flex gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-ll-ink4 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-ll-ink4 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-ll-ink4 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </span>
        </div>
      )}

      {/* ── Input ── */}
      <div className="ll-chat-foot relative flex-shrink-0 z-10 px-2.5 sm:px-5 pt-2 pb-2.5 sm:pt-3 sm:pb-[18px]">

        {/* Editing banner */}
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg bg-ll-subtle border border-ll-line">
            <div className="flex items-center gap-1.5 text-xs text-ll-ink2">
              <FiEdit2 size={12} />
              <span>{t("chatWindow.editing")}</span>
            </div>
            <button onClick={handleCancelEdit} className="text-ll-ink3 hover:text-ll-ink flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Reply banner */}
        {replyTo && !editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg bg-ll-subtle border border-ll-line border-l-2 border-l-ll-violet">
            <div className="flex items-center gap-1.5 min-w-0">
              <FiCornerUpLeft size={12} className="flex-shrink-0 text-ll-violet" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ll-violet-ink">{replyTo.username}</p>
                <p className="text-xs text-ll-ink3 truncate">{replyTo.message}</p>
              </div>
            </div>
            <button onClick={handleCancelReply} className="text-ll-ink3 hover:text-ll-ink flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Staged file preview */}
        <UploadStatus
          progress={uploadProgress === null ? null : { name: stagedFile?.file?.name || "", ratio: uploadProgress }}
          errorCode={uploadErrorCode}
          onDismissError={() => setUploadErrorCode(null)}
        />
        {stagedFile && !editingMsg && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-ll-subtle border border-ll-line">
            {stagedFile.previewUrl ? (
              <img src={stagedFile.previewUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-violet-tint text-ll-violet-ink">
                <FiFile size={15} />
              </div>
            )}
            <p className="text-xs font-medium truncate flex-1 min-w-0 text-ll-ink2">{stagedFile.file.name}</p>
            <button onClick={handleRemoveStagedFile} className="text-ll-ink3 hover:text-ll-ink flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1 px-2 py-1.5 bg-ll-panel rounded-xl border border-ll-line2 shadow-ll-1 focus-within:border-ll-violet/60 transition-colors">
          <button onClick={() => setShowEmojiPicker((p) => !p)} className={COMPOSER_BTN}>
            <BsEmojiSmile size={16} />
          </button>
          {!editingMsg && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
              <button onClick={() => fileInputRef.current?.click()} className={COMPOSER_BTN}>
                <FiPaperclip size={16} />
              </button>
            </>
          )}
          <textarea
            ref={textareaRef}
            placeholder={user?.role === "admin" ? t("supportChat.placeholderAdmin") : t("supportChat.placeholderUser")}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={markRead}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-[14px] text-ll-ink placeholder:text-ll-ink3 leading-relaxed py-1.5 px-1"
            style={{ minHeight: "32px", maxHeight: "112px", overflowY: "hidden" }}
          />
          <button
            onClick={sendMessage}
            disabled={(!message.trim() && !stagedFile) || isUploading}
            className="flex-shrink-0 w-8 h-8 rounded-lg grid place-items-center bg-ll-violet hover:bg-ll-violet-hover text-ll-on-violet transition-colors disabled:opacity-40 disabled:hover:bg-ll-violet self-end"
            aria-label="Send"
          >
            {isUploading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <FiSend size={15} />
            )}
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-3 mb-2 z-20">
            <div className="rounded-xl overflow-hidden border border-ll-line shadow-ll-pop">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChatWindow;
