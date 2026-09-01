import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiUsers, FiEdit2, FiCheck, FiUserPlus, FiSearch } from "react-icons/fi";
import useUserSearch from "../../hooks/useUserSearch";
import AvatarPicker from "./AvatarPicker";

const getInitials = (name, lastName) => {
  const a = (name || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

const ROLE_LABEL_KEY = {
  admin: "profileCard.roleAdmin",
  teacher: "profileCard.roleTeacher",
  user: "profileCard.roleStudent",
};

// Legacy fixed rooms (general/teacher/support) are read-only — membership is
// rule-based (language/role), not something a user manages by hand.
const CAN_MANAGE_TYPES = ["dm", "group"];

const GroupMembersModal = ({
  chatType,
  groupName,
  groupAvatarUrl,
  members,
  currentUserId,
  onClose,
  onViewProfile,
  onRename,
  onChangeAvatar,
  onAddMember,
}) => {
  const { t } = useTranslation();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(groupName || "");
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [query, setQuery] = useState("");
  const [shareHistory, setShareHistory] = useState(true);
  const { results, loading } = useUserSearch(query, currentUserId);
  const existingMemberIds = new Set(members.map((m) => m.id));

  const canManage = CAN_MANAGE_TYPES.includes(chatType);

  const submitRename = () => {
    if (nameInput.trim() && nameInput.trim() !== groupName) onRename(nameInput.trim());
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />

        <div className="relative z-10 p-5 flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-1 flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {chatType === "group" ? (
                <AvatarPicker value={groupAvatarUrl} onChange={onChangeAvatar} size={32} align="start" />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F6B82E]/15 flex-shrink-0">
                  <FiUsers size={15} className="text-[#F6B82E]" />
                </div>
              )}
              {editingName ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitRename()}
                    className="flex-1 min-w-0 text-sm px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-[#9E2FD0]/30 text-gray-900 dark:text-white outline-none"
                  />
                  <button onClick={submitRename} className="p-1.5 rounded-lg text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                    <FiCheck size={13} />
                  </button>
                </div>
              ) : (
                <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{groupName}</h2>
              )}
              {!editingName && canManage && (
                <button onClick={() => { setNameInput(groupName || ""); setEditingName(true); }} className="p-1 rounded-lg text-gray-400 hover:text-[#9E2FD0] flex-shrink-0">
                  <FiEdit2 size={13} />
                </button>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0">
              <FiX size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3 flex-shrink-0">
            {t("messagesExtra.membersCount", { count: members.length })}
          </p>

          {!showAddPeople ? (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => onViewProfile(m.id)}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                        {getInitials(m.name, m.lastName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">
                        {m.name} {m.lastName}
                        {m.memberRole === "owner" && (
                          <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F6B82E]/15 text-[#d4a017] dark:text-[#F6B82E]">
                            {t("messagesExtra.groupOwner")}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400">{t(ROLE_LABEL_KEY[m.role] || "profileCard.roleStudent")}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.online === "online" ? "bg-[#26D9A1]" : "bg-gray-300 dark:bg-gray-600"}`} />
                  </div>
                ))}
              </div>
              {canManage && (
                <button
                  onClick={() => setShowAddPeople(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 15px rgba(158,47,208,0.3)" }}
                >
                  <FiUserPlus size={15} />
                  {t("messagesExtra.addPeople")}
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="relative mb-2 flex-shrink-0">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("messagesExtra.searchMembersPlaceholder")}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0]"
                />
              </div>

              <label className="flex items-center gap-2 mb-2 px-1 text-xs text-gray-600 dark:text-gray-300 flex-shrink-0 cursor-pointer">
                <input type="checkbox" checked={shareHistory} onChange={(e) => setShareHistory(e.target.checked)} className="accent-[#9E2FD0]" />
                {t("messagesExtra.shareHistoryToggle")}
              </label>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
                {loading && <p className="text-xs text-gray-400 text-center py-4">{t("messagesExtra.searching")}</p>}
                {!loading && query.trim().length >= 2 && results.filter((u) => !existingMemberIds.has(u.id)).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">{t("messagesExtra.noResults")}</p>
                )}
                {results.filter((u) => !existingMemberIds.has(u.id)).map((u) => (
                  <div
                    key={u.id}
                    onClick={() => { onAddMember(u.id, shareHistory); setShowAddPeople(false); setQuery(""); }}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                        {getInitials(u.name, u.lastName)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{u.name} {u.lastName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAddPeople(false)}
                className="mt-3 w-full py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex-shrink-0"
              >
                {t("messagesExtra.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
