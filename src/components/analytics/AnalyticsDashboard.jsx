import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  FiUsers, FiUser, FiUserCheck, FiUserX, FiBarChart2, FiPieChart,
  FiCalendar, FiClock, FiVideo, FiActivity,
} from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LANG_COLORS = { english: "#9E2FD0", spanish: "#26D9A1", polish: "#F6B82E", unknown: "#6b7280" };
const LANG_LABELS = { english: "English", spanish: "Spanish", polish: "Polish", unknown: "Other" };

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}22` }}>
    <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.88)" }} />
    <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
    <div className="relative z-10 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-gray-800 dark:text-white leading-tight">{value ?? "—"}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

/* ── Chart Card ── */
const ChartCard = ({ title, icon: Icon, color, badge, children }) => (
  <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}22` }}>
    <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.88)" }} />
    <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
    <div className="relative z-10 p-5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{title}</h3>
        {badge && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  </div>
);

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-semibold shadow-lg"
      style={{ background: "rgba(13,10,30,0.92)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
      <p className="text-gray-300 mb-0.5">{label}</p>
      <p style={{ color: payload[0].fill || payload[0].color }}>{payload[0].value} {payload[0].name}</p>
    </div>
  );
};

/* ── Empty state ── */
const Empty = ({ msg = "No data yet" }) => (
  <p className="text-xs text-center text-gray-400 py-10">{msg}</p>
);

/* ── Active/Inactive teacher pill list ── */
const TeacherStatusList = ({ allTeachers, activeNames }) => {
  const activeSet = new Set(activeNames);
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {allTeachers.map((t) => {
        const isActive = activeSet.has(`${t.name} ${t.lastName}`);
        return (
          <span key={t.id}
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={isActive
              ? { background: "rgba(38,217,161,0.12)", color: "#26D9A1", border: "1px solid rgba(38,217,161,0.25)" }
              : { background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.18)" }}>
            {t.name} {t.lastName}
          </span>
        );
      })}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/users/admin-stats`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/users/analytics`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/class-sessions/analytics`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/users/teachers`).then((r) => r.json()),
    ])
      .then(([s, a, sess, t]) => {
        setStats(s); setAnalytics(a); setSessions(sess);
        setTeachers(Array.isArray(t) ? t : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#9E2FD0 transparent transparent transparent" }} />
      </div>
    );
  }

  const assignedCount = (stats?.studentCount ?? 0) - (stats?.unassignedCount ?? 0);
  const assignedPct   = stats?.studentCount ? Math.round((assignedCount / stats.studentCount) * 100) : 0;

  const langData = (analytics?.languageDistribution ?? []).map((d) => ({
    ...d,
    label: LANG_LABELS[d.language] ?? d.language,
    color: LANG_COLORS[d.language] ?? "#6b7280",
  }));
  const totalLangStudents = langData.reduce((s, d) => s + d.count, 0);

  const shortName = (n) => { const p = n.trim().split(/\s+/); return p.length >= 2 ? `${p[0]} ${p[1]}` : p[0]; };
  const teacherBarData   = (analytics?.studentsPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));
  const weeklyHoursData  = (sessions?.weeklyHoursPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));
  const monthlyHoursData = (sessions?.monthlyHoursPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));

  return (
    <div className="space-y-6">

      {/* ── Row 1: Platform overview stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUser}      label="Teachers"           value={stats?.teacherCount}    color="#9E2FD0" />
        <StatCard icon={FiUsers}     label="Students"           value={stats?.studentCount}    color="#26D9A1" />
        <StatCard icon={FiVideo}     label="Classes This Week"  value={sessions?.weeklyClassCount  ?? "—"} color="#F6B82E" sub="last 7 days" />
        <StatCard icon={FiActivity}  label="Classes This Month" value={sessions?.monthlyClassCount ?? "—"} color="#ef4444" sub="last 30 days" />
      </div>

      {/* ── Row 2: students per teacher + language donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Students per Teacher" icon={FiBarChart2} color="#9E2FD0">
            {teacherBarData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={Math.max(220, teacherBarData.length * 30)}>
                <BarChart data={teacherBarData} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(158,47,208,0.08)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="shortName" width={90} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(158,47,208,0.06)" }} />
                  <Bar dataKey="count" name="students" fill="#9E2FD0" radius={[0, 6, 6, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Language Distribution" icon={FiPieChart} color="#26D9A1">
          {langData.length === 0 ? <Empty /> : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={langData} dataKey="count" nameKey="label" innerRadius={52} outerRadius={76} paddingAngle={3} strokeWidth={0}>
                      {langData.map((entry) => <Cell key={entry.language} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-extrabold text-gray-800 dark:text-white leading-none">{totalLangStudents}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">students</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {langData.map((d) => (
                  <div key={d.language} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-300">{d.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 dark:text-white">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: Weekly hours per teacher ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Weekly Teaching Hours" icon={FiClock} color="#F6B82E" badge="last 7 days">
          {weeklyHoursData.length === 0 ? <Empty msg="No completed classes tracked yet" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyHoursData} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,184,46,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="shortName" width={72} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(246,184,46,0.06)" }} />
                <Bar dataKey="hours" name="hrs" fill="#F6B82E" radius={[0, 6, 6, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Monthly Teaching Hours" icon={FiCalendar} color="#9E2FD0" badge="last 30 days">
          {monthlyHoursData.length === 0 ? <Empty msg="No completed classes tracked yet" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyHoursData} layout="vertical" margin={{ left: 0, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(158,47,208,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="shortName" width={72} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(158,47,208,0.06)" }} />
                <Bar dataKey="hours" name="hrs" fill="#9E2FD0" radius={[0, 6, 6, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row 4: Active / Inactive teachers this month ── */}
      <ChartCard title="Teacher Activity This Month" icon={FiActivity} color="#26D9A1"
        badge={`${sessions?.activeTeacherNames?.length ?? 0} / ${teachers.length} active`}>
        {teachers.length === 0 ? <Empty /> : (
          <TeacherStatusList allTeachers={teachers} activeNames={sessions?.activeTeacherNames ?? []} />
        )}
      </ChartCard>

      {/* ── Row 5: Assignment rate ── */}
      <div className="relative rounded-2xl overflow-hidden p-5" style={{ border: "1px solid rgba(38,217,161,0.22)" }}>
        <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #26D9A1, transparent)" }} />
        <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.88)" }} />
        <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiUserCheck size={14} style={{ color: "#26D9A1" }} />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Student Assignment Rate</span>
            </div>
            <span className="text-lg font-extrabold" style={{ color: "#26D9A1" }}>{assignedPct}%</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(38,217,161,0.12)" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${assignedPct}%`, background: "linear-gradient(90deg, #26D9A1, #1fa07a)" }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">{assignedCount} assigned</span>
            <span className="text-xs text-gray-400">{stats?.unassignedCount} unassigned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
