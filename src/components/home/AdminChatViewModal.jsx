// AdminChatViewModal.jsx — Read-only chat observer for admin dashboard
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { FiX, FiMessageSquare, FiEye } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AdminChatViewModal = ({ classItem, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      // Class chats use /chat/messages/{studentId} — NOT /chat/global-chats/
      const res = await axios.get(
        `${BACKEND_URL}/chat/messages/${classItem.studentId}`,
        { params: { email: classItem.teacherEmail } }
      );
      setMessages(res.data.reverse());
    } catch (e) {
      console.error("AdminChatViewModal fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [classItem.studentId, classItem.teacherEmail]);

  useEffect(() => {
    fetchMessages();

    // Live updates via socket — class chat uses "chat" event, not "globalChat"
    const socket = io(BACKEND_URL);
    socket.emit("join", { username: "admin-observer", room: classItem.studentId });
    socket.on("chat", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("chat");
      socket.disconnect();
    };
  }, [classItem.studentId, fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return t;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${t}`;
  };

  const formatMessageWithLinks = (text, isTeacher) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={isTeacher ? "underline text-white/90 hover:text-white" : "underline text-blue-600 dark:text-blue-400 hover:opacity-80"}
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  const cleanFileName = (fileUrl) => {
    let fileName = fileUrl.split("/").pop().split(".")[0];
    fileName = fileName.replace(/^\d+-|^\d+$/g, "");
    fileName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    fileName = fileName.replace(/[-\s]+/g, " ").trim();
    return fileName || "file";
  };

  const renderFileMessage = (fileUrl, isTeacher) => {
    const fileExtension = fileUrl.split(".").pop().toLowerCase().split("?")[0];
    const fileName = cleanFileName(fileUrl);

    if (["mp3", "wav", "ogg"].includes(fileExtension)) {
      return (
        <audio controls className="max-w-full">
          <source src={fileUrl} type={`audio/${fileExtension}`} />
          Your browser does not support the audio element.
        </audio>
      );
    }

    if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
          <img src={fileUrl} alt="shared file" className="max-w-full max-h-40 rounded-lg" />
        </a>
      );
    }

    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline cursor-pointer ${isTeacher ? "text-white/90 hover:text-white" : "text-blue-600 dark:text-blue-400 hover:opacity-80"}`}
      >
        {fileName}.{fileExtension}
      </a>
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  };

  const generateColor = (name) => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360}, 60%, 52%)`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          height: "min(80vh, 700px)",
          border: "1px solid rgba(158,47,208,0.28)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
          animation: "navbarDropdownIn 0.22s cubic-bezier(0.16,1,0.3,1) both",
          transformOrigin: "center top",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background layers */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background: "linear-gradient(135deg, rgba(13,10,30,0.98) 0%, rgba(26,26,46,0.97) 100%)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          }}
        />

        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80" />

        {/* ── Header ── */}
        <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20 mt-[2px]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                boxShadow: "0 2px 10px rgba(158,47,208,0.40)",
              }}
            >
              <FiMessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold login-gradient-text leading-tight">Class Chat</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {classItem.teacherName} &amp; {classItem.studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Observer badge */}
            <span
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{
                background: "rgba(246,184,46,0.10)",
                border: "1px solid rgba(246,184,46,0.28)",
                color: "#F6B82E",
              }}
            >
              <FiEye size={10} />
              Observer Mode
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#9E2FD0] dark:hover:text-white hover:bg-[#9E2FD0]/8 dark:hover:bg-white/10 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* ── Participants strip ── */}
        <div className="relative z-10 flex-shrink-0 flex flex-wrap items-center gap-4 px-5 py-2.5 border-b border-[#9E2FD0]/8 dark:border-[#9E2FD0]/15"
             style={{ background: "rgba(158,47,208,0.04)" }}>
          {/* Teacher */}
          <div className="flex items-center gap-2">
            <img
              src={classItem.teacherAvatar}
              alt={classItem.teacherName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              style={{ boxShadow: "0 0 0 2px rgba(38,217,161,0.55)" }}
            />
            <div>
              <p className="text-[10px] font-bold text-[#26D9A1] uppercase tracking-wider leading-none">Teacher</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{classItem.teacherName}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[#9E2FD0]/20 to-transparent" />

          {/* Student */}
          <div className="flex items-center gap-2">
            <img
              src={classItem.studentAvatar}
              alt={classItem.studentName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              style={{ boxShadow: "0 0 0 2px rgba(158,47,208,0.55)" }}
            />
            <div>
              <p className="text-[10px] font-bold text-[#9E2FD0] uppercase tracking-wider leading-none">Student</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{classItem.studentName}</p>
            </div>
          </div>

          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 font-medium">{classItem.time}</span>
        </div>

        {/* ── Messages ── */}
        {loading ? (
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-3"
                style={{
                  border: "3px solid rgba(158,47,208,0.15)",
                  borderTopColor: "#9E2FD0",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Loading messages…</p>
            </div>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-2"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(158,47,208,0.10)", border: "1px solid rgba(158,47,208,0.20)" }}
                >
                  <FiMessageSquare size={22} className="text-[#9E2FD0]" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  No messages in this class chat yet.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const prev = messages[index - 1];
                const isTeacher = msg.email === classItem.teacherEmail;
                const isFirstFromUser = index === 0 || msg.email !== prev?.email;
                const showTimestamp =
                  index === 0 ||
                  new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;

                return (
                  <div key={index}>
                    {showTimestamp && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                        <span
                          className="text-[10px] font-medium text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full border"
                          style={{
                            background: "rgba(158,47,208,0.05)",
                            borderColor: "rgba(158,47,208,0.15)",
                          }}
                        >
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${isTeacher ? "justify-end" : "justify-start"}`}>
                      {/* Left avatar (student) */}
                      {!isTeacher && (
                        <div className="flex-shrink-0 w-8 self-end">
                          {isFirstFromUser ? (
                            msg.userUrl ? (
                              <img
                                src={msg.userUrl}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                style={{ boxShadow: "0 0 0 2px rgba(158,47,208,0.35)" }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{
                                  background: generateColor(msg.username || ""),
                                  boxShadow: "0 0 0 2px rgba(158,47,208,0.35)",
                                }}
                              >
                                {getInitials(msg.username)}
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`max-w-[72%] flex flex-col ${isTeacher ? "items-end" : "items-start"}`}>
                        {isFirstFromUser && msg.username && (
                          <p
                            className={`text-[10px] font-semibold mb-1 px-1 ${
                              isTeacher ? "text-[#26D9A1]" : "text-[#9E2FD0]"
                            }`}
                          >
                            {msg.username}
                            {isTeacher && (
                              <span className="ml-1 opacity-70">(Teacher)</span>
                            )}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isTeacher
                              ? "rounded-br-sm text-white"
                              : "rounded-bl-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-[#1e1e38] border border-gray-200 dark:border-[#9E2FD0]/20 shadow-sm dark:shadow-none"
                          }`}
                          style={
                            isTeacher
                              ? { background: "linear-gradient(135deg, #9E2FD0 0%, #7b22a8 100%)" }
                              : {}
                          }
                        >
                          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {msg.message.startsWith("http")
                              ? renderFileMessage(msg.message, isTeacher)
                              : formatMessageWithLinks(msg.message, isTeacher)}
                          </div>
                        </div>
                        <p
                          className={`text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1 ${
                            isTeacher ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTimestamp(msg.timestamp)}
                        </p>
                      </div>

                      {/* Right avatar (teacher) */}
                      {isTeacher && (
                        <div className="flex-shrink-0 w-8 self-end">
                          {isFirstFromUser ? (
                            msg.userUrl ? (
                              <img
                                src={msg.userUrl}
                                alt="avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                style={{ boxShadow: "0 0 0 2px rgba(38,217,161,0.45)" }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{
                                  background: "linear-gradient(135deg, #26D9A1, #1fa07a)",
                                  boxShadow: "0 0 0 2px rgba(38,217,161,0.45)",
                                }}
                              >
                                {getInitials(msg.username)}
                              </div>
                            )
                          ) : (
                            <div className="w-8 h-8" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Read-only footer ── */}
        <div
          className="relative z-10 flex-shrink-0 px-5 py-2.5 border-t border-[#9E2FD0]/10 dark:border-[#9E2FD0]/15"
          style={{ background: "rgba(158,47,208,0.03)" }}
        >
          <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
            <FiEye size={11} className="inline mr-1 mb-px" />
            Viewing as <span className="text-[#F6B82E] font-semibold">observer</span> — this chat is read-only
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminChatViewModal;
