import { FiUsers, FiBookOpen } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const LANG_CONFIG = {
  english: { labelKey: "admin.englishStudents", code: "EN", color: "#9E2FD0", glow: "rgba(158,47,208,0.10)", border: "rgba(158,47,208,0.22)" },
  spanish: { labelKey: "admin.spanishStudents", code: "ES", color: "#26D9A1", glow: "rgba(38,217,161,0.10)", border: "rgba(38,217,161,0.22)" },
  polish:  { labelKey: "admin.polishStudents",  code: "PL", color: "#F6B82E", glow: "rgba(246,184,46,0.10)",  border: "rgba(246,184,46,0.22)"  },
};

const StudentRow = ({ student }) => (
  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5">
    {student.avatarUrl ? (
      <img
        src={student.avatarUrl}
        alt={`${student.name} ${student.lastName}`}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    ) : (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        {student.name.charAt(0)}{student.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
        {student.name} {student.lastName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
    </div>
  </div>
);

const LangColumn = ({ lang, students }) => {
  const { t } = useTranslation();
  const cfg = LANG_CONFIG[lang];
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ border: `1px solid ${cfg.border}` }}
    >
      {/* Colored top bar */}
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      {/* Glass bg */}
      <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
      <div className="absolute inset-0 hidden dark:block" style={{ background: `rgba(13,10,30,0.55)` }} />

      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs tracking-widest flex-shrink-0"
            style={{ background: cfg.glow, border: `1px solid ${cfg.border}`, color: cfg.color }}
          >
            {cfg.code}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">{t(cfg.labelKey)}</h3>
            <p className="text-xs font-medium" style={{ color: cfg.color }}>
              {students.length} {students.length === 1 ? t("admin.studentSingular") : t("admin.studentPlural")}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-3 opacity-30" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

        {/* Student list */}
        <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar space-y-1">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FiUsers size={22} className="text-gray-400 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("admin.noStudentsYet")}</p>
            </div>
          ) : (
            students.map((student) => <StudentRow key={student.id} student={student} />)
          )}
        </div>
      </div>
    </div>
  );
};

const DisplayAllStudents = ({ students }) => {
  const { t } = useTranslation();
  const englishStudents = students.filter((s) => s.language === "english");
  const spanishStudents = students.filter((s) => s.language === "spanish");
  const polishStudents  = students.filter((s) => s.language === "polish");

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <FiBookOpen size={17} style={{ color: "#9E2FD0" }} />
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">{t("admin.allStudentsByLang")}</h2>
        <span
          className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
        >
          {students.length}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LangColumn lang="english" students={englishStudents} />
        <LangColumn lang="spanish" students={spanishStudents} />
        <LangColumn lang="polish"  students={polishStudents}  />
      </div>
    </section>
  );
};

export default DisplayAllStudents;
