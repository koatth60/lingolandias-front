import { FiVideo, FiMessageSquare } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const Person = ({ avatar, name, role }) => (
  <div className="flex items-center gap-3 min-w-0">
    <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-ll-hover" />
    <div className="min-w-0">
      <p className="text-[13.5px] font-medium text-ll-ink truncate">{name}</p>
      <p className="text-[12px] text-ll-ink3">{role}</p>
    </div>
  </div>
);

const ClassCard = ({ classItem, onJoinClass, onViewChat }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-ll-line bg-ll-panel overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-ll-line">
        <span className="inline-flex items-center h-5 px-2 rounded-full text-[11.5px] font-medium capitalize bg-ll-violet-tint text-ll-violet-ink">
          {classItem.language}
        </span>
        <span className="font-mono text-[12.5px] text-ll-ink2">{classItem.time}</span>
      </div>

      <div className="px-4 py-3.5 space-y-3">
        <Person avatar={classItem.teacherAvatar} name={classItem.teacherName} role={t("classCard.teacher")} />
        <Person avatar={classItem.studentAvatar} name={classItem.studentName} role={t("classCard.student")} />

        <div className="flex gap-2 pt-1">
          <button onClick={() => onJoinClass(classItem.id)} className="ll-btn ll-btn-primary flex-1 justify-center">
            <FiVideo size={14} /> {t("classCard.joinClass")}
          </button>
          <button onClick={() => onViewChat(classItem.id)} className="ll-btn ll-btn-secondary flex-1 justify-center">
            <FiMessageSquare size={14} /> {t("classCard.viewChat")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
