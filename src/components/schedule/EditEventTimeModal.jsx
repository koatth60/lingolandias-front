import { FiCheck, FiX, FiEdit2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import TimeInput from "../common/TimeInput";

// Opened directly from an event's "..." menu (see EventActionsMenu) — no more
// toggling a page-level "Edit Calendar" mode and re-clicking the event inside
// a mini calendar first. eventDetails/handleSubmitEvent come straight from
// useEventEdit; the caller is responsible for calling handleEventEdit(event)
// and setSelectedDate(event.start) before rendering this.
const EditEventTimeModal = ({ eventTitle, eventDetails, handleEventDetailsChange, handleSubmitEvent, onClose }) => {
  const { t } = useTranslation();
  const setField = (name) => (value) => handleEventDetailsChange({ target: { name, value } });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-ll-panel border border-ll-line"
      >

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 min-w-0">
              <FiEdit2 className="text-ll-violet flex-shrink-0" size={20} />
              <h3 className="text-xl font-bold text-ll-ink truncate">
                {eventTitle || t("editEvent.editEvent")}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-ll-ink3 hover:text-ll-ink hover:bg-ll-hover transition-colors flex-shrink-0"
            >
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmitEvent}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("editEvent.startTime")}
                </label>
                <TimeInput value={eventDetails.start || ""} onChange={setField("start")} className="w-full px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("editEvent.endTime")}
                </label>
                <TimeInput value={eventDetails.end || ""} onChange={setField("end")} className="w-full px-4 py-3" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #1FA48C, #17886F)", boxShadow: "0 4px 15px rgba(31,164,140,0.3)" }}
              >
                <FiCheck className="inline mr-2" size={16} />
                {t("editEvent.update")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-ll-hover text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/10 transition-all font-medium"
              >
                <FiX className="inline mr-2" size={16} />
                {t("editEvent.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEventTimeModal;
