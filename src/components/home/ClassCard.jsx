import { FiVideo, FiMessageSquare } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const ClassCard = ({ classItem, onJoinClass, onViewChat }) => {
  const { t } = useTranslation();
  return (
  <div
    className="relative rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-sm dark:shadow-none"
    style={{ border: "1px solid rgba(158,47,208,0.18)" }}
  >
    <div className="dark:hidden absolute inset-0 bg-white" />
    <div
      className="hidden dark:block absolute inset-0"
      style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.95), rgba(26,26,46,0.93))" }}
    />
    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-60" />

    {/* Header */}
    <div className="relative z-10 px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/15">
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}
      >
        {classItem.language}
      </span>
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{classItem.time}</span>
    </div>

    {/* Participants */}
    <div className="relative z-10 px-5 py-4 space-y-4">
      {/* Teacher */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={classItem.teacherAvatar}
            alt={classItem.teacherName}
            className="w-11 h-11 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 2px rgba(38,217,161,0.6)" }}
          />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-[#0d0a1e]"
            style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", fontSize: "8px", fontWeight: 700 }}
          >
            T
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase">{t("classCard.teacher")}</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{classItem.teacherName}</p>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/15 to-transparent" />

      {/* Student */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={classItem.studentAvatar}
            alt={classItem.studentName}
            className="w-11 h-11 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 2px rgba(158,47,208,0.5)" }}
          />
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-[#0d0a1e]"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", fontSize: "8px", fontWeight: 700 }}
          >
            S
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase">{t("classCard.student")}</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{classItem.studentName}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 flex-wrap sm:flex-nowrap">
        <button
          onClick={() => onJoinClass(classItem.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 3px 10px rgba(158,47,208,0.35)" }}
        >
          <FiVideo size={13} /> {t("classCard.joinClass")}
        </button>
        <button
          onClick={() => onViewChat(classItem.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition-all hover:bg-[#9E2FD0]/8 dark:hover:bg-white/5"
          style={{ border: "1px solid rgba(158,47,208,0.20)" }}
        >
          <FiMessageSquare size={13} /> {t("classCard.viewChat")}
        </button>
      </div>
    </div>
  </div>
  );
};

export default ClassCard;
