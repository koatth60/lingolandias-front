import { useRef, useLayoutEffect, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile, BsPaperclip, BsThreeDots } from "react-icons/bs";
import { FiX, FiArrowLeft, FiMessageSquare, FiSend, FiDownload, FiEye, FiBell, FiBellOff, FiTrash2, FiEdit2, FiArrowDown, FiCornerUpLeft } from "react-icons/fi";
import { updateUserSettings } from "../../redux/userSlice";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import useSocketManager from "../../hooks/useSocketManager";
import useMessageHandler from "../../hooks/useMessageHandler";
import useMessageFormatter from "../../hooks/useMessageFormatter.jsx";
import useChatInput from "../../hooks/useChatInput";
import useArchivedMessages from "../../hooks/useArchivedMessages";
import MessageOptionsCard from "./MessageOptionsCard";
import { openFilePreview } from "../../redux/filePreviewSlice";
import Dropdown from "../schedule/Dropdown";

const getInitials = (name) => {
  if (!name || name === "undefined" || name === "null") return "?";
  const p = name.trim().split(" ");
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
};

const generateAvatarColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (name.charCodeAt(i) + ((h << 5) - h));
  return `hsl(${Math.abs(h) % 360}, 60%, 52%)`;
};

// File extension set — defined outside component to avoid recreation on each render
const FILE_EXTS = new Set([
  "jpg","jpeg","png","gif","webp","svg",
  "mp3","wav","ogg","m4a","aac","flac",
  "mp4","mov","webm","avi","mkv",
  "pdf","doc","docx","xls","xlsx","ppt","pptx","txt","zip","rar","csv",
]);

const ChatWindow = ({
  username,
  email,
  room,
  studentName,
  height,
  isChatOpen,
  setIsChatOpen,
  setShowChat,
  handleJoinMeeting,
  onBack,
  meeting = false,
  onNewMessage,
}) => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo?.user);
  const teacher = useSelector((state) => state.user.userInfo?.user?.teacher);
  const dispatch = useDispatch();
  const soundEnabled = user?.settings?.notificationSound !== false;
  const handleToggleSound = () => {
    dispatch(updateUserSettings({ notificationSound: !soundEnabled }));
  };
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { socket, chatMessages, setChatMessages, typingUser } = useSocketManager(
    room,
    username,
    email,
    onNewMessage
  );
  const { allMessages, fetchArchivedMessages, hasMore } = useArchivedMessages(
    room,
    chatMessages
  );
  const {
    uploading,
    error,
    file,
    sendMessage,
    handleFileChange,
    uploadFile,
    clearFile,
  } = useMessageHandler(socket, room, username, email);

  const handleClearFile = () => {
    clearFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [peerOnline, setPeerOnline] = useState(null);

  // Scroll-to-bottom tracking
  const isAtBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevMsgCountRef = useRef(0);

  // Typing emit debounce
  const typingTimeoutRef = useRef(null);

  // Track peer online status (for teacher role showing student's status)
  useEffect(() => {
    if (!socket) return;
    const handler = ({ id, online }) => {
      if (id === room) setPeerOnline(online);
    };
    socket.on("userStatus", handler);
    return () => { socket.off("userStatus", handler); };
  }, [socket, room]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
    if (atBottom) setNewMsgCount(0);
  };

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setNewMsgCount(0);
  };

  const handleFileClick = (fileUrl) => setSelectedFile(fileUrl);
  const handleCloseModal = () => setSelectedFile(null);
  const handleDownload = () => {
    if (selectedFile) {
      window.open(selectedFile, "_blank");
      handleCloseModal();
    }
  };
  const handlePreview = () => {
    if (selectedFile) {
      dispatch(openFilePreview(selectedFile));
      handleCloseModal();
    }
  };

  const { formatMessageWithLinks, formatTimestamp, renderFileMessage, isImageUrl } =
    useMessageFormatter(handleFileClick);

  const [editingMsg, setEditingMsg] = useState(null);

  const handleSend = (msg, setMsg, reset) => {
    if (editingMsg) {
      if (!msg.trim()) return;
      socket.emit("editNormalChat", { messageId: editingMsg.id, room, newMessage: msg.trim() });
      setChatMessages((prev) => prev.map((m) => m.id === editingMsg.id ? { ...m, message: msg.trim() } : m));
      setMsg("");
      setEditingMsg(null);
    } else {
      sendMessage(msg, setMsg, reset, replyTo);
      setReplyTo(null);
      // Clear typing indicator the moment the message is sent
      clearTimeout(typingTimeoutRef.current);
      if (socket) socket.emit("stopTyping", { room });
    }
  };

  const {
    message,
    setMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    handleInput,
    handleKeyDown,
    handleEmojiClick,
    resetTextarea,
  } = useChatInput(handleSend);

  const handleInputWithTyping = (e) => {
    handleInput(e);
    if (!file && socket) {
      socket.emit("typing", { room, username });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { room });
      }, 2000);
    }
  };

  const {
    handleDeleteNormalMessage,
    toggleOptionsMenu,
    openMessageId,
  } = useDeleteMessage(setChatMessages, socket, room);

  const handleEditMessage = (msg) => {
    setEditingMsg(msg);
    toggleOptionsMenu(openMessageId);
  };

  const clearEditing = () => {
    setEditingMsg(null);
    setMessage("");
  };

  const handleClearConversation = () => {
    Swal.fire({
      title: t("chatWindow.clearTitle"),
      text: t("chatWindow.clearText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("chatWindow.clearConfirm"),
      cancelButtonText: t("chatWindow.clearCancel"),
      confirmButtonColor: "#e53e3e",
      background: "#1a1a2e",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        socket.emit("clearNormalChat", { room });
      }
    });
  };

  useEffect(() => {
    if (editingMsg) setMessage(editingMsg.message);
  }, [editingMsg]);

  const isArchivedFetch = useRef(false);
  const prevScrollHeight = useRef(null);

  const handleLoadMore = async () => {
    if (scrollContainerRef.current) {
      prevScrollHeight.current = scrollContainerRef.current.scrollHeight;
    }
    isArchivedFetch.current = true;
    await fetchArchivedMessages();
  };

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    if (isArchivedFetch.current) {
      scrollContainer.scrollTop =
        scrollContainer.scrollHeight - prevScrollHeight.current;
      isArchivedFetch.current = false;
    } else {
      const newCount = allMessages.length - prevMsgCountRef.current;
      if (isAtBottomRef.current) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        setNewMsgCount(0);
      } else if (newCount > 0) {
        setNewMsgCount((prev) => prev + newCount);
      }
    }
    prevMsgCountRef.current = allMessages.length;
  }, [allMessages]);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.overflowY = "hidden";
    textarea.style.height = "1px";
    const newHeight = Math.max(Math.min(textarea.scrollHeight, 128), 32);
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = newHeight >= 128 ? "auto" : "hidden";
  };

  // Runs on every keystroke — immediate, before paint
  useLayoutEffect(() => {
    resizeTextarea();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  // Poll every frame for 500ms after mount — the chat panel animates from w-0
  // so the first few useLayoutEffect measurements are wrong (0-width container).
  // This keeps correcting until the transition finishes.
  useEffect(() => {
    let rafId;
    const start = Date.now();
    const poll = () => {
      resizeTextarea();
      if (Date.now() - start < 500) rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative w-full flex flex-col overflow-hidden bg-white dark:bg-[#0f0d24] ${
        meeting ? "" : "rounded-2xl border border-gray-200 dark:border-[rgba(158,47,208,0.18)]"
      }`}
      style={{
        height: height || "630px",
        boxShadow: meeting ? "none" : "0 8px 32px rgba(0,0,0,0.10), 0 2px 10px rgba(158,47,208,0.08)",
      }}
    >
      {/* ── Header ── */}
      <div className="relative flex-shrink-0">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80 z-10" />

        {/* Light bg */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,245,255,0.98) 100%)",
            borderBottom: "1px solid rgba(158,47,208,0.08)",
          }}
        />
        {/* Dark bg */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(135deg, rgba(15,13,36,0.98) 0%, rgba(26,20,50,0.98) 100%)",
            borderBottom: "1px solid rgba(158,47,208,0.15)",
          }}
        />

        <div className="relative z-10 flex items-center px-4 py-3 mt-[2px] gap-3">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 p-1.5 rounded-lg text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiArrowLeft size={16} />
            </button>
          )}
          {isChatOpen && !onBack && (
            <button
              onClick={() => {
                setIsChatOpen(false);
                setShowChat(false);
              }}
              className="flex-shrink-0 p-1.5 rounded-lg text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiArrowLeft size={16} />
            </button>
          )}

          {/* Icon badge */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
              boxShadow: "0 2px 8px rgba(158,47,208,0.35)",
            }}
          >
            <FiMessageSquare size={14} className="text-white" />
          </div>

          {/* Name + online dot */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-extrabold login-gradient-text truncate">
              {user.role === "user"
                ? teacher
                  ? teacher.name
                  : t("chatWindow.noTeacher")
                : studentName}
            </span>
            {user.role === "user" && teacher && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    teacher?.online === "online" ? "#26D9A1" : "#ef4444",
                }}
                title={teacher?.online === "online" ? t("chatWindow.online") : t("chatWindow.offline")}
              />
            )}
            {user.role !== "user" && peerOnline !== null && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: peerOnline === "online" ? "#26D9A1" : "#ef4444" }}
                title={peerOnline === "online" ? t("chatWindow.online") : t("chatWindow.offline")}
              />
            )}
          </div>

          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            title={soundEnabled ? t("chatWindow.muteSound") : t("chatWindow.unmuteSound")}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {soundEnabled ? <FiBell size={16} /> : <FiBellOff size={16} />}
          </button>

          {/* Clear conversation */}
          <button
            onClick={handleClearConversation}
            title="Clear conversation"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <FiTrash2 size={16} />
          </button>

          {/* Student dropdown */}
          {user.role === "user" && (
            <Dropdown>
              <button
                onClick={() => handleJoinMeeting()}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.001 3.001 0 015.644 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("chatList.groupClass")}
              </button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Message area ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 sm:p-5 bg-gray-50 dark:bg-black/20 overflow-y-auto"
        style={{ minHeight: 0 }}
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={handleLoadMore}
              className="py-1.5 px-5 text-xs font-semibold rounded-full transition-all duration-150
                         text-[#9E2FD0] dark:text-[#c084fc]
                         border border-[rgba(158,47,208,0.25)] dark:border-[rgba(158,47,208,0.35)]
                         bg-white dark:bg-white/5
                         hover:bg-[rgba(158,47,208,0.06)] dark:hover:bg-white/10"
            >
              {t("chatWindow.loadMore")}
            </button>
          </div>
        )}

        <ul>
          {allMessages.map((msg, index) => {
            const showTimestamp =
              index === 0 ||
              new Date(msg.timestamp) -
                new Date(allMessages[index - 1].timestamp) >
                3 * 60 * 1000;
            const isSender = msg.email === email;
            const isFileMessage = msg.message.startsWith("http") && FILE_EXTS.has(msg.message.split("?")[0].split(".").pop().toLowerCase());
            const isImageMessage = isFileMessage && isImageUrl(msg.message);
            const isGrouped =
              !showTimestamp &&
              index > 0 &&
              allMessages[index - 1].email === msg.email;

            return (
              <div key={index} className={isGrouped ? "mt-1" : "mt-3"}>
                {showTimestamp && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                    <span className="text-[10px] font-medium px-3 py-1 rounded-full
                                     text-gray-500 dark:text-gray-400
                                     bg-white dark:bg-white/5
                                     border border-gray-200 dark:border-white/10">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                  </div>
                )}
                <li
                  className={`group flex items-end gap-2 ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for received messages */}
                  {!isSender && (
                    <div className="flex-shrink-0 w-7 self-end">
                      {!isGrouped ? (
                        msg.userUrl ? (
                          <img src={msg.userUrl} alt="avatar"
                            className="w-7 h-7 rounded-full object-cover shadow ring-2 ring-purple-200 dark:ring-purple-500/30" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow ring-2 ring-purple-200 dark:ring-purple-500/30"
                            style={{ background: generateAvatarColor(msg.username) }}>
                            {getInitials(msg.username)}
                          </div>
                        )
                      ) : <div className="w-7 h-7" />}
                    </div>
                  )}
                  <div
                    className={`relative max-w-[75%] shadow-sm ${
                      isImageMessage
                        ? `overflow-hidden rounded-2xl ${isSender ? "rounded-br-sm" : "rounded-bl-sm"}`
                        : isFileMessage
                        ? ""
                        : `px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isSender
                              ? "text-white rounded-br-sm"
                              : "bg-white dark:bg-[rgba(255,255,255,0.08)] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-bl-sm"
                          }`
                    }`}
                    style={
                      isImageMessage
                        ? { boxShadow: "0 3px 12px rgba(0,0,0,0.18)" }
                        : isFileMessage
                        ? {}
                        : isSender
                        ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 3px 12px rgba(158,47,208,0.30)" }
                        : {}
                    }
                  >
                    {/* Sender actions: reply + dots */}
                    {isSender && (
                      <div className="absolute top-1/2 -left-16 transform -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setReplyTo({ id: msg.id, message: msg.message, username: msg.username })}
                          className="p-1.5 rounded-full text-gray-400 hover:text-[#9E2FD0] hover:bg-[rgba(158,47,208,0.08)] transition-colors"
                        >
                          <FiCornerUpLeft size={13} />
                        </button>
                        <button
                          onClick={() => toggleOptionsMenu(msg.id)}
                          className="p-1.5 rounded-full text-gray-400 hover:text-[#9E2FD0] hover:bg-[rgba(158,47,208,0.08)] transition-colors"
                        >
                          <BsThreeDots size={13} />
                        </button>
                      </div>
                    )}

                    {/* Reply quote */}
                    {msg.replyTo && (
                      <div
                        className={`mb-2 pl-2 border-l-2 rounded text-xs ${
                          isSender
                            ? "border-white/50 bg-white/10"
                            : "border-[#9E2FD0]/60 bg-[#9E2FD0]/5 dark:bg-white/5"
                        }`}
                        style={{ padding: "4px 6px" }}
                      >
                        <p className={`font-semibold text-[10px] mb-0.5 ${isSender ? "text-white/80" : "text-[#9E2FD0] dark:text-purple-300"}`}>
                          {msg.replyTo.username}
                        </p>
                        <p className={`line-clamp-2 text-[11px] ${isSender ? "text-white/70" : "text-gray-500 dark:text-gray-400"}`}>
                          {msg.replyTo.message.startsWith("http") ? "📎 File" : msg.replyTo.message}
                        </p>
                      </div>
                    )}

                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {isFileMessage
                        ? renderFileMessage(msg.message, isSender)
                        : formatMessageWithLinks(msg.message, isSender)}
                    </div>
                    {isSender && (
                      <span
                        className={`absolute bottom-1.5 right-2 text-[10px] leading-none ${isImageMessage ? "px-1 py-0.5 rounded bg-black/40" : ""}`}
                        style={{ color: msg.unread === false ? "#26D9A1" : isImageMessage ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)" }}
                      >
                        {msg.unread === false ? "✓✓" : "✓"}
                      </span>
                    )}
                    {openMessageId === msg.id && (
                      <div className="absolute top-full mt-1 left-0 z-10">
                        <MessageOptionsCard
                          onEdit={() => handleEditMessage(msg)}
                          onDelete={() => handleDeleteNormalMessage(msg.id)}
                          onClose={() => toggleOptionsMenu(msg.id)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Receiver reply button — appears on hover */}
                  {!isSender && (
                    <button
                      onClick={() => setReplyTo({ id: msg.id, message: msg.message, username: msg.username })}
                      className="flex-shrink-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full text-gray-400 hover:text-[#9E2FD0] dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <FiCornerUpLeft size={13} />
                    </button>
                  )}
                </li>
              </div>
            );
          })}
        </ul>

      </div>

      {/* Typing indicator — always visible above input, never hidden by scroll */}
      {typingUser && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5
                        bg-gray-50 dark:bg-black/20
                        border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2FD0]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2FD0]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2FD0]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">{typingUser} is typing…</span>
        </div>
      )}

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{
            bottom: "80px",
            background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
            boxShadow: "0 4px 12px rgba(158,47,208,0.4)",
          }}
        >
          <FiArrowDown size={16} className="text-white" />
          {newMsgCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">
              {newMsgCount > 9 ? "9+" : newMsgCount}
            </span>
          )}
        </button>
      )}

      {/* ── File preview modal ── */}
      {selectedFile && (
        <div className="absolute inset-0 flex items-center justify-center z-40"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          <div className="relative w-64 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}>
            {/* Light bg */}
            <div className="absolute inset-0 dark:hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.98)", border: "1px solid rgba(0,0,0,0.08)" }} />
            {/* Dark bg */}
            <div className="absolute inset-0 hidden dark:block rounded-2xl"
              style={{ background: "rgba(15,13,36,0.98)", border: "1px solid rgba(158,47,208,0.18)" }} />
            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-[2px]"
              style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />
            <div className="relative z-10 p-5">
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-white mb-4 text-center">
                {t("chatWindow.fileOptions")}
              </h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePreview}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 3px 12px rgba(158,47,208,0.3)" }}
                >
                  <FiEye size={14} /> {t("chatWindow.preview")}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 3px 12px rgba(38,217,161,0.3)" }}
                >
                  <FiDownload size={14} /> {t("chatWindow.download")}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all
                             text-gray-600 dark:text-gray-300
                             bg-gray-100 dark:bg-white/8
                             border border-gray-200 dark:border-white/10
                             hover:bg-gray-200 dark:hover:bg-white/12"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      <div className="relative flex-shrink-0 p-3
                      bg-white dark:bg-[#0f0d24]
                      border-t border-gray-100 dark:border-[rgba(158,47,208,0.12)]">
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <FiEdit2 size={12} />
              <span>Editing message</span>
            </div>
            <button onClick={clearEditing} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}
        {replyTo && !editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg bg-[#9E2FD0]/5 dark:bg-[#9E2FD0]/10 border border-[#9E2FD0]/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <FiCornerUpLeft size={12} className="text-[#9E2FD0] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#9E2FD0] dark:text-purple-300">{replyTo.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {replyTo.message.startsWith("http") ? "📎 File" : replyTo.message}
                </p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}
        {file && (
          <div className="p-2.5 mb-3 rounded-xl
                          bg-gray-50 dark:bg-white/5
                          border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
              <button onClick={handleClearFile} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <FiX size={14} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t("chatWindow.readyToSend")}</p>
          </div>
        )}
        {uploading && (
          <p className="text-xs text-[#9E2FD0] mb-2 font-medium">{t("chatWindow.uploading")}</p>
        )}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="flex items-center gap-2
                        bg-gray-50 dark:bg-white/5
                        rounded-xl px-3 py-2
                        border border-gray-200 dark:border-white/10
                        focus-within:border-[rgba(158,47,208,0.5)] dark:focus-within:border-[rgba(158,47,208,0.4)]
                        transition-colors duration-200">
          <textarea
            ref={textareaRef}
            placeholder={t("chatWindow.typePlaceholder")}
            value={message}
            onChange={handleInputWithTyping}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent resize-none outline-none
                       text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       leading-relaxed py-1"
            style={{ minHeight: "32px", maxHeight: "128px", overflowY: "hidden" }}
            disabled={!!file}
            rows={1}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-[#F6B82E] transition-colors"
            >
              <BsEmojiSmile size={18} />
            </button>
            <label
              htmlFor="fileInput"
              className="text-gray-400 hover:text-[#26D9A1] cursor-pointer transition-colors"
            >
              <BsPaperclip size={18} />
            </label>
            <input
              type="file"
              id="fileInput"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </div>
          <button
            onClick={
              file
                ? uploadFile
                : () => handleSend(message, setMessage, resetTextarea)
            }
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30"
            style={{
              background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
              boxShadow: "0 2px 8px rgba(158,47,208,0.35)",
            }}
            disabled={uploading || (!message.trim() && !file)}
          >
            <FiSend size={13} className="text-white" />
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

export default ChatWindow;
