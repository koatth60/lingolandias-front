import { useTranslation } from "react-i18next";
import { FiX, FiMail, FiMessageSquare } from "react-icons/fi";

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

const ProfileCard = ({ user, onClose, onMessage, isSelf }) => {
  const { t } = useTranslation();
  if (!user) return null;

  const isOnline = user.online === "online";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute w-40 h-40 rounded-full bg-[#9E2FD0]/15 blur-3xl -top-16 -left-16" />
          <div className="absolute w-40 h-40 rounded-full bg-[#F6B82E]/10 blur-3xl -bottom-16 -right-16" />
        </div>

        <div className="relative z-10 p-6 flex flex-col items-center text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <FiX size={18} />
          </button>

          <div className="relative mb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover shadow-lg ring-4 ring-[#9E2FD0]/15" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-[#9E2FD0]/15"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
              >
                {getInitials(user.name, user.lastName)}
              </div>
            )}
            <span
              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0d0a1e] ${
                isOnline ? "bg-[#26D9A1]" : "bg-gray-400 dark:bg-gray-600"
              }`}
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {user.name} {user.lastName}
          </h3>
          {user.role && (
            <span className="mt-1 inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#9E2FD0]/10 text-[#9E2FD0] dark:bg-[#9E2FD0]/20">
              {t(ROLE_LABEL_KEY[user.role] || "profileCard.roleStudent")}
            </span>
          )}

          <div className="mt-4 w-full space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <FiMail size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{user.email}</span>
            </div>
          </div>

          {!isSelf && (
            <button
              onClick={() => onMessage(user)}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 15px rgba(158,47,208,0.3)" }}
            >
              <FiMessageSquare size={15} />
              {t("profileCard.sendMessage")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
