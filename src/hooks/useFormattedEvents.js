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
    if (user.role === "teacher" && user.teacherSchedules) {
      return projectSchedules(user.teacherSchedules, { rangeStart, rangeEnd, nameKey: "studentName" });
    } else if (user.role === "user" && user.studentSchedules) {
      return projectSchedules(user.studentSchedules, { rangeStart, rangeEnd, nameKey: "teacherName" });
    }
    return [];
  }, [user.role, user.teacherSchedules, user.studentSchedules, rangeStart, rangeEnd]);

  return formattedEvents;
};

export default useFormattedEvents;
