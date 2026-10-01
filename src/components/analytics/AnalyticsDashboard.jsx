import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const VIOLET = "rgb(var(--ll-violet))";
const TEAL = "rgb(var(--ll-teal))";
const GOLD = "rgb(var(--ll-gold))";
const INK3 = "rgb(var(--ll-ink-3))";
const LINE = "rgb(var(--ll-line))";

const LANG_COLORS = { english: VIOLET, spanish: TEAL, polish: GOLD, unknown: "rgb(var(--ll-ink-4))" };
const LANG_LABELS = { english: "English", spanish: "Spanish", polish: "Polish", unknown: "Other" };

const AXIS_TICK = { fontSize: 11, fill: INK3 };

/* ── Section: plain heading + bordered body ── */
const Section = ({ title, badge, children }) => (
  <section className="flex flex-col h-full">
    <div className="flex items-center gap-2 mb-2.5">
      <h3 className="text-[13.5px] font-semibold text-ll-ink">{title}</h3>
      {badge && (
        <span className="font-mono text-[11.5px] text-ll-ink3 px-1.5 py-px rounded-[5px] bg-ll-hover">{badge}</span>
      )}
    </div>
    <div className="rounded-xl border border-ll-line bg-ll-panel p-4 sm:p-5 flex-1">{children}</div>
  </section>
);

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[12px] bg-ll-panel border border-ll-line shadow-ll-2 text-ll-ink">
      <p className="text-ll-ink3 mb-0.5">{label}</p>
      <p className="font-medium">{payload[0].value} {payload[0].name}</p>
    </div>
  );
};

/* ── Empty state ── */
const Empty = ({ msg = "No data yet" }) => (
  <p className="text-[13px] text-center text-ll-ink3 py-10">{msg}</p>
);

/* ── Active/Inactive teacher pill list ── */
const TeacherStatusList = ({ allTeachers, activeNames }) => {
  const activeSet = new Set(activeNames);
  return (
    <div className="flex flex-wrap gap-2">
      {allTeachers.map((t) => {
        const isActive = activeSet.has(`${t.name} ${t.lastName}`);
        return (
          <span key={t.id}
            className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[12.5px] font-medium ${
              isActive ? "bg-ll-teal-tint text-ll-teal-ink" : "bg-ll-hover text-ll-ink3"
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-ll-teal" : "bg-ll-ink4"}`} />
            {t.name} {t.lastName}
          </span>
        );
      })}
    </div>
  );
};

const HoursChart = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={Math.max(160, data.length * 32)}>
    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24 }}>
      <CartesianGrid stroke={LINE} horizontal={false} />
      <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
      <YAxis type="category" dataKey="shortName" width={84} tick={AXIS_TICK} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgb(var(--ll-hover))" }} />
      <Bar dataKey="hours" name="hrs" fill={color} radius={[0, 4, 4, 0]} maxBarSize={14} />
    </BarChart>
  </ResponsiveContainer>
);

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
        <div className="w-7 h-7 rounded-full border-[3px] border-ll-violet/30 border-t-ll-violet animate-spin" />
      </div>
    );
  }

  const assignedCount = (stats?.studentCount ?? 0) - (stats?.unassignedCount ?? 0);
  const assignedPct   = stats?.studentCount ? Math.round((assignedCount / stats.studentCount) * 100) : 0;

  const langData = (analytics?.languageDistribution ?? []).map((d) => ({
    ...d,
    label: LANG_LABELS[d.language] ?? d.language,
    color: LANG_COLORS[d.language] ?? LANG_COLORS.unknown,
  }));
  const totalLangStudents = langData.reduce((s, d) => s + d.count, 0);

  const shortName = (n) => { const p = n.trim().split(/\s+/); return p.length >= 2 ? `${p[0]} ${p[1]}` : p[0]; };
  const teacherBarData   = (analytics?.studentsPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));
  const weeklyHoursData  = (sessions?.weeklyHoursPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));
  const monthlyHoursData = (sessions?.monthlyHoursPerTeacher ?? []).map((d) => ({ ...d, shortName: shortName(d.name) }));

  const overview = [
    { label: "Teachers", value: stats?.teacherCount },
    { label: "Students", value: stats?.studentCount },
    { label: "Classes this week", value: sessions?.weeklyClassCount ?? "—", sub: "last 7 days" },
    { label: "Classes this month", value: sessions?.monthlyClassCount ?? "—", sub: "last 30 days" },
  ];

  return (
    <div className="space-y-7 max-w-6xl mx-auto">

      {/* ── Overview: one strip, big mono numbers ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-ll-line bg-ll-panel divide-ll-line lg:divide-x [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-ll-line lg:[&>*:nth-child(odd)]:border-r-0 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-ll-line lg:[&>*:nth-child(n+3)]:border-t-0">
        {overview.map(({ label, value, sub }) => (
          <div key={label} className="px-4 sm:px-5 py-4">
            <p className="text-[12.5px] text-ll-ink3">{label}</p>
            <p className="font-mono text-[26px] font-medium leading-tight text-ll-ink mt-1">{value ?? "—"}</p>
            {sub && <p className="text-[11.5px] text-ll-ink4 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Students per teacher + language donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Section title="Students per teacher">
            {teacherBarData.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={Math.max(220, teacherBarData.length * 30)}>
                <BarChart data={teacherBarData} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <CartesianGrid stroke={LINE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="shortName" width={90} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgb(var(--ll-hover))" }} />
                  <Bar dataKey="count" name="students" fill={VIOLET} radius={[0, 4, 4, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>

        <Section title="Language distribution">
          {langData.length === 0 ? <Empty /> : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={langData} dataKey="count" nameKey="label" innerRadius={54} outerRadius={74} paddingAngle={2} strokeWidth={0}>
                      {langData.map((entry) => <Cell key={entry.language} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono text-[22px] font-medium text-ll-ink leading-none">{totalLangStudents}</span>
                  <span className="text-[11.5px] text-ll-ink3 mt-1">students</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                {langData.map((d) => (
                  <div key={d.language} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-[13px] text-ll-ink2">{d.label}</span>
                    </div>
                    <span className="font-mono text-[12.5px] text-ll-ink">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Teaching hours ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Weekly teaching hours" badge="last 7 days">
          {weeklyHoursData.length === 0 ? <Empty msg="No completed classes tracked yet" /> : (
            <HoursChart data={weeklyHoursData} color={GOLD} />
          )}
        </Section>
        <Section title="Monthly teaching hours" badge="last 30 days">
          {monthlyHoursData.length === 0 ? <Empty msg="No completed classes tracked yet" /> : (
            <HoursChart data={monthlyHoursData} color={VIOLET} />
          )}
        </Section>
      </div>

      {/* ── Teacher activity ── */}
      <Section title="Teacher activity this month"
        badge={`${sessions?.activeTeacherNames?.length ?? 0} / ${teachers.length} active`}>
        {teachers.length === 0 ? <Empty /> : (
          <TeacherStatusList allTeachers={teachers} activeNames={sessions?.activeTeacherNames ?? []} />
        )}
      </Section>

      {/* ── Assignment rate ── */}
      <Section title="Student assignment rate">
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-[13px] text-ll-ink2">{assignedCount} of {stats?.studentCount ?? 0} students have a teacher</span>
          <span className="font-mono text-[18px] font-medium text-ll-ink">{assignedPct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-ll-hover">
          <div className="h-full rounded-full bg-ll-teal transition-all duration-700" style={{ width: `${assignedPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-[12px] text-ll-ink3">
          <span>{assignedCount} assigned</span>
          <span>{stats?.unassignedCount} unassigned</span>
        </div>
      </Section>
    </div>
  );
};

export default AnalyticsDashboard;
