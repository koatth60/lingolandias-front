import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import ChatWindow from "../chatWindow";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessagesForTeacher } from "../../redux/chatSlice";
import { useTranslation } from "react-i18next";
import {
  FiEdit,
  FiUsers,
  FiVideo,
  FiXCircle,
  FiMessageSquare,
} from "react-icons/fi";
import Dropdown from "../schedule/Dropdown";
import { meetingRooms } from "../../constants";

const ChatList = ({
  chats,
  onChatSelect,
  user,
  handleJoinMeeting,
  setEditingEvent,
  editingEvent,
  loading,
}) => {
  const { t, i18n } = useTranslation();
  const lastMessagesByRoom = useSelector(
    (state) => state.chat.lastMessagesByRoom
  );
  const unreadCountsByRoom = useSelector(
    (state) => state.chat.unreadCountsByRoom
  );

  const getDisplayDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate >= today) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (messageDate >= yesterday) {
      return t("common.yesterday");
    } else {
      return messageDate.toLocaleDateString(i18n.language, {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getInitials = (name, lastName) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  };

  const generateColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 75%, 60%)`;
    return color;
  };

  const sortedChats = chats.slice().sort((a, b) => {
    const aMsg = lastMessagesByRoom[a.id];
    const bMsg = lastMessagesByRoom[b.id];
    if (!aMsg && !bMsg) return 0;
    if (!aMsg) return 1;
    if (!bMsg) return -1;
    return new Date(bMsg.timestamp).getTime() - new Date(aMsg.timestamp).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative flex-shrink-0">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80" />

        {/* Light bg */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,255,0.95) 100%)",
          }}
        />
        {/* Dark bg */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(135deg, rgba(13,10,30,0.85) 0%, rgba(26,26,46,0.85) 100%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20 mt-[2px]">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                boxShadow: "0 2px 8px rgba(158,47,208,0.35)",
              }}
            >
              <FiMessageSquare size={14} className="text-white" />
            </div>
            <span className="text-sm font-extrabold login-gradient-text whitespace-nowrap">
              {t("chatList.messages")}
            </span>
          </div>

          <Dropdown
            buttonText={t("common.actions")}
            buttonClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-85"
            buttonStyle={{
              background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
              boxShadow: "0 2px 8px rgba(158,47,208,0.35)",
            }}
          >
            {(user.role === "teacher" || user.role === "admin") && (
              <button
                onClick={() => {
                  setEditingEvent((prev) => !prev);
                  if (!editingEvent) {
                    Swal.fire({
                      title: t("chatList.editModeTitle"),
                      text: t("chatList.editModeText"),
                      icon: "info",
                      confirmButtonText: t("chatList.editModeConfirm"),
                      background: "#1a1a2e",
                      color: "#fff",
                      confirmButtonColor: "#9E2FD0",
                    });
                  }
                }}
                className="block w-full text-left px-4 py-2 text-sm font-semibold text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                role="menuitem"
              >
                {editingEvent ? (
                  <>
                    <FiXCircle className="mr-2" /> {t("chatList.cancelEdit")}
                  </>
                ) : (
                  <>
                    <FiEdit className="mr-2" /> {t("chatList.editCalendar")}
                  </>
                )}
              </button>
            )}
            {(user.role === "teacher" || user.role === "user") && (
              <button
                onClick={() => handleJoinMeeting()}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                role="menuitem"
              >
                <FiUsers className="mr-2" /> {t("chatList.groupClass")}
              </button>
            )}
            {!loading &&
              (user.role === "teacher" || user.role === "admin") &&
              Object.entries(meetingRooms).map(([lang, roomName]) => {
                const shouldRender =
                  user.role === "admin" ||
                  (user.role === "teacher" && user.language.includes(lang));
                if (!shouldRender) return null;

                return (
                  <button
                    key={lang}
                    onClick={() => handleJoinMeeting(roomName)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                    role="menuitem"
                  >
                    <FiVideo className="mr-2" /> {roomName}
                  </button>
                );
              })}
          </Dropdown>
        </div>
      </div>

      {/* Chat list */}
      <ul
        className="flex-1 overflow-y-auto py-1 px-2"
        style={{ overscrollBehaviorY: "contain" }}
      >
        {sortedChats.map((chat, index) => {
            const lastMessage = lastMessagesByRoom[chat.id];
            const unreadCount = unreadCountsByRoom[chat.id] || 0;
            const displayDate = lastMessage?.timestamp
              ? getDisplayDate(lastMessage.timestamp)
              : null;
            const initials = getInitials(chat.name, chat.lastName);
            const avatarColor = generateColor(chat.name);

            return (
              <li
                key={chat.id}
                className="relative px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-[#9E2FD0]/5 dark:hover:bg-[#9E2FD0]/8 hover:border hover:border-[#9E2FD0]/20 border border-transparent"
                onClick={() => onChatSelect(chat)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {chat.avatarUrl ? (
                      <img
                        src={chat.avatarUrl}
                        alt={`${chat.name} ${chat.lastName}`}
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#9E2FD0]/20"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                    )}
                    {chat.online === "online" && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0d0a1e]"
                        style={{ backgroundColor: "#26D9A1" }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight truncate">
                        {chat.name} {chat.lastName}
                      </h3>
                      {displayDate && (
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {displayDate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5 gap-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {lastMessage ? (
                          lastMessage.type === "file" ? (
                            <span className="text-[#9E2FD0] font-medium">
                              📎 {t("chatList.fileAttachment")}
                            </span>
                          ) : (
                            lastMessage.content
                          )
                        ) : (
                          <span className="italic text-gray-400 dark:text-gray-600">
                            {t("chatList.noMessages")}
                          </span>
                        )}
                      </p>
                      {unreadCount > 0 && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white flex-shrink-0"
                          style={{
                            background: "linear-gradient(135deg, #26D9A1, #1fa07a)",
                            boxShadow: "0 2px 6px rgba(38,217,161,0.4)",
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider — hidden on last item */}
                {index < sortedChats.length - 1 && (
                  <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/15 to-transparent" />
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
};

ChatList.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string,
      name: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      online: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChatSelect: PropTypes.func.isRequired,
};

const MainChat = ({
  user,
  username,
  teacherChat,
  email,
  handleJoinMeeting,
  setEditingEvent,
  editingEvent,
  loading,
}) => {
  const dispatch = useDispatch();
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    dispatch(fetchMessagesForTeacher());
  }, [dispatch]);

  return (
    /* Glassmorphism container matching calendar card */
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        height: "630px",
        border: "1px solid rgba(158,47,208,0.15)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
      }}
    >
      {/* Light mode glass */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        }}
      />
      {/* Dark mode glass */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "rgba(13,10,30,0.65)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {!selectedChat ? (
          <ChatList
            chats={teacherChat}
            onChatSelect={setSelectedChat}
            user={user}
            handleJoinMeeting={handleJoinMeeting}
            setEditingEvent={setEditingEvent}
            editingEvent={editingEvent}
            loading={loading}
          />
        ) : (
          <ChatWindow
            username={username}
            email={email}
            room={selectedChat.id}
            studentName={selectedChat.name}
            onBack={() => setSelectedChat(null)}
          />
        )}
      </div>
    </div>
  );
};

MainChat.propTypes = {
  username: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  teacherChat: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      avatarUrl: PropTypes.string,
      name: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      online: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default MainChat;
