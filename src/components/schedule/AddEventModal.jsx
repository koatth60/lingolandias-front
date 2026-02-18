import { useState } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { FiX, FiCalendar, FiClock } from "react-icons/fi";

const AddEventModal = ({
  student,
  teacherId,
  teacherName,
  onClose,
  onConfirm,
  isOpen,
}) => {
  const [eventDetails, setEventDetails] = useState({
    date: "",
    start: "",
    end: "",
  });

  if (!student || !isOpen) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const { date, start, end } = eventDetails;
    const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

    if (!date || !start || !end) {
      Swal.fire({
        title: "Error",
        text: "Please fill in all fields.",
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#9E2FD0',
      });
      return;
    }

    if (!timePattern.test(start) || !timePattern.test(end)) {
      Swal.fire({
        title: "Invalid Time Format",
        text: "Please use HH:MM format for start and end times.",
        icon: "warning",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#9E2FD0',
      });
      return;
    }

    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);

    const startDateTime = dayjs(date)
      .hour(startHours)
      .minute(startMinutes)
      .second(0);
    const endDateTime = dayjs(date)
      .hour(endHours)
      .minute(endMinutes)
      .second(0);

    const payload = {
      studentId: student.id,
      teacherId: teacherId,
      studentName: `${student.name} ${student.lastName}`,
      teacherName: teacherName,
      initialDateTime: startDateTime.toDate(),
      startTime: startDateTime.toDate(),
      endTime: endDateTime.toDate(),
      dayOfWeek: startDateTime.format("dddd"),
    };
    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div 
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)'
        }}
      >
        {/* Dark mode gradient */}
        <div className="dark:block hidden absolute inset-0" style={{ 
          background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)'
        }} />

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute w-48 h-48 rounded-full bg-[#9E2FD0]/10 blur-3xl -top-24 -left-24" />
          <div className="absolute w-48 h-48 rounded-full bg-[#F6B82E]/10 blur-3xl -bottom-24 -right-24" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#9E2FD0] to-[#F6B82E] bg-clip-text text-transparent dark:text-white">
              Add Event
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            for <span className="font-semibold text-[#9E2FD0]">{student.name} {student.lastName}</span>
          </p>

          <div className="space-y-5">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  name="date"
                  value={eventDetails.date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                />
              </div>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time (HH:MM)
              </label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="start"
                  placeholder="09:00"
                  value={eventDetails.start}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                />
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time (HH:MM)
              </label>
              <div className="relative">
                <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="end"
                  placeholder="10:00"
                  value={eventDetails.end}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white focus:border-[#9E2FD0] focus:ring-1 focus:ring-[#9E2FD0] transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)',
                boxShadow: '0 4px 15px rgba(158,47,208,0.3)',
              }}
            >
              Add Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;