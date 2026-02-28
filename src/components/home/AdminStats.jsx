import { useTranslation } from "react-i18next";
import { FiUsers, FiBook, FiUserCheck } from "react-icons/fi";

const STAT_COLORS = [
  { gradient: "linear-gradient(135deg, #9E2FD0, #7b22a8)", shadow: "rgba(158,47,208,0.35)" },
  { gradient: "linear-gradient(135deg, #26D9A1, #1fa07a)", shadow: "rgba(38,217,161,0.35)" },
  { gradient: "linear-gradient(135deg, #F6B82E, #d4981a)", shadow: "rgba(246,184,46,0.35)" },
  { gradient: "linear-gradient(135deg, #c084fc, #9E2FD0)", shadow: "rgba(192,132,252,0.35)" },
];

const AdminStats = ({
  teachersCount = 0,
  studentsCount = 0,
  unassignedStudentsCount = 0,
  totalUsers = 0,
}) => {
  const { t } = useTranslation();
  const teacherPercentage = totalUsers > 0 ? Math.round((teachersCount / totalUsers) * 100) : 0;
  const studentPercentage = totalUsers > 0 ? Math.round((studentsCount / totalUsers) * 100) : 0;

  const stats = [
    { label: t("adminStats.totalUsers"), value: totalUsers, icon: <FiUsers size={16} />, sub: t("adminStats.registered", { count: totalUsers }) },
    { label: t("adminStats.teachers"), value: teachersCount, icon: <FiUserCheck size={16} />, sub: t("adminStats.ofTotal", { pct: teacherPercentage }) },
    { label: t("adminStats.students"), value: studentsCount, icon: <FiUsers size={16} />, sub: t("adminStats.ofTotal", { pct: studentPercentage }) },
    {
      label: t("adminStats.unassigned"),
      value: unassignedStudentsCount,
      icon: <FiBook size={16} />,
      sub: studentsCount > 0
        ? t("adminStats.ofStudents", { pct: Math.round((unassignedStudentsCount / studentsCount) * 100) })
        : t("adminStats.ofStudents", { pct: 0 }),
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="relative rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-sm dark:shadow-none"
          style={{ border: "1px solid rgba(158,47,208,0.15)" }}
        >
          <div className="dark:hidden absolute inset-0 bg-white" />
          <div
            className="hidden dark:block absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.94), rgba(26,26,46,0.92))" }}
          />
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-50" />

          <div className="relative z-10 p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div
                className="p-1.5 sm:p-2 rounded-xl text-white"
                style={{ background: STAT_COLORS[i].gradient, boxShadow: `0 4px 12px ${STAT_COLORS[i].shadow}` }}
              >
                {stat.icon}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium hidden xs:block sm:block truncate ml-2 max-w-[70px] sm:max-w-none">{stat.sub}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-0.5">{stat.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
};

export default AdminStats;
