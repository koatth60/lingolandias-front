import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { FiX, FiAlertTriangle, FiTrash2 } from "react-icons/fi";

const RemoveStudentModal = ({ student, teacher, onClose, onConfirm, isOpen }) => {
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [removeAll, setRemoveAll] = useState(false);
  const [uniqueEvents, setUniqueEvents] = useState([]);

  useEffect(() => {
    if (isOpen && student && student.events) {
      const groupedEvents = student.events.reduce((acc, event) => {
        const day = dayjs(event.start).format("dddd");
        const time = dayjs(event.start).format("h:mm A");
        const key = `${day}-${time}`;
        if (!acc[key]) {
          acc[key] = { ...event, day, time };
        }
        return acc;
      }, {});
      const uniqueEventsList = Object.values(groupedEvents);
      setUniqueEvents(uniqueEventsList);
      setSelectedSlots([]);
    } else if (!isOpen) {
      setUniqueEvents([]);
      setSelectedSlots([]);
      setRemoveAll(false);
    }
  }, [isOpen, student]);

  if (!student || !isOpen) {
    return null;
  }

  const handleSlotSelection = (slotKey) => {
    setSelectedSlots((prev) =>
      prev.includes(slotKey)
        ? prev.filter((key) => key !== slotKey)
        : [...prev, slotKey]
    );
  };

  const handleConfirm = () => {
    const selectedEventIds = student.events
      .filter((event) => {
        const day = dayjs(event.start).format("dddd");
        const time = dayjs(event.start).format("h:mm A");
        const slotKey = `${day}-${time}`;
        return selectedSlots.includes(slotKey);
      })
      .map((event) => event.eventId);
    onConfirm({ events: selectedEventIds, removeAll });
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

        {/* Ambient glow orbs - rojizo para advertencia */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
          <div className="absolute w-48 h-48 rounded-full bg-red-500/10 blur-3xl -top-24 -left-24" />
          <div className="absolute w-48 h-48 rounded-full bg-orange-500/10 blur-3xl -bottom-24 -right-24" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FiAlertTriangle className="text-red-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Remove Student
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Removing <span className="font-semibold text-[#9E2FD0]">{student.name} {student.lastName}</span>
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-[#9E2FD0]/20">
            You can either remove the student completely (which will delete all
            their events and chats) or remove only selected events.
          </p>

          {/* Remove All Option */}
          <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-[#9E2FD0]/20 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={removeAll}
              onChange={() => setRemoveAll(!removeAll)}
              className="w-5 h-5 rounded border-gray-300 dark:border-[#9E2FD0]/30 text-[#9E2FD0] focus:ring-[#9E2FD0]"
            />
            <span className="text-gray-900 dark:text-white font-medium">
              Remove student completely
            </span>
          </label>

          {/* Events Selection */}
          {!removeAll && uniqueEvents.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select events to remove:
              </p>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {uniqueEvents.map((event) => {
                  const slotKey = `${event.day}-${event.time}`;
                  return (
                    <label
                      key={slotKey}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-[#9E2FD0]/20 cursor-pointer hover:border-[#9E2FD0] transition-colors"
                    >
                      <span className="text-gray-800 dark:text-white">
                        {event.day} at {event.time}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedSlots.includes(slotKey)}
                        onChange={() => handleSlotSelection(slotKey)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-[#9E2FD0]/30 text-[#9E2FD0] focus:ring-[#9E2FD0]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #F6B82E, #d49c1f)',
                boxShadow: '0 4px 15px rgba(246,184,46,0.3)',
              }}
            >
              <FiTrash2 size={16} />
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveStudentModal;