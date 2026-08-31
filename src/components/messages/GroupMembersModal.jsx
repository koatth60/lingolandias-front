import { useTranslation } from "react-i18next";
import { FiX, FiUsers } from "react-icons/fi";

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

const GroupMembersModal = ({ groupName, members, onClose, onViewProfile }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden max-h-[75vh] flex flex-col"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />

        <div className="relative z-10 p-5 flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F6B82E]/15">
                <FiUsers size={15} className="text-[#F6B82E]" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[160px]">{groupName}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
              <FiX size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3 flex-shrink-0">
            {t("messagesExtra.membersCount", { count: members.length })}
          </p>

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
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
