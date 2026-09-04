import { useTranslation } from "react-i18next";
import { FiX, FiMail, FiMessageSquare, FiMapPin, FiBookOpen } from "react-icons/fi";

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

// Matches the role-color convention used across the app (profile.jsx hero
// card, admin badges, etc.) so the same role always reads the same color.
const ROLE_GRADIENT = {
  teacher: "linear-gradient(135deg, #26D9A1, #1fa07a)",
  admin: "linear-gradient(135deg, #F6B82E, #d49c1f)",
  user: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
};

// Same language <-> color/flag mapping as DisplayAllStudents' LANG_CONFIG and
// userModal's language picker, kept in sync deliberately for recognizability.
const LANGUAGE_META = {
  english: { flag: "🇬🇧", color: "#9E2FD0" },
  spanish: { flag: "🇪🇸", color: "#26D9A1" },
  polish: { flag: "🇵🇱", color: "#F6B82E" },
};

const ProfileCard = ({ user, onClose, onMessage, isSelf }) => {
  const { t } = useTranslation();
  if (!user) return null;

  const isOnline = user.online === "online";
  const roleGradient = ROLE_GRADIENT[user.role] || ROLE_GRADIENT.user;
  const langMeta = user.language ? LANGUAGE_META[user.language] : null;
  const location = [user.city, user.country].filter(Boolean).join(", ");
  const languageLabel =
    user.role === "teacher" ? "profileCard.teaches" : "profileCard.learning";
  // classesCount is computed server-side (getPublicProfile) — real data only.
  // createdAt is null for accounts created before this field existed, so we
  // simply hide "member since" rather than guess a date.
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "#151530" }} />

        {/* Cover banner — the person's own cover photo if they set one,
            otherwise the role-colored gradient fallback */}
        <div
          className="relative h-24 overflow-hidden"
          style={
            user.coverUrl
              ? { backgroundImage: `url(${user.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: roleGradient }
          }
        >
          {!user.coverUrl && (
            <>
              <div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25), transparent 60%)" }} />
              <div className="absolute w-32 h-32 rounded-full bg-white/10 blur-2xl -top-10 -right-6" />
              <div className="absolute w-24 h-24 rounded-full bg-black/10 blur-2xl -bottom-10 -left-6" />
            </>
          )}
          {user.coverUrl && <div className="absolute inset-0 bg-black/15" />}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-black/15 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="relative z-10 px-6 pb-6 flex flex-col items-center text-center -mt-12">
          <div className="relative mb-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-[#151530]"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white dark:ring-[#151530]"
                style={{ background: roleGradient }}
              >
                {getInitials(user.name, user.lastName)}
              </div>
            )}
            <span
              className={`absolute bottom-1.5 right-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#151530] ${
                isOnline ? "bg-[#26D9A1]" : "bg-gray-400 dark:bg-gray-600"
              }`}
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {user.name} {user.lastName}
          </h3>

          <div className="mt-1.5 flex items-center justify-center gap-2">
            {user.role && (
              <span
                className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                style={{ background: roleGradient }}
              >
                {t(ROLE_LABEL_KEY[user.role] || "profileCard.roleStudent")}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#26D9A1]" : "bg-gray-400 dark:bg-gray-600"}`} />
              {t(isOnline ? "profileCard.activeNow" : "profileCard.offline")}
            </span>
          </div>

          {user.biography && (
            <p className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-gray-300 italic">
              “{user.biography}”
            </p>
          )}

          {(typeof user.classesCount === "number" || memberSince) && (
            <div className="mt-4 flex items-center justify-center gap-4">
              {typeof user.classesCount === "number" && (
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{user.classesCount}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {t(user.role === "teacher" ? "profileCard.classesTaught" : "profileCard.classesTaken")}
                  </p>
                </div>
              )}
              {memberSince && (
                <>
                  {typeof user.classesCount === "number" && <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />}
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{memberSince}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      {t("profileCard.memberSince")}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-4 w-full space-y-2">
            {location && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <FiMapPin size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <FiMail size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{user.email}</span>
            </div>
            {langMeta && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: `${langMeta.color}12`, border: `1px solid ${langMeta.color}30` }}
              >
                <FiBookOpen size={14} style={{ color: langMeta.color }} className="flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  {t(languageLabel)}: <span className="font-bold">{t(`userModal.languages.${user.language}`)}</span>
                </span>
                <span className="ml-auto text-sm">{langMeta.flag}</span>
              </div>
            )}
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
