import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { FiSend, FiRadio } from "react-icons/fi";
import { HiShieldCheck } from "react-icons/hi2";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import MessageOptionsCard from "./MessageOptionsCard";
import useDeleteMessage from "../../hooks/useDeleteMessage";
import useMessageFormatter from "../../hooks/useMessageFormatter";
import { fetchUnreadMessages } from "../../redux/messageSlice";
import useNotificationSound from "../../hooks/useNotificationSound";
import notificationSound from "../../assets/sounds/notification.wav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SUPPORT_ROOM = "uuid-support";

const SupportChatWindow = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo?.user);
  const soundEnabled = user?.settings?.notificationSound !== false;

  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const playSound = useNotificationSound(notificationSound);

  const { handleDeleteMessage, toggleOptionsMenu, openMessageId } =
    useDeleteMessage(setChatMessages, socket, SUPPORT_ROOM, "deleteSupportChat", "supportChatDeleted");

  const { formatMessageWithLinks } = useMessageFormatter(() => {});

  // Fetch history
  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/chat/global-chats/${SUPPORT_ROOM}`
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
      await axios.patch(`${BACKEND_URL}/chat/delete-unread-global-messages`, {
        room: SUPPORT_ROOM,
        userId: user.id,
      });
      dispatch(fetchUnreadMessages(user.id));
    } catch (e) {}
  };

  useEffect(() => {
    if (!user) return;
    const s = io(BACKEND_URL);
    setSocket(s);
    s.emit("join", { username: user.name, room: SUPPORT_ROOM });
    fetchMessages();
    markRead();

    s.on("supportChat", (data) => {
      setChatMessages((prev) => [...prev, data]);
      if (data.email !== user?.email && soundEnabledRef.current) {
        playSound();
      }
    });

    s.on("supportChatDeleted", (data) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    return () => s.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    socket.emit("supportChat", {
      username: user.name,
      email: user.email,
      room: SUPPORT_ROOM,
      message: message.trim(),
      userRole: user.role,
      userUrl: user.avatarUrl || null,
    });
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "32px";
    }
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
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
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
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f0c26] transition-colors duration-300 relative overflow-hidden">

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
                      <div className="flex items-end gap-1.5 max-w-[80%]">
                        {/* Options */}
                        <div className="relative self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleOptionsMenu(msg.id)}
                            className="p-1.5 rounded-full text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-white/10 transition-colors">
                            <BsThreeDots size={12} />
                          </button>
                          {openMessageId === msg.id && (
                            <div className="absolute bottom-full right-0 mb-1 z-20">
                              <MessageOptionsCard
                                onDelete={() => handleDeleteMessage(msg.id)}
                              />
                            </div>
                          )}
                        </div>
                        {/* Sender bubble */}
                        <div className="px-3.5 py-2 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed shadow-md"
                          style={{
                            background: user?.role === "admin"
                              ? "linear-gradient(135deg, #F6B82E, #d4950a)"
                              : "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                            boxShadow: user?.role === "admin"
                              ? "0 3px 10px rgba(246,184,46,0.30)"
                              : "0 3px 10px rgba(158,47,208,0.30)",
                          }}>
                          {user?.role === "admin" && (
                            <div className="flex items-center gap-1 mb-1 opacity-80">
                              <HiShieldCheck size={11} />
                              <span className="text-[9px] font-bold tracking-wider uppercase">{t("supportChat.adminBadge")}</span>
                            </div>
                          )}
                          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, true)}</p>
                        </div>
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
                        {adminMsg ? (
                          <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm text-white text-sm leading-relaxed shadow-md"
                            style={{
                              background: "linear-gradient(135deg, #F6B82E, #d4950a)",
                              boxShadow: "0 3px 10px rgba(246,184,46,0.30)",
                            }}>
                            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, true)}</p>
                          </div>
                        ) : (
                          <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm bg-white dark:bg-white/[0.07] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10">
                            <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message, false)}</p>
                          </div>
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

      {/* ── Input ── */}
      <div className="relative flex-shrink-0 z-10 p-3 bg-white dark:bg-[#0f0c26] border-t border-gray-100 dark:border-[rgba(246,184,46,0.10)]">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 focus-within:border-[rgba(246,184,46,0.5)] dark:focus-within:border-[rgba(246,184,46,0.4)] transition-colors">
          <button onClick={() => setShowEmojiPicker((p) => !p)}
            className="flex-shrink-0 text-gray-400 hover:text-amber-500 transition-colors self-end mb-0.5">
            <BsEmojiSmile size={18} />
          </button>
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
            disabled={!message.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 self-end"
            style={{ background: "linear-gradient(135deg, #F6B82E, #d4950a)", boxShadow: "0 2px 8px rgba(246,184,46,0.35)" }}
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

export default SupportChatWindow;
