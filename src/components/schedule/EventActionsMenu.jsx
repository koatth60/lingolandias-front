import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FiMoreVertical, FiClock, FiUsers } from "react-icons/fi";

// Per-event "..." menu — the direct replacement for the old page-level
// "Actions → Edit Calendar" toggle. Clicking it opens a small menu anchored
// to THIS event with the two actions that used to require a two-step detour
// (toggle edit mode, then re-click the event). Portaled to <body> since the
// calendar's week/day grid clips overflow, which would otherwise cut the
// menu off.
const EventActionsMenu = ({ onEditTime, onManageParticipants, alwaysVisible = false }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: Math.max(8, rect.right - 176) });
    }
    setOpen((prev) => !prev);
  };

  // Deliberately no scroll-based auto-close: the calendar page uses
  // PerfectScrollbar, which fires its own synthetic scroll events on layout
  // changes (e.g. the very re-render this menu's own open state causes) —
  // a capture-phase window scroll listener was closing the menu the instant
  // it opened. Closing on an actual outside click/resize is enough.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title={t("schedule.eventMenuLabel")}
        className={
          alwaysVisible
            ? "p-1.5 rounded-lg text-gray-400 hover:text-[#9E2FD0] hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0"
            : "absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/25 text-white transition-opacity"
        }
      >
        <FiMoreVertical size={alwaysVisible ? 14 : 12} />
      </button>
      {open &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[100] w-44 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e]"
            style={{ top: coords.top, left: coords.left }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEditTime();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center gap-2"
            >
              <FiClock size={14} className="text-[#9E2FD0]" /> {t("schedule.editTimeMenuItem")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onManageParticipants();
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center gap-2 border-t border-gray-100 dark:border-white/5"
            >
              <FiUsers size={14} className="text-[#9E2FD0]" /> {t("schedule.manageParticipantsMenuItem")}
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default EventActionsMenu;
