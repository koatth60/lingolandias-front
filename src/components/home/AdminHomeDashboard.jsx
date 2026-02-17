import { useState, useEffect } from "react";
import { FiGlobe } from "react-icons/fi";
import AdminStats from "./AdminStats";
import LanguageFilter from "./LanguageFilter";
import ClassCard from "./ClassCard";
import QuickActions from "./QuickActions";

// Import utility functions
import { getTodayDayName } from "../../data/dateUtils";
import { filterUsers, debugUserData } from "../../data/userUtils";
import { fetchAllSchedules, getTodaysSchedules, organizeClassesByLanguage } from "../../data/scheduleUtils";
import { getFilteredClasses } from "../../data/filterClasses";

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all users
        const usersResponse = await fetch(`${BACKEND_URL}/users`);
        const usersData = await usersResponse.json();

        // Fetch all schedules
        const allSchedules = await fetchAllSchedules(BACKEND_URL, usersData);
        console.log("Total schedules found:", allSchedules.length);
        
        // Get today's schedules
        const todaysSchedules = getTodaysSchedules(allSchedules);
        
        // Organize classes by language
        const classesByLanguage = organizeClassesByLanguage(todaysSchedules, usersData);
        
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

  // Filter users using utility function
  const { teachers, allStudents, unassignedStudents } = filterUsers(users);

  // Combine and sort classes for display
  const filteredClasses = getFilteredClasses(activeSection, todaysClasses);

  const handleJoinClass = (classId) => {
    alert(`Joining class ${classId} as admin observer`);
  };

  const handleViewChat = (chatId) => {
    alert(`Opening chat: chat_${chatId}`);
  };

if (loading) {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-brand-purple mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
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
          Today is {getTodayDayName()} - Showing classes scheduled for today.
        </p>
      </section>

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