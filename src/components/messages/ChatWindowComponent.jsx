// ChatWindowComponent.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import send from "../../assets/logos/send.png";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { FiVideo, FiChevronLeft, FiEdit2, FiX, FiPaperclip, FiDownload, FiFile, FiMusic, FiFileText } from "react-icons/fi";
import { FaComments } from "react-icons/fa";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import EmojiPicker from "emoji-picker-react";
import MessageOptionsCard from "./MessageOptionsCard";
import useDeleteMessage from "../../hooks/useDeleteMessage.js";
import useChatWindow from "../../hooks/useChatWindow.js";
import { useDispatch, useSelector } from "react-redux";
import { fetchUnreadMessages } from "../../redux/messageSlice";
import { useNavigate } from "react-router-dom";
import useGlobalChat from "../../hooks/useGlobalChat.js";
import useChatInputHandler from "../../hooks/useChatInputHandler.js";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];
const isImageUrl = (url) => IMAGE_EXTS.includes(url.split("?")[0].split(".").pop().toLowerCase());

const ChatWindowComponent = ({
  username,
  room,
  studentName,
  chatType,
  email,
  userUrl,
  userId,
  socket,
  onBackClick,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo.user);

  const { chatMessages, setChatMessages, sendMessage } = useGlobalChat(
    socket, room, username, email, userUrl
  );

  const [message, setMessage] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);

  const { showEmojiPicker, setShowEmojiPicker, handleInput, handleEmojiClick } =
    useChatInputHandler(message, setMessage);

  const { handleDeleteMessage, toggleOptionsMenu, openMessageId } =
    useDeleteMessage(setChatMessages, socket, room);

  // ── Typing emit wrapper ──
  const handleInputWithTyping = (e) => {
    handleInput(e);
    if (socket && room) {
      socket.emit("typing", { room, username });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { room });
      }, 2000);
    }
  };

  // ── Typing listeners (room-scoped) ──
  useEffect(() => {
    if (!socket || !room) return;
    const handleTyping = ({ username: who }) => {
      if (who && who !== username) {
        setTypingUsers((prev) => prev.includes(who) ? prev : [...prev, who]);
      }
    };
    const handleStopTyping = () => setTypingUsers([]);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, room, username]);

  // ── Room members (active users) ──
  useEffect(() => {
    if (!socket || !room) return;
    socket.emit("getRoomMembers", { room });
    const handleRoomMembers = ({ room: r, members }) => {
      if (r === room) setRoomMembers(members);
    };
    socket.on("roomMembers", handleRoomMembers);
    return () => { socket.off("roomMembers", handleRoomMembers); };
  }, [socket, room]);

  // ── Edit listener ──
  useEffect(() => {
    if (socket && room) {
      socket.on("globalChatEdited", ({ messageId, newMessage }) => {
        setChatMessages((prev) =>
          prev.map((m) => m.id === messageId ? { ...m, message: newMessage } : m)
        );
      });
      return () => { socket.off("globalChatEdited"); };
    }
  }, [socket, room]);

  const handleEditMessage = (msg) => {
    setEditingMsg(msg);
    toggleOptionsMenu(openMessageId);
  };

  const clearEditing = () => {
    setEditingMsg(null);
    setMessage("");
  };

  useEffect(() => {
    if (editingMsg) setMessage(editingMsg.message);
  }, [editingMsg]);

  const handleSendMessage = () => {
    if (editingMsg) {
      if (!message.trim()) return;
      socket.emit("editGlobalChat", { messageId: editingMsg.id, room, newMessage: message.trim() });
      setChatMessages((prev) =>
        prev.map((m) => m.id === editingMsg.id ? { ...m, message: message.trim() } : m)
      );
      setMessage("");
      setEditingMsg(null);
    } else {
      if (!message.trim()) return;
      sendMessage(message);
      setMessage("");
      const ta = document.querySelector("textarea");
      if (ta) ta.style.height = "auto";
    }
    // stop typing on send
    if (socket && room) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", { room });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── File upload ──
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket || !room) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/upload/chat-upload`, formData);
      const fileUrl = res.data.url;
      socket.emit("globalChat", {
        username,
        room,
        email,
        message: "",
        userUrl: userUrl || null,
        fileUrl,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // ── File helpers ──
  const getFileName = (url) => {
    const raw = url.split("?")[0];
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

  const EXT_COLORS = {
    PDF: "#ef4444", DOC: "#2563eb", DOCX: "#2563eb",
    XLS: "#16a34a", XLSX: "#16a34a", TXT: "#6b7280",
    ZIP: "#d97706", RAR: "#d97706", CSV: "#16a34a",
  };

  // ── File render ──
  const renderFile = (fileUrl, isSender) => {
    const raw = fileUrl.split("?")[0];
    const ext = raw.split(".").pop().toLowerCase();
    const fileName = getFileName(fileUrl);

    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
    const isAudio = ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext);
    const isVideo = ["mp4", "mov", "webm", "avi", "mkv"].includes(ext);

    if (isImage) {
      return (
        <img
          src={fileUrl}
          alt="shared"
          className="block w-full max-h-64 object-cover cursor-pointer select-none hover:opacity-95 transition-opacity"
          onClick={() => window.open(fileUrl, "_blank")}
          draggable={false}
        />
      );
    }

    if (isAudio) {
      return (
        <div
          className="rounded-xl overflow-hidden min-w-[230px]"
          style={{ background: "rgba(158,47,208,0.08)", border: "1px solid rgba(158,47,208,0.25)" }}
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
            <audio src={fileUrl} controls className="w-full" style={{ height: "32px", accentColor: "#9E2FD0" }} />
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[300px]">
          <video src={fileUrl} controls className="w-full max-h-48 object-contain bg-black" />
          <div className="px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: "rgba(158,47,208,0.06)" }}>
            <FiVideo size={11} className="text-purple-500 dark:text-purple-400" />
            <span className="text-[11px] truncate text-gray-700 dark:text-gray-300">{fileName}</span>
          </div>
        </div>
      );
    }

    // Generic file download card (PDF, DOC, TXT, ZIP, etc.)
    const extUpper = ext.toUpperCase();
    const extColor = EXT_COLORS[extUpper] || "#9E2FD0";
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-[200px] max-w-[280px] group/file no-underline"
        style={{ background: "rgba(158,47,208,0.07)", border: "1px solid rgba(158,47,208,0.22)" }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-sm"
          style={{ background: extColor }}
        >
          <FileIconComp size={14} className="text-white mb-0.5" />
          <span className="text-white font-black leading-none" style={{ fontSize: "8px" }}>{extUpper.slice(0, 4)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-snug text-gray-800 dark:text-gray-100">{fileName}</p>
          <p className="text-[10px] uppercase font-medium tracking-wide mt-0.5 text-purple-600 dark:text-purple-400">{extUpper} file</p>
        </div>
        <FiDownload size={14} className="flex-shrink-0 transition-transform group-hover/file:translate-y-0.5 text-purple-500 dark:text-purple-400" />
      </a>
    );
  };

  const { readMessages } = useChatWindow();

  // Mark as read when opening the chat — await so fetch runs AFTER the PATCH
  useEffect(() => {
    if (!user?.id || !room) return;
    (async () => {
      await readMessages(userId, room);
      dispatch(fetchUnreadMessages(user.id));
    })();
  }, [room, user?.id, dispatch, userId, readMessages]);

  // Mark as read whenever new messages arrive while the chat is open
  useEffect(() => {
    if (!user?.id || !room || chatMessages.length === 0) return;
    (async () => {
      await readMessages(userId, room);
      dispatch(fetchUnreadMessages(user.id));
    })();
  }, [chatMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [chatMessages]);

  const handleJoinGeneralClass = () => {
    navigate("/classroom", {
      state: {
        roomId: room,
        chatRoomId: room,
        userName: user.name,
        email: user.email,
        fromMessage: true,
        chatName: studentName,
        chatType,
      },
    });
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yest = new Date(); yest.setDate(today.getDate() - 1);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return time;
    if (d.toDateString() === yest.toDateString()) return `${t("common.yesterday")} ${time}`;
    return `${d.toLocaleDateString(i18n.language, { month: "short", day: "numeric" })} ${time}`;
  };

  const getInitials = (name) => {
    if (!name || name === "undefined" || name === "null") return "?";
    const p = name.trim().split(" ");
    return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  };

  const generateColor = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 60%, 52%)`;
  };

  const formatMessageWithLinks = (text) => {
    if (!text) return text;
    const parts = [];
    let lastIndex = 0;
    const regex = /https?:\/\/[^\s]+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      parts.push(
        <a
          key={match.index}
          href={match[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:opacity-80 transition-opacity"
          style={{ color: "inherit", textDecorationColor: "rgba(255,255,255,0.6)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {match[0]}
        </a>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length > 0 ? parts : text;
  };

  const isGeneralChat = chatType === "general" || chatType === "teacher" || chatType === "group";

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden
                    bg-gray-50 dark:bg-[#0d0a1e] transition-colors duration-300">

      {/* Orbs de fondo */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block" aria-hidden="true">
        <div className="absolute rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.5), transparent 70%)", width: "400px", height: "400px", top: "-10%", right: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "-5%", left: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(246,184,46,0.3), transparent 70%)", width: "300px", height: "300px", top: "20%", left: "20%" }} />
      </div>

      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 py-3 flex-shrink-0
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-b border-gray-200 dark:border-white/10
                      z-10 transition-colors duration-300">

        {/* Back button — mobile */}
        <button
          onClick={onBackClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <FiChevronLeft size={20} />
        </button>

        {/* Avatar icon */}
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
                        bg-purple-100 dark:bg-purple-500/20
                        border border-purple-200 dark:border-purple-500/30">
          <FaComments className="text-purple-600 dark:text-purple-400" size={15} />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {studentName}
            </h2>
            {isGeneralChat && (
              <button
                onClick={handleJoinGeneralClass}
                title="Join video class"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0
                           text-white text-[11px] font-semibold
                           transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.4)" }}
              >
                <FiVideo size={13} />
                <span>Join</span>
              </button>
            )}
          </div>
          {/* Active members */}
          {roomMembers.length > 0 ? (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {roomMembers.slice(0, 5).map((m) => {
                const flag = m.language?.toLowerCase() === "spanish" ? "🇪🇸"
                           : m.language?.toLowerCase() === "polish"  ? "🇵🇱"
                           : "🇬🇧";
                const initials = m.name?.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
                return (
                  <span key={m.id} title={`${m.name} • ${m.language || "English"}`}
                    className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full
                               bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400
                               border border-emerald-200 dark:border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {initials} {flag}
                  </span>
                );
              })}
              {roomMembers.length > 5 && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500">+{roomMembers.length - 5}</span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              ● {t("chatWindow.activeNow")}
            </span>
          )}
        </div>

        {/* Close button — always visible */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg
                       text-gray-500 dark:text-gray-400
                       hover:bg-red-50 dark:hover:bg-red-500/10
                       hover:text-red-500 dark:hover:text-red-400
                       transition-colors"
            title="Close chat"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Accent line */}
      <div className="relative h-[2px] flex-shrink-0 z-10 opacity-70 dark:opacity-100"
           style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

      {/* Messages */}
      <PerfectScrollbar
        containerRef={(ref) => (scrollContainerRef.current = ref)}
        className="flex-1 relative z-10 bg-transparent transition-colors duration-300"
        options={{ suppressScrollX: true }}
      >
        <div className="p-4 sm:p-6">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-full
                             bg-purple-100 dark:bg-purple-500/20
                             border border-purple-200 dark:border-purple-500/30
                             flex items-center justify-center">
                <FaComments className="text-purple-400" size={24} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("chatWindow.noMessages")}
              </p>
            </div>
          )}

          <ul className="space-y-1">
            {chatMessages.map((msg, index) => {
              const prev = chatMessages[index - 1];
              const showTimestamp = index === 0 || new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;
              const isSender = msg.email === email;
              const hasContent = msg.fileUrl || msg.message?.trim();
              if (!hasContent) return null;
              const isFirstFromUser = index === 0 || msg.email !== prev.email;
              const showUsername = !isSender && isFirstFromUser;
              const initials = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);
              const isImageOnly = !!(msg.fileUrl && !msg.message?.trim() && isImageUrl(msg.fileUrl));
              // Non-image file cards render their own styled container — no outer bubble needed
              const isFileOnly = !!(msg.fileUrl && !msg.message?.trim() && !isImageUrl(msg.fileUrl));

              return (
                <div key={index}>
                  {showTimestamp && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300
                                     px-3 py-1 rounded-full bg-white dark:bg-black/40
                                     backdrop-blur-sm border border-gray-200 dark:border-white/10">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                    </div>
                  )}

                  <li className={`group flex items-end gap-2 mb-1.5 ${isSender ? "justify-end" : "justify-start"}`}>

                    {/* Avatar (others) */}
                    {!isSender && (
                      <div className="flex-shrink-0 w-8 self-end">
                        {isFirstFromUser ? (
                          msg.userUrl ? (
                            <img src={msg.userUrl} alt="avatar"
                              className="w-8 h-8 rounded-full object-cover shadow
                                       ring-2 ring-purple-200 dark:ring-purple-500/30" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center
                                          text-white text-xs font-bold shadow
                                          ring-2 ring-purple-200 dark:ring-purple-500/30"
                              style={{ background: avatarColor }}>
                              {initials}
                            </div>
                          )
                        ) : <div className="w-8 h-8" />}
                      </div>
                    )}

                    {isSender ? (
                      <div className="flex items-end gap-1.5 max-w-[75%] sm:max-w-[60%]">
                        {/* Options */}
                        <div className="relative self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => toggleOptionsMenu(msg.id)}
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400
                                     hover:text-purple-600 dark:hover:text-purple-400
                                     hover:bg-purple-50 dark:hover:bg-white/10 transition-colors duration-150"
                          >
                            <BsThreeDots size={14} />
                          </button>
                          {openMessageId === msg.id && (
                            <div className="absolute bottom-full right-0 mb-1 z-20">
                              <MessageOptionsCard
                                onEdit={() => handleEditMessage(msg)}
                                onDelete={() => handleDeleteMessage(msg.id)}
                                onClose={() => toggleOptionsMenu(msg.id)}
                              />
                            </div>
                          )}
                        </div>
                        {/* Bubble */}
                        <div
                          className={`relative rounded-2xl rounded-br-sm ${
                            isImageOnly ? "overflow-hidden shadow-lg"
                            : isFileOnly ? ""
                            : "px-4 py-2.5 text-white text-sm leading-relaxed shadow-lg"
                          }`}
                          style={isImageOnly
                            ? { boxShadow: "0 3px 12px rgba(0,0,0,0.22)" }
                            : isFileOnly ? {}
                            : { background: "linear-gradient(135deg, #9E2FD0 0%, #7b22a8 100%)" }}
                        >
                          {msg.fileUrl && renderFile(msg.fileUrl, true)}
                          {msg.message?.trim() && (
                            <p className="text-white" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {formatMessageWithLinks(msg.message)}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[75%] sm:max-w-[60%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1 ml-1">
                            {msg.username}
                          </p>
                        )}
                        <div
                          className={`relative rounded-2xl rounded-bl-sm ${
                            isImageOnly
                              ? "overflow-hidden shadow-sm"
                              : isFileOnly
                              ? ""
                              : "px-4 py-2.5 text-sm leading-relaxed bg-white dark:bg-white/5 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none"
                          }`}
                        >
                          {msg.fileUrl && renderFile(msg.fileUrl, false)}
                          {msg.message?.trim() && (
                            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {formatMessageWithLinks(msg.message)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                </div>
              );
            })}
          </ul>
        </div>
      </PerfectScrollbar>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="relative z-10 px-5 pb-1 flex-shrink-0">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
            <span className="inline-flex gap-0.5 ml-1">
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </span>
        </div>
      )}

      {/* Input bar */}
      <div className="relative flex-shrink-0 px-3 sm:px-5 py-3 z-10
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg
                         bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <FiEdit2 size={12} />
              <span>Editing message</span>
            </div>
            <button onClick={clearEditing} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-gray-50 dark:bg-black/40 rounded-2xl px-3 py-2
                        border border-gray-200 dark:border-white/10
                        focus-within:border-purple-400 dark:focus-within:border-purple-500/50
                        transition-colors duration-200">

          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="flex-shrink-0 p-1.5 rounded-lg self-end mb-0.5
                       text-gray-500 dark:text-gray-400
                       hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-150"
          >
            <BsEmojiSmile size={19} />
          </button>

          {/* File button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 p-1.5 rounded-lg self-end mb-0.5
                       text-gray-500 dark:text-gray-400
                       hover:text-purple-600 dark:hover:text-purple-400
                       disabled:opacity-40 transition-colors duration-150"
            title="Attach file"
          >
            <FiPaperclip size={18} className={isUploading ? "animate-pulse" : ""} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
            accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

          {/* Textarea */}
          <textarea
            placeholder={t("chatWindow.typePlaceholder")}
            value={message}
            onChange={handleInputWithTyping}
            onClick={() => dispatch(fetchUnreadMessages(user.id))}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none
                       text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       max-h-32 leading-relaxed py-1.5"
          />

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                       self-end transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:scale-105 active:scale-95 text-white"
            style={{
              background: message.trim() ? "linear-gradient(135deg, #9E2FD0, #7b22a8)" : "#9E2FD0",
              opacity: message.trim() ? 1 : 0.3,
            }}
          >
            <img src={send} alt="send" className="w-4 h-4 brightness-200" />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2 z-20">
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl
                          border border-gray-200 dark:border-white/10
                          overflow-hidden shadow-xl">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindowComponent;
