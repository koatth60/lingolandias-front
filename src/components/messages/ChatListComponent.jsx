import { useState, useMemo, memo, useEffect } from "react";
import PropTypes from "prop-types";
import { FaComments } from "react-icons/fa";
import { FiSearch, FiPlus, FiUserPlus, FiMoreVertical, FiBellOff, FiBell, FiTrash2, FiAlertTriangle } from "react-icons/fi";
import { BsPinAngleFill, BsPinAngle } from "react-icons/bs";
import { useTranslation } from "react-i18next";
import useUserSearch from "../../hooks/useUserSearch";

// Tinted avatar + chip per chat type. Groups get a square avatar, people a
// round one (see the list item below), so the two read apart without labels.
const TYPE_META = {
  teacher: { tile: "bg-ll-violet-tint text-ll-violet-ink", chipKey: "messagesExtra.chipTeacher" },
  group:   { tile: "bg-ll-gold-tint text-ll-gold-ink",     chipKey: "messagesExtra.chipGroup" },
  general: { tile: "bg-ll-teal-tint text-ll-teal-ink",     chipKey: "messagesExtra.chipGeneral" },
  support: { tile: "bg-ll-teal-tint text-ll-teal-ink",     chipKey: "messagesExtra.chipGeneral" },
  dm:      { tile: "bg-ll-hover text-ll-ink2",             chipKey: "messagesExtra.chipDm" },
};

const getInitials = (name) => {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
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

const ChatListComponent = ({
  chats,
  onChatSelect,
  selectedChatId,
  currentUserId,
  currentUserRole,
  onStartChatWithUser,
  onNewGroup,
  onTogglePin,
  onToggleMute,
  onDeleteChat,
  onDeleteGroup,
  hasMoreChats,
  loadingMoreChats,
  onLoadMoreChats,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!openMenuId) return;
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [openMenuId]);
  const { results: rawPeopleResults, loading: peopleLoading } = useUserSearch(search, currentUserId);

  // Teams-style: if a DM with this person already exists, it's just a chat
  // in the list below — don't also show them as a separate "start new chat"
  // result, that reads as a confusing duplicate.
  const existingDmUserIds = useMemo(
    () => new Set(chats.filter((c) => c.type === "dm" && c.otherUser).map((c) => c.otherUser.id)),
    [chats]
  );
  const peopleResults = useMemo(
    () => rawPeopleResults.filter((p) => !existingDmUserIds.has(p.id)),
    [rawPeopleResults, existingDmUserIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) => (c.name || "").toLowerCase().includes(q) || (c.otherUser?.email || "").toLowerCase().includes(q)
    );
  }, [chats, search]);

  const getMeta = (type) => TYPE_META[type] ?? TYPE_META.general;
  const showPeopleResults = search.trim().length >= 2;

  return (
    <div className="h-full flex flex-col bg-ll-panel">

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 flex flex-col gap-3 border-b border-ll-line">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ll-ink">
            {t("messagesExtra.chatsHeader")}
          </h2>
          <span className="font-mono text-[11.5px] px-1.5 py-px rounded-[5px] bg-ll-hover text-ll-ink3">
            {chats.length}
          </span>
          <button
            onClick={onNewGroup}
            title={t("messagesExtra.newGroupTitle")}
            className="ml-auto w-[30px] h-[30px] grid place-items-center rounded-[7px] border border-ll-line text-ll-ink2
                       hover:bg-ll-hover hover:text-ll-ink transition-colors"
          >
            <FiPlus size={16} />
          </button>
        </div>

        {/* Search — filters chats AND finds new people to message */}
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3 pointer-events-none"
            size={15}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("messagesExtra.searchPeoplePlaceholder")}
            className="w-full h-[34px] text-[13px] pl-9 pr-3 rounded-[9px]
                       bg-ll-panel border border-ll-line2 text-ll-ink placeholder:text-ll-ink3
                       outline-none focus:border-ll-violet/60 transition-colors"
          />
        </div>
      </div>

      {/* ── People search results ── */}
      {showPeopleResults && (
        <div className="flex-shrink-0 border-b border-ll-line max-h-48 overflow-y-auto custom-scrollbar">
          {peopleLoading && (
            <p className="text-[12px] text-ll-ink3 text-center py-3">{t("messagesExtra.searching")}</p>
          )}
          {!peopleLoading && peopleResults.length === 0 && (
            <p className="text-[12px] text-ll-ink3 text-center py-3">{t("messagesExtra.noResults")}</p>
          )}
          {peopleResults.map((person) => (
            <div
              key={person.id}
              onClick={() => onStartChatWithUser(person)}
              className="flex items-center gap-2.5 px-4 py-2 cursor-pointer hover:bg-ll-hover transition-colors"
            >
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt={person.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 bg-ll-hover text-ll-ink2">
                  {getInitials(`${person.name} ${person.lastName}`)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ll-ink truncate">{person.name} {person.lastName}</p>
                <p className="text-[11.5px] text-ll-ink3 truncate">{person.email}</p>
              </div>
              <FiUserPlus size={14} className="text-ll-ink3 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* ── List ── */}
      <ul className="flex-1 overflow-y-auto custom-scrollbar py-1.5 px-1.5">
        {isLoading && (
          Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-ll-hover flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-ll-hover" />
                <div className="h-2.5 w-1/2 rounded bg-ll-subtle" />
              </div>
            </li>
          ))
        )}

        {!isLoading && filtered.length === 0 && !showPeopleResults && (
          <li className="flex flex-col items-center gap-2 py-12 text-ll-ink3">
            <FaComments size={28} className="opacity-30" />
            <span className="text-xs">{t("messages.noConversations")}</span>
          </li>
        )}

        {!isLoading && filtered.map((chat) => {
          const meta = getMeta(chat.type);
          const unread = chat.unreadCount || 0;
          const isActive = chat.id === selectedChatId;
          const lastMsg = chat.lastMessage;
          const isOnline = chat.type === "dm" && chat.otherUser?.online === "online";
          const isManageable = chat.type === "dm" || chat.type === "group";

          return (
            <li
              key={chat.id || "draft"}
              onClick={() => { onChatSelect(chat); setOpenMenuId(null); }}
              className={`group relative flex items-center gap-[11px] px-3 py-2 rounded-[9px] cursor-pointer transition-colors
                         ${openMenuId === chat.id ? "z-40" : ""}
                         ${isActive ? "bg-ll-violet-tint" : "hover:bg-ll-hover"}`}
            >
              {/* Avatar — round for a person, square for a group */}
              <div className="relative flex-shrink-0">
                {(chat.type === "dm" || chat.type === "group") && chat.avatarUrl ? (
                  <img src={chat.avatarUrl} alt={chat.name}
                    className={`w-9 h-9 object-cover ${chat.type === "dm" ? "rounded-full" : "rounded-[10px]"}`} />
                ) : (
                  <div className={`w-9 h-9 flex items-center justify-center text-[11.5px] font-semibold
                                  ${chat.type === "dm" ? "rounded-full" : "rounded-[10px]"}
                                  ${isActive && chat.type === "dm" ? "bg-ll-panel text-ll-ink2" : meta.tile}`}>
                    {getInitials(chat.name)}
                  </div>
                )}
                {chat.type === "dm" && isOnline && (
                  <span className={`absolute -right-px -bottom-px w-2.5 h-2.5 rounded-full bg-ll-teal ring-2
                                   ${isActive ? "ring-[rgb(var(--ll-violet-tint))]" : "ring-[rgb(var(--ll-panel))]"}`} />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                {/* Row 1: name + timestamp */}
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`flex items-center gap-1 text-[13.5px] leading-tight truncate text-ll-ink ${
                      unread > 0 || isActive ? "font-semibold" : "font-medium"
                    }`}>
                    {chat.pinned && <BsPinAngleFill size={10} className="text-ll-gold flex-shrink-0" />}
                    {chat.muted && <FiBellOff size={10} className="text-ll-ink3 flex-shrink-0" />}
                    <span className="truncate">{chat.name}</span>
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {lastMsg?.timestamp && (
                      <span className="font-mono text-[10.5px] text-ll-ink3">
                        {formatTime(lastMsg.timestamp, t)}
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-ll-violet text-ll-on-violet text-[10px] font-semibold px-1">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                    {!chat.isDraft && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId((id) => (id === chat.id ? null : chat.id)); }}
                        className="p-0.5 rounded-md text-ll-ink4 hover:text-ll-ink hover:bg-ll-panel transition-colors"
                      >
                        <FiMoreVertical size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: last message preview OR chip + status */}
                {lastMsg?.content ? (
                  <p className="text-[12.5px] text-ll-ink3 truncate mt-px">
                    {chat.type !== "dm" && lastMsg.username ? (
                      <span className="text-ll-ink2">{lastMsg.username}: </span>
                    ) : null}
                    {/* Plain-text preview, so @[Name](id) mention markup is
                        stripped down to "@Name" instead of showing raw text. */}
                    {lastMsg.content.replace(/@\[([^\]]+)\]\([0-9a-f-]{36}\)/g, "@$1")}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block text-[11px] font-medium px-1.5 py-px rounded-full ${meta.tile}`}>
                      {t(meta.chipKey)}
                    </span>
                  </div>
                )}
              </div>

              {/* Pin / mute / delete menu — chat.id is null for a draft, same
                  as openMenuId's unset default, so this must also check
                  !chat.isDraft or a fresh draft would render "open" by
                  coincidence before anyone ever clicked its (hidden) button. */}
              {!chat.isDraft && openMenuId === chat.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-2 top-11 z-30 w-44 p-1 rounded-lg shadow-ll-pop border border-ll-line bg-ll-panel"
                >
                  <button
                    onClick={() => { onTogglePin?.(chat); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-ll-ink hover:bg-ll-hover"
                  >
                    {chat.pinned ? <BsPinAngleFill size={13} /> : <BsPinAngle size={13} />} {chat.pinned ? t("messagesExtra.unpin") : t("messagesExtra.pin")}
                  </button>
                  <button
                    onClick={() => { onToggleMute?.(chat); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-ll-ink hover:bg-ll-hover"
                  >
                    {chat.muted ? <FiBell size={13} /> : <FiBellOff size={13} />}
                    {chat.muted ? t("messagesExtra.unmute") : t("messagesExtra.mute")}
                  </button>
                  {isManageable && (
                    <button
                      onClick={() => { onDeleteChat?.(chat); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] text-red-500 hover:bg-red-500/10"
                    >
                      <FiTrash2 size={13} /> {t("messagesExtra.deleteChat")}
                    </button>
                  )}
                  {chat.type === "group" && (!chat.linkedToSchedule || currentUserRole === "teacher") && (
                    <button
                      onClick={() => { onDeleteGroup?.(chat); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      <FiAlertTriangle size={13} /> {t("messagesExtra.deleteGroup")}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasMoreChats && !showPeopleResults && (
        <div className="flex-shrink-0 px-3 py-2 border-t border-ll-line">
          <button
            onClick={onLoadMoreChats}
            disabled={loadingMoreChats}
            className="w-full h-8 text-[12.5px] font-medium rounded-[7px] text-ll-ink2 border border-ll-line2
                       hover:bg-ll-hover hover:text-ll-ink transition-colors disabled:opacity-50"
          >
            {loadingMoreChats ? t("messagesExtra.searching") : t("messagesExtra.loadMoreChats")}
          </button>
        </div>
      )}
    </div>
  );
};

ChatListComponent.propTypes = {
  chats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["general", "teacher", "group", "dm", "support"]).isRequired,
    })
  ).isRequired,
  onChatSelect: PropTypes.func.isRequired,
  selectedChatId: PropTypes.string,
  currentUserId: PropTypes.string,
  currentUserRole: PropTypes.string,
  onStartChatWithUser: PropTypes.func,
  onNewGroup: PropTypes.func,
  onDeleteGroup: PropTypes.func,
};

export default memo(ChatListComponent);
