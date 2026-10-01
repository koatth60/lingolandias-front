import HalloweenChatScene from "../common/HalloweenChatScene";
// ChatWindowComponent.jsx
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BsCheck2All, BsEmojiSmile, BsThreeDots, BsType, BsTypeBold, BsTypeItalic, BsTypeStrikethrough, BsCodeSlash } from "react-icons/bs";
import { FiVideo, FiChevronLeft, FiEdit2, FiX, FiPaperclip, FiDownload, FiFile, FiMusic, FiFileText, FiCornerUpLeft, FiArrowDown, FiUsers, FiPhoneMissed, FiUserPlus, FiUserMinus, FiLogOut, FiMic, FiSquare, FiTrash2, FiPlus, FiAlertCircle, FiSend } from "react-icons/fi";

const SYSTEM_MESSAGE_TYPES = ["member_added", "member_removed", "member_left", "group_renamed"];
import { FaComments } from "react-icons/fa";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import EmojiPicker from "emoji-picker-react";
import MessageOptionsCard from "./MessageOptionsCard";
import MessageReactions from "./MessageReactions";
import AudioPlayer from "./AudioPlayer";
import useDeleteConversationMessage from "../../hooks/useDeleteConversationMessage.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useConversationChat from "../../hooks/useConversationChat.js";
import useChatInputHandler from "../../hooks/useChatInputHandler.js";
import useUserSearch from "../../hooks/useUserSearch.js";
import Swal from "sweetalert2";
import { renderInlineFormatting } from "../../utils/inlineFormatting.jsx";
import useVoiceRecorder from "../../hooks/useVoiceRecorder.js";
import { getDraft, setDraft } from "../../state/messageDrafts.js";
import { uploadChatFile, formatBytes, snapshotFile } from "../../data/uploadApi.js";
import UploadStatus from "./UploadStatus";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
// "weba" (not "webm") for voice notes recorded via MediaRecorder — sharing
// the "webm" extension with VIDEO_EXTS below would make a real .webm video
// attachment render as an audio player instead.
const AUDIO_EXTS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "flac", "weba"]);
const VIDEO_EXTS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);
const isImageUrl = (url) => IMAGE_EXTS.has(url.split("?")[0].split(".").pop().toLowerCase());
// Voice notes render as a bare waveform pill (see AudioPlayer's "voiceNote"
// variant) with no card of their own, unlike every other file type — they
// need the surrounding message bubble to still supply its normal
// background/padding instead of going bubble-less like an image or a
// bordered file card does.
const isVoiceNoteUrl = (url) => url.split("?")[0].split(".").pop().toLowerCase() === "weba";

const EXT_COLORS = {
  PDF: "#ef4444", DOC: "#2563eb", DOCX: "#2563eb",
  XLS: "#16a34a", XLSX: "#16a34a", TXT: "#6b7280",
  ZIP: "#d97706", RAR: "#d97706", CSV: "#16a34a",
};

// Icon button inside the composer box (emoji, format, attach, mic).
const COMPOSER_BTN = "w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink3 hover:bg-ll-hover hover:text-ll-ink transition-colors duration-150";

// Day/time divider between message runs: plain text between two hairlines.
const DateSep = ({ children }) => (
  <div className="flex items-center gap-3 mt-3.5 mb-2.5 text-[11.5px] font-medium text-ll-ink3">
    <div className="flex-1 h-px bg-ll-line" />
    {children}
    <div className="flex-1 h-px bg-ll-line" />
  </div>
);

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
  // Scroll bookkeeping for the open conversation — see "Scroll" below.
  const contentRef = useRef(null);
  const pinnedRoomRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const olderAnchorRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo?.user);

  const currentUser = { id: userId, name: username, email, avatarUrl: userUrl };
  const { chatMessages, setChatMessages, sendMessage, retryMessage, loadOlderMessages, hasMore, loadingMore, toggleReaction, isLoading } = useConversationChat(
    socket, room, currentUser
  );

  const [message, setMessage] = useState(() => getDraft(room));
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
  // { id, name, ratio } for the attachment currently going up, or null.
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadErrorCode, setUploadErrorCode] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // ── Per-conversation draft (WhatsApp-style) ──
  // Loads whatever was last typed here whenever the room changes.
  useEffect(() => {
    setMessage(getDraft(room));
    // A file staged for one conversation shouldn't silently ride along into
    // whichever one you open next — unlike text, in-memory File objects
    // can't be drafted to localStorage anyway.
    setStagedFiles((prev) => {
      prev.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      return [];
    });
    // Switching chats mid-recording would otherwise leave the mic running
    // and, worse, stage the eventual result into whichever conversation
    // happens to be open when Stop is finally tapped.
    if (isRecordingRef.current) cancelRecording();
  }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced save tied directly to (room, message) — deliberately NOT a
  // "save on leave" effect keyed off a remembered previous room. This app
  // renders a separate ChatWindowComponent instance per layout breakpoint
  // (mobile/desktop) sharing the same `room` prop; a "save on leave" effect
  // fires in BOTH instances on every room change, and the one nobody typed
  // into would overwrite the real draft with "" depending on which
  // instance's effect happens to commit last. Tying the save to actual
  // `message` edits means an untouched duplicate only ever re-saves the
  // same value it just loaded — never clobbers the other instance's draft.
  useEffect(() => {
    if (!room) return;
    const timer = setTimeout(() => setDraft(room, message), 400);
    return () => clearTimeout(timer);
  }, [room, message]);

  const {
    isRecording,
    seconds: recordingSeconds,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();
  const isRecordingRef = useRef(isRecording);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
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
        confirmButtonColor: "rgb(var(--ll-violet))",
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
    const handleTyping = ({ username: who, room: typingRoom }) => {
      // Typing events carry their room now; without it, someone typing in
      // the support channel showed up as typing in whatever DM was open.
      if (typingRoom && typingRoom !== room) return;
      if (who && who !== username) {
        setTypingUsers((prev) => prev.includes(who) ? prev : [...prev, who]);
      }
    };
    const handleStopTyping = ({ room: typingRoom } = {}) => {
      if (typingRoom && typingRoom !== room) return;
      setTypingUsers([]);
    };
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      // Leaving mid-typing used to leave "typing…" stuck on the other side.
      if (typingTimeoutRef.current) socket.emit("stopTyping", { room });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      setTypingUsers([]);
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

  // ── Drag-and-drop staging ──
  // dragenter/dragleave fire on every child element the pointer crosses too
  // (bubbling in and out of nested divs while dragging over the chat), so a
  // plain boolean flag flickers off mid-drag — a counter only zeroes out
  // once the pointer has genuinely left every nested element.
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounterRef.current += 1;
    setIsDraggingFile(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault(); // required for onDrop to fire at all
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingFile(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length) addStagedFiles(files);
  };

  // ── File staging (attach/paste, then Send) ──
  // Picking or pasting a file stages it as a thumbnail above the composer —
  // like chatWindow.jsx's existing single-file "ready to send" preview, but
  // for several files at once, all going out together on the next Send tap
  // instead of firing off as its own message the instant it's picked.
  // No size check: attachments upload straight to S3 via a presigned PUT
  // (see data/uploadApi.js), so there is no request-body ceiling to stay
  // under. The old 10 MB cap existed because the file used to be posted
  // through nginx and buffered in the API process.
  // Copies each file into memory first (snapshotFile) so moving, deleting or
  // re-saving the original before Send no longer breaks the upload.
  const addStagedFiles = async (files) => {
    const list = await Promise.all(Array.from(files).filter(Boolean).map(snapshotFile));
    if (!list.length) return;
    setStagedFiles((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        name: file.name,
        size: file.size,
      })),
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
    addStagedFiles(e.target.files);
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
          addStagedFiles([file]);
        }
        return;
      }
    }
  };

  // ── Voice notes ──
  const handleStartRecording = async () => {
    const result = await startRecording();
    if (!result.ok) {
      alert(result.reason === "permission_denied" ? t("chatWindow.micPermissionDenied") : t("chatWindow.micUnavailable"));
    }
  };
  const handleStopRecording = async () => {
    const file = await stopRecording();
    if (file) addStagedFiles([file]);
  };
  const handleCancelRecording = () => { cancelRecording(); };

  // Uploads every staged file and sends each as its own message — routed
  // through sendMessage() (see handleSendMessage) for the same optimistic
  // local placeholder a typed message gets, instead of only appearing after
  // the round trip back from the server's broadcast.
  // Uploads each staged file, one at a time, and sends each as its own
  // message. A file that fails is KEPT staged with an error on it so the user
  // can retry — the previous version logged to the console and cleared the
  // whole tray in a `finally`, so a failed attachment silently vanished with
  // no message and no error. That was the actual reported bug ("I attach the
  // PDF, press send, and nothing happens").
  const sendStagedFiles = async (targetRoom) => {
    setIsUploading(true);
    setUploadErrorCode(null);
    const failed = [];
    try {
      for (const staged of stagedFiles) {
        setUploadProgress({ id: staged.id, name: staged.name, ratio: 0 });
        try {
          const fileUrl = await uploadChatFile(staged.file, {
            onProgress: (ratio) =>
              setUploadProgress({ id: staged.id, name: staged.name, ratio }),
          });
          sendMessage("", undefined, fileUrl, targetRoom);
          if (staged.previewUrl) URL.revokeObjectURL(staged.previewUrl);
        } catch (err) {
          console.error("File upload failed:", staged.name, err);
          failed.push({ ...staged, error: err?.code || "upload_failed" });
        }
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      setStagedFiles(failed);
    }

    if (failed.length) setUploadErrorCode(failed[0].error);
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

    // ".weba" = a voice note recorded in-app (see useVoiceRecorder) — the
    // WhatsApp-style waveform pill, no card/filename around it since it
    // already sits inside the message bubble.
    if (ext === "weba") {
      return <AudioPlayer src={fileUrl} variant="voiceNote" isSender={isSender} />;
    }

    // A real uploaded audio file — same compact waveform player as a voice
    // note, just with a one-line filename header above it instead of the
    // old taller icon-box + two-line label (which the "attach" mode never
    // needed, unlike the actual card, but that made it noticeably taller
    // than the voice-note pill for no real reason).
    if (AUDIO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl min-w-[210px] px-3 py-2.5"
          style={{ background: "rgb(var(--ll-violet) / 0.08)", border: "1px solid rgb(var(--ll-violet) / 0.25)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <FiMusic size={11} className="flex-shrink-0 text-ll-violet-ink dark:text-ll-violet-ink" />
            <p className="text-[11px] font-semibold truncate text-gray-800 dark:text-gray-100 flex-1 min-w-0">{fileName}</p>
          </div>
          <AudioPlayer src={fileUrl} variant="voiceNote" />
        </div>
      );
    }

    if (VIDEO_EXTS.has(ext)) {
      return (
        <div className="rounded-xl overflow-hidden max-w-[300px]">
          <video src={fileUrl} controls className="w-full max-h-48 object-contain bg-black" />
          <div className="px-2.5 py-1.5 flex items-center gap-1.5" style={{ background: "rgb(var(--ll-violet) / 0.06)" }}>
            <FiVideo size={11} className="text-ll-violet-ink dark:text-ll-violet-ink" />
            <span className="text-[11px] truncate text-gray-700 dark:text-gray-300">{fileName}</span>
          </div>
        </div>
      );
    }

    const extColor = EXT_COLORS[extUpper] || "rgb(var(--ll-violet))";
    const FileIconComp = ["doc", "docx", "txt", "pdf", "csv"].includes(ext) ? FiFileText : FiFile;
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-w-[200px] max-w-[280px] group/file no-underline"
        style={{ background: "rgb(var(--ll-violet) / 0.07)", border: "1px solid rgb(var(--ll-violet) / 0.22)" }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center shadow-sm"
          style={{ background: extColor }}>
          <FileIconComp size={14} className="text-white mb-0.5" />
          <span className="text-white font-black leading-none" style={{ fontSize: "8px" }}>{extUpper.slice(0, 4)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate leading-snug text-gray-800 dark:text-gray-100">{fileName}</p>
          <p className="text-[10px] uppercase font-medium tracking-wide mt-0.5 text-ll-violet-ink dark:text-ll-violet-ink">{extUpper} file</p>
        </div>
        <FiDownload size={14} className="flex-shrink-0 transition-transform group-hover/file:translate-y-0.5 text-ll-violet-ink dark:text-ll-violet-ink" />
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
  // Real online/offline for the other DM participant — the header used to
  // hardcode "Active now" unconditionally, showing everyone as online even
  // when they hadn't connected in months. Seeded from their persisted
  // status here, then kept live via the 'userStatus' socket broadcast below.
  const [otherOnline, setOtherOnline] = useState(null);

  useEffect(() => {
    setOtherReadAt(null);
    setOtherOnline(null);
    if (chatType !== "dm" || !room || !otherUserId) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/conversations/${room}/members`, {
      headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {},
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((members) => {
        if (cancelled) return;
        const other = members.find((m) => m.id === otherUserId);
        if (other?.lastReadAt) setOtherReadAt(other.lastReadAt);
        if (other) setOtherOnline(other.online === "online");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [room, chatType, otherUserId, userId]);

  useEffect(() => {
    if (!socket || chatType !== "dm" || !otherUserId) return;
    const handleUserStatus = ({ id, online }) => {
      if (id === otherUserId) setOtherOnline(online === "online");
    };
    socket.on("userStatus", handleUserStatus);
    return () => socket.off("userStatus", handleUserStatus);
  }, [socket, chatType, otherUserId]);

  useEffect(() => {
    setMentionCandidates([]);
    if (chatType !== "group" || !room) return;
    let cancelled = false;
    fetch(`${BACKEND_URL}/conversations/${room}/members`, {
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
  // Only a real user gesture may take the view off the bottom. Scroll events
  // also come from the browser's own scroll anchoring and from our pinning;
  // treating those as "the user scrolled up" (as before) switched off the
  // stick-to-bottom halfway through images loading, leaving a gap.
  const lastUserScrollRef = useRef(0);
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) {
      isAtBottomRef.current = true;
      setShowScrollBtn(false);
      setNewMsgCount(0);
      return;
    }
    if (Date.now() - lastUserScrollRef.current < 1000) {
      isAtBottomRef.current = false;
      setShowScrollBtn(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return undefined;
    const markUserScroll = () => { lastUserScrollRef.current = Date.now(); };
    const events = ["wheel", "touchmove", "pointerdown", "keydown"];
    events.forEach((name) => el.addEventListener(name, markUserScroll, { passive: true }));
    return () => events.forEach((name) => el.removeEventListener(name, markUserScroll));
  }, []);

  // ── Scroll ──
  // Opening a chat used to visibly jump: the scroll-to-bottom ran in a
  // useEffect (after the browser had already painted the top of the list),
  // keyed on the message COUNT (so switching between two 50-message chats
  // never re-scrolled), and nothing re-pinned when images or videos finished
  // loading and grew the list. All pinning now happens in layout effects,
  // before paint, and a ResizeObserver keeps the view on the last message
  // while content settles.

  // Each conversation starts at the bottom with a clean slate.
  useLayoutEffect(() => {
    isAtBottomRef.current = true;
    pinnedRoomRef.current = null;
    lastMessageIdRef.current = null;
    olderAnchorRef.current = null;
    setShowScrollBtn(false);
    setNewMsgCount(0);
  }, [room]);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !chatMessages.length) return;
    const last = chatMessages[chatMessages.length - 1];

    // First content for this conversation: jump straight to the end.
    if (pinnedRoomRef.current !== room) {
      pinnedRoomRef.current = room;
      lastMessageIdRef.current = last.id;
      el.scrollTop = el.scrollHeight;
      return;
    }

    // "Load more" prepended older messages: put the message that was at the
    // top back exactly where it was, instead of letting the list shift.
    const anchor = olderAnchorRef.current;
    if (anchor && chatMessages[0]?.id !== anchor.firstId) {
      olderAnchorRef.current = null;
      const row = anchor.messageId && el.querySelector(`[data-msg-id="${CSS.escape(anchor.messageId)}"]`);
      const target = row ? row.querySelector("li") || row : null;
      if (target) {
        const offset = target.getBoundingClientRect().top - el.getBoundingClientRect().top;
        el.scrollTop += offset - anchor.offset;
      } else {
        el.scrollTop = el.scrollHeight - anchor.fromBottom;
      }
      return;
    }

    // Only a new message at the END counts as new (edits, reactions and
    // older pages don't).
    if (last.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = last.id;
    const mine = last.email === email || last.senderId === userId;
    if (isAtBottomRef.current || mine) {
      el.scrollTop = el.scrollHeight;
      isAtBottomRef.current = true;
      setNewMsgCount(0);
    } else {
      setNewMsgCount((n) => n + 1);
    }
  }, [chatMessages, room, email, userId]);

  // Images, videos and file cards grow after they load; the composer, reply
  // bar and typing line change the visible height. Stay on the last message
  // through all of it, unless the user has scrolled up to read.
  useEffect(() => {
    const el = scrollContainerRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (isAtBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(content);
    observer.observe(el);
    return () => observer.disconnect();
  }, [room]);

  const handleLoadOlder = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const elTop = el.getBoundingClientRect().top;
      // The first message row still (at least partly) on screen.
      const row = [...el.querySelectorAll("[data-msg-id]")].find(
        (r) => r.getBoundingClientRect().bottom > elTop,
      );
      const target = row ? row.querySelector("li") || row : null;
      olderAnchorRef.current = {
        fromBottom: el.scrollHeight - el.scrollTop,
        firstId: chatMessages[0]?.id,
        messageId: row?.getAttribute("data-msg-id") || null,
        offset: target ? target.getBoundingClientRect().top - elTop : 0,
      };
    }
    loadOlderMessages();
  };

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
        <span className="font-semibold rounded px-1" style={{ background: "rgb(var(--ll-violet) / 0.15)", color: "inherit" }}>
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
                ? { background: "rgba(232,162,58,0.35)", color: "inherit" }
                : isSender
                ? { background: "rgba(255,255,255,0.25)", color: "inherit" }
                : { background: "rgb(var(--ll-violet) / 0.15)", color: "inherit" }
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
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-ll-panel"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay — dropping anywhere in the chat stages the
          file(s), same as pasting or picking via the paperclip. */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none
                        bg-ll-violet/10 dark:bg-ll-violet/15 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border-2 border-dashed
                          border-ll-violet bg-white/90 dark:bg-[#1a1a2e]/90">
            <FiPaperclip size={22} className="text-ll-violet" />
            <p className="text-sm font-semibold text-ll-violet">{t("chatWindow.dropFilesHere")}</p>
          </div>
        </div>
      )}

      <HalloweenChatScene />

      {/* Header — avatar + name on the left, actions on the right (members,
          join call, close). Round avatar for a person, square for a group. */}
      <div className="relative flex items-center gap-3 h-[60px] pl-3 pr-3 sm:pl-5 sm:pr-4 flex-shrink-0
                      bg-ll-panel border-b border-ll-line z-10">
        {/* Back button — mobile */}
        <button onClick={onBackClick}
          className="lg:hidden w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink2
                     hover:bg-ll-hover hover:text-ll-ink transition-colors flex-shrink-0">
          <FiChevronLeft size={18} />
        </button>

        <div
          onClick={() => {
            if (chatType === "dm" && otherUserId) onViewProfile?.(otherUserId);
            else if (chatType === "group") onViewGroupMembers?.();
          }}
          className={`relative w-[34px] h-[34px] flex items-center justify-center flex-shrink-0
                      text-[12px] font-semibold bg-ll-violet-tint text-ll-violet-ink
                      ${chatType === "dm" ? "rounded-full" : "rounded-[10px]"}
                      ${chatType === "dm" || chatType === "group" ? "cursor-pointer" : ""}`}>
          {getInitials(studentName)}
          {chatType === "dm" && otherOnline && (
            <span className="absolute -right-px -bottom-px w-2.5 h-2.5 rounded-full bg-ll-teal ring-2 ring-[rgb(var(--ll-panel))]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2
            onClick={() => {
              if (chatType === "dm" && otherUserId) onViewProfile?.(otherUserId);
              else if (chatType === "group") onViewGroupMembers?.();
            }}
            className={`text-[14.5px] font-semibold text-ll-ink truncate leading-tight ${chatType === "dm" || chatType === "group" ? "cursor-pointer hover:underline" : ""}`}
          >
            {studentName}
          </h2>
          {/* Online indicator — only meaningful for a 1:1 DM with a known peer */}
          {chatType === "dm" && otherOnline !== null && (
            <span className={`flex items-center gap-1.5 mt-0.5 text-[12px] ${otherOnline ? "text-ll-teal-ink" : "text-ll-ink3"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${otherOnline ? "bg-ll-teal" : "bg-ll-ink4"}`} />
              {t(otherOnline ? "chatWindow.activeNow" : "chatWindow.offline")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {canShowMembers && (
            <button onClick={() => onViewGroupMembers?.()} title="View members"
              className="w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink2
                         hover:bg-ll-hover hover:text-ll-ink transition-colors">
              <FiUsers size={16} />
            </button>
          )}
          {isGeneralChat && (
            <button onClick={handleJoinGeneralClass} title="Join video class"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] text-[12.5px] font-medium
                         bg-ll-violet hover:bg-ll-violet-hover text-ll-on-violet transition-colors
                         shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_1px_2px_rgb(var(--ll-shadow)/.25)]">
              <FiVideo size={14} />
              <span>{t("messagesExtra.joinCall")}</span>
            </button>
          )}
          {onClose && (
            <button onClick={onClose}
              className="w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink2
                         hover:bg-ll-hover hover:text-ll-ink transition-colors"
              title="Close chat">
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages — the scroll container stays mounted while empty or
          loading (it used to be swapped for the spinner, so every cold open
          re-created it at scrollTop 0 and then jumped). */}
      <div className="ll-chat-body flex-1 relative z-10 min-h-0 flex flex-col">
      {chatMessages.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-4 border-ll-violet/30 border-t-ll-violet animate-spin" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-ll-violet-tint flex items-center justify-center">
                <FaComments className="text-ll-violet-ink" size={20} />
              </div>
              <p className="text-[13px] text-ll-ink3">{t("chatWindow.noMessages")}</p>
            </div>
          )}
        </div>
      )}
      <PerfectScrollbar
        containerRef={(ref) => { scrollContainerRef.current = ref; }}
        onScrollY={handleScroll}
        className="flex-1 relative bg-transparent"
        // perfect-scrollbar's stylesheet turns the browser's scroll anchoring
        // off; with it on, images that finish loading ABOVE what you're
        // reading (e.g. after "load more") no longer push the text away.
        style={{ overflowAnchor: "auto" }}
        options={{ suppressScrollX: true }}
      >
        <div ref={contentRef} className="px-2.5 py-3 sm:px-7 sm:pt-[18px] sm:pb-3">
          {hasMore && chatMessages.length > 0 && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handleLoadOlder}
                disabled={loadingMore}
                className="h-7 px-2.5 rounded-[7px] text-[12.5px] font-medium text-ll-violet-ink
                           bg-ll-violet-tint hover:bg-ll-violet/15 transition-colors disabled:opacity-50"
              >
                {loadingMore ? t("chatWindow.loading", "Loading...") : t("chatWindow.loadMore")}
              </button>
            </div>
          )}
          <ul>
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
              // A "run" = consecutive ordinary messages from one sender with no
              // date divider between them. Bubbles in a run stack tightly with
              // squared inner corners; name on the first, avatar + time on the last.
              const next = chatMessages[index + 1];
              const isSpecial = (m) => SYSTEM_MESSAGE_TYPES.includes(m.messageType) || m.messageType === "missed_call";
              const breaksRun = (a, b) => !a || !b || a.email !== b.email || isSpecial(a) || isSpecial(b)
                || new Date(b.timestamp) - new Date(a.timestamp) > 3 * 60 * 1000;
              const isFirstInRun = breaksRun(prev, msg);
              const isLastInRun = breaksRun(msg, next);
              const showUsername = !isSender && isFirstInRun;
              const initials = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);
              const isImageOnly = !!(effectiveFileUrl && !effectiveMessage?.trim() && isImageUrl(effectiveFileUrl));
              const isVoiceNoteOnly = !!(effectiveFileUrl && !effectiveMessage?.trim() && isVoiceNoteUrl(effectiveFileUrl));
              const isFileOnly = !!(effectiveFileUrl && !effectiveMessage?.trim() && !isImageUrl(effectiveFileUrl) && !isVoiceNoteOnly);

              if (isSystemMessage) {
                const meta = msg.metadata || {};
                let icon = <FiUsers size={12} className="text-gray-400 flex-shrink-0" />;
                let text = "";
                if (msg.messageType === "member_added") {
                  icon = <FiUserPlus size={12} className="text-[#1FA48C] flex-shrink-0" />;
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
                  icon = <FiEdit2 size={12} className="text-ll-violet flex-shrink-0" />;
                  text = t("messagesExtra.systemGroupRenamed", { actor: msg.username, oldName: meta.oldName, newName: meta.newName });
                }
                return (
                  <div key={msg.id || index} data-msg-id={msg.id}>
                    {showTimestamp && (
                      <DateSep>{formatTimestamp(msg.timestamp)}</DateSep>
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
                  <div key={msg.id || index} data-msg-id={msg.id}>
                    {showTimestamp && (
                      <DateSep>{formatTimestamp(msg.timestamp)}</DateSep>
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
                          style={{ background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))" }}
                        >
                          {t("messagesExtra.joinCall")}
                        </button>
                      </div>
                    </li>
                  </div>
                );
              }

              return (
                <div key={msg.id || index} data-msg-id={msg.id}>
                  {showTimestamp && (
                    <DateSep>{formatTimestamp(msg.timestamp)}</DateSep>
                  )}

                  <li className={`group flex items-end gap-2.5 ${isLastInRun ? "mb-2.5" : "mb-[3px]"} ${isSender ? "justify-end" : "justify-start"}`}>

                    {/* Avatar (others), on the run's last bubble — clickable to view the sender's profile */}
                    {!isSender && (
                      <div className={`flex-shrink-0 w-7 self-end ${isLastInRun ? "mb-[18px]" : ""}`}>
                        {isLastInRun ? (
                          msg.avatarUrl ? (
                            <img src={msg.avatarUrl} alt="avatar"
                              onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                              className="w-7 h-7 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" />
                          ) : (
                            <div
                              onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                              className="w-7 h-7 rounded-full flex items-center justify-center
                                          text-white text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ background: avatarColor }}>
                              {initials}
                            </div>
                          )
                        ) : <div className="w-7" />}
                      </div>
                    )}

                    {isSender ? (
                      <div className="flex flex-col items-end max-w-[88%] sm:max-w-[62%]">
                      <div className="relative flex items-center gap-2">
                        {/* Reply + options */}
                        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-ll-panel border border-ll-line shadow-ll-2
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                        max-sm:absolute max-sm:-top-9 max-sm:right-0 max-sm:z-10">
                          <button
                            onClick={() => setReplyTo({ id: msg.id, message: legacyFileUrl ? "📎 File" : (msg.message || "📎 File"), username: msg.username })}
                            className="w-[26px] h-[26px] grid place-items-center rounded-md text-ll-ink2
                                       hover:bg-ll-hover hover:text-ll-ink transition-colors duration-150">
                            <FiCornerUpLeft size={14} />
                          </button>
                          <div className="relative">
                            <button onClick={() => toggleOptionsMenu(msg.id)}
                              className="w-[26px] h-[26px] grid place-items-center rounded-md text-ll-ink2
                                         hover:bg-ll-hover hover:text-ll-ink transition-colors duration-150">
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
                        <div className={`relative rounded-2xl ${isFirstInRun ? "" : "rounded-tr-md"} ${isLastInRun ? "" : "rounded-br-md"} ${
                            isImageOnly ? "overflow-hidden"
                            : isFileOnly ? ""
                            : "ll-bubble-out px-[13px] py-2 text-[14px] leading-[1.42]"
                          } ${msg._pending ? "opacity-60" : ""} ${msg._failed ? "ring-2 ring-red-400/70" : ""}`}
                          style={isImageOnly || isFileOnly ? {}
                            : { background: "rgb(var(--ll-violet))", color: "rgb(var(--ll-on-violet))" }}>
                          {/* Reply quote in bubble */}
                          {msg.replyTo && (
                            <div className="mb-1.5 pl-2 border-l-2 border-white/50 rounded bg-white/10 text-xs" style={{ padding: "4px 6px" }}>
                              <p className="font-semibold text-[11px] mb-0.5 text-white/80">{msg.replyTo.username}</p>
                              <p className="line-clamp-2 text-[12px] text-white/70">{stripMentionMarkup(msg.replyTo.message)}</p>
                            </div>
                          )}
                          {effectiveFileUrl && renderFile(effectiveFileUrl, true)}
                          {effectiveMessage?.trim() && (
                            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {formatMessageWithLinks(effectiveMessage, true, userId)}
                              {msg.editedAt && <span className="text-[11px] text-white/60 ml-1">({t("chatWindow.edited")})</span>}
                            </p>
                          )}
                        </div>
                      </div>
                      <MessageReactions
                        reactions={msg.reactions}
                        currentUserId={userId}
                        onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                        align="end"
                      />
                        {msg._failed ? (
                          <button
                            onClick={() => retryMessage(msg.id)}
                            className="flex items-center gap-1 text-[11px] mt-[3px] mx-1 text-red-500 hover:text-red-600 hover:underline"
                          >
                            <FiAlertCircle size={11} />
                            {t("chatWindow.failedToSend")} · {t("chatWindow.retry")}
                          </button>
                        ) : msg._pending ? (
                          <span className="text-[11px] mt-[3px] mx-1 text-ll-ink3">{t("chatWindow.sending")}</span>
                        ) : isLastInRun && (
                          <span className="flex items-center gap-1.5 mt-[3px] mx-1 font-mono text-[10.5px] text-ll-ink3">
                            {bubbleTime(msg.timestamp)}
                            {isLastOwnMessage && chatType === "dm" && (
                              <>
                                <BsCheck2All size={14} className={isSeen ? "text-ll-teal" : "text-ll-ink4"} />
                                <span className={`font-sans text-[11px] font-medium ${isSeen ? "text-ll-teal-ink" : "text-ll-ink3"}`}>
                                  {isSeen ? t("chatWindow.seen") : t("chatWindow.sent")}
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="max-w-[84%] sm:max-w-[62%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <p
                            onClick={() => msg.senderId && onViewProfile?.(msg.senderId)}
                            className="text-[12px] font-semibold text-ll-violet-ink mb-0.5 ml-1 cursor-pointer hover:underline w-fit"
                          >
                            {msg.username}
                          </p>
                        )}
                        {/* relative wrapper for bubble only — so button centers on bubble, not username */}
                        <div className="relative">
                          <div className={`rounded-2xl ${isFirstInRun ? "" : "rounded-tl-md"} ${isLastInRun ? "" : "rounded-bl-md"} ${
                              isImageOnly ? "overflow-hidden"
                              : isFileOnly ? ""
                              : "px-[13px] py-2 text-[14px] leading-[1.42] text-ll-ink"
                            }`}
                            style={isImageOnly || isFileOnly ? {} : { background: "rgb(var(--ll-bubble-in))" }}>
                            {/* Reply quote in received bubble */}
                            {msg.replyTo && (
                              <div className="mb-1.5 pl-2 border-l-2 border-ll-violet/60 rounded bg-ll-panel/60 text-xs" style={{ padding: "4px 6px" }}>
                                <p className="font-semibold text-[11px] mb-0.5 text-ll-violet-ink">{msg.replyTo.username}</p>
                                <p className="line-clamp-2 text-[12px] text-ll-ink3">{stripMentionMarkup(msg.replyTo.message)}</p>
                              </div>
                            )}
                            {effectiveFileUrl && renderFile(effectiveFileUrl, false)}
                            {effectiveMessage?.trim() && (
                              <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {formatMessageWithLinks(effectiveMessage, false, userId)}
                                {msg.editedAt && <span className="text-[11px] text-ll-ink3 ml-1">({t("chatWindow.edited")})</span>}
                              </p>
                            )}
                          </div>
                          {/* Reply button — positioned relative to bubble only */}
                          <button
                            onClick={() => setReplyTo({ id: msg.id, message: legacyFileUrl ? "📎 File" : (msg.message || "📎 File"), username: msg.username })}
                            className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                                       opacity-0 group-hover:opacity-100 transition-opacity
                                       w-[26px] h-[26px] grid place-items-center rounded-md
                                       bg-ll-panel border border-ll-line shadow-ll-2 text-ll-ink2
                                       hover:text-ll-ink">
                            <FiCornerUpLeft size={14} />
                          </button>
                        </div>
                        <MessageReactions
                          reactions={msg.reactions}
                          currentUserId={userId}
                          onToggle={(emoji) => toggleReaction(msg.id, emoji)}
                          align="start"
                        />
                        {isLastInRun && (
                          <span className="block mt-[3px] mx-1 font-mono text-[10.5px] text-ll-ink3">
                            {bubbleTime(msg.timestamp)}
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
      </PerfectScrollbar>
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button onClick={scrollToBottom}
          className="absolute right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center
                     bg-ll-panel border border-ll-line shadow-ll-2 text-ll-ink2 hover:text-ll-ink transition-colors"
          style={{ bottom: "96px" }}>
          <FiArrowDown size={16} />
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
          <span className="text-[11.5px] text-ll-ink3">
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
      <div className="relative flex-shrink-0 px-2.5 sm:px-5 pt-2 pb-2.5 sm:pt-3 sm:pb-[18px] z-10 ll-chat-foot">
        {/* @ mention picker — anchored above the input like the emoji picker
            below; full-width on phones (no left/right inset) instead of a
            narrow floating box, since a cramped list is hard to tap accurately. */}
        {mentionQuery !== null && filteredMentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 sm:left-3 sm:right-auto sm:w-64 mb-2 z-20 px-3 sm:px-0">
            <div className="rounded-xl overflow-hidden border border-ll-line bg-ll-panel shadow-ll-pop max-h-56 overflow-y-auto">
              {filteredMentionCandidates.map((candidate, i) => (
                <button
                  key={candidate.id}
                  onClick={() => insertMention(candidate)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                    i === mentionActiveIndex
                      ? "bg-ll-violet-tint"
                      : "hover:bg-ll-hover"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))" }}>
                    {candidate.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm text-ll-ink truncate flex-1">{candidate.name}</span>
                  {candidate.isMember === false && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0
                                     bg-[#E8A23A]/15 text-[#C4860A] dark:text-[#E8A23A]">
                      <FiUserPlus size={10} />
                      {t("messagesExtra.addPeople")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Staged files — attached/pasted, waiting on the next Send tap.
            A file that failed to upload stays here with a red border instead
            of disappearing, so Send retries it. */}
        {stagedFiles.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            {stagedFiles.map((f) => (
              <div key={f.id} className="relative flex-shrink-0"
                title={f.error ? t(`chatWindow.uploadError.${f.error}`, { defaultValue: t("chatWindow.uploadError.upload_failed") }) : f.name}>
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt={f.name}
                    className={`w-14 h-14 rounded-lg object-cover border ${
                      f.error ? "border-red-400 ring-1 ring-red-400" : "border-gray-200 dark:border-white/10"
                    }`} />
                ) : (
                  <div className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-0.5 px-1
                                  bg-gray-100 dark:bg-white/5 border ${
                                    f.error ? "border-red-400 ring-1 ring-red-400" : "border-gray-200 dark:border-white/10"
                                  }`}>
                    <FiFile size={16} className={f.error ? "text-red-400" : "text-gray-400"} />
                    <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate w-full text-center">{f.name}</span>
                  </div>
                )}
                {typeof f.size === "number" && (
                  <span className="absolute -bottom-1 left-0 right-0 text-[8px] text-center text-gray-500 dark:text-gray-400">
                    {formatBytes(f.size)}
                  </span>
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
        {/* Progress + failure banner. Without the progress bar a large
            attachment looks frozen; without the banner a failed upload is
            indistinguishable from a successful one that sent nothing. */}
        <UploadStatus
          progress={uploadProgress}
          errorCode={uploadErrorCode}
          onDismissError={() => setUploadErrorCode(null)}
        />
        {/* Editing banner */}
        {editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg
                         bg-ll-subtle border border-ll-line">
            <div className="flex items-center gap-1.5 text-xs text-ll-ink2">
              <FiEdit2 size={12} />
              <span>{t("chatWindow.editing")}</span>
            </div>
            <button onClick={clearEditing} className="text-ll-ink3 hover:text-ll-ink flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        {/* Reply banner */}
        {replyTo && !editingMsg && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 mb-2 rounded-lg
                         bg-ll-subtle border border-ll-line border-l-2 border-l-ll-violet">
            <div className="flex items-center gap-1.5 min-w-0">
              <FiCornerUpLeft size={12} className="text-ll-violet flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-ll-violet-ink">{replyTo.username}</p>
                <p className="text-xs text-ll-ink3 truncate">{stripMentionMarkup(replyTo.message)}</p>
              </div>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-ll-ink3 hover:text-ll-ink flex-shrink-0">
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="relative">
          <svg className="hw-only ll-peek absolute right-16 -top-[18px] z-0 w-[34px] h-10 pointer-events-none" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2C10.5 2 4 9.5 4 19.5V42l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V19.5C36 9.5 29.5 2 20 2z" fill="rgba(246,242,255,.94)" /><ellipse cx="14.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="25.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="20" cy="28" rx="2.4" ry="3" fill="#140E1C" /></svg>
        {/* Composer box. Phone: one row (tools | text | send). sm+: text on
            top, tools + hint + send underneath, like the design mock. */}
        <div className="ll-composer relative z-[1] grid grid-cols-[auto_1fr_auto] items-end gap-1.5 px-2 py-1.5
                        sm:grid-cols-[1fr_auto] sm:gap-0 sm:p-0
                        bg-ll-panel rounded-xl border border-ll-line2 shadow-ll-1
                        focus-within:border-ll-violet/60 transition-colors duration-200">

          <div className="flex items-center gap-0.5 flex-shrink-0 self-end sm:col-start-1 sm:row-start-2 sm:px-2 sm:pb-2 sm:pt-1">
            {/* Mobile-only "+" — emoji/format/attach collapse behind it so the
                row doesn't get crowded on a narrow phone screen; desktop just
                shows all three inline (see the hidden sm:flex group below). */}
            {!isRecording && (
              <button
                onClick={() => setShowMoreOptions((p) => !p)}
                className={`sm:hidden ${COMPOSER_BTN}`}>
                <FiPlus size={18} className={`transition-transform duration-150 ${showMoreOptions ? "rotate-45" : ""}`} />
              </button>
            )}

            <div className={`items-center gap-0.5 ${showMoreOptions ? "flex" : "hidden"} sm:flex`}>
              {/* Emoji button */}
              <button onClick={() => { setShowEmojiPicker((p) => !p); setShowFormatMenu(false); setShowMoreOptions(false); }}
                className={COMPOSER_BTN}>
                <BsEmojiSmile size={16} />
              </button>

              {/* Text format button — one icon instead of 4 separate ones so the
                  input row stays usable on narrow phone screens. */}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setShowFormatMenu((p) => !p); setShowEmojiPicker(false); setShowMoreOptions(false); }}
                title={t("chatWindow.formatText")}
                className={COMPOSER_BTN}>
                <BsType size={17} />
              </button>

              {/* File button */}
              <button onClick={() => { fileInputRef.current?.click(); setShowMoreOptions(false); }} disabled={isUploading}
                className={`${COMPOSER_BTN} disabled:opacity-40`} title="Attach file">
                <FiPaperclip size={16} className={isUploading ? "animate-pulse" : ""} />
              </button>
              {/* No `accept` filter. The old list had no video/* entry at all, so
                  the picker silently hid every video (and .pptx) — a teacher could
                  not even select the file. Executables are refused server-side. */}
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}
                accept="*/*" />
            </div>

            {/* Voice note — cancel (discard) only shows up mid-recording */}
            {isRecording && (
              <button onClick={handleCancelRecording}
                className={`${COMPOSER_BTN} hover:!text-red-500`}>
                <FiTrash2 size={16} />
              </button>
            )}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              title={isRecording ? t("chatWindow.stopRecording") : t("chatWindow.recordVoiceNote")}
              className={isRecording
                ? "w-[30px] h-[30px] grid place-items-center rounded-full bg-red-500 text-white animate-pulse"
                : COMPOSER_BTN}>
              {isRecording ? <FiSquare size={13} /> : <FiMic size={16} />}
            </button>
          </div>

          {/* Textarea — swapped for a recording indicator while capturing */}
          <div className="min-w-0 sm:col-span-2 sm:row-start-1 sm:px-3.5 sm:pt-2.5">
            {isRecording ? (
              <div className="flex items-center gap-2 py-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-semibold text-red-500 tabular-nums flex-shrink-0">
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                </span>
                <span className="text-xs text-ll-ink3 truncate">{t("chatWindow.recording")}</span>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                placeholder={t("chatWindow.typePlaceholder")}
                value={message}
                onChange={handleInputWithTyping}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={1}
                className="block w-full bg-transparent resize-none outline-none
                           text-[14px] text-ll-ink placeholder:text-ll-ink3
                           max-h-32 leading-relaxed py-1.5"
                style={{ overflowY: "hidden" }}
              />
            )}
          </div>

          {/* Hint + send */}
          <div className="flex items-center gap-3 self-end sm:col-start-2 sm:row-start-2 sm:px-2 sm:pb-2 sm:pt-1">
            <span className="hidden sm:inline text-[11.5px] text-ll-ink4">{t("chatWindow.enterHint")}</span>
            <button onClick={handleSendMessage} disabled={!message.trim() && stagedFiles.length === 0}
              aria-label="Send"
              className="flex-shrink-0 w-8 h-8 rounded-lg grid place-items-center
                         bg-ll-violet hover:bg-ll-violet-hover text-ll-on-violet transition-colors duration-150
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ll-violet">
              <FiSend size={15} />
            </button>
          </div>
        </div>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2 z-20">
            <div className="bg-ll-panel rounded-xl border border-ll-line overflow-hidden shadow-ll-pop">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}

        {showFormatMenu && (
          <div className="absolute bottom-full left-3 mb-2 z-20">
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-ll-panel border border-ll-line shadow-ll-pop">
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
                  className="w-8 h-8 grid place-items-center rounded-md text-ll-ink2
                             hover:text-ll-ink hover:bg-ll-hover transition-colors"
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
