import { useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer, Navigate } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./studentAssignment.css";
import dayjs from "dayjs";
import { FiUserCheck, FiCalendar, FiClock, FiX, FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const CalendarToolbar = ({ label, onNavigate, onView, view }) => {
  const { t } = useTranslation();
  return (
  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#13102a] border-b border-gray-200 dark:border-white/[0.08] flex-wrap gap-3">
    {/* Navigation */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigate(Navigate.PREVIOUS)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
        title="Previous"
      >
        <FiChevronLeft size={18} />
      </button>
      <button
        onClick={() => onNavigate(Navigate.TODAY)}
        className="px-4 h-9 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
      >
        {t("common.today")}
      </button>
      <button
        onClick={() => onNavigate(Navigate.NEXT)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
        title="Next"
      >
        <FiChevronRight size={18} />
      </button>
    </div>

    {/* Current label */}
    <span className="text-base font-extrabold text-gray-900 dark:text-white">{label}</span>

    {/* View switcher */}
    <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
      {["month", "week"].map((v) => (
        <button
          key={v}
          onClick={() => onView(v)}
          className={`px-4 h-8 rounded-lg text-sm font-bold capitalize transition-all ${
            view === v
              ? "text-white shadow-md"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const panelStyle = {
  border: "1px solid rgba(158,47,208,0.12)",
};

const UserRow = ({ person, selected, accentColor, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-all duration-150"
    style={
      selected
        ? {
            background: `${accentColor}14`,
            border: `1px solid ${accentColor}50`,
            boxShadow: `0 2px 10px ${accentColor}18`,
          }
        : {
            background: "transparent",
            border: "1px solid transparent",
          }
    }
    onMouseEnter={(e) => {
      if (!selected) e.currentTarget.style.background = "rgba(158,47,208,0.06)";
    }}
    onMouseLeave={(e) => {
      if (!selected) e.currentTarget.style.background = "transparent";
    }}
  >
    {person.avatarUrl ? (
      <img src={person.avatarUrl} alt={`${person.name} ${person.lastName}`} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: selected ? `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)` : "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        {person.name.charAt(0)}{person.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{person.name} {person.lastName}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{person.email}</p>
    </div>
    {selected && (
      <FiCheckCircle size={14} style={{ color: accentColor }} className="flex-shrink-0" />
    )}
  </div>
);

// eslint-disable-next-line react/prop-types
const StudentAssignment = ({ teachers, students }) => {
  const { t } = useTranslation();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({ start: "", end: "" });
  const [teachersEvents, setTeachersEvents] = useState([]);

  const localizer = dayjsLocalizer(dayjs);

  const studentsWithoutTeacher = students.filter((student) => student.teacher === null);

  const handleCalendarOpen = () => {
    if (selectedTeacher?.teacherSchedules?.length > 0) {
      const endDate = dayjs().add(2, "month");
      const formattedEvents = selectedTeacher.teacherSchedules.flatMap((event) => {
        const initialDate = dayjs(event.initialDateTime).local();
        const originalStart = dayjs(event.startTime).local();
        const originalEnd = dayjs(event.endTime).local();
        const eventDayOfWeek = initialDate.day();
        const durationMinutes = originalEnd.diff(originalStart, "minute");

        const now = dayjs().startOf("week").local();
        let firstOccurrence = now.startOf("day").day(eventDayOfWeek);
        if (firstOccurrence.isBefore(now)) {
          firstOccurrence = firstOccurrence.add(1, "week");
        }

        return Array.from({ length: 8 }, (_, i) => {
          const start = firstOccurrence
            .add(i * 7, "day")
            .set("hour", originalStart.hour())
            .set("minute", originalStart.minute())
            .set("second", 0);
          const end = start.add(durationMinutes, "minute");
          if (start.isBefore(endDate)) {
            return {
              title: event.studentName,
              start: start.toDate(),
              end: end.toDate(),
              studentId: event.studentId,
            };
          }
          return null;
        }).filter(Boolean);
      });
      setTeachersEvents(formattedEvents);
    }
    setIsCalendarOpen(true);
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setEventModalOpen(true);
  };

  const handleEventDetailsChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = () => {
    if (selectedDate && eventDetails.start && eventDetails.end) {
      const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timePattern.test(eventDetails.start) || !timePattern.test(eventDetails.end)) {
        Swal.fire({ title: "Invalid Time Format", text: "Please enter time in HH:MM format (24-hour).", icon: "warning", confirmButtonText: "Ok" });
        return;
      }
      const [startHours, startMinutes] = eventDetails.start.split(":").map(Number);
      const [endHours, endMinutes] = eventDetails.end.split(":").map(Number);
      const startDateTime = dayjs(selectedDate).hour(startHours).minute(startMinutes).second(0).millisecond(0).utc().toDate();
      const endDateTime = dayjs(selectedDate).hour(endHours).minute(endMinutes).second(0).millisecond(0).utc().toDate();
      const dayOfWeek = dayjs(selectedDate).format("dddd");
      const date = dayjs(selectedDate).format("YYYY-MM-DD");
      setEvents((prev) => [
        ...prev,
        {
          dayOfWeek, startTime: eventDetails.start, endTime: eventDetails.end, date,
          start: startDateTime, end: endDateTime,
          teacherName: `${selectedTeacher.name} ${selectedTeacher.lastName}`,
          studentName: `${selectedStudent.name} ${selectedStudent.lastName}`,
        },
      ]);
      setEventDetails({ start: "", end: "" });
      setEventModalOpen(false);
    }
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
          confirmButtonColor: "#9E2FD0",
          timer: 3000,
          timerProgressBar: true,
        }).then(() => window.location.reload());
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
      <div className="flex items-center gap-2 mb-5">
        <FiUserCheck size={17} style={{ color: "#9E2FD0" }} />
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">{t("admin.assignTitle")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── 1. Select Student ── */}
        <div className="relative rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #26D9A1, transparent)" }} />
          <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
          <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#26D9A1] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t("admin.selectStudentLabel")}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {studentsWithoutTeacher.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">{t("admin.noUnassigned")}</p>
              ) : (
                studentsWithoutTeacher.map((student) => (
                  <UserRow
                    key={student.id}
                    person={student}
                    selected={selectedStudent?.id === student.id}
                    accentColor="#26D9A1"
                    onClick={() => setSelectedStudent(student)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Select Teacher ── */}
        <div className="relative rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #9E2FD0, transparent)" }} />
          <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
          <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#9E2FD0] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t("admin.selectTeacherLabel")}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {teachers.map((teacher) => (
                <UserRow
                  key={teacher.id}
                  person={teacher}
                  selected={selectedTeacher?.id === teacher.id}
                  accentColor="#9E2FD0"
                  onClick={() => setSelectedTeacher(teacher)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── 3. Schedule ── */}
        <div className="relative rounded-2xl overflow-hidden flex flex-col min-h-[260px]" style={panelStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #F6B82E, transparent)" }} />
          <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
          <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
          <div className="relative z-10 p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#F6B82E] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t("admin.setSchedule")}</h3>
            </div>

            <button
              onClick={handleCalendarOpen}
              disabled={!selectedTeacher || !selectedStudent}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 14px rgba(158,47,208,0.30)" }}
            >
              <FiCalendar size={14} /> {t("admin.viewAvailability")}
            </button>

            {events.length > 0 && (
              <div className="mt-4 flex-1">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">{t("admin.scheduledClasses")}</p>
                <ul className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                  {events.map((event, index) => (
                    <li
                      key={index}
                      className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-2"
                      style={{ background: "rgba(38,217,161,0.08)", border: "1px solid rgba(38,217,161,0.18)", color: "#26D9A1" }}
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
              className="w-full mt-auto pt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 14px rgba(38,217,161,0.28)" }}
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
              border: "1px solid rgba(158,47,208,0.30)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              zIndex: 100000,
            }}
          >
            {/* gradient top bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
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
                  components={{ toolbar: CalendarToolbar }}
                  formats={{
                    timeGutterFormat: "HH:mm",
                    eventTimeRangeFormat: ({ start, end }) =>
                      `${dayjs(start).format("HH:mm")} – ${dayjs(end).format("HH:mm")}`,
                  }}
                  selectable
                  onSelectSlot={handleSelectSlot}
                  eventPropGetter={() => ({
                    style: {
                      background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
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

      {/* ── Event Time Modal — also on document.body ── */}
      {eventModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 100001 }}
          onClick={(e) => { if (e.target === e.currentTarget) setEventModalOpen(false); }}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0d0a1e]"
            style={{
              border: "1px solid rgba(158,47,208,0.30)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
              zIndex: 100002,
            }}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #F6B82E, #9E2FD0)" }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiClock size={15} style={{ color: "#F6B82E" }} />
                  {t("addEvent.addClassTime")}
                </h3>
                <button
                  onClick={() => setEventModalOpen(false)}
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.startTime")}</label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                      type="text"
                      placeholder="09:00"
                      name="start"
                      value={eventDetails.start}
                      onChange={handleEventDetailsChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 outline-none border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.endTime")}</label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                      type="text"
                      placeholder="10:00"
                      name="end"
                      value={eventDetails.end}
                      onChange={handleEventDetailsChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 outline-none border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #F6B82E, #d4981a)", boxShadow: "0 4px 14px rgba(246,184,46,0.28)" }}
                >
                  <FiClock size={14} /> {t("addEvent.add")}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default StudentAssignment;
