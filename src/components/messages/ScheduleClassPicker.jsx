import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer, Navigate } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../admin/studentAssignment.css";
import { FiCalendar, FiClock, FiX, FiUsers, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import TimeInput from "../common/TimeInput";
import { projectSchedules, normalizeCalendarRange } from "../../utils/scheduleProjection";

dayjs.extend(utc);

const CalendarToolbar = ({ label, onNavigate, onView, view }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#13102a] border-b border-gray-200 dark:border-white/[0.08] flex-wrap gap-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate(Navigate.PREVIOUS)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
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
        >
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

// Lets a teacher turn a group chat into a recurring class: shows their own
// busy schedule (same projection used by admin's assign-student flow) so
// they can pick a free slot, then confirm the time/recurrence/name. Confirm
// contract mirrors the old (dead, unwired) ScheduleGroupClassModal so nothing
// downstream cares which one produced the payload.
const ScheduleClassPicker = ({ teacherSchedules, students, defaultName, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const localizer = useMemo(() => dayjsLocalizer(dayjs), []);
  const [calendarRange, setCalendarRange] = useState(() => ({
    start: dayjs().startOf("week").toDate(),
    end: dayjs().endOf("week").toDate(),
  }));
  const busyEvents = useMemo(
    () =>
      projectSchedules(teacherSchedules || [], {
        rangeStart: calendarRange.start,
        rangeEnd: calendarRange.end,
        nameKey: "studentName",
      }),
    [teacherSchedules, calendarRange],
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [groupName, setGroupName] = useState(defaultName || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSelectSlot = ({ start: slotStart }) => {
    setSelectedDate(slotStart);
    setDetailsOpen(true);
  };

  const handleConfirm = async () => {
    if (!start || !end || !groupName.trim() || submitting) return;
    if (end <= start) {
      Swal.fire({
        title: "Error",
        text: t("addEvent.endBeforeStart"),
        icon: "error",
        background: "#1a1a2e",
        color: "#fff",
        confirmButtonColor: "#9E2FD0",
      });
      return;
    }
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startDateTime = dayjs(selectedDate).hour(startHours).minute(startMinutes).second(0).millisecond(0);
    const endDateTime = dayjs(selectedDate).hour(endHours).minute(endMinutes).second(0).millisecond(0);

    setSubmitting(true);
    await onConfirm({
      initialDateTime: startDateTime.toDate(),
      startTime: startDateTime.toDate(),
      endTime: endDateTime.toDate(),
      dayOfWeek: startDateTime.format("dddd"),
      recurrenceWeeks,
      groupName: groupName.trim(),
    });
    setSubmitting(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full rounded-2xl bg-white dark:bg-[#0d0a1e] flex flex-col"
        style={{ maxWidth: "min(1100px, 96vw)", height: "min(800px, 90vh)", border: "1px solid rgba(158,47,208,0.30)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", zIndex: 100000 }}
      >
        <div className="absolute top-0 left-0 w-full h-[3px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
              <FiCalendar size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">{t("messagesExtra.scheduleClassTitle")}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t("messagesExtra.scheduleClassHint")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <div className="rbc-admin-cal h-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.07]">
            <Calendar
              localizer={localizer}
              events={busyEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%", width: "100%" }}
              views={["month", "week"]}
              defaultView="week"
              defaultDate={new Date()}
              onRangeChange={(range) => setCalendarRange(normalizeCalendarRange(range))}
              components={{ toolbar: CalendarToolbar }}
              formats={{
                timeGutterFormat: "HH:mm",
                eventTimeRangeFormat: ({ start: s, end: e }) => `${dayjs(s).format("HH:mm")} – ${dayjs(e).format("HH:mm")}`,
              }}
              selectable
              onSelectSlot={handleSelectSlot}
              eventPropGetter={() => ({
                style: { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, padding: "2px 6px" },
              })}
            />
          </div>
        </div>
      </div>

      {detailsOpen &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 100001 }}
            onClick={(e) => { if (e.target === e.currentTarget) setDetailsOpen(false); }}
          >
            <div
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#0d0a1e]"
              style={{ border: "1px solid rgba(158,47,208,0.30)", boxShadow: "0 32px 64px rgba(0,0,0,0.5)", zIndex: 100002 }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] rounded-t-2xl" style={{ background: "linear-gradient(90deg, #F6B82E, #9E2FD0)" }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiClock size={15} style={{ color: "#F6B82E" }} />
                    {selectedDate ? dayjs(selectedDate).format("dddd, MMMM D") : ""}
                  </h3>
                  <button onClick={() => setDetailsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                    <FiX size={15} />
                  </button>
                </div>

                {!!students?.length && (
                  <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500 dark:text-gray-400">
                    <FiUsers size={12} />
                    <span>{students.map((s) => s.name).join(", ")}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                      {t("messagesExtra.eventNameLabel")}
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={defaultName}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.startTime")}</label>
                    <TimeInput value={start} onChange={setStart} className="w-full px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.endTime")}</label>
                    <TimeInput value={end} onChange={setEnd} className="w-full px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.recurrence")}</label>
                    <div className="flex gap-2">
                      {[{ value: 1, label: t("addEvent.everyWeek") }, { value: 2, label: t("addEvent.everyTwoWeeks") }].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRecurrenceWeeks(opt.value)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                            recurrenceWeeks === opt.value ? "text-white" : "text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                          }`}
                          style={recurrenceWeeks === opt.value ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={submitting || !start || !end || !groupName.trim()}
                    className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #F6B82E, #d4981a)", boxShadow: "0 4px 14px rgba(246,184,46,0.28)" }}
                  >
                    <FiClock size={14} /> {submitting ? t("messagesExtra.creating") : t("messagesExtra.scheduleClassConfirm")}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>,
    document.body,
  );
};

export default ScheduleClassPicker;
