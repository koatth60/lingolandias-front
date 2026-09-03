// ChatWindowComponent.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import send from "../../assets/logos/send.png";
import { BsEmojiSmile, BsThreeDots, BsType, BsTypeBold, BsTypeItalic, BsTypeStrikethrough, BsCodeSlash } from "react-icons/bs";
import { FiVideo, FiChevronLeft, FiEdit2, FiX, FiPaperclip, FiDownload, FiFile, FiMusic, FiFileText, FiCornerUpLeft, FiArrowDown, FiUsers, FiPhoneMissed, FiUserPlus, FiUserMinus, FiLogOut } from "react-icons/fi";

const SYSTEM_MESSAGE_TYPES = ["member_added", "member_removed", "member_left", "group_renamed"];
import { FaComments } from "react-icons/fa";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import EmojiPicker from "emoji-picker-react";
import MessageOptionsCard from "./MessageOptionsCard";
import MessageReactions from "./MessageReactions";
import useDeleteConversationMessage from "../../hooks/useDeleteConversationMessage.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useConversationChat from "../../hooks/useConversationChat.js";
import useChatInputHandler from "../../hooks/useChatInputHandler.js";
import useUserSearch from "../../hooks/useUserSearch.js";
import Swal from "sweetalert2";
import { renderInlineFormatting } from "../../utils/inlineFormatting.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac"]);
const VIDEO_EXTS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);
const isImageUrl = (url) => IMAGE_EXTS.has(url.split("?")[0].split(".").pop().toLowerCase());

const EXT_COLORS = {
  PDF: "#ef4444", DOC: "#2563eb", DOCX: "#2563eb",
  XLS: "#16a34a", XLSX: "#16a34a", TXT: "#6b7280",
  ZIP: "#d97706", RAR: "#d97706", CSV: "#16a34a",
};

const ChatWindowComponent = ({
  username,
  room,
  studentName,
  chatType,
  email,
  userUrl,
  userId,
  otherUserId,
  isDraft,
  onResolveDraft,
  socket,
  onBackClick,
  onClose,
  onViewProfile,
  onViewGroupMembers,
  onAddMember,
}) => {
  const { t, i18n } = useTranslation();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const readDebounceRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo?.user);

  const currentUser = { id: userId, name: username, email, avatarUrl: userUrl };
  const { chatMessages, setChatMessages, sendMessage, loadOlderMessages, hasMore, loadingMore, toggleReaction, isLoading } = useConversationChat(
    socket, room, currentUser
  );

  const [message, setMessage] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [roomMembersLoaded, setRoomMembersLoaded] = useState(false);
  // Actual persistent group roster for @ mentions — NOT roomMembers above,
  // which is live socket-room presence (who's currently connected), not who
  // actually belongs to this conversation. DM chats don't get an @ picker;
  // mentioning the one other person in a 1:1 is redundant.
  const [mentionCandidates, setMentionCandidates] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartPos, setMentionStartPos] = useState(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const [replyTo, setReplyTo] = useState(null);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  // Image lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const { showEmojiPicker, setShowEmojiPicker, handleInput, handleEmojiClick } =
    useChatInputHandler(message, setMessage);

  const { handleDeleteMessage, toggleOptionsMenu, openMessageId } =
    useDeleteConversationMessage(setChatMessages, socket, room);

  // ── Typing emit wrapper ──
  const handleInputWithTyping = (e) => {
    handleInput(e);
    // auto-grow textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 128) + "px";
    }
    if (socket && room) {
      socket.emit("typing", { room, username });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { room });
      }, 2000);
    }
    updateMentionState(e.target.value, e.target.selectionStart);
  };

  // Finds the @-token the cursor is currently sitting inside of, if any —
  // e.g. typing "hey @car" opens the picker with query "car"; a space (or
  // moving the cursor away) closes it. The char right before "@" must be
  // whitespace/start-of-line so "user@domain.com" never triggers it.
  const updateMentionState = (text, cursorPos) => {
    const upToCursor = text.slice(0, cursorPos);
    const at = upToCursor.lastIndexOf("@");
    if (at === -1 || (at > 0 && !/\s/.test(upToCursor[at - 1]))) {
      setMentionQuery(null);
      return;
    }
    const query = upToCursor.slice(at + 1);
    if (/\s/.test(query)) {
      setMentionQuery(null);
      return;
    }
    setMentionStartPos(at);
    setMentionQuery(query);
    setMentionActiveIndex(0);
  };

  // Non-member search — lets a mention reach (and, on confirm, add) someone
  // who isn't in the group yet, not just people already in mentionCandidates.
  // Backend only notifies mentionedUserIds that are actual current members
  // (see extractMentionedUserIds in videocalls.gateaway.ts), so adding them
  // on confirm isn't just a courtesy — it's what makes the mention real.
  const { results: nonMemberSearchResults } = useUserSearch(
    chatType === "group" ? mentionQuery : null,
    userId
  );

  const filteredMentionCandidates = mentionQuery === null
    ? []
    : (() => {
        const memberIds = new Set(mentionCandidates.map((m) => m.id));
        const memberMatches = mentionCandidates
          .filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .map((m) => ({ ...m, isMember: true }));
        const nonMemberMatches = nonMemberSearchResults
          .filter((u) => !memberIds.has(u.id))
          .map((u) => ({
            id: u.id,
            name: `${u.name || ""} ${u.lastName || ""}`.trim(),
            firstName: u.name,
            lastName: u.lastName,
            role: u.role,
            isMember: false,
          }));
        return [...memberMatches, ...nonMemberMatches].slice(0, 6);
      })();

  const insertMentionToken = (candidate) => {
    const before = message.slice(0, mentionStartPos);
    const after = message.slice(mentionStartPos + 1 + (mentionQuery?.length || 0));
    const token = `@[${candidate.name}](${candidate.id}) `;
    const next = `${before}${token}${after}`;
    setMessage(next);
    // Put the cursor right after the inserted token, not at the end of the
    // message — matters once there's text after the mention (e.g. inserting
    // a mid-sentence mention someone edited their way back into).
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = before.length + token.length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertMention = (candidate) => {
    if (mentionStartPos === null) return;
    setMentionQuery(null);
    setMentionStartPos(null);

    if (candidate.isMember === false) {
      Swal.fire({
        title: t("messagesExtra.mentionAddNotMemberTitle", { name: candidate.name }),
        text: t("messagesExtra.mentionAddNotMemberWarning", { name: candidate.name }),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: t("messagesExtra.mentionAddConfirm"),
        cancelButtonText: t("messagesExtra.cancel"),
        confirmButtonColor: "#9E2FD0",
      }).then(({ isConfirmed }) => {
        if (!isConfirmed) return;
        insertMentionToken(candidate);
        onAddMember?.(
          { id: candidate.id, name: candidate.firstName, lastName: candidate.lastName, role: candidate.role },
          true
        );
      });
      return;
    }

    insertMentionToken(candidate);
  };

  const handleMentionKeyDown = (e) => {
    if (mentionQuery === null || !filteredMentionCandidates.length) return false;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionActiveIndex((i) => (i + 1) % filteredMentionCandidates.length);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionActiveIndex((i) => (i - 1 + filteredMentionCandidates.length) % filteredMentionCandidates.length);
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredMentionCandidates[mentionActiveIndex]);
      return true;
    }
    if (e.key === "Escape") {
      setMentionQuery(null);
      return true;
    }
    return false;
  };

  // ── Typing listeners ──
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

  // ── Room members ──
  useEffect(() => {
    if (!socket || !room) return;
    setRoomMembersLoaded(false);
    socket.emit("getRoomMembers", { room });
    const handleRoomMembers = ({ room: r, members }) => {
      if (r === room) { setRoomMembers(members); setRoomMembersLoaded(true); }
    };
    socket.on("roomMembers", handleRoomMembers);
    return () => { socket.off("roomMembers", handleRoomMembers); };
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

  const handleSendMessage = async () => {
    if (editingMsg) {
      if (!message.trim()) return;
      socket.emit("editConversationMessage", { messageId: editingMsg.id, conversationId: room, newMessage: message.trim() });
      setChatMessages((prev) =>
        prev.map((m) => m.id === editingMsg.id ? { ...m, message: message.trim() } : m)
      );
      setMessage("");
      setEditingMsg(null);
    } else {
      if (!message.trim() && stagedFiles.length === 0) return;
      // First message on a brand-new DM: nothing was ever persisted just from
      // opening the chat (Teams doesn't do that either) — create the real
      // conversation only now, at send time.
      let targetRoom = room;
      if (isDraft && onResolveDraft) {
        targetRoom = await onResolveDraft();
        if (!targetRoom) return;
      }
      if (stagedFiles.length > 0) await sendStagedFiles(targetRoom);
      if (message.trim()) {
        sendMessage(message, replyTo ? { id: replyTo.id, message: replyTo.message, username: replyTo.username } : undefined, undefined, targetRoom);
      }
      setMessage("");
      setReplyTo(null);
      const ta = textareaRef.current;
      if (ta) { ta.style.height = "auto"; }
    }
    if (socket && room) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("stopTyping", { room });
    }
  };

  // Slack-style single-char delimiters — *bold*, _italic_, ~strike~, `code` —
  // wraps the current selection, or (nothing selected) drops the cursor
  // between an empty pair so typing continues inside it.
  const wrapSelection = (delimiter) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = message.slice(start, end);
    const before = message.slice(0, start);
    const after = message.slice(end);
    const next = `${before}${delimiter}${selected}${delimiter}${after}`;
    setMessage(next);
    requestAnimationFrame(() => {
      ta.focus();
      if (selected) {
        ta.setSelectionRange(start, start + delimiter.length * 2 + selected.length);
      } else {
        const pos = start + delimiter.length;
        ta.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (handleMentionKeyDown(e)) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); wrapSelection("*"); }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "i") { e.preventDefault(); wrapSelection("_"); }
  };

  // ── File staging (attach/paste, then Send) ──
  // Picking or pasting a file stages it as a thumbnail above the composer —
  // like chatWindow.jsx's existing single-file "ready to send" preview, but
  // for several files at once, all going out together on the next Send tap
  // instead of firing off as its own message the instant it's picked.
  const addStagedFile = (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      alert(t("chatWindow.fileTooBig"));
      return;
    }
    setStagedFiles((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        name: file.name,
      },
    ]);
  };

  const removeStagedFile = (id) => {
    setStagedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleFileSelect = (e) => {
    Array.from(e.target.files).forEach(addStagedFile);
    e.target.value = "";
  };

  // Ctrl/Cmd+V a screenshot or a copied image straight into the composer —
  // stages it the same way picking one via the paperclip button does.
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          addStagedFile(file);
        }
        return;
      }
    }
  };

  // Uploads every staged file and sends each as its own message — routed
  // through sendMessage() (see handleSendMessage) for the same optimistic
  // local placeholder a typed message gets, instead of only appearing after
  // the round trip back from the server's broadcast.
  const sendStagedFiles = async (targetRoom) => {
    setIsUploading(true);
    try {
      for (const staged of stagedFiles) {
        const formData = new FormData();
        formData.append("file", staged.file);
        const res = await axios.post(`${BACKEND_URL}/upload/chat-upload`, formData);
        sendMessage("", undefined, res.data.fileUrl, targetRoom);
        if (staged.previewUrl) URL.revokeObjectURL(staged.previewUrl);
      }
    } catch (err) {
      console.error("File upload failed:", err);
    } finally {
      setIsUploading(false);
      setStagedFiles([]);
    }
  };

  // ── File helpers ──
  const getFileName = (url) => {
    const raw = url.split("?")[0];
    let full = raw.split("/").pop();
    try { full = decodeURIComponent(full); } catch { /* keep */ }
    try {
      full = decodeURIComponent(
        full.replace(/[^\x00-\x7F]/g, (c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase())
      );
    } catch { /* keep */ }
    return full.replace(/^\d{10,13}-/, "") || full;
  };

  // ── File render ──
  const renderFile = (fileUrl, isSender) => {
    const raw = fileUrl.split("?")[0];
    const ext = raw.split(".").pop().toLowerCase();
    const fileName = getFileName(fileUrl);
    const extUpper = ext.toUpperCase();

    if (IMAGE_EXTS.has(ext)) {
      return (
        <img
          src={fileUrl}
          alt="shared"
          className="block w-full max-h-64 object-cover cursor-pointer select-none hover:opacity-95 transition-opacity"
          onClick={() => setLightboxUrl(fileUrl)}
          draggable={false}
        />
      );
    }

    if (AUDIO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl overflow-hidden min-w-[230px]"
          style={{ background: "rgba(158,47,208,0.08)", border: "1px solid rgba(158,47,208,0.25)" }}>
          <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-1.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#9E2FD0,#7b22a8)" }}>
              <FiMusic size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-gray-800 dark:text-gray-100">{fileName}</p>
              <p className="text-[10px] uppercase font-medium tracking-wide text-purple-600 dark:text-purple-400">
                {extUpper} · Audio
              </p>
            </div>
          </div>
          <div className="px-3 pb-2.5">
            <audio src={fileUrl} controls className="w-full" style={{ height: "32px", accentColor: "#9E2FD0" }} />
          </div>
        </div>
      );
    }

    if (VIDEO_EXTS.has(ext)) {
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

    const extColor = EXT_COLORS[extUpper] || "#9E2FD0";
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-[200px] max-w-[280px] group/file no-underline"
        style={{ background: "rgba(158,47,208,0.07)", border: "1px solid rgba(158,47,208,0.22)" }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-sm"
          style={{ background: extColor }}>
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

  const markConversationRead = useCallback(() => {
    if (!socket || !room || !userId) return;
    socket.emit("markConversationRead", { conversationId: room, userId });
  }, [socket, room, userId]);

  // Mark as read on open
  useEffect(() => {
    if (!user?.id) return;
    markConversationRead();
  }, [room, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read when new messages arrive — debounced (max 1 call per 1.5s)
  useEffect(() => {
    if (!user?.id || !room || chatMessages.length === 0) return;
    clearTimeout(readDebounceRef.current);
    readDebounceRef.current = setTimeout(markConversationRead, 1500);
    return () => clearTimeout(readDebounceRef.current);
  }, [chatMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live "seen" state for the other participant in a DM — updated the moment
  // they read, and seeded from their persisted lastReadAt when the window
  // first opens so a page reload doesn't lose the checkmark.
  const [otherReadAt, setOtherReadAt] = useState(null);

  useEffect(() => {
    setOtherReadAt(null);
    if (chatType !== "dm" || !room || !otherUserId) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/conversations/${room}/members?userId=${userId}`, {
      headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((members) => {
        if (cancelled) return;
        const other = members.find((m) => m.id === otherUserId);
        if (other?.lastReadAt) setOtherReadAt(other.lastReadAt);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [room, chatType, otherUserId, userId]);

  useEffect(() => {
    setMentionCandidates([]);
    if (chatType !== "group" || !room) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/conversations/${room}/members?userId=${userId}`, {
      headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((members) => {
        if (cancelled) return;
        setMentionCandidates(
          (members || [])
            .filter((m) => m.id !== userId)
            .map((m) => ({ id: m.id, name: `${m.name || ""} ${m.lastName || ""}`.trim() }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [room, chatType, userId]);

  useEffect(() => {
    if (!socket || chatType !== "dm") return;
    const handleConversationRead = (data) => {
      if (data.conversationId !== room || data.userId !== otherUserId) return;
      setOtherReadAt(data.readAt);
    };
    socket.on("conversationRead", handleConversationRead);
    return () => socket.off("conversationRead", handleConversationRead);
  }, [socket, room, chatType, otherUserId]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
    if (atBottom) setNewMsgCount(0);
  }, []);

  // Auto-scroll on new messages, count if scrolled up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setNewMsgCount(0);
    } else {
      setNewMsgCount((n) => n + 1);
    }
  }, [chatMessages.length]);

  // Initial scroll to bottom when chat loads
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [room]);

  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setNewMsgCount(0);
    setShowScrollBtn(false);
  };

  const handleJoinGeneralClass = () => {
    navigate("/classroom", {
      state: {
        roomId: room, chatRoomId: room, userName: user.name, email: user.email,
        fromMessage: true, chatName: studentName, chatType,
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

  // Small per-bubble time, WhatsApp/Telegram-style — complements the
  // block-level date separator, doesn't replace it.
  const bubbleTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

  // @[Display Name](userId) markup inserted by the @ mention picker — render
  // as a styled chip instead of raw text, matching useMessageFormatter's
  // convention (this component keeps its own copy since it never reads
  // through that hook).
  const mentionRegex = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/g;

  // Reply-quote previews are plain text (no chip rendering), so mention
  // markup needs to collapse to "@Name" instead of showing raw text.
  const stripMentionMarkup = (text) => (text || "").replace(/@\[([^\]]+)\]\([0-9a-f-]{36}\)/g, "@$1");

  // "X added Y" system messages read as a mention of Y — style their name
  // as the same @chip a real mention gets, instead of plain text. Works off
  // the already-translated sentence (find where the raw name landed after
  // interpolation) so the surrounding "added"/"removed" wording stays
  // localized without a translation-key restructure.
  const renderSystemTextWithTag = (translatedText, targetName) => {
    if (!targetName) return translatedText;
    const idx = translatedText.indexOf(targetName);
    if (idx === -1) return translatedText;
    return (
      <>
        {translatedText.slice(0, idx)}
        <span className="font-semibold rounded px-1" style={{ background: "rgba(158,47,208,0.15)", color: "inherit" }}>
          @{targetName}
        </span>
        {translatedText.slice(idx + targetName.length)}
      </>
    );
  };

  const formatMessageWithLinks = (text, isSender, currentUserId) => {
    if (!text) return text;
    let mentionKey = 0;
    return text.split(mentionRegex).map((part, i, arr) => {
      // matchAll-via-split alternates: text, name, id, text, name, id, ...
      if (i % 3 === 1) {
        const name = part;
        const id = arr[i + 1];
        const isMe = id === currentUserId;
        return (
          <span
            key={`mention-${mentionKey++}`}
            className="font-semibold rounded px-1"
            style={
              isMe
                ? { background: "rgba(246,184,46,0.35)", color: "inherit" }
                : isSender
                ? { background: "rgba(255,255,255,0.25)", color: "inherit" }
                : { background: "rgba(158,47,208,0.15)", color: "inherit" }
            }
          >
            @{name}
          </span>
        );
      }
      if (i % 3 === 2) return null; // the id half of the pair above, already consumed
      return renderInlineFormatting(part, `fmt-${i}`, "underline break-all hover:opacity-80 transition-opacity");
    });
  };

  const extractLegacyFileUrl = (text) => {
    if (!text) return null;
    const trimmed = text.trim();
    return /^https?:\/\/\S*\/chat-uploads\//i.test(trimmed) ? trimmed : null;
  };

  const isGeneralChat = chatType === "general" || chatType === "teacher" || chatType === "group" || chatType === "dm";
  const canShowMembers = chatType === "general" || chatType === "teacher" || chatType === "support" || chatType === "group" || chatType === "dm";

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden
                    bg-white dark:bg-[#0d0a1e] transition-colors duration-300">

      {/* Background orbs — previously dark-mode-only, which left light mode
          completely flat with nothing to give the chat area any depth. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full blur-3xl opacity-[0.07] dark:opacity-20"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.5), transparent 70%)", width: "400px", height: "400px", top: "-10%", right: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-[0.06] dark:opacity-15"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "-5%", left: "-5%" }} />
      </div>

      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 py-3 flex-shrink-0
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-b border-gray-200 dark:border-white/10 z-10 transition-colors duration-300">
        {/* Back button — mobile */}
        <button onClick={onBackClick}
          className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex-shrink-0">
          <FiChevronLeft size={20} />
        </button>

        {/* Avatar icon */}
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
                        bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30">
          <FaComments className="text-purple-600 dark:text-purple-400" size={15} />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              onClick={() => {
                if (chatType === "dm" && otherUserId) onViewProfile?.(otherUserId);
                else if (chatType === "group") onViewGroupMembers?.();
              }}
              className={`text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white truncate ${chatType === "dm" || chatType === "group" ? "cursor-pointer hover:underline" : ""}`}
            >
              {studentName}
            </h2>
            {isGeneralChat && (
              <button onClick={handleJoinGeneralClass} title="Join video class"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0
                           text-white text-[11px] font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.4)" }}>
                <FiVideo size={13} />
                <span>Join</span>
              </button>
            )}
            {canShowMembers && (
              <button onClick={() => onViewGroupMembers?.()} title="View members"
                className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0
                           text-gray-600 dark:text-gray-300 text-[11px] font-medium transition-colors
                           bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10">
                <FiUsers size={12} />
              </button>
            )}
          </div>
          {/* Online indicator */}
          <span className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#26D9A1]" />
            <span className="text-[11px] font-medium text-[#26D9A1]">{t("chatWindow.activeNow")}</span>
          </span>
        </div>

        {/* Close button */}
        {onClose && (
          <button onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 dark:text-gray-400
                       hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Close chat">
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Accent line */}
      <div className="relative h-[2px] flex-shrink-0 z-10 opacity-70 dark:opacity-100"
           style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

      {/* Messages */}
      {chatMessages.length === 0 ? (
        <div className="flex-1 relative z-10 flex items-center justify-center">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-4 border-[#9E2FD0]/30 border-t-[#9E2FD0] animate-spin" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-500/20
                             border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
                <FaComments className="text-purple-400" size={24} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("chatWindow.noMessages")}</p>
            </div>
          )}
        </div>
      ) : (
      <PerfectScrollbar
        containerRef={(ref) => { scrollContainerRef.current = ref; }}
        onScrollY={handleScroll}
        className="flex-1 relative z-10 bg-transparent transition-colors duration-300"
        options={{ suppressScrollX: true }}
      >
        <div className="p-4 sm:p-6">
          {hasMore && chatMessages.length > 0 && (
            <div className="flex justify-center mb-4">
              <button
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="text-xs font-medium px-3 py-1.5 rounded-full text-[#9E2FD0] dark:text-purple-300
                           bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/15 hover:bg-[#9E2FD0]/20 transition-colors
                           disabled:opacity-50"
              >
                {loadingMore ? t("chatWindow.loading", "Loading...") : t("chatWindow.loadMore")}
              </button>
            </div>
          )}
          <ul className="space-y-1">
            {chatMessages.map((msg, index) => {
              const prev = chatMessages[index - 1];
              const showTimestamp = index === 0 || new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;
              const isSender = msg.email === email;
              // "Seen" checkmark only makes sense on the last message you
              // sent — same convention as WhatsApp/Teams.
              const isLastOwnMessage = isSender && !chatMessages.slice(index + 1).some((m) => m.email === email);
              const isSeen = isLastOwnMessage && chatType === "dm" && otherReadAt && new Date(otherReadAt) >= new Date(msg.timestamp);
              const legacyFileUrl = !msg.fileUrl ? extractLegacyFileUrl(msg.message) : null;
              const effectiveFileUrl = msg.fileUrl || legacyFileUrl;
              const effectiveMessage = legacyFileUrl ? "" : msg.message;
              const hasContent = effectiveFileUrl || effectiveMessage?.trim();
              const isSystemMessage = SYSTEM_MESSAGE_TYPES.includes(msg.messageType);
              if (!hasContent && !isSystemMessage) return null;
              const isFirstFromUser = index === 0 || msg.email !== prev.email;
              const showUsername = !isSender && isFirstFromUser;
              const initials = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);
              const isImageOnly = !!(effectiveFileUrl && !effectiveMessage?.trim() && isImageUrl(effectiveFileUrl));
              const isFileOnly = !!(effectiveFileUrl && !effectiveMessage?.trim() && !isImageUrl(effectiveFileUrl));

              if (isSystemMessage) {
                const meta = msg.metadata || {};
                let icon = <FiUsers size={12} className="text-gray-400 flex-shrink-0" />;
                let text = "";
                if (msg.messageType === "member_added") {
                  icon = <FiUserPlus size={12} className="text-[#26D9A1] flex-shrink-0" />;
                  text = renderSystemTextWithTag(
                    t("messagesExtra.systemMemberAdded", { actor: msg.username, target: meta.targetName }),
                    meta.targetName
                  );
                } else if (msg.messageType === "member_removed") {
                  icon = <FiUserMinus size={12} className="text-red-400 flex-shrink-0" />;
                  text = renderSystemTextWithTag(
                    t("messagesExtra.systemMemberRemoved", { actor: msg.username, target: meta.targetName }),
                    meta.targetName
                  );
                } else if (msg.messageType === "member_left") {
                  icon = <FiLogOut size={12} className="text-gray-400 flex-shrink-0" />;
                  text = t("messagesExtra.systemMemberLeft", { actor: msg.username });
                } else if (msg.messageType === "group_renamed") {
                  icon = <FiEdit2 size={12} className="text-[#9E2FD0] flex-shrink-0" />;
                  text = t("messagesExtra.systemGroupRenamed", { actor: msg.username, oldName: meta.oldName, newName: meta.newName });
                }
                return (
                  <div key={index}>
                    {showTimestamp && (
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                        <span className="text-[10px] font-semibold text-[#9E2FD0] dark:text-purple-300
                                       px-3 py-1 rounded-full bg-[#9E2FD0]/[0.06] dark:bg-black/40
                                       backdrop-blur-sm border border-[#9E2FD0]/15 dark:border-white/10"
                                       style={{ boxShadow: "0 1px 4px rgba(158,47,208,0.08)" }}>
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                      </div>
                    )}
                    <li className="flex justify-center my-1">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5">
                        {icon}
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{text}</span>
                      </div>
                    </li>
                  </div>
                );
              }

              if (msg.messageType === "missed_call") {
                return (
                  <div key={index}>
                    {showTimestamp && (
                      <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                        <span className="text-[10px] font-semibold text-[#9E2FD0] dark:text-purple-300
                                       px-3 py-1 rounded-full bg-[#9E2FD0]/[0.06] dark:bg-black/40
                                       backdrop-blur-sm border border-[#9E2FD0]/15 dark:border-white/10"
                                       style={{ boxShadow: "0 1px 4px rgba(158,47,208,0.08)" }}>
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                      </div>
                    )}
                    <li className="flex justify-center my-1.5">
                      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                        <FiPhoneMissed size={14} className="text-red-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 dark:text-gray-200">
                          {t("messagesExtra.missedCallFrom", { name: msg.username })}
                        </span>
                        <button
                          onClick={handleJoinGeneralClass}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
                        >
                          {t("messagesExtra.joinCall")}
                        </button>
                      </div>
                    </li>
                  </div>
                );
              }

              return (
                <div key={index}>
                  {showTimestamp && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                      <span className="text-[10px] font-semibold text-[#9E2FD0] dark:text-purple-300
                                     px-3 py-1 rounded-full bg-[#9E2FD0]/[0.06] dark:bg-black/40
                                     backdrop-blur-sm border border-[#9E2FD0]/15 dark:border-white/10"
                                     style={{ boxShadow: "0 1px 4px rgba(158,47,208,0.08)" }}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-[#9E2FD0]/15 dark:bg-white/10" />
                    </div>
                  )}

                  <li className={`group flex items-end gap-2 mb-1.5 ${isSender ? "justify-end" : "justify-start"}`}>

                    {/* Avatar (others) — clickable to view sender's profile */}
                    {!isSender && (
                      <div className="flex-shrink-0 w-8 self-end">
                        {isFirstFromUser ? (
                          msg.avatarUrl ? (
                            <img src={msg.avatarUrl} alt="avatar"
                              onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                              className="w-8 h-8 rounded-full object-cover shadow ring-2 ring-purple-200 dark:ring-purple-500/30 cursor-pointer hover:opacity-80 transition-opacity" />
                          ) : (
                            <div
                              onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                              className="w-8 h-8 rounded-full flex items-center justify-center
                                          text-white text-xs font-bold shadow ring-2 ring-purple-200 dark:ring-purple-500/30 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ background: avatarColor }}>
                              {initials}
                            </div>
                          )
                        ) : <div className="w-8 h-8" />}
                      </div>
                    )}

                    {isSender ? (
                      <div className="flex flex-col items-end max-w-[75%] sm:max-w-[60%]">
                      <div className="flex items-end gap-1.5">
                        {/* Reply + options */}
                        <div className="flex items-center gap-0.5 self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => setReplyTo({ id: msg.id, message: legacyFileUrl ? "📎 File" : (msg.message || "📎 File"), username: msg.username })}
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400
                                       hover:text-purple-600 dark:hover:text-purple-400
                                       hover:bg-purple-50 dark:hover:bg-white/10 transition-colors duration-150">
                            <FiCornerUpLeft size={13} />
                          </button>
                          <div className="relative">
                            <button onClick={() => toggleOptionsMenu(msg.id)}
                              className="p-1.5 rounded-full text-gray-500 dark:text-gray-400
                                         hover:text-purple-600 dark:hover:text-purple-400
                                         hover:bg-purple-50 dark:hover:bg-white/10 transition-colors duration-150">
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
                        </div>
                        {/* Bubble */}
                        <div className={`relative rounded-2xl rounded-br-sm ${
                            isImageOnly ? "overflow-hidden"
                            : isFileOnly ? ""
                            : "px-4 py-2.5 text-white text-sm leading-relaxed"
                          }`}
                          style={isImageOnly
                            ? { boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }
                            : isFileOnly ? {}
                            : { background: "linear-gradient(135deg, #9E2FD0 0%, #7b22a8 100%)", boxShadow: "0 3px 10px rgba(158,47,208,0.35)" }}>
                          {/* Reply quote in bubble */}
                          {msg.replyTo && (
                            <div className="mb-2 pl-2 border-l-2 border-white/50 rounded bg-white/10 text-xs" style={{ padding: "4px 6px" }}>
                              <p className="font-semibold text-[10px] mb-0.5 text-white/80">{msg.replyTo.username}</p>
                              <p className="line-clamp-2 text-[11px] text-white/70">{stripMentionMarkup(msg.replyTo.message)}</p>
                            </div>
                          )}
                          {effectiveFileUrl && renderFile(effectiveFileUrl, true)}
                          {effectiveMessage?.trim() && (
                            <p className="text-white" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {formatMessageWithLinks(effectiveMessage, true, userId)}
                              {msg.editedAt && <span className="text-[10px] text-white/60 ml-1">({t("chatWindow.edited")})</span>}
                            </p>
                          )}
                          {!isImageOnly && (
                            <span className="block text-right text-[10px] text-white/60 mt-0.5 leading-none">
                              {bubbleTime(msg.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                      <MessageReactions
                        reactions={msg.reactions}
                        currentUserId={userId}
                        onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                        align="end"
                      />
                        {isLastOwnMessage && chatType === "dm" && (
                          <span className={`text-[10px] mt-0.5 mr-1 ${isSeen ? "text-[#9E2FD0]" : "text-gray-400"}`}>
                            {isSeen ? t("chatWindow.seen") : t("chatWindow.sent")}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-[75%] sm:max-w-[60%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <p
                            onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mb-1 ml-1 cursor-pointer hover:underline w-fit"
                          >
                            {msg.username}
                          </p>
                        )}
                        {/* relative wrapper for bubble only — so button centers on bubble, not username */}
                        <div className="relative">
                          <div className={`rounded-2xl rounded-bl-sm ${
                              isImageOnly ? "overflow-hidden"
                              : isFileOnly ? ""
                              : "px-4 py-2.5 text-sm leading-relaxed bg-gray-100 dark:bg-[#211d38] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/10"
                            }`}
                            style={isImageOnly ? { boxShadow: "0 4px 16px rgba(0,0,0,0.16)" } : isFileOnly ? {} : { boxShadow: "0 2px 8px rgba(20,20,40,0.08)" }}>
                            {/* Reply quote in received bubble */}
                            {msg.replyTo && (
                              <div className="mb-2 pl-2 border-l-2 border-[#9E2FD0]/60 rounded bg-[#9E2FD0]/5 dark:bg-white/5 text-xs" style={{ padding: "4px 6px" }}>
                                <p className="font-semibold text-[10px] mb-0.5 text-[#9E2FD0] dark:text-purple-300">{msg.replyTo.username}</p>
                                <p className="line-clamp-2 text-[11px] text-gray-500 dark:text-gray-400">{stripMentionMarkup(msg.replyTo.message)}</p>
                              </div>
                            )}
                            {effectiveFileUrl && renderFile(effectiveFileUrl, false)}
                            {effectiveMessage?.trim() && (
                              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {formatMessageWithLinks(effectiveMessage, false, userId)}
                                {msg.editedAt && <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">({t("chatWindow.edited")})</span>}
                              </p>
                            )}
                            {!isImageOnly && (
                              <span className="block text-right text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
                                {bubbleTime(msg.timestamp)}
                              </span>
                            )}
                          </div>
                          {/* Reply button — positioned relative to bubble only */}
                          <button
                            onClick={() => setReplyTo({ id: msg.id, message: legacyFileUrl ? "📎 File" : (msg.message || "📎 File"), username: msg.username })}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-1
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       p-1.5 rounded-full text-gray-400
                                       hover:text-purple-600 dark:hover:text-purple-400
                                       hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <FiCornerUpLeft size={13} />
                          </button>
                        </div>
                        <MessageReactions
                          reactions={msg.reactions}
                          currentUserId={userId}
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
      </PerfectScrollbar>
      )}

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button onClick={scrollToBottom}
          className="absolute right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center shadow-lg
                     transition-all hover:scale-110 active:scale-95"
          style={{ bottom: "80px", background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 12px rgba(158,47,208,0.4)" }}>
          <FiArrowDown size={16} className="text-white" />
          {newMsgCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500
                             text-white text-[9px] flex items-center justify-center font-bold leading-none">
              {newMsgCount > 9 ? "9+" : newMsgCount}
            </span>
          )}
        </button>
      )}

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

      {/* Input bar */}
      <div className="relative flex-shrink-0 px-3 sm:px-5 py-3 z-10
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
        {/* @ mention picker — anchored above the input like the emoji picker
            below; full-width on phones (no left/right inset) instead of a
            narrow floating box, since a cramped list is hard to tap accurately. */}
        {mentionQuery !== null && filteredMentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 sm:left-3 sm:right-auto sm:w-64 mb-2 z-20 px-3 sm:px-0">
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl bg-white dark:bg-[#1a1a2e] max-h-56 overflow-y-auto">
              {filteredMentionCandidates.map((candidate, i) => (
                <button
                  key={candidate.id}
                  onClick={() => insertMention(candidate)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    i === mentionActiveIndex
                      ? "bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/20"
                      : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                    {candidate.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800 dark:text-white truncate flex-1">{candidate.name}</span>
                  {candidate.isMember === false && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0
                                     bg-[#F6B82E]/15 text-[#d4a017] dark:text-[#F6B82E]">
                      <FiUserPlus size={10} />
                      {t("messagesExtra.addPeople")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Staged files — attached/pasted, waiting on the next Send tap */}
        {stagedFiles.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            {stagedFiles.map((f) => (
              <div key={f.id} className="relative flex-shrink-0">
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt={f.name}
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 dark:border-white/10" />
                ) : (
                  <div className="w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 px-1
                                  bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <FiFile size={16} className="text-gray-400" />
                    <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate w-full text-center">{f.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeStagedFile(f.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white
                             flex items-center justify-center shadow hover:bg-red-500 transition-colors">
                  <FiX size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Editing banner */}
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg
                         bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <FiEdit2 size={12} />
              <span>{t("chatWindow.editing")}</span>
            </div>
            <button onClick={clearEditing} className="text-blue-400 hover:text-blue-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Reply banner */}
        {replyTo && !editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg
                         bg-[#9E2FD0]/5 dark:bg-[#9E2FD0]/10 border border-[#9E2FD0]/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <FiCornerUpLeft size={12} className="text-[#9E2FD0] flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#9E2FD0] dark:text-purple-300">{replyTo.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stripMentionMarkup(replyTo.message)}</p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-1.5 bg-gray-50 dark:bg-black/40 rounded-2xl px-3 py-2
                        border border-gray-200 dark:border-white/10
                        focus-within:border-purple-400 dark:focus-within:border-purple-500/50
                        transition-colors duration-200">

          <div className="flex items-center gap-0.5 flex-shrink-0 self-end mb-0.5">
            {/* Emoji button */}
            <button onClick={() => { setShowEmojiPicker((p) => !p); setShowFormatMenu(false); }}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400
                         hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-150">
              <BsEmojiSmile size={18} />
            </button>

            {/* Text format button — one icon instead of 4 separate ones so the
                input row stays usable on narrow phone screens. */}
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowFormatMenu((p) => !p); setShowEmojiPicker(false); }}
              title={t("chatWindow.formatText")}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400
                         hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-150">
              <BsType size={17} />
            </button>

            {/* File button */}
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="p-1 rounded-lg text-gray-500 dark:text-gray-400
                         hover:text-purple-600 dark:hover:text-purple-400
                         disabled:opacity-40 transition-colors duration-150" title="Attach file">
              <FiPaperclip size={17} className={isUploading ? "animate-pulse" : ""} />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            placeholder={t("chatWindow.typePlaceholder")}
            value={message}
            onChange={handleInputWithTyping}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none
                       text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       max-h-32 leading-relaxed py-1.5"
            style={{ overflowY: "hidden" }}
          />

          {/* Send button */}
          <button onClick={handleSendMessage} disabled={!message.trim() && stagedFiles.length === 0}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                       self-end transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:scale-105 active:scale-95 text-white"
            style={{
              background: (message.trim() || stagedFiles.length > 0) ? "linear-gradient(135deg, #9E2FD0, #7b22a8)" : "#9E2FD0",
              opacity: (message.trim() || stagedFiles.length > 0) ? 1 : 0.3,
            }}>
            <img src={send} alt="send" className="w-4 h-4 brightness-200" />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2 z-20">
            <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl
                          border border-gray-200 dark:border-white/10 overflow-hidden shadow-xl">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}

        {showFormatMenu && (
          <div className="absolute bottom-full left-3 mb-2 z-20">
            <div className="flex items-center gap-1 p-1.5 rounded-xl bg-white dark:bg-[#1a1a2e]
                            border border-gray-200 dark:border-white/10 shadow-xl">
              {[
                { delimiter: "*", icon: BsTypeBold, label: t("chatWindow.formatBold") },
                { delimiter: "_", icon: BsTypeItalic, label: t("chatWindow.formatItalic") },
                { delimiter: "~", icon: BsTypeStrikethrough, label: t("chatWindow.formatStrike") },
                { delimiter: "`", icon: BsCodeSlash, label: t("chatWindow.formatCode") },
              ].map(({ delimiter, icon: Icon, label }) => (
                <button
                  key={delimiter}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => wrapSelection(delimiter)}
                  title={label}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300
                             hover:text-purple-600 dark:hover:text-purple-400
                             hover:bg-purple-50 dark:hover:bg-white/10 transition-colors"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-[90%] max-h-[85%]" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxUrl} alt="preview"
              className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain" />
            <div className="absolute top-2 right-2 flex gap-2">
              <a href={lightboxUrl} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <FiDownload size={16} />
              </a>
              <button onClick={() => setLightboxUrl(null)}
                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <FiX size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindowComponent;
