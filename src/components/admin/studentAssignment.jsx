import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./studentAssignment.css";
import dayjs from "dayjs";
import { FiUserCheck, FiCalendar, FiClock, FiX, FiCheckCircle, FiSearch } from "react-icons/fi";
import TimeInput from "../common/TimeInput";
import AdminCalToolbar from "./AdminCalToolbar";
import { projectSchedules, normalizeCalendarRange } from "../../utils/scheduleProjection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const EventTimeModal = ({ selectedDate, initialStart, initialEnd, onClose, onAdd }) => {
  const { t } = useTranslation();
  const [start, setStart] = useState(initialStart ? dayjs(initialStart).format("HH:mm") : "");
  const [end, setEnd] = useState(initialEnd ? dayjs(initialEnd).format("HH:mm") : "");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);

  const handleAdd = () => {
    if (!start || !end) return;
    // "HH:MM" strings sort lexicographically the same as chronologically since both are zero-padded
    if (end <= start) {
      Swal.fire({
        title: "Error",
        text: t("addEvent.endBeforeStart"),
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: 'rgb(var(--ll-violet))',
      });
      return;
    }
    onAdd(start, end, recurrenceWeeks);
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 100001 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0d0a1e]"
        style={{
          border: "1px solid rgb(var(--ll-violet) / 0.30)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          zIndex: 100002,
        }}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #E8A23A, rgb(var(--ll-violet)))" }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <FiClock size={15} style={{ color: "#E8A23A" }} />
              {t("addEvent.addClassTime")}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
            >
              <FiX size={15} />
            </button>
          </div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-5">
            {selectedDate ? dayjs(selectedDate).format("dddd, MMMM D YYYY") : ""}
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ll-ink2 mb-1.5">{t("addEvent.startTime")}</label>
              <TimeInput value={start} onChange={setStart} className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ll-ink2 mb-1.5">{t("addEvent.endTime")}</label>
              <TimeInput value={end} onChange={setEnd} className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ll-ink2 mb-1.5">{t("addEvent.recurrence")}</label>
              <div className="flex gap-2">
                {[
                  { value: 1, label: t("addEvent.everyWeek") },
                  { value: 2, label: t("addEvent.everyTwoWeeks") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrenceWeeks(opt.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      recurrenceWeeks === opt.value
                        ? "text-white"
                        : "text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                    }`}
                    style={recurrenceWeeks === opt.value ? { background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))" } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #E8A23A, #C4860A)", boxShadow: "0 4px 14px rgba(232,162,58,0.28)" }}
            >
              <FiClock size={14} /> {t("addEvent.add")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const UserRow = ({ person, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-2.5 py-2 rounded-[9px] cursor-pointer mb-1 transition-colors ${
      selected ? "bg-ll-violet-tint" : "hover:bg-ll-hover"
    }`}
  >
    {person.avatarUrl ? (
      <img src={person.avatarUrl} alt={`${person.name} ${person.lastName}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${selected ? "bg-ll-panel text-ll-violet-ink" : "bg-ll-hover text-ll-ink2"}`}>
        {person.name.charAt(0)}{person.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-medium text-ll-ink truncate">{person.name} {person.lastName}</p>
      <p className="text-[12px] text-ll-ink3 truncate">{person.email}</p>
    </div>
    {selected && <FiCheckCircle size={15} className="flex-shrink-0 text-ll-violet" />}
  </div>
);

// eslint-disable-next-line react/prop-types
const StudentAssignment = ({ teachers, onRefresh, refreshKey }) => {
  const { t } = useTranslation();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotEnd, setSelectedSlotEnd] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [teachersEvents, setTeachersEvents] = useState([]);
  // Tracks whatever the availability calendar is currently displaying — recomputed
  // on navigation instead of pre-generating a big fixed window up front (that's what
  // made it slow, and it still silently ran out a couple months out either way).
  const [calendarRange, setCalendarRange] = useState(() => ({
    start: dayjs().startOf("week").toDate(),
    end: dayjs().add(6, "week").toDate(),
  }));

  // Unassigned students — fetched server-side with search
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMoreStudents, setLoadingMoreStudents] = useState(false);
  const searchRef = useRef(studentSearch);

  const fetchUnassigned = async (search, page, append = false) => {
    if (page === 1) setLoadingStudents(true); else setLoadingMoreStudents(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", unassignedOnly: "true" });
      if (search?.trim()) params.set("search", search.trim());
      const res = await fetch(`${BACKEND_URL}/users/students/paginated?${params}`);
      const data = await res.json();
      setUnassignedStudents((prev) => append ? [...prev, ...data.data] : data.data);
      setStudentTotal(data.total);
      setStudentPage(page);
    } catch (err) {
      console.error("Error fetching unassigned students:", err);
    } finally {
      setLoadingStudents(false);
      setLoadingMoreStudents(false);
    }
  };

  // Initial load + refresh
  useEffect(() => {
    searchRef.current = "";
    setStudentSearch("");
    fetchUnassigned("", 1);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    searchRef.current = studentSearch;
    const timer = setTimeout(() => fetchUnassigned(studentSearch, 1), 350);
    return () => clearTimeout(timer);
  }, [studentSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const localizer = useMemo(() => dayjsLocalizer(dayjs), []);

  // Recompute the teacher's projected availability whenever the selected teacher or
  // the visible calendar window changes — cheap regardless of how far someone
  // navigates, since it only ever projects what's actually on screen.
  useEffect(() => {
    if (!selectedTeacher?.teacherSchedules?.length) {
      setTeachersEvents([]);
      return;
    }
    setTeachersEvents(
      projectSchedules(selectedTeacher.teacherSchedules, {
        rangeStart: calendarRange.start,
        rangeEnd: calendarRange.end,
        nameKey: "studentName",
      }),
    );
  }, [selectedTeacher, calendarRange]);

  const handleCalendarOpen = () => {
    // The calendar unmounts on close and remounts fresh (defaultDate={new Date()})
    // each time it opens, but react-big-calendar only fires onRangeChange in
    // response to user navigation — never on mount. Without this reset,
    // calendarRange would still hold whatever week was last navigated to before
    // closing, out of sync with the freshly-shown "today" view, and no events
    // would appear until the user navigated again.
    setCalendarRange({
      start: dayjs().startOf("week").toDate(),
      end: dayjs().endOf("week").toDate(),
    });
    setIsCalendarOpen(true);
  };

  const handleSelectSlot = ({ start, end }) => {
    setSelectedDate(start);
    setSelectedSlotEnd(end);
    setEventModalOpen(true);
  };

  const handleAddEvent = (startTime, endTime, recurrenceWeeks = 1) => {
    if (!selectedDate) return;
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startDateTime = dayjs(selectedDate).hour(startHours).minute(startMinutes).second(0).millisecond(0).utc().toDate();
    const endDateTime = dayjs(selectedDate).hour(endHours).minute(endMinutes).second(0).millisecond(0).utc().toDate();
    const dayOfWeek = dayjs(selectedDate).format("dddd");
    const date = dayjs(selectedDate).format("YYYY-MM-DD");
    setEvents((prev) => [
      ...prev,
      {
        dayOfWeek, startTime, endTime, date, recurrenceWeeks,
        start: startDateTime, end: endDateTime,
        teacherName: `${selectedTeacher.name} ${selectedTeacher.lastName}`,
        studentName: `${selectedStudent.name} ${selectedStudent.lastName}`,
      },
    ]);
    setEventModalOpen(false);
  };

  const assignTeacherToStudent = (data) => {
    fetch(`${BACKEND_URL}/users/assignstudent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) return response.text().then((t) => { throw new Error(t || "An error occurred"); });
        return response.json();
      })
      .then(() => {
        Swal.fire({
          title: t("common.success"),
          text: t("admin.assignSuccess"),
          icon: "success",
          confirmButtonText: "Ok",
          confirmButtonColor: "rgb(var(--ll-violet))",
          timer: 3000,
          timerProgressBar: true,
        }).then(() => {
          setSelectedStudent(null);
          setSelectedTeacher(null);
          setEvents([]);
          onRefresh?.();
        });
      })
      .catch((error) => { console.error("Error:", error); });
  };

  const handleAssignClick = () => {
    if (selectedTeacher && selectedStudent && events.length > 0) {
      const eventsWithTeacherAndStudent = events.map((event) => ({
        ...event, teacherId: selectedTeacher.id, studentId: selectedStudent.id,
      }));
      assignTeacherToStudent({ teacherId: selectedTeacher.id, studentId: selectedStudent.id, events: eventsWithTeacherAndStudent });
      setEvents([]);
    }
  };

  const formatDateTime = (dateTime) => dayjs(dateTime).isValid() ? dayjs(dateTime).format("HH:mm") : "Invalid Date";

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[15px] font-semibold text-ll-ink">{t("admin.assignTitle")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── 1. Select Student ── */}
        <div className="relative rounded-xl overflow-hidden border border-ll-line">
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-ll-hover text-ll-ink2 flex items-center justify-center font-mono text-[11px] flex-shrink-0">1</span>
              <h3 className="text-[13.5px] font-semibold text-ll-ink">{t("admin.selectStudentLabel")}</h3>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3" />
              <input
                type="text"
                placeholder={t("admin.searchStudents")}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg text-[13px] outline-none border border-ll-line2 bg-ll-panel text-ll-ink placeholder:text-ll-ink3 focus:border-ll-violet/60 transition-colors"
              />
            </div>

            <div className="max-h-52 overflow-y-auto custom-scrollbar">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-emerald-400" />
                </div>
              ) : unassignedStudents.length === 0 ? (
                <p className="text-[12.5px] text-ll-ink3 text-center py-6">{t("admin.noUnassigned")}</p>
              ) : (
                <>
                  {unassignedStudents.map((student) => (
                    <UserRow
                      key={student.id}
                      person={student}
                      selected={selectedStudent?.id === student.id}
                      accentColor="#1FA48C"
                      onClick={() => setSelectedStudent(student)}
                    />
                  ))}
                  {unassignedStudents.length < studentTotal && (
                    <button
                      onClick={() => fetchUnassigned(searchRef.current, studentPage + 1, true)}
                      disabled={loadingMoreStudents}
                      className="w-full mt-1 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                      {loadingMoreStudents ? "…" : `${t("admin.loadMore")} (${studentTotal - unassignedStudents.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Select Teacher ── */}
        <div className="relative rounded-xl overflow-hidden border border-ll-line">
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-ll-hover text-ll-ink2 flex items-center justify-center font-mono text-[11px] flex-shrink-0">2</span>
              <h3 className="text-[13.5px] font-semibold text-ll-ink">{t("admin.selectTeacherLabel")}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {teachers.map((teacher) => (
                <UserRow
                  key={teacher.id}
                  person={teacher}
                  selected={selectedTeacher?.id === teacher.id}
                  accentColor="rgb(var(--ll-violet))"
                  onClick={() => setSelectedTeacher(teacher)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Schedule ── */}
        <div className="relative rounded-xl overflow-hidden border border-ll-line flex flex-col min-h-[260px]">
          <div className="relative z-10 p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-ll-hover text-ll-ink2 flex items-center justify-center font-mono text-[11px] flex-shrink-0">3</span>
              <h3 className="text-[13.5px] font-semibold text-ll-ink">{t("admin.setSchedule")}</h3>
            </div>

            <button
              onClick={handleCalendarOpen}
              disabled={!selectedTeacher || !selectedStudent}
              className="ll-btn ll-btn-secondary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiCalendar size={14} /> {t("admin.viewAvailability")}
            </button>

            {events.length > 0 && (
              <div className="mt-4 flex-1">
                <p className="text-[12.5px] font-medium text-ll-ink2 mb-2">{t("admin.scheduledClasses")}</p>
                <ul className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                  {events.map((event, index) => (
                    <li
                      key={index}
                      className="text-[12.5px] px-3 py-1.5 rounded-lg flex items-center gap-2 bg-ll-teal-tint text-ll-teal-ink"
                    >
                      <FiClock size={10} className="flex-shrink-0" />
                      {dayjs(event.date).format("MMM DD")} · {formatDateTime(event.start)} – {formatDateTime(event.end)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleAssignClick}
              disabled={!selectedTeacher || !selectedStudent || events.length === 0}
              className="ll-btn ll-btn-primary w-full justify-center mt-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiUserCheck size={14} /> {t("admin.assignStudent")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Calendar Modal — rendered on document.body via portal ── */}
      {isCalendarOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 99999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsCalendarOpen(false); }}
        >
          <div
            className="relative w-full rounded-2xl bg-white dark:bg-[#0d0a1e] flex flex-col"
            style={{
              maxWidth: "min(1100px, 96vw)",
              height: "min(800px, 90vh)",
              border: "1px solid rgb(var(--ll-violet) / 0.30)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              zIndex: 100000,
            }}
          >
            {/* gradient top bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, rgb(var(--ll-violet)), #E8A23A, #1FA48C)" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))" }}>
                  <FiCalendar size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                    {t("admin.teacherSchedule", { name: `${selectedTeacher?.name} ${selectedTeacher?.lastName}` })}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t("admin.calendarHint")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-hidden p-4">
              <div className="rbc-admin-cal h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.07]">
                <Calendar
                  localizer={localizer}
                  events={[...teachersEvents, ...events]}
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
                    eventTimeRangeFormat: ({ start, end }) =>
                      `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`,
                  }}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  eventPropGetter={() => ({
                    style: {
                      background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "2px 6px",
                    },
                  })}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Event Time Modal — isolated component so typing doesn't re-render parent ── */}
      {eventModalOpen && (
        <EventTimeModal
          selectedDate={selectedDate}
          initialStart={selectedDate}
          initialEnd={selectedSlotEnd}
          onClose={() => setEventModalOpen(false)}
          onAdd={handleAddEvent}
        />
      )}
    </section>
  );
};

export default StudentAssignment;
