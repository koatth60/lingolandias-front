import { useState, useEffect } from "react";
import { FiGlobe } from "react-icons/fi";
import AdminStats from "./AdminStats";
import LanguageFilter from "./LanguageFilter";
import ClassCard from "./ClassCard";
import QuickActions from "./QuickActions";

const AdminHomeDashboard = () => {
  const [activeSection, setActiveSection] = useState("all");
  const [users, setUsers] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState({
    english: [],
    spanish: [],
    polish: []
  });
  const [loading, setLoading] = useState(true);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api";

  // Get today's day name
  const getTodayDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Get day name from a date string
  const getDayNameFromDate = (dateString) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  // Helper to format time from schedule
  const formatTimeRange = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)}`;
  };

  // Check if a schedule occurs today (using initialDateTime for day calculation)
  const isScheduleToday = (schedule) => {
    const today = new Date();
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

  // Helper to get sortable time value (hours + minutes as number)
  const getSortableTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * 100 + minutes; // Converts 7:30 AM to 730, 1:15 PM to 1315
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersResponse = await fetch(`${BACKEND_URL}/users`);
        const usersData = await usersResponse.json();
        
        // Try to fetch schedules directly
        let allSchedules = [];
        try {
          const schedulesResponse = await fetch(`${BACKEND_URL}/schedules`);
          if (schedulesResponse.ok) {
            allSchedules = await schedulesResponse.json();
            console.log("Fetched schedules:", allSchedules.length);
          }
        } catch (err) {
          console.log("No /schedules endpoint, trying alternatives...");
          
          // Alternative: Try to get schedules from teachers
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
        
        // If still no schedules, check if schedules are included with users
        if (allSchedules.length === 0) {
          console.log("Checking for schedules in user data...");
          usersData.forEach(user => {
            if (user.teacherSchedules && Array.isArray(user.teacherSchedules)) {
              console.log(`Found ${user.teacherSchedules.length} schedules for teacher ${user.name}`);
              allSchedules.push(...user.teacherSchedules);
            }
          });
        }
        
        console.log("Total schedules found:", allSchedules.length);
        
        // Filter for today's classes using accurate day calculation
        const todayDay = getTodayDayName();
        const todaysSchedules = allSchedules.filter(schedule => {
          const isToday = isScheduleToday(schedule);
          console.log(`Schedule ${schedule.id}: stored day=${schedule.dayOfWeek}, actual day=${getDayNameFromDate(schedule.initialDateTime || schedule.startTime)}, isToday=${isToday}`);
          return isToday;
        });
        
        console.log(`Today is ${todayDay}, found ${todaysSchedules.length} classes`);
        
        // Debug: Show what we found
        todaysSchedules.forEach(schedule => {
          console.log(`Class today: ${schedule.teacherName} with ${schedule.studentName} at ${schedule.startTime}`);
        });
        
        // SORT by start time using sortable time value
        todaysSchedules.sort((a, b) => {
          const timeA = getSortableTime(a.startTime);
          const timeB = getSortableTime(b.startTime);
          return timeA - timeB; // Ascending order
        });
        
        // Organize classes by language
        const classesByLanguage = {
          english: [],
          spanish: [],
          polish: []
        };
        
        todaysSchedules.forEach(schedule => {
          // Find teacher and student
          const teacher = usersData.find(u => u.id === schedule.teacherId);
          const student = usersData.find(u => u.id === schedule.studentId);
          
          // Fallback to schedule names if user not found
          if (!teacher || !student) {
            console.log("Missing user data for schedule:", schedule);
            // Could create minimal class item with just schedule data
            // For now, skip
            return;
          }
          
          // Determine language
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
        
        // Sort within each language group by sortableTime
        Object.keys(classesByLanguage).forEach(lang => {
          classesByLanguage[lang].sort((a, b) => a.sortableTime - b.sortableTime);
        });
        
        setUsers(usersData);
        setTodaysClasses(classesByLanguage);
        
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users
  const teachers = users.filter(user => user.role === "teacher");
  const allStudents = users.filter(user => user.role === "user");
  const unassignedStudents = users.filter(user => user.role === "user" && !user.teacherId);

  // Combine and sort classes for display by sortableTime
  const filteredClasses = activeSection === "all" 
    ? [...todaysClasses.english, ...todaysClasses.spanish, ...todaysClasses.polish]
        .sort((a, b) => a.sortableTime - b.sortableTime)
    : todaysClasses[activeSection] || [];

  const handleJoinClass = (classId) => {
    alert(`Joining class ${classId} as admin observer`);
  };

  const handleViewChat = (chatId) => {
    alert(`Opening chat: chat_${chatId}`);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-brand-purple mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3">
          Admin Dashboard
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Today is {getTodayDayName()} - Showing classes calculated from actual dates
        </p>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Schedules verified using initialDateTime to ensure accuracy
        </div>
      </section>

      {/* Stats Summary Card - Better Styling */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{teachers.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Teachers</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{allStudents.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Students</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{unassignedStudents.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unassigned</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{filteredClasses.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Today's Classes</div>
          </div>
        </div>
        
        {/* Today's Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Today's Schedule</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getTodayDayName()} • Sorted by time • {filteredClasses.length} classes
              </p>
            </div>
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Component */}
      <AdminStats 
        teachersCount={teachers.length}
        studentsCount={allStudents.length}
        unassignedStudentsCount={unassignedStudents.length}
        totalUsers={users.length}
        todaysClassesCount={filteredClasses.length}
      />

      {/* Language Navigation & Classes */}
      <section className="mb-10">
        <div className="flex items-center mb-8">
          <FiGlobe className="text-4xl text-purple-600 dark:text-brand-purple mr-4" />
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white">Today's Classes</h2>
          <span className="ml-4 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-semibold">
            {filteredClasses.length} classes
          </span>
        </div>
        
        <LanguageFilter 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        {/* Class Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onJoinClass={() => handleJoinClass(classItem.id)}
              onViewChat={() => handleViewChat(classItem.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              No classes scheduled for {getTodayDayName()}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Check console for schedule debugging information
            </p>
          </div>
        )}
      </section>

      <QuickActions />
    </main>
  );
};

export default AdminHomeDashboard;
