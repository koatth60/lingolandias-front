import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import AdminCalToolbar from "./AdminCalToolbar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./studentAssignment.css";
import { FiCalendar, FiUser } from "react-icons/fi";
import { projectSchedules, normalizeCalendarRange } from "../../utils/scheduleProjection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3" size={14} />
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="pl-9 pr-8 h-9 text-[13.5px] rounded-lg border border-ll-line2 bg-ll-panel text-ll-ink focus:outline-none focus:border-ll-violet/60"
          >
            <option value="">{t("admin.teacherSchedulesSelect")}</option>
            {teachers.map((tc) => (
              <option key={tc.id} value={tc.id}>{tc.name} {tc.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTeacherId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-ll-line2 bg-ll-subtle">
          <FiCalendar size={26} className="text-ll-ink4 mb-2" />
          <p className="text-[13.5px] text-ll-ink3">{t("admin.teacherSchedulesEmpty")}</p>
        </div>
      ) : (
        <div className="relative" style={{ height: "560px" }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-ll-panel/70 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgb(var(--ll-violet))", borderTopColor: "transparent" }} />
            </div>
          )}
          <div className="rbc-admin-cal h-full rounded-xl overflow-hidden border border-ll-line">
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
              components={{ toolbar: AdminCalToolbar }}
              formats={{
                timeGutterFormat: "HH:mm",
                eventTimeRangeFormat: ({ start: s, end: e }) => `${dayjs(s).format("HH:mm")} – ${dayjs(e).format("HH:mm")}`,
              }}
              selectable={false}
              eventPropGetter={() => ({
                style: { background: "rgb(var(--ll-violet-tint))", color: "rgb(var(--ll-violet-ink))", border: "1px solid rgb(var(--ll-violet-line))", borderRadius: 7, fontSize: 12, fontWeight: 600 },
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedulesViewer;
