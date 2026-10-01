import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import { FiCalendar, FiClock, FiVideo } from "react-icons/fi";
import EventActionsMenu from "./EventActionsMenu";

dayjs.extend(isToday);
dayjs.extend(isTomorrow);

const MobileClassList = ({ events, onEventClick, onEditTime, onManageParticipants, user }) => {
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
            <div className="flex items-center gap-3 mb-2 px-1 text-[12.5px] font-medium">
              <span className={isTodayGroup ? "text-ll-violet-ink" : "text-ll-ink3"}>
                {formatDayLabel(dateStr)}
              </span>
              <div className="flex-1 h-px bg-ll-line" />
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
                  <div key={`${ev.eventId}-${i}`} className="relative">
                  <button
                    onClick={() => onEventClick(ev)}
                    className={`w-full text-left rounded-xl px-3.5 py-3 transition-colors border bg-ll-panel hover:bg-ll-subtle ${
                      isNow ? "border-ll-teal/50" : isSoon ? "border-ll-gold/50" : "border-ll-line"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Time block */}
                      <div className="flex-shrink-0 w-12">
                        <p className={`font-mono text-[14px] font-medium ${isNow ? "text-ll-teal-ink" : "text-ll-ink"}`}>
                          {startTime}
                        </p>
                        <p className="font-mono text-[11px] text-ll-ink3">{endTime}</p>
                      </div>

                      <div className={`w-0.5 h-9 rounded-full flex-shrink-0 ${isNow ? "bg-ll-teal" : "bg-ll-violet"}`} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-ll-ink truncate">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[12.5px] text-ll-ink3">
                          <FiClock size={12} />
                          <span>
                            {dayjs(ev.end).diff(dayjs(ev.start), "minute")} {t("mobileSchedule.min")}
                          </span>
                          {isNow && (
                            <span className="font-medium text-ll-teal-ink">● {t("mobileSchedule.live")}</span>
                          )}
                          {isSoon && (
                            <span className="font-medium text-ll-gold-ink">{t("mobileSchedule.soon")}</span>
                          )}
                        </div>
                      </div>

                      {/* Join icon + (teachers) the "..." menu, stacked so
                          neither one has to float over the other. */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        {user.role === "teacher" && (
                          <EventActionsMenu
                            alwaysVisible
                            onEditTime={() => onEditTime(ev)}
                            onManageParticipants={() => onManageParticipants(ev)}
                          />
                        )}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-ll-on-violet ${isNow ? "bg-ll-teal" : "bg-ll-violet"}`}>
                          <FiVideo size={15} />
                        </div>
                      </div>
                    </div>
                  </button>
                  </div>
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
