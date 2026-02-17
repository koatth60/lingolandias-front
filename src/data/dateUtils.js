// Helper functions for date calculations
export const getTodayDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

export const getDayNameFromDate = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(dateString);
  return days[date.getDay()];
};

export const formatTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const options = { hour: 'numeric', minute: '2-digit', hour12: true };
  return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)}`;
};

export const getSortableTime = (dateString) => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours * 100 + minutes; // Converts 7:30 AM to 730, 1:15 PM to 1315
};

export const isScheduleToday = (schedule) => {
  const todayDay = getTodayDayName();
  
  // Calculate actual day from initialDateTime (most reliable)
  let actualDay = '';
  if (schedule.initialDateTime) {
    actualDay = getDayNameFromDate(schedule.initialDateTime);
  } else if (schedule.startTime) {
    actualDay = getDayNameFromDate(schedule.startTime);
  } else {
    // Fallback to stored dayOfWeek
    actualDay = schedule.dayOfWeek;
  }
  
  // For recurring classes, check if it's the same day of week
  return actualDay === todayDay;
};