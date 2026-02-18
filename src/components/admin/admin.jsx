import { useEffect, useState } from "react";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";
import UserModal from "./userModal";
import DeleteUserModal from "./deleteUserModal";
import { useSelector } from "react-redux";
import StudentAssignment from "./studentAssignment";
import RemoveStudent from "./RemoveStudent";
import DisplayAllStudents from "./DisplayAllStudents";
import { FiUserPlus, FiUserX, FiUsers, FiBookOpen, FiGrid } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const glassCard = {
  border: "1px solid rgba(158,47,208,0.15)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
};

const Admin = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState([]);

  const toggleUserModal = () => setShowUserModal(!showUserModal);
  const toggleDeleteModal = () => setShowDeleteModal(!showDeleteModal);

  useEffect(() => {
    fetch(`${BACKEND_URL}/users`)
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const teachers = users.filter((u) => u.role === "teacher");
  const students = users.filter((u) => u.role === "user" && u.teacher === null);
  const allStudents = users.filter((u) => u.role === "user");

  const stats = [
    { label: "Teachers", value: teachers.length, color: "#9E2FD0", icon: FiBookOpen },
    { label: "All Students", value: allStudents.length, color: "#26D9A1", icon: FiUsers },
    { label: "Unassigned", value: students.length, color: "#F6B82E", icon: FiGrid },
  ];

  return (
    <div className="flex w-full relative min-h-screen">
      {/* Page background */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "500px", height: "500px", top: "-5%", right: "0%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "10%", left: "5%" }} />
      </div>

      <Dashboard />

      <div className="w-full relative z-10 flex flex-col min-h-screen overflow-y-auto">
        <Navbar header="Admin Panel" />

        <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 flex flex-col gap-5 sm:gap-8">

          {/* ── Header row ── */}
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold login-gradient-text mb-1">
                Hello {user.name}, welcome to the Admin Interface
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Manage users, assign students to teachers, and oversee all platform activity.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
              <button
                onClick={toggleUserModal}
                className="flex items-center gap-2 text-white font-bold text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 14px rgba(38,217,161,0.35)" }}
              >
                <FiUserPlus size={15} /> Create User
              </button>
              <button
                onClick={toggleDeleteModal}
                className="flex items-center gap-2 text-white font-bold text-sm px-4 sm:px-5 py-2.5 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 4px 14px rgba(239,68,68,0.30)" }}
              >
                <FiUserX size={15} /> Delete User
              </button>
            </div>
          </div>

          {/* ── Quick stats ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {stats.map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden p-3 sm:p-4 flex items-center" style={glassCard}>
                <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }} />
                <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)" }} />
                <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 w-full">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg sm:text-xl font-extrabold leading-none" style={{ color }}>{value}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Assign Student ── */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />
            <div className="relative z-10 p-4 sm:p-6">
              <StudentAssignment teachers={teachers} students={students} />
            </div>
          </div>

          {/* ── Remove Student ── */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #ef4444, #f97316, transparent)" }} />
            <div className="relative z-10 p-4 sm:p-6">
              <RemoveStudent teachers={teachers} students={students} />
            </div>
          </div>

          {/* ── All Students ── */}
          <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
            <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)" }} />
            <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)" }} />
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #26D9A1, #9E2FD0, transparent)" }} />
            <div className="relative z-10 p-4 sm:p-6">
              <DisplayAllStudents students={allStudents} />
            </div>
          </div>

        </div>
      </div>

      <UserModal show={showUserModal} handleClose={toggleUserModal} />
      <DeleteUserModal show={showDeleteModal} handleClose={toggleDeleteModal} />
    </div>
  );
};

export default Admin;
