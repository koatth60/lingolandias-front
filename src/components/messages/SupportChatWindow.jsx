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
import { uploadChatFile } from "../../data/uploadApi.js";
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
    const handleTyping = ({ username: who }) => {
      if (who && who !== user?.name) {
        setTypingUsers((prev) => (prev.includes(who) ? prev : [...prev, who]));
      }
    };
    const handleStopTyping = () => setTypingUsers([]);

    socket.on("supportChat", handleSupportChat);
    socket.on("supportChatDeleted", handleSupportChatDeleted);
    socket.on("globalChatEdited", handleSupportChatEdited);
    socket.on("globalChatReactionUpdated", handleReactionUpdated);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
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
  const stageFile = (file) => {
    if (!file) return;
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
        <div className="rounded-xl min-w-[200px] px-3 py-2.5" style={{ background: "rgba(246,184,46,0.10)", border: "1px solid rgba(246,184,46,0.30)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <FiMusic size={11} className="flex-shrink-0" style={{ color: "#d4950a" }} />
            <p className="text-[11px] font-semibold truncate flex-1 min-w-0 text-gray-800 dark:text-gray-100">{fileName}</p>
          </div>
          <AudioPlayer src={fileUrl} variant="voiceNote" isSender={isSender} />
        </div>
      );
    }
    if (VIDEO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[280px]">
          <video src={fileUrl} controls className="w-full max-h-48 object-contain bg-black" />
          <div className="px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: "rgba(246,184,46,0.10)" }}>
            <FiVideo size={11} style={{ color: "#d4950a" }} />
            <span className="text-[11px] truncate text-gray-700 dark:text-gray-300">{fileName}</span>
          </div>
        </div>
      );
    }
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-[190px] max-w-[260px] no-underline"
        style={{ background: "rgba(246,184,46,0.10)", border: "1px solid rgba(246,184,46,0.30)" }}>
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #F6B82E, #d4950a)" }}>
          <FileIconComp size={14} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold truncate text-gray-800 dark:text-gray-100">{fileName}</p>
          <p className="text-[9px] uppercase font-bold text-gray-400">{ext}</p>
        </div>
        <FiDownload size={13} className="flex-shrink-0 text-gray-400" />
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

  return (
    <div
      className="w-full h-full flex flex-col bg-white dark:bg-[#0f0c26] transition-colors duration-300 relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >

      {/* Drag-and-drop overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-[#F6B82E]/10 dark:bg-[#F6B82E]/15 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border-2 border-dashed" style={{ borderColor: "#F6B82E", background: "rgba(255,255,255,0.9)" }}>
            <FiPaperclip size={22} style={{ color: "#F6B82E" }} />
            <p className="text-sm font-semibold" style={{ color: "#d4950a" }}>{t("chatWindow.dropFilesHere")}</p>
          </div>
        </div>
      )}

      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block" aria-hidden="true">
        <div className="absolute rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, rgba(246,184,46,0.5), transparent 70%)", width: 320, height: 320, top: "-8%", right: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: 260, height: 260, bottom: "-5%", left: "-5%" }} />
      </div>

      {/* ── Header ── */}
      <div className="relative flex-shrink-0 z-10">
        <div className="absolute top-0 left-0 w-full h-[2px] z-10"
          style={{ background: "linear-gradient(90deg, #F6B82E, #26D9A1, #F6B82E)" }} />
        <div className="absolute inset-0 dark:hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,250,235,0.98))", borderBottom: "1px solid rgba(246,184,46,0.12)" }} />
        <div className="absolute inset-0 hidden dark:block"
          style={{ background: "linear-gradient(135deg, rgba(20,16,40,0.98), rgba(30,22,55,0.98))", borderBottom: "1px solid rgba(246,184,46,0.18)" }} />

        <div className="relative z-10 flex items-center gap-3 px-4 py-3 mt-[2px]">
          {/* Icon */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F6B82E, #d4950a)", boxShadow: "0 3px 12px rgba(246,184,46,0.35)" }}>
            <FiRadio size={17} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold truncate"
              style={{ background: "linear-gradient(90deg, #F6B82E, #26D9A1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("supportChat.title")}
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#26D9A1" }}>
              ● {t("supportChat.staffChannel")}
            </p>
          </div>

        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black/20"
        style={{ minHeight: 0 }}
      >
        <div className="p-4 sm:p-5">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center border"
                style={{ background: "rgba(246,184,46,0.1)", borderColor: "rgba(246,184,46,0.25)" }}>
                <FiRadio size={24} style={{ color: "#F6B82E" }} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[200px]">
                {t("supportChat.noUpdates")}
              </p>
            </div>
          )}

          <ul className="space-y-1.5">
            {chatMessages.map((msg, index) => {
              const prev = chatMessages[index - 1];
              const showTimestamp =
                index === 0 ||
                new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;
              const isSender = msg.email === user?.email;
              const isFirstFromUser = index === 0 || msg.email !== prev.email;
              const showUsername = !isSender && isFirstFromUser;
              const adminMsg = isAdmin(msg);
              const initials = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);

              return (
                <div key={msg.id || index}>
                  {showTimestamp && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                      <span className="text-[10px] font-medium px-3 py-1 rounded-full text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                    </div>
                  )}

                  <li className={`group flex items-end gap-2 ${isSender ? "justify-end" : "justify-start"}`}>
                    {/* Avatar for others */}
                    {!isSender && (
                      <div className="flex-shrink-0 w-7 self-end">
                        {isFirstFromUser ? (
                          msg.userUrl ? (
                            <img src={msg.userUrl} alt="avatar"
                              className="w-7 h-7 rounded-full object-cover shadow"
                              style={{ ring: adminMsg ? "2px solid #F6B82E" : undefined }} />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow"
                              style={{ background: adminMsg ? "linear-gradient(135deg, #F6B82E, #d4950a)" : avatarColor }}>
                              {initials}
                            </div>
                          )
                        ) : (
                          <div className="w-7 h-7" />
                        )}
                      </div>
                    )}

                    {isSender ? (
                      <div className="flex flex-col items-end max-w-[80%]">
                      <div className="flex items-end gap-1.5">
                        {/* Reply trigger */}
                        <button onClick={() => handleReplyClick(msg)}
                          className="self-end mb-0.5 p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100
                                     hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-white/10 transition-all">
                          <FiCornerUpLeft size={12} />
                        </button>
                        {/* Options */}
                        <div className="relative self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleOptionsMenu(msg.id)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-white/10 transition-colors">
                            <BsThreeDots size={12} />
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
                        {/* Sender bubble */}
                        <div className="rounded-2xl rounded-br-sm text-white text-sm leading-relaxed shadow-md overflow-hidden"
                          style={{
                            background: user?.role === "admin"
                              ? "linear-gradient(135deg, #F6B82E, #d4950a)"
                              : "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                            boxShadow: user?.role === "admin"
                              ? "0 3px 10px rgba(246,184,46,0.30)"
                              : "0 3px 10px rgba(158,47,208,0.30)",
                          }}>
                          <div className="px-3.5 py-2">
                            {user?.role === "admin" && (
                              <div className="flex items-center gap-1 mb-1 opacity-80">
                                <HiShieldCheck size={11} />
                                <span className="text-[9px] font-bold tracking-wider uppercase">{t("supportChat.adminBadge")}</span>
                              </div>
                            )}
                            {msg.replyTo && (
                              <div className="mb-1.5 pl-2 border-l-2 border-white/50 rounded bg-white/10 text-xs" style={{ padding: "4px 6px" }}>
                                <p className="font-semibold text-[10px] mb-0.5 text-white/80">{msg.replyTo.username}</p>
                                <p className="line-clamp-2 text-[11px] text-white/70">{msg.replyTo.message}</p>
                              </div>
                            )}
                            {msg.fileUrl && <div className="mb-1.5">{renderFile(msg.fileUrl, true)}</div>}
                            {msg.message && (
                              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, true)}</p>
                            )}
                            {msg.editedAt && (
                              <p className="text-[9px] opacity-70 mt-0.5">{t("chatWindow.edited")}</p>
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
                      </div>
                    ) : (
                      <div className="max-w-[80%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                            <p className={`font-bold truncate ${adminMsg ? "text-xs" : "text-[10px]"}`}
                              style={{ color: adminMsg ? "#F6B82E" : "#9E2FD0" }}>
                              {msg.username}
                            </p>
                            {adminMsg && (
                              <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                                style={{
                                  background: "linear-gradient(135deg, rgba(246,184,46,0.30), rgba(246,184,46,0.15))",
                                  color: "#d4950a",
                                  border: "1.5px solid rgba(246,184,46,0.55)",
                                  boxShadow: "0 0 8px rgba(246,184,46,0.25)",
                                  letterSpacing: "0.05em",
                                }}>
                                <HiShieldCheck size={10} /> {t("supportChat.adminBadge")}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Receiver bubble */}
                        <div className="relative">
                          {adminMsg ? (
                            <div className="rounded-2xl rounded-bl-sm text-white text-sm leading-relaxed shadow-md overflow-hidden"
                              style={{
                                background: "linear-gradient(135deg, #F6B82E, #d4950a)",
                                boxShadow: "0 3px 10px rgba(246,184,46,0.30)",
                              }}>
                              <div className="px-3.5 py-2">
                                {msg.replyTo && (
                                  <div className="mb-1.5 pl-2 border-l-2 border-white/50 rounded bg-white/10 text-xs" style={{ padding: "4px 6px" }}>
                                    <p className="font-semibold text-[10px] mb-0.5 text-white/80">{msg.replyTo.username}</p>
                                    <p className="line-clamp-2 text-[11px] text-white/70">{msg.replyTo.message}</p>
                                  </div>
                                )}
                                {msg.fileUrl && <div className="mb-1.5">{renderFile(msg.fileUrl, false)}</div>}
                                {msg.message && (
                                  <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, true)}</p>
                                )}
                                {msg.editedAt && <p className="text-[9px] opacity-70 mt-0.5">{t("chatWindow.edited")}</p>}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm bg-white dark:bg-white/[0.07] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 overflow-hidden">
                              <div className="px-3.5 py-2">
                                {msg.replyTo && (
                                  <div className="mb-1.5 pl-2 border-l-2 border-[#F6B82E]/60 rounded bg-[#F6B82E]/5 dark:bg-white/5 text-xs" style={{ padding: "4px 6px" }}>
                                    <p className="font-semibold text-[10px] mb-0.5" style={{ color: "#d4950a" }}>{msg.replyTo.username}</p>
                                    <p className="line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">{msg.replyTo.message}</p>
                                  </div>
                                )}
                                {msg.fileUrl && <div className="mb-1.5">{renderFile(msg.fileUrl, false)}</div>}
                                {msg.message && (
                                  <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, false)}</p>
                                )}
                                {msg.editedAt && <p className="text-[9px] opacity-60 mt-0.5">{t("chatWindow.edited")}</p>}
                              </div>
                            </div>
                          )}
                          {/* Reply trigger — positioned relative to bubble only */}
                          <button
                            onClick={() => handleReplyClick(msg)}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-1
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       p-1.5 rounded-full text-gray-400
                                       hover:text-amber-500 dark:hover:text-amber-400
                                       hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <FiCornerUpLeft size={13} />
                          </button>
                        </div>
                        <MessageReactions
                          reactions={msg.reactions}
                          currentUserId={user?.id}
                          onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                          align="start"
                        />
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
          <span className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? t("chatWindow.isTyping") : t("chatWindow.areTyping")}
            <span className="inline-flex gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </span>
        </div>
      )}

      {/* ── Input ── */}
      <div className="relative flex-shrink-0 z-10 p-3 bg-white dark:bg-[#0f0c26] border-t border-gray-100 dark:border-[rgba(246,184,46,0.10)]">

        {/* Editing banner */}
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg"
            style={{ background: "rgba(246,184,46,0.10)", border: "1px solid rgba(246,184,46,0.30)" }}>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#d4950a" }}>
              <FiEdit2 size={12} />
              <span>{t("chatWindow.editing")}</span>
            </div>
            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Reply banner */}
        {replyTo && !editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg"
            style={{ background: "rgba(158,47,208,0.06)", border: "1px solid rgba(158,47,208,0.20)" }}>
            <div className="flex items-center gap-1.5 min-w-0">
              <FiCornerUpLeft size={12} className="flex-shrink-0" style={{ color: "#9E2FD0" }} />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold" style={{ color: "#9E2FD0" }}>{replyTo.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.message}</p>
              </div>
            </div>
            <button onClick={handleCancelReply} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg"
            style={{ background: "rgba(246,184,46,0.10)", border: "1px solid rgba(246,184,46,0.30)" }}>
            {stagedFile.previewUrl ? (
              <img src={stagedFile.previewUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F6B82E, #d4950a)" }}>
                <FiFile size={14} className="text-white" />
              </div>
            )}
            <p className="text-xs font-medium truncate flex-1 min-w-0 text-gray-700 dark:text-gray-200">{stagedFile.file.name}</p>
            <button onClick={handleRemoveStagedFile} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 focus-within:border-[rgba(246,184,46,0.5)] dark:focus-within:border-[rgba(246,184,46,0.4)] transition-colors">
          <button onClick={() => setShowEmojiPicker((p) => !p)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-amber-500 transition-colors self-end">
            <BsEmojiSmile size={18} />
          </button>
          {!editingMsg && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                           text-gray-400 hover:text-amber-500 transition-colors self-end">
                <FiPaperclip size={17} />
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
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed py-1"
            style={{ minHeight: "32px", maxHeight: "112px", overflowY: "hidden" }}
          />
          <button
            onClick={sendMessage}
            disabled={(!message.trim() && !stagedFile) || isUploading}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 self-end"
            style={{ background: "linear-gradient(135deg, #F6B82E, #d4950a)", boxShadow: "0 2px 8px rgba(246,184,46,0.35)" }}
          >
            {isUploading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <FiSend size={13} className="text-white" />
            )}
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-3 mb-2 z-20">
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChatWindow;
