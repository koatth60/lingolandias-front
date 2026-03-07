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
    
    if (!teacher || !student) return;
    
    // Determine language - EXACT SAME LOGIC
    const language = teacher.language || 'English';
    const languageKey = language.toLowerCase().includes('spanish') ? 'spanish' : 
                      language.toLowerCase().includes('polish') ? 'polish' : 'english';
    
    const classItem = {
      id: schedule.id,
      teacherName: schedule.teacherName || `${teacher.name} ${teacher.lastName}`,
      teacherAvatar: teacher.avatarUrl || `https://ui-avatars.com/api/?name=${teacher.name}+${teacher.lastName}`,
      teacherEmail: teacher.email,
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

export const extractSchedulesFromUsers = (usersData) => {
  const allSchedules = [];
  usersData.forEach(user => {
    if (user.teacherSchedules && Array.isArray(user.teacherSchedules)) {
      allSchedules.push(...user.teacherSchedules);
    }
  });
  return allSchedules;
};

export const getTodaysSchedules = (allSchedules) => {
  return allSchedules
    .filter(isScheduleToday)
    .sort((a, b) => getSortableTime(a.startTime) - getSortableTime(b.startTime));
};