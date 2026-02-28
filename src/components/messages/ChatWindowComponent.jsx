// ChatWindowComponent.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import send from "../../assets/logos/send.png";
import { BsEmojiSmile, BsThreeDots } from "react-icons/bs";
import { FiVideo, FiChevronLeft } from "react-icons/fi";
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

const ChatWindowComponent = ({
  username,
  room,
  studentName,
  email,
  userUrl,
  userId,
  socket,
  onBackClick,
}) => {
  const { t, i18n } = useTranslation();
  const scrollContainerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo.user);

  const { chatMessages, setChatMessages, sendMessage } = useGlobalChat(
    socket, room, username, email, userUrl
  );

  const [message, setMessage] = useState("");
  const { showEmojiPicker, setShowEmojiPicker, handleInput, handleEmojiClick } =
    useChatInputHandler(message, setMessage);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage("");
    const ta = document.querySelector("textarea");
    if (ta) ta.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const { handleDeleteMessage, handleEditMessage, toggleOptionsMenu, openMessageId } =
    useDeleteMessage(setChatMessages, socket, room);

  const { readMessages } = useChatWindow();

  useEffect(() => {
    if (user?.id && room) {
      readMessages(userId, room);
      dispatch(fetchUnreadMessages(user.id));
    }
  }, [room, user?.id, dispatch, userId, readMessages]);

  useEffect(() => {
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }, [chatMessages]);

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

  const handleJoinGeneralClass = () => {
    // Use the chat's own UUID as the Jitsi room name so everyone in this chat
    // lands in the same meeting and the in-call chat shows the same messages.
    navigate("/classroom", {
      state: {
        roomId: room,
        chatRoomId: room,
        userName: user.name,
        email: user.email,
        fromMessage: true,
        chatName: studentName,
      },
    });
  };

  const isGeneralChat = studentName.includes("General Chat ");

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden
                    bg-gray-50 dark:bg-[#0d0a1e] transition-colors duration-300">
      
      {/* Orbs de fondo - solo visibles en dark mode */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block" aria-hidden="true">
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(158,47,208,0.5), transparent 70%)',
            width: '400px',
            height: '400px',
            top: '-10%',
            right: '-5%',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)',
            width: '350px',
            height: '350px',
            bottom: '-5%',
            left: '-5%',
          }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(246,184,46,0.3), transparent 70%)',
            width: '300px',
            height: '300px',
            top: '20%',
            left: '20%',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 py-3 flex-shrink-0
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-b border-gray-200 dark:border-white/10
                      z-10 transition-colors duration-300">
        
        <button
          onClick={onBackClick}
          className="lg:hidden p-1.5 rounded-lg 
                     text-gray-600 dark:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-white/10 
                     transition-colors flex-shrink-0"
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
                        bg-purple-100 dark:bg-purple-500/20 
                        border border-purple-200 dark:border-purple-500/30">
          <FaComments className="text-purple-600 dark:text-purple-400" size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold 
                          text-gray-900 dark:text-white 
                          truncate">
              {studentName}
            </h2>
            {isGeneralChat && (
              <button
                onClick={handleJoinGeneralClass}
                title="Join video class"
                className="text-gray-500 dark:text-gray-400 
                         hover:text-purple-600 dark:hover:text-purple-400 
                         transition-colors flex-shrink-0"
              >
                <FiVideo size={15} />
              </button>
            )}
          </div>
          <span className="text-[11px] font-medium
                         text-emerald-600 dark:text-emerald-400">
            ● {t("chatWindow.activeNow")}
          </span>
        </div>

        <div className="lg:hidden w-8 flex-shrink-0" />
      </div>

      {/* Línea de acento con gradiente */}
      <div className="relative h-[2px] flex-shrink-0 z-10
                      opacity-70 dark:opacity-100"
           style={{ background: 'linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)' }} />

      {/* Área de mensajes */}
      <PerfectScrollbar
        containerRef={(ref) => (scrollContainerRef.current = ref)}
        className="flex-1 relative z-10
                   bg-transparent dark:bg-transparent
                   transition-colors duration-300"
        options={{ suppressScrollX: true }}
      >
        <div className="p-4 sm:p-6">

          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-14 h-14 rounded-full 
                             bg-purple-100 dark:bg-purple-500/20 
                             border border-purple-200 dark:border-purple-500/30 
                             flex items-center justify-center">
                <FaComments className="text-purple-400 dark:text-purple-400" size={24} />
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
              const isSender       = msg.email === email;
              const isFirstFromUser = index === 0 || msg.email !== prev.email;
              const showUsername    = !isSender && isFirstFromUser;

              const initials    = getInitials(msg.username);
              const avatarColor = generateColor(msg.username);

              return (
                <div key={index}>
                  {showTimestamp && (
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                      <span className="text-[10px] font-medium 
                                     text-gray-600 dark:text-gray-300
                                     px-3 py-1 rounded-full
                                     bg-white dark:bg-black/40 
                                     backdrop-blur-sm
                                     border border-gray-200 dark:border-white/10">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
                    </div>
                  )}

                  <li className={`group flex items-end gap-2 mb-1.5 ${isSender ? "justify-end" : "justify-start"}`}>

                    {!isSender && (
                      <div className="flex-shrink-0 w-8 self-end">
                        {isFirstFromUser ? (
                          msg.userUrl ? (
                            <img src={msg.userUrl} alt="avatar"
                              className="w-8 h-8 rounded-full object-cover shadow 
                                       ring-2 ring-purple-200 dark:ring-purple-500/30" />
                          ) : (
                            <div className="w-8 h-8 rounded-full 
                                          flex items-center justify-center 
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
                        <div className="relative self-end mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => toggleOptionsMenu(msg.id)}
                            className="p-1.5 rounded-full 
                                     text-gray-500 dark:text-gray-400 
                                     hover:text-purple-600 dark:hover:text-purple-400
                                     hover:bg-purple-50 dark:hover:bg-white/10 
                                     transition-colors duration-150"
                          >
                            <BsThreeDots size={14} />
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

                        {/* Burbuja del remitente */}
                        <div
                          className="px-4 py-2.5 rounded-2xl rounded-br-sm
                                   text-white text-sm leading-relaxed
                                   shadow-lg"
                          style={{
                            background: "linear-gradient(135deg, #9E2FD0 0%, #7b22a8 100%)",
                          }}
                        >
                          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {formatMessageWithLinks(msg.message)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Burbuja del receptor */
                      <div className="max-w-[75%] sm:max-w-[60%]">
                        {showUsername && msg.username && msg.username !== "undefined" && (
                          <p className="text-[11px] font-semibold
                                      text-purple-600 dark:text-purple-400
                                      mb-1 ml-1">
                            {msg.username}
                          </p>
                        )}
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm
                                      text-sm leading-relaxed
                                      bg-white dark:bg-white/5
                                      text-gray-800 dark:text-gray-100
                                      border border-gray-200 dark:border-white/10
                                      shadow-sm dark:shadow-none">
                          <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {formatMessageWithLinks(msg.message)}
                          </p>
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

      {/* Input bar */}
      <div className="relative flex-shrink-0 px-3 sm:px-5 py-3 z-10
                      bg-white dark:bg-black/40 backdrop-blur-xl
                      border-t border-gray-200 dark:border-white/10
                      transition-colors duration-300">
        <div className="flex items-end gap-2
                        bg-gray-50 dark:bg-black/40 
                        rounded-2xl px-3 py-2
                        border border-gray-200 dark:border-white/10
                        focus-within:border-purple-400 dark:focus-within:border-purple-500/50 
                        transition-colors duration-200">
          
          <button
            onClick={() => setShowEmojiPicker((p) => !p)}
            className="flex-shrink-0 p-1.5 rounded-lg self-end mb-0.5
                       text-gray-500 dark:text-gray-400 
                       hover:text-amber-600 dark:hover:text-amber-400 
                       transition-colors duration-150"
          >
            <BsEmojiSmile size={19} />
          </button>

          <textarea
            placeholder={t("chatWindow.typePlaceholder")}
            value={message}
            onChange={handleInput}
            onClick={() => dispatch(fetchUnreadMessages(user.id))}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none
                       text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       max-h-32 leading-relaxed py-1.5"
          />

          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                       self-end transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       hover:scale-105 active:scale-95
                       text-white"
            style={{
              background: message.trim()
                ? "linear-gradient(135deg, #9E2FD0, #7b22a8)"
                : "#9E2FD0",
              opacity: message.trim() ? 1 : 0.3,
            }}
          >
            <img src={send} alt="send" className="w-4 h-4 brightness-200" />
          </button>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2 z-20">
            <div className="bg-white dark:bg-[#1a1a2e] 
                          rounded-2xl 
                          border border-gray-200 dark:border-white/10 
                          overflow-hidden
                          shadow-xl">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindowComponent;