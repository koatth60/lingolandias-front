import { 
  getTodayDayName,
  isScheduleToday, 
  formatTimeRange, 
  getDayNameFromDate, 
  getSortableTime 
} from './dateUtils';

export const organizeClassesByLanguage = (todaysSchedules, usersData) => {
  const classesByLanguage = {
    english: [],
    spanish: [],
    polish: []
  };
  
  todaysSchedules.forEach(schedule => {
    // Find teacher and student - EXACT SAME LOGIC
    const teacher = usersData.find(u => u.id === schedule.teacherId);
    const student = usersData.find(u => u.id === schedule.studentId);
    
    // Fallback to schedule names if user not found
    if (!teacher || !student) {
      console.log("Missing user data for schedule:", schedule);
      // Could create minimal class item with just schedule data
      // For now, skip
      return;
    }
    
    // Determine language - EXACT SAME LOGIC
    const language = teacher.language || 'English';
    const languageKey = language.toLowerCase().includes('spanish') ? 'spanish' : 
                      language.toLowerCase().includes('polish') ? 'polish' : 'english';
    
    const classItem = {
      id: schedule.id,
      teacherName: schedule.teacherName || `${teacher.name} ${teacher.lastName}`,
      teacherAvatar: teacher.avatarUrl || `https://ui-avatars.com/api/?name=${teacher.name}+${teacher.lastName}`,
      studentName: schedule.studentName || `${student.name} ${student.lastName}`,
      studentAvatar: student.avatarUrl || `https://ui-avatars.com/api/?name=${student.name}+${student.lastName}`,
      time: formatTimeRange(schedule.startTime, schedule.endTime),
      language: language,
      scheduleId: schedule.id,
      teacherId: teacher.id,
      studentId: student.id,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      actualDay: getDayNameFromDate(schedule.initialDateTime || schedule.startTime),
      sortableTime: getSortableTime(schedule.startTime) // Add for sorting
    };
    
    classesByLanguage[languageKey].push(classItem);
  });
  
  // Sort within each language group by sortableTime - EXACT SAME LOGIC
  Object.keys(classesByLanguage).forEach(lang => {
    classesByLanguage[lang].sort((a, b) => a.sortableTime - b.sortableTime);
  });
  
  return classesByLanguage;
};

export const fetchAllSchedules = async (BACKEND_URL, usersData) => {
  let allSchedules = [];
  
  try {
    const schedulesResponse = await fetch(`${BACKEND_URL}/schedules`);
    if (schedulesResponse.ok) {
      allSchedules = await schedulesResponse.json();
      console.log("Fetched schedules:", allSchedules.length);
    }
  } catch (err) {
    console.log("No /schedules endpoint, trying alternatives...");
    
    // Alternative: Try to get schedules from teachers - EXACT SAME LOGIC
    const teachers = usersData.filter(user => user.role === "teacher");
    for (const teacher of teachers) {
      try {
        const teacherSchedulesResponse = await fetch(`${BACKEND_URL}/teachers/${teacher.id}/schedules`);
        if (teacherSchedulesResponse.ok) {
          const teacherSchedules = await teacherSchedulesResponse.json();
          allSchedules.push(...teacherSchedules);
        }
      } catch (err2) {
        // Skip if no schedules for this teacher
      }
    }
  }
  
  // If still no schedules, check if schedules are included with users - EXACT SAME LOGIC
  if (allSchedules.length === 0) {
    console.log("Checking for schedules in user data...");
    usersData.forEach(user => {
      if (user.teacherSchedules && Array.isArray(user.teacherSchedules)) {
        console.log(`Found ${user.teacherSchedules.length} schedules for teacher ${user.name}`);
        allSchedules.push(...user.teacherSchedules);
      }
    });
  }
  
  return allSchedules;
};

export const getTodaysSchedules = (allSchedules) => {
  const todayDay = getTodayDayName(); // ADDED THIS LINE
  
  // Filter for today's classes using accurate day calculation - EXACT SAME LOGIC
  const todaysSchedules = allSchedules.filter(schedule => {
    const isToday = isScheduleToday(schedule);
    console.log(`Schedule ${schedule.id}: stored day=${schedule.dayOfWeek}, actual day=${getDayNameFromDate(schedule.initialDateTime || schedule.startTime)}, isToday=${isToday}`);
    return isToday;
  });
  
  console.log(`Today is ${todayDay}, found ${todaysSchedules.length} classes`); // FIXED THIS LINE
  
  // Debug: Show what we found
  todaysSchedules.forEach(schedule => {
    console.log(`Class today: ${schedule.teacherName} with ${schedule.studentName} at ${schedule.startTime}`);
  });
  
  // SORT by start time using sortable time value - EXACT SAME LOGIC
  todaysSchedules.sort((a, b) => {
    const timeA = getSortableTime(a.startTime);
    const timeB = getSortableTime(b.startTime);
    return timeA - timeB; // Ascending order
  });
  
  return todaysSchedules;
};