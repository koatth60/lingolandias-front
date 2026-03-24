import { useState, useMemo, memo } from "react";
import PropTypes from "prop-types";
import { FaComments, FaUsers, FaUserFriends } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const TYPE_META = {
  teacher: {
    wrap: "bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/15",
    icon: "text-[#9E2FD0]",
    dot:  "bg-[#9E2FD0]",
    chipKey: "messagesExtra.chipTeacher",
    chipStyle: "bg-[#9E2FD0]/10 text-[#9E2FD0] dark:bg-[#9E2FD0]/20",
  },
  group: {
    wrap: "bg-[#F6B82E]/10 dark:bg-[#F6B82E]/15",
    icon: "text-[#F6B82E]",
    dot:  "bg-[#F6B82E]",
    chipKey: "messagesExtra.chipGroup",
    chipStyle: "bg-[#F6B82E]/10 text-[#d4a017] dark:bg-[#F6B82E]/15 dark:text-[#F6B82E]",
  },
  general: {
    wrap: "bg-[#26D9A1]/10 dark:bg-[#26D9A1]/15",
    icon: "text-[#26D9A1]",
    dot:  "bg-[#26D9A1]",
    chipKey: "messagesExtra.chipGeneral",
    chipStyle: "bg-[#26D9A1]/10 text-[#1aad82] dark:bg-[#26D9A1]/15 dark:text-[#26D9A1]",
  },
};

const ChatIcon = ({ type }) => {
  if (type === "teacher") return <FaUsers size={18} />;
  if (type === "group")   return <FaUserFriends size={18} />;
  return <FaComments size={18} />;
};

const formatTime = (ts, t) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d >= today) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d >= yesterday) return t("common.yesterday");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ChatListComponent = ({ chats, onChatSelect, newMessage, setNewMessage, socket, selectedChatId, lastMessages = {} }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => chats.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [chats, search]
  );

  const getMeta = (type) => TYPE_META[type] ?? TYPE_META.general;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#16131f] border-r border-gray-100 dark:border-white/5">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full bg-[#9E2FD0]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white">
            {t("messagesExtra.chatsHeader")}
          </h2>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/20 text-[#9E2FD0]">
            {chats.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600"
            size={13}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("messages.search")}
            className="w-full text-xs py-2 pl-8 pr-3 rounded-xl
                       bg-gray-50 dark:bg-[#1e1b35]
                       border border-gray-200 dark:border-white/5
                       text-gray-700 dark:text-gray-300
                       placeholder-gray-400 dark:placeholder-gray-600
                       outline-none focus:border-[#9E2FD0]/50 transition-colors"
          />
        </div>
      </div>

      {/* ── List ── */}
      <ul className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2 space-y-0.5">
        {filtered.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-12 text-gray-400 dark:text-gray-600">
            <FaComments size={28} className="opacity-30" />
            <span className="text-xs">{t("messages.noConversations")}</span>
          </li>
        )}

        {filtered.map((chat) => {
          const meta = getMeta(chat.type);
          const unread = chat.unreadCount || 0;
          const isActive = chat.id === selectedChatId;
          const lastMsg = lastMessages[chat.id];

          return (
            <li
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
                         transition-all duration-150 active:scale-[0.99]
                         ${isActive
                           ? "bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/15 border border-[#9E2FD0]/25 dark:border-[#9E2FD0]/30"
                           : "hover:bg-purple-50 dark:hover:bg-white/[0.04] border border-transparent"
                         }`}
            >
              {/* Icon avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105 ${meta.wrap}`}>
                  <span className={meta.icon}>
                    <ChatIcon type={chat.type} />
                  </span>
                </div>
                {/* Online dot */}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#16131f] ${meta.dot}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                {/* Row 1: name + timestamp */}
                <div className="flex items-center justify-between gap-1">
                  <p className={`text-sm font-medium leading-tight truncate ${isActive ? "text-[#9E2FD0] dark:text-purple-300" : "text-gray-700 dark:text-white"}`}>
                    {chat.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {lastMsg?.timestamp && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {formatTime(lastMsg.timestamp, t)}
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#9E2FD0] text-white text-[9px] font-bold px-1">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: last message preview OR chip + status */}
                {lastMsg?.content ? (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {lastMsg.sender ? (
                      <span className="font-medium text-gray-600 dark:text-gray-300">{lastMsg.sender}: </span>
                    ) : null}
                    {lastMsg.content}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${meta.chipStyle}`}>
                      {t(meta.chipKey)}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

ChatListComponent.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["general", "teacher", "group"]).isRequired,
    })
  ).isRequired,
  onChatSelect: PropTypes.func.isRequired,
  selectedChatId: PropTypes.string,
  lastMessages: PropTypes.object,
};

export default memo(ChatListComponent);
