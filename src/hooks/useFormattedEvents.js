import { useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { projectSchedules } from "../utils/scheduleProjection";

dayjs.extend(utc);
dayjs.extend(timezone);

// Default window used before the calendar reports its actual visible range (e.g. on
// first render) — matches the calendar's defaultView="week" so it's cheap, and gets
// replaced by the real visible range via `range` once the calendar mounts.
const DEFAULT_RANGE = {
  start: dayjs().startOf("week").toDate(),
  end: dayjs().add(1, "month").toDate(),
};

const useFormattedEvents = (user, range) => {
  const { start: rangeStart, end: rangeEnd } = range || DEFAULT_RANGE;

  const formattedEvents = useMemo(() => {
    let events = [];
    if (user.role === "teacher" && user.teacherSchedules) {
      events = projectSchedules(user.teacherSchedules, { rangeStart, rangeEnd, nameKey: "studentName" });
    } else if (user.role === "user" && user.studentSchedules) {
      events = projectSchedules(user.studentSchedules, { rangeStart, rangeEnd, nameKey: "teacherName" });
    }
    // A class tied to a group chat shows the same title for every viewer —
    // groupName overrides the normal per-role studentName/teacherName split.
    const withGroupTitles = events.map((event) =>
      event.groupName ? { ...event, title: event.groupName, isGroupClass: true } : event
    );
    // A group class creates one Schedule row per student sharing the same
    // roomId — a teacher who teaches 3 students in one class has 3 rows in
    // teacherSchedules, which would otherwise render as 3 stacked duplicate
    // blocks at the same time. Each student only ever has their own single
    // row, so this is a no-op on the student side.
    return withGroupTitles.filter((event, idx, all) => {
      if (!event.roomId) return true;
      const firstIdx = all.findIndex((e) => e.roomId === event.roomId && e.start.getTime() === event.start.getTime());
      return firstIdx === idx;
    });
  }, [user.role, user.teacherSchedules, user.studentSchedules, rangeStart, rangeEnd]);

  return formattedEvents;
};

export default useFormattedEvents;
