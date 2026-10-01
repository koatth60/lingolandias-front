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
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-ll-panel border border-ll-line"
      >

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FiAlertTriangle className="text-red-500" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-ll-ink">
                Remove Student
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ll-ink3 hover:text-ll-ink hover:bg-ll-hover transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <p className="text-ll-ink2 mb-6">
            Removing <span className="font-semibold text-ll-violet">{student.name} {student.lastName}</span>
          </p>

          <p className="text-sm text-ll-ink3 mb-6 p-4 bg-ll-subtle rounded-xl border border-ll-line">
            You can either remove the student completely (which will delete all
            their events and chats) or remove only selected events.
          </p>

          {/* Remove All Option */}
          <label className="flex items-center gap-3 p-4 bg-ll-subtle rounded-xl border border-ll-line cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={removeAll}
              onChange={() => setRemoveAll(!removeAll)}
              className="w-5 h-5 rounded border-gray-300 dark:border-ll-violet/30 text-ll-violet focus:ring-ll-violet"
            />
            <span className="text-ll-ink font-medium">
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
                      className="flex items-center justify-between p-3 bg-ll-subtle rounded-xl border border-ll-line cursor-pointer hover:border-ll-violet transition-colors"
                    >
                      <span className="text-ll-ink">
                        {event.day} at {event.time}
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedSlots.includes(slotKey)}
                        onChange={() => handleSlotSelection(slotKey)}
                        className="w-5 h-5 rounded border-gray-300 dark:border-ll-violet/30 text-ll-violet focus:ring-ll-violet"
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
              className="flex-1 py-3 px-4 rounded-xl bg-ll-hover text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!removeAll && selectedSlots.length === 0}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #E8A23A, #C4860A)',
                boxShadow: '0 4px 15px rgba(232,162,58,0.3)',
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