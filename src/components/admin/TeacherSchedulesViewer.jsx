import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer, Navigate } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./studentAssignment.css";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiUser } from "react-icons/fi";
import { projectSchedules, normalizeCalendarRange } from "../../utils/scheduleProjection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ViewerToolbar = ({ label, onNavigate, onView, view }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#13102a] border-b border-gray-200 dark:border-white/[0.08] flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate(Navigate.PREVIOUS)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all">
          <FiChevronLeft size={18} />
        </button>
        <button onClick={() => onNavigate(Navigate.TODAY)} className="px-4 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all">
          {t("common.today")}
        </button>
        <button onClick={() => onNavigate(Navigate.NEXT)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all">
          <FiChevronRight size={18} />
        </button>
      </div>
      <span className="text-base font-extrabold text-gray-900 dark:text-white">{label}</span>
      <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        {["month", "week"].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-4 h-8 rounded-lg text-sm font-bold capitalize transition-all ${
              view === v ? "text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            }`}
            style={view === v ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

// Read-only calendar of one teacher's classes, for admins — a direct look
// without going through the "availability" slot-picker inside student
// assignment (which is built for scheduling a new class, not just checking
// what a teacher's week looks like).
const TeacherSchedulesViewer = ({ teachers }) => {
  const { t } = useTranslation();
  const localizer = useMemo(() => dayjsLocalizer(dayjs), []);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarRange, setCalendarRange] = useState(() => ({
    start: dayjs().startOf("week").toDate(),
    end: dayjs().endOf("week").toDate(),
  }));

  useEffect(() => {
    if (!selectedTeacherId) { setSchedules([]); return; }
    const token = localStorage.getItem("token");
    setLoading(true);
    fetch(`${BACKEND_URL}/users/teacher-profile/${selectedTeacherId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : { teacherSchedules: [] }))
      .then((data) => setSchedules(Array.isArray(data.teacherSchedules) ? data.teacherSchedules : []))
      .catch((err) => console.error("Error fetching teacher schedule:", err))
      .finally(() => setLoading(false));
  }, [selectedTeacherId]);

  const events = useMemo(
    () => projectSchedules(schedules, { rangeStart: calendarRange.start, rangeEnd: calendarRange.end, nameKey: "studentName" }),
    [schedules, calendarRange],
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9E2FD0]/40 focus:border-[#9E2FD0] transition min-w-[220px]"
          >
            <option value="">{t("admin.teacherSchedulesSelect")}</option>
            {teachers.map((tc) => (
              <option key={tc.id} value={tc.id}>{tc.name} {tc.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTeacherId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-gray-200 dark:border-white/10">
          <FiCalendar size={26} className="text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("admin.teacherSchedulesEmpty")}</p>
        </div>
      ) : (
        <div className="relative" style={{ height: "560px" }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-black/40 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#9E2FD0", borderTopColor: "transparent" }} />
            </div>
          )}
          <div className="rbc-admin-cal h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.07]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%", width: "100%" }}
              views={["month", "week"]}
              defaultView="week"
              defaultDate={new Date()}
              onRangeChange={(range) => setCalendarRange(normalizeCalendarRange(range))}
              components={{ toolbar: ViewerToolbar }}
              formats={{
                timeGutterFormat: "HH:mm",
                eventTimeRangeFormat: ({ start: s, end: e }) => `${dayjs(s).format("HH:mm")} – ${dayjs(e).format("HH:mm")}`,
              }}
              selectable={false}
              eventPropGetter={() => ({
                style: { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, padding: "2px 6px" },
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedulesViewer;
