import { useState } from "react";
import PropTypes from "prop-types";
import { FaComments, FaUsers, FaUserFriends } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

const TYPE_META = {
  teacher: {
    wrap: "bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/15",
    icon: "text-[#9E2FD0]",
    dot:  "bg-[#9E2FD0]",
    chip: "Teachers",
    chipStyle: "bg-[#9E2FD0]/10 text-[#9E2FD0] dark:bg-[#9E2FD0]/20",
  },
  group: {
    wrap: "bg-[#F6B82E]/10 dark:bg-[#F6B82E]/15",
    icon: "text-[#F6B82E]",
    dot:  "bg-[#F6B82E]",
    chip: "My Group",
    chipStyle: "bg-[#F6B82E]/10 text-[#d4a017] dark:bg-[#F6B82E]/15 dark:text-[#F6B82E]",
  },
  general: {
    wrap: "bg-[#26D9A1]/10 dark:bg-[#26D9A1]/15",
    icon: "text-[#26D9A1]",
    dot:  "bg-[#26D9A1]",
    chip: "General",
    chipStyle: "bg-[#26D9A1]/10 text-[#1aad82] dark:bg-[#26D9A1]/15 dark:text-[#26D9A1]",
  },
};

const ChatIcon = ({ type }) => {
  if (type === "teacher") return <FaUsers size={18} />;
  if (type === "group")   return <FaUserFriends size={18} />;
  return <FaComments size={18} />;
};

const ChatListComponent = ({ chats, onChatSelect, newMessage, setNewMessage, socket }) => {
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getMeta = (type) => TYPE_META[type] ?? TYPE_META.general;

  const getStatusText = (chat) => {
    if (chat.type === "group") return "Active group";
    return chat.online ? "Active now" : "Last seen recently";
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#16131f] border-r border-gray-100 dark:border-white/5">

      {/* ── Header ── */}
      <div className="px-4 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2 mb-3">
          {/* Purple accent bar */}
          <span className="w-1 h-5 rounded-full bg-[#9E2FD0]" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white">
            Chats
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
            placeholder="Search…"
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
            <span className="text-xs">No conversations found</span>
          </li>
        )}

        {filtered.map((chat) => {
          const meta = getMeta(chat.type);
          const unread = chat.unreadCount || 0;

          return (
            <li
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
                         transition-all duration-150
                         hover:bg-purple-50 dark:hover:bg-white/[0.04]
                         active:scale-[0.99]"
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
                <div className="flex items-start justify-between gap-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-white leading-tight truncate">
                    {chat.name}
                  </p>
                  {unread > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#9E2FD0] text-white text-[9px] font-bold px-1 mt-0.5">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${meta.chipStyle}`}>
                    {meta.chip}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 truncate">
                    {getStatusText(chat)}
                  </span>
                </div>
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
      online: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["general", "teacher", "group"]).isRequired,
    })
  ).isRequired,
  onChatSelect: PropTypes.func.isRequired,
};

export default ChatListComponent;
