import { useTranslation } from "react-i18next";

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
    { label: t("adminStats.totalUsers"), value: totalUsers, sub: t("adminStats.registered", { count: totalUsers }) },
    { label: t("adminStats.teachers"), value: teachersCount, sub: t("adminStats.ofTotal", { pct: teacherPercentage }) },
    { label: t("adminStats.students"), value: studentsCount, sub: t("adminStats.ofTotal", { pct: studentPercentage }) },
    {
      label: t("adminStats.unassigned"),
      value: unassignedStudentsCount,
      sub: t("adminStats.ofStudents", {
        pct: studentsCount > 0 ? Math.round((unassignedStudentsCount / studentsCount) * 100) : 0,
      }),
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-ll-line bg-ll-panel overflow-hidden
                        [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-ll-line lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0
                        [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-ll-line lg:[&>*:nth-child(n+3)]:border-t-0">
      {stats.map((stat) => (
        <div key={stat.label} className="px-4 sm:px-5 py-4">
          <p className="text-[12.5px] text-ll-ink3">{stat.label}</p>
          <p className="font-mono text-[26px] font-medium leading-tight text-ll-ink mt-1">{stat.value}</p>
          <p className="text-[11.5px] text-ll-ink4 mt-0.5 truncate">{stat.sub}</p>
        </div>
      ))}
    </section>
  );
};

export default AdminStats;
