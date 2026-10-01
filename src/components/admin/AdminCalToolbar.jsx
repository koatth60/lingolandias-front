import { Navigate } from "react-big-calendar";
import { useTranslation } from "react-i18next";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Shared toolbar for the admin calendars (availability picker + teacher schedule viewer).
const AdminCalToolbar = ({ label, onNavigate, onView, view }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-ll-subtle border-b border-ll-line flex-wrap gap-3">
      <div className="flex items-center gap-1.5">
        <div className="flex border border-ll-line2 rounded-lg overflow-hidden bg-ll-panel">
          <button onClick={() => onNavigate(Navigate.PREVIOUS)} title="Previous"
            className="w-8 h-8 grid place-items-center text-ll-ink2 hover:bg-ll-hover border-r border-ll-line">
            <FiChevronLeft size={16} />
          </button>
          <button onClick={() => onNavigate(Navigate.NEXT)} title="Next"
            className="w-8 h-8 grid place-items-center text-ll-ink2 hover:bg-ll-hover">
            <FiChevronRight size={16} />
          </button>
        </div>
        <button onClick={() => onNavigate(Navigate.TODAY)} className="ll-btn ll-btn-secondary ll-btn-sm">
          {t("common.today")}
        </button>
      </div>
      <span className="text-[13.5px] font-semibold text-ll-ink">{label}</span>
      <div className="flex items-center p-0.5 rounded-lg bg-ll-hover border border-ll-line">
        {["month", "week"].map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-md capitalize transition-colors ${
              view === v ? "bg-ll-panel text-ll-ink shadow-ll-1" : "text-ll-ink3 hover:text-ll-ink"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminCalToolbar;
