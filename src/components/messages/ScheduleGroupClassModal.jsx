import { useState } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FiX, FiCalendar, FiUsers } from "react-icons/fi";
import TimeInput from "../common/TimeInput";

const ScheduleGroupClassModal = ({ groupName, students, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !start || !end) {
      Swal.fire({
        title: "Error",
        text: t("messagesExtra.fillAllFields"),
        icon: "error",
        background: "#1a1a2e",
        color: "#fff",
        confirmButtonColor: "#9E2FD0",
      });
      return;
    }
    if (end <= start) {
      Swal.fire({
        title: "Error",
        text: t("messagesExtra.endAfterStart"),
        icon: "error",
        background: "#1a1a2e",
        color: "#fff",
        confirmButtonColor: "#9E2FD0",
      });
      return;
    }

    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);
    const startDateTime = dayjs(date).hour(startHours).minute(startMinutes).second(0);
    const endDateTime = dayjs(date).hour(endHours).minute(endMinutes).second(0);

    setSubmitting(true);
    await onConfirm({
      initialDateTime: startDateTime.toDate(),
      startTime: startDateTime.toDate(),
      endTime: endDateTime.toDate(),
      dayOfWeek: startDateTime.format("dddd"),
      recurrenceWeeks,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)" }}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute w-48 h-48 rounded-full bg-[#9E2FD0]/10 blur-3xl -top-24 -left-24" />
          <div className="absolute w-48 h-48 rounded-full bg-[#F6B82E]/10 blur-3xl -bottom-24 -right-24" />
        </div>

        <div className="relative z-10 p-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#9E2FD0] to-[#F6B82E] bg-clip-text text-transparent dark:text-white">
              {t("messagesExtra.scheduleClassTitle")}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <FiX size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-1">
            <span className="font-semibold text-[#9E2FD0]">{groupName}</span>
          </p>
          <div className="flex items-center gap-1.5 mb-5 text-xs text-gray-500 dark:text-gray-400">
            <FiUsers size={12} />
            <span>{students.map((s) => s.name).join(", ")}</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("messagesExtra.classDate")}
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("messagesExtra.startTime")}
              </label>
              <TimeInput value={start} onChange={setStart} className="w-full px-4 py-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("messagesExtra.endTime")}
              </label>
              <TimeInput value={end} onChange={setEnd} className="w-full px-4 py-3" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                {t("addEvent.recurrence")}
              </label>
              <div className="flex gap-2">
                {[
                  { value: 1, label: t("addEvent.everyWeek") },
                  { value: 2, label: t("addEvent.everyTwoWeeks") },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecurrenceWeeks(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      recurrenceWeeks === opt.value
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#9E2FD0]/20"
                    }`}
                    style={recurrenceWeeks === opt.value ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
            >
              {t("messagesExtra.skipScheduling")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 15px rgba(158,47,208,0.3)" }}
            >
              {submitting ? t("messagesExtra.creating") : t("messagesExtra.scheduleClassConfirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleGroupClassModal;
