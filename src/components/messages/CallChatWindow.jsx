import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { FaComments } from "react-icons/fa";
import axios from "axios";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import EmojiPicker from "emoji-picker-react";
import avatar from "../../assets/logos/avatar.jpg";
import MessageOptionsCard from "./MessageOptionsCard";
import useDeleteMessage from "../../hooks/useDeleteMessage";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CallChatWindow = ({
  username,
  room,
  chatName,
  email,
  userUrl,
}) => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const { handleDeleteMessage, handleEditMessage, toggleOptionsMenu, openMessageId } =
    useDeleteMessage(setChatMessages, socket, room);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/chat/global-chats/${room}`, {
        params: { email },
      });
      setChatMessages(response.data.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (socket && room) {
      socket.on("globalChatDeleted", (data) => {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      });
      return () => socket.off("globalChatDeleted");
    }
  }, [socket, room]);

  useEffect(() => {
    if (username && room) {
      const socketInstance = io(`${BACKEND_URL}`);
      setSocket(socketInstance);
      fetchMessages();
      socketInstance.emit("join", { username, room });
      socketInstance.on("globalChat", (data) => {
        setChatMessages((prev) => [...prev, data]);
      });
      return () => socketInstance.disconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, room]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const sendMessage = () => {
    if (message.trim() && room && socket) {
      const messageData = {
        username,
        room,
        email,
        message,
        timestamp: new Date(),
        ...(userUrl && { userUrl }),
      };
      socket.emit("globalChat", messageData);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "32px";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleInput = (e) => {
    setMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "32px";
      ta.style.height = `${Math.min(ta.scrollHeight, 112)}px`;
    }
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yest = new Date(); yest.setDate(today.getDate() - 1);
    const t = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === today.toDateString()) return t;
    if (d.toDateString() === yest.toDateString()) return `Yesterday ${t}`;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${t}`;
  };

  const getInitials = (name) => {
    if (!name || name === "undefined") return "?";
    const p = name.trim().split(" ");
    return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  };

  const generateColor = (name) => {
    let h = 0;
    for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
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

  const displayName = chatName || "Group Chat";

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f0d24] transition-colors duration-300">

      {/* ── Header ── */}
      <div className="relative flex-shrink-0">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80 z-10" />
        <div className="absolute inset-0 dark:hidden"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,245,255,0.98))", borderBottom: "1px solid rgba(158,47,208,0.08)" }} />
        <div className="absolute inset-0 hidden dark:block"
          style={{ background: "linear-gradient(135deg, rgba(15,13,36,0.98), rgba(26,20,50,0.98))", borderBottom: "1px solid rgba(158,47,208,0.15)" }} />

        <div className="relative z-10 flex items-center gap-3 px-4 py-3 mt-[2px]">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}>
            <FiMessageSquare size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold login-gradient-text truncate">{displayName}</p>
            <p className="text-[10px] font-medium" style={{ color: "#26D9A1" }}>● Live</p>
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <PerfectScrollbar
        containerRef={(ref) => (scrollContainerRef.current = ref)}
        className="flex-1 p-4 sm:p-5 bg-gray-50 dark:bg-black/20"
        style={{ minHeight: 0 }}
        options={{ suppressScrollX: true }}
      >
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
              <FaComments className="text-purple-400" size={20} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">No messages yet — say hi!</p>
          </div>
        )}

        <ul className="space-y-1.5">
          {chatMessages.map((msg, index) => {
            const prev = chatMessages[index - 1];
            const showTimestamp = index === 0 || new Date(msg.timestamp) - new Date(prev.timestamp) > 3 * 60 * 1000;
            const isSender = msg.email === email;
            const isFirstFromUser = index === 0 || msg.email !== prev.email;
            const showUsername = !isSender && isFirstFromUser;
            const initials = getInitials(msg.username);
            const avatarColor = generateColor(msg.username);

            return (
              <div key={index}>
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
                            className="w-7 h-7 rounded-full object-cover shadow ring-2 ring-purple-200 dark:ring-purple-500/30" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow ring-2 ring-purple-200 dark:ring-purple-500/30"
                            style={{ background: avatarColor }}>
                            {initials}
                          </div>
                        )
                      ) : <div className="w-7 h-7" />}
                    </div>
                  )}

                  {isSender ? (
                    <div className="flex items-end gap-1.5 max-w-[80%]">
                      {/* Options button */}
                      <div className="relative self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleOptionsMenu(msg.id)}
                          className="p-1.5 rounded-full text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-white/10 transition-colors">
                          <BsThreeDots size={12} />
                        </button>
                        {openMessageId === msg.id && (
                          <div className="absolute bottom-full right-0 mb-1 z-20">
                            <MessageOptionsCard
                              onEdit={() => handleEditMessage(msg)}
                              onDelete={() => handleDeleteMessage(msg.id)}
                            />
                          </div>
                        )}
                      </div>
                      {/* Bubble */}
                      <div className="px-3.5 py-2 rounded-2xl rounded-br-sm text-white text-sm leading-relaxed shadow-md"
                        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 3px 10px rgba(158,47,208,0.30)" }}>
                        <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[80%]">
                      {showUsername && msg.username && msg.username !== "undefined" && (
                        <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-1 ml-1">
                          {msg.username}
                        </p>
                      )}
                      <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm leading-relaxed bg-white dark:bg-white/[0.07] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-white/10 shadow-sm">
                        <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{formatMessageWithLinks(msg.message)}</p>
                      </div>
                    </div>
                  )}
                </li>
              </div>
            );
          })}
        </ul>
      </PerfectScrollbar>

      {/* ── Input ── */}
      <div className="relative flex-shrink-0 p-3 bg-white dark:bg-[#0f0d24] border-t border-gray-100 dark:border-[rgba(158,47,208,0.12)]">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10 focus-within:border-[rgba(158,47,208,0.5)] dark:focus-within:border-[rgba(158,47,208,0.4)] transition-colors">
          <button onClick={() => setShowEmojiPicker((p) => !p)}
            className="flex-shrink-0 text-gray-400 hover:text-[#F6B82E] transition-colors self-end mb-0.5">
            <BsEmojiSmile size={18} />
          </button>
          <textarea
            ref={textareaRef}
            placeholder="Type a message…"
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed py-1"
            style={{ minHeight: "32px", maxHeight: "112px", overflowY: "hidden" }}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 self-end"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}
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

export default CallChatWindow;
