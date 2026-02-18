import { useState } from "react";
import Swal from "sweetalert2";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import dayjs from "dayjs";
import { FiUserCheck, FiCalendar, FiClock, FiX, FiCheckCircle } from "react-icons/fi";

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
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState({ start: "", end: "" });
  const [teachersEvents, setTeachersEvents] = useState({});

  const localizer = dayjsLocalizer(dayjs);

  const studentsWithoutTeacher = students.filter((student) => student.teacher === null);

  const handleCalendarOpen = () => {
    if (selectedTeacher?.teacherSchedules) {
      const endDate = dayjs().add(1, "month");
      const formattedEvents = selectedTeacher.teacherSchedules.flatMap((event) => {
        const startTime = dayjs(event.startTime);
        const endTime = dayjs(event.endTime);
        return Array.from({ length: 4 }, (_, i) => {
          const start = startTime.add(i * 7, "day");
          const end = endTime.add(i * 7, "day");
          if (start.isBefore(endDate)) {
            return {
              title: selectedTeacher.role === "teacher" ? event.studentName : event.teacherName,
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
    setIsCalendarOpen(!isCalendarOpen);
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
      .then(() => { window.location.reload(); })
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

  const inputFocusStyle = (e) => {
    e.target.style.borderColor = "rgba(158,47,208,0.7)";
    e.target.style.background = "rgba(158,47,208,0.08)";
  };
  const inputBlurStyle = (e) => {
    e.target.style.borderColor = "rgba(255,255,255,0.12)";
    e.target.style.background = "rgba(255,255,255,0.05)";
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <FiUserCheck size={17} style={{ color: "#9E2FD0" }} />
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">Assign Student to Teacher</h2>
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
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Select a Student</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {studentsWithoutTeacher.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">No unassigned students.</p>
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
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Select a Teacher</h3>
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
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Set Schedule</h3>
            </div>

            <button
              onClick={handleCalendarOpen}
              disabled={!selectedTeacher || !selectedStudent}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 14px rgba(158,47,208,0.30)" }}
            >
              <FiCalendar size={14} /> View Availability
            </button>

            {events.length > 0 && (
              <div className="mt-4 flex-1">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Scheduled Classes</p>
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
              <FiUserCheck size={14} /> Assign Student
            </button>
          </div>
        </div>
      </div>

      {/* ── Calendar Modal ── */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
          <div
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
            style={{ background: "rgba(13,10,30,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
          >
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FiCalendar size={15} style={{ color: "#9E2FD0" }} />
                  {selectedTeacher?.name}'s Schedule
                </h3>
                <button onClick={() => setIsCalendarOpen(false)} className="text-gray-500 hover:text-white transition-colors p-1">
                  <FiX size={16} />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden">
                <Calendar
                  localizer={localizer}
                  events={teachersEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 400, width: "100%" }}
                  views={["month", "week"]}
                  selectable
                  onSelectSlot={handleSelectSlot}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Event Time Modal ── */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "rgba(13,10,30,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}
          >
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #F6B82E, #9E2FD0)" }} />
            <div className="relative z-10 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FiClock size={15} style={{ color: "#F6B82E" }} />
                  Add Class Time
                </h3>
                <button onClick={() => setEventModalOpen(false)} className="text-gray-500 hover:text-white transition-colors p-1">
                  <FiX size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                {selectedDate ? dayjs(selectedDate).format("dddd, MMMM D YYYY") : ""}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Start Time (HH:MM)</label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2" size={13} style={{ color: "#6b7280" }} />
                    <input
                      type="text"
                      placeholder="09:00"
                      name="start"
                      value={eventDetails.start}
                      onChange={handleEventDetailsChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 outline-none border transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">End Time (HH:MM)</label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 -translate-y-1/2" size={13} style={{ color: "#6b7280" }} />
                    <input
                      type="text"
                      placeholder="10:00"
                      name="end"
                      value={eventDetails.end}
                      onChange={handleEventDetailsChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 outline-none border transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #F6B82E, #d4981a)", boxShadow: "0 4px 14px rgba(246,184,46,0.28)" }}
                >
                  <FiClock size={14} /> Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StudentAssignment;
