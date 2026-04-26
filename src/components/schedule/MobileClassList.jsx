import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import { FiCalendar, FiClock, FiVideo } from "react-icons/fi";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const MobileClassList = ({ events, onEventClick, user }) => {
  const { t, i18n } = useTranslation();

  // Group events by day, sorted chronologically, only future events
  const grouped = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter((e) => e.end > now)
      .sort((a, b) => a.start - b.start);

    const groups = {};
    for (const ev of upcoming) {
      const key = dayjs(ev.start).format("YYYY-MM-DD");
      if (!groups[key]) groups[key] = [];
      groups[key].push(ev);
    }
    return Object.entries(groups).slice(0, 14); // max 2 weeks ahead
  }, [events]);

  const formatDayLabel = (dateStr) => {
    const d = dayjs(dateStr);
    if (d.isToday()) return t("mobileSchedule.today");
    if (d.isTomorrow()) return t("mobileSchedule.tomorrow");
    return d.locale(i18n.language).format("dddd, MMM D");
  };

  if (events.length === 0) return null; // parent handles empty state

  return (
    <div className="space-y-4">
      {grouped.map(([dateStr, dayEvents]) => {
        const isTodayGroup = dayjs(dateStr).isToday();
        return (
          <div key={dateStr}>
            {/* Day header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isTodayGroup
                    ? "text-[#9E2FD0] dark:text-[#c084fc]"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {formatDayLabel(dateStr)}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
              {isTodayGroup && (
                <span className="w-2 h-2 rounded-full bg-[#26D9A1] animate-pulse" />
              )}
            </div>

            {/* Class cards */}
            <div className="space-y-2">
              {dayEvents.map((ev, i) => {
                const startTime = dayjs(ev.start).format("HH:mm");
                const endTime = dayjs(ev.end).format("HH:mm");
                const isNow =
                  new Date() >= ev.start && new Date() <= ev.end;
                const isSoon =
                  !isNow &&
                  ev.start - new Date() < 30 * 60 * 1000 &&
                  ev.start > new Date();

                return (
                  <button
                    key={`${ev.eventId}-${i}`}
                    onClick={() => onEventClick(ev)}
                    className="w-full text-left rounded-xl p-3.5 transition-all duration-150 active:scale-[0.98]
                               border border-gray-200 dark:border-white/10
                               bg-white dark:bg-white/[0.04]
                               hover:border-[#9E2FD0]/30 dark:hover:border-[#9E2FD0]/30
                               hover:shadow-md"
                    style={
                      isNow
                        ? {
                            borderColor: "rgba(38,217,161,0.5)",
                            background:
                              "linear-gradient(135deg, rgba(38,217,161,0.08), rgba(38,217,161,0.02))",
                            boxShadow: "0 2px 12px rgba(38,217,161,0.15)",
                          }
                        : isSoon
                        ? {
                            borderColor: "rgba(246,184,46,0.4)",
                            background:
                              "linear-gradient(135deg, rgba(246,184,46,0.06), rgba(246,184,46,0.02))",
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-3">
                      {/* Time block */}
                      <div className="flex-shrink-0 text-center w-14">
                        <p
                          className={`text-sm font-bold ${
                            isNow
                              ? "text-[#26D9A1]"
                              : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {startTime}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {endTime}
                        </p>
                      </div>

                      {/* Divider */}
                      <div
                        className="w-0.5 h-10 rounded-full flex-shrink-0"
                        style={{
                          background: isNow
                            ? "linear-gradient(180deg, #26D9A1, #1fa07a)"
                            : "linear-gradient(180deg, #9E2FD0, #7b22a8)",
                        }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {ev.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <FiClock
                            size={11}
                            className="text-gray-400 dark:text-gray-500"
                          />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            {dayjs(ev.end).diff(dayjs(ev.start), "minute")}{" "}
                            {t("mobileSchedule.min")}
                          </span>
                          {isNow && (
                            <span className="text-[10px] font-bold text-[#26D9A1] uppercase">
                              ● {t("mobileSchedule.live")}
                            </span>
                          )}
                          {isSoon && (
                            <span className="text-[10px] font-bold text-[#F6B82E] uppercase">
                              {t("mobileSchedule.soon")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Join icon */}
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{
                          background: isNow
                            ? "linear-gradient(135deg, #26D9A1, #1fa07a)"
                            : "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                          boxShadow: isNow
                            ? "0 2px 8px rgba(38,217,161,0.35)"
                            : "0 2px 8px rgba(158,47,208,0.25)",
                        }}
                      >
                        <FiVideo size={14} className="text-white" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileClassList;
