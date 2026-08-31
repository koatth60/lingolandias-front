import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Projects one recurring schedule row into concrete calendar event instances,
 * but ONLY within [rangeStart, rangeEnd] — callers should pass whatever the
 * calendar is currently displaying (react-big-calendar's onRangeChange), not a
 * large fixed window. That's what keeps this cheap no matter how far someone
 * navigates, and removes the old hard cutoff (recurring classes used to just
 * stop appearing 1-2 months out, looking like the teacher had gone "free").
 *
 * Phase is anchored to the schedule's own `initialDateTime` (not "today") so
 * every-N-weeks recurrence (recurrenceWeeks > 1) lands on the correct weeks
 * regardless of when the calendar happens to be viewed. Existing schedules
 * have no recurrenceWeeks value and default to 1 (weekly) — identical
 * behavior to before, just range-bounded instead of count-bounded.
 */
export const projectSchedule = (schedule, { rangeStart, rangeEnd, nameKey, extra = {} }) => {
  if (!schedule?.initialDateTime || !schedule?.startTime || !schedule?.endTime) return [];

  const anchorDay = dayjs(schedule.initialDateTime).local().startOf("day");
  const originalStart = dayjs(schedule.startTime).local();
  const originalEnd = dayjs(schedule.endTime).local();
  const durationMinutes = originalEnd.diff(originalStart, "minute");
  const intervalWeeks = Math.max(1, schedule.recurrenceWeeks || 1);

  const start = dayjs(rangeStart);
  const end = dayjs(rangeEnd);

  // Land on the "on" week at or just before the range, then step forward from there.
  const weeksFromAnchor = start.diff(anchorDay, "week");
  let stepIndex = weeksFromAnchor < 0 ? -1 : Math.floor(weeksFromAnchor / intervalWeeks) - 1;

  const occurrences = [];
  for (let guard = 0; guard < 500; guard++) {
    stepIndex += 1;
    const occurrenceDay = anchorDay.add(stepIndex * intervalWeeks, "week");
    if (occurrenceDay.isAfter(end)) break;

    const occStart = occurrenceDay
      .set("hour", originalStart.hour())
      .set("minute", originalStart.minute())
      .set("second", 0);
    const occEnd = occStart.add(durationMinutes, "minute");

    if (occEnd.isAfter(start) && occStart.isBefore(end)) {
      occurrences.push({
        title: schedule[nameKey],
        start: occStart.toDate(),
        end: occEnd.toDate(),
        studentId: schedule.studentId,
        eventId: schedule.id,
        ...extra,
      });
    }
  }
  return occurrences;
};

export const projectSchedules = (schedules, { rangeStart, rangeEnd, nameKey, extra }) =>
  (schedules || []).flatMap((s) => projectSchedule(s, { rangeStart, rangeEnd, nameKey, extra }));

// react-big-calendar's onRangeChange gives either {start,end} (month view) or
// an array of visible dates (week/day view) — normalize both into {start, end}.
// In both cases "end" is midnight of the last visible day, not end-of-day, so
// it's bumped to endOf("day") here — otherwise any event later that day (e.g.
// a 8:30pm Saturday class) falls just outside the range and gets dropped.
export const normalizeCalendarRange = (range) => {
  const { start, end } = Array.isArray(range)
    ? { start: range[0], end: range[range.length - 1] }
    : { start: range.start, end: range.end };
  return { start, end: dayjs(end).endOf("day").toDate() };
};
