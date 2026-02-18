import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiGlobe } from "react-icons/fi";
import AdminStats from "./AdminStats";
import LanguageFilter from "./LanguageFilter";
import ClassCard from "./ClassCard";
import QuickActions from "./QuickActions";
import AdminChatViewModal from "./AdminChatViewModal";

import { getTodayDayName } from "../../data/dateUtils";
import { filterUsers } from "../../data/userUtils";
import { fetchAllSchedules, getTodaysSchedules, organizeClassesByLanguage } from "../../data/scheduleUtils";
import { getFilteredClasses } from "../../data/filterClasses";

const AdminHomeDashboard = () => {
  const [activeSection, setActiveSection] = useState("all");
  const [users, setUsers] = useState([]);
  const [todaysClasses, setTodaysClasses] = useState({ english: [], spanish: [], polish: [] });
  const [loading, setLoading] = useState(true);
  const [chatModal, setChatModal] = useState(null); // holds classItem or null

  const navigate = useNavigate();
  const admin = useSelector((state) => state.user.userInfo.user);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001/api";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersResponse = await fetch(`${BACKEND_URL}/users`);
        const usersData = await usersResponse.json();
        const allSchedules = await fetchAllSchedules(BACKEND_URL, usersData);
        const todaysSchedules = getTodaysSchedules(allSchedules);
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

  const { teachers, allStudents, unassignedStudents } = filterUsers(users);
  const filteredClasses = getFilteredClasses(activeSection, todaysClasses);

  // Join class as admin observer — room is the student's ID
  const handleJoinClass = (classItem) => {
    navigate("/classroom", {
      state: {
        roomId: classItem.studentId,
        userName: admin.name,
        email: admin.email,
      },
    });
  };

  // Open read-only chat modal
  const handleViewChat = (classItem) => {
    setChatModal(classItem);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8 h-screen flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4"
            style={{
              border: "3px solid rgba(158,47,208,0.15)",
              borderTopColor: "#9E2FD0",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">

        {/* ── Admin hero ── */}
        <section className="relative rounded-2xl overflow-hidden shadow-sm dark:shadow-none" style={{ border: "1px solid rgba(158,47,208,0.12)" }}>
          <div className="dark:hidden absolute inset-0 bg-white" />
          <div
            className="hidden dark:block absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.96) 0%, rgba(26,26,46,0.95) 100%)" }}
          />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />
          <div
            className="absolute top-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(158,47,208,0.18), transparent 70%)" }}
          />
          <div className="relative z-10 px-4 sm:px-10 py-6 sm:py-8">
            <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase mb-2">Admin Panel</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold login-gradient-text mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Today is <span className="font-semibold text-gray-700 dark:text-gray-300">{getTodayDayName()}</span> — showing classes scheduled for today.
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <AdminStats
          teachersCount={teachers.length}
          studentsCount={allStudents.length}
          unassignedStudentsCount={unassignedStudents.length}
          totalUsers={users.length}
          todaysClassesCount={filteredClasses.length}
        />

        {/* ── Today's Classes ── */}
        <section>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <FiGlobe className="text-[#9E2FD0]" size={20} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Today's Classes</h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}
            >
              {filteredClasses.length}
            </span>
          </div>

          <LanguageFilter activeSection={activeSection} setActiveSection={setActiveSection} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                onJoinClass={() => handleJoinClass(classItem)}
                onViewChat={() => handleViewChat(classItem)}
              />
            ))}
          </div>

          {filteredClasses.length === 0 && (
            <div
              className="relative rounded-2xl overflow-hidden text-center py-16 shadow-sm dark:shadow-none"
              style={{ border: "1px solid rgba(158,47,208,0.15)" }}
            >
              <div className="dark:hidden absolute inset-0 bg-white" />
              <div
                className="hidden dark:block absolute inset-0"
                style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.90), rgba(26,26,46,0.88))" }}
              />
              <div className="relative z-10">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
                  No classes scheduled for {getTodayDayName()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Check the schedule to add sessions.
                </p>
              </div>
            </div>
          )}
        </section>

        <QuickActions />
      </main>

      {/* ── Chat observer modal ── */}
      {chatModal && (
        <AdminChatViewModal
          classItem={chatModal}
          onClose={() => setChatModal(null)}
        />
      )}
    </>
  );
};

export default AdminHomeDashboard;
