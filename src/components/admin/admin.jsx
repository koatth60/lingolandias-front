import { useCallback, useEffect, useState } from "react";
import Dashboard from "../../sections/dashboard";
import Navbar from "../layout/navbar";
import UserModal from "./userModal";
import DeleteUserModal from "./deleteUserModal";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import StudentAssignment from "./studentAssignment";
import RemoveStudent from "./RemoveStudent";
import DisplayAllStudents from "./DisplayAllStudents";
import TeacherSchedulesViewer from "./TeacherSchedulesViewer";
import { FiUserPlus, FiUserX, FiUsers, FiBookOpen, FiGrid } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Admin = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo.user);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminStats, setAdminStats] = useState({ teacherCount: 0, studentCount: 0, unassignedCount: 0 });
  const [teachers, setTeachers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleUserModal = () => setShowUserModal(!showUserModal);
  const toggleDeleteModal = () => setShowDeleteModal(!showDeleteModal);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/users/admin-stats`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/users/teachers`).then((r) => r.json()),
    ])
      .then(([stats, teacherList]) => {
        setAdminStats(stats);
        setTeachers(Array.isArray(teacherList) ? teacherList : []);
      })
      .catch((err) => console.error("Error fetching admin data:", err));
  }, [refreshKey]);

  const stats = [
    { label: t("admin.teachers"), value: adminStats.teacherCount, tile: "bg-ll-violet-tint text-ll-violet-ink", icon: FiBookOpen },
    { label: t("admin.allStudents"), value: adminStats.studentCount, tile: "bg-ll-teal-tint text-ll-teal-ink", icon: FiUsers },
    { label: t("admin.unassigned"), value: adminStats.unassignedCount, tile: "bg-ll-gold-tint text-ll-gold-ink", icon: FiGrid },
  ];

  return (
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full relative z-10 flex flex-col min-w-0">
        <Navbar header={t("adminHome.adminPanel")} />

        <div className="px-3 sm:px-7 py-4 sm:py-6 flex flex-col gap-6 sm:gap-8 max-w-6xl w-full mx-auto">

          {/* ── Header row ── */}
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">
                {t("admin.hello", { name: user.name })}
              </h2>
              <p className="text-[13.5px] text-ll-ink3 mt-1 max-w-lg">
                {t("admin.subtitle")}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button onClick={toggleUserModal} className="ll-btn ll-btn-primary">
                <FiUserPlus size={15} /> {t("admin.createUser")}
              </button>
              <button onClick={toggleDeleteModal} className="ll-btn ll-btn-secondary !text-ll-danger">
                <FiUserX size={15} /> {t("admin.deleteUser")}
              </button>
            </div>
          </div>

          {/* ── Quick stats ── */}
          <div className="grid grid-cols-3 rounded-xl border border-ll-line divide-x divide-ll-line overflow-hidden">
            {stats.map(({ label, value, tile, icon: Icon }) => (
              <div key={label} className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tile}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="font-mono text-[20px] font-medium leading-none text-ll-ink">{value}</p>
                  <p className="text-[12px] text-ll-ink3 mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Sections: plain, separated by hairlines ── */}
          <section className="pt-6 border-t border-ll-line">
            <StudentAssignment teachers={teachers} onRefresh={refresh} refreshKey={refreshKey} />
          </section>

          <section className="pt-6 border-t border-ll-line">
            <RemoveStudent teachers={teachers} onRefresh={refresh} />
          </section>

          <section className="pt-6 border-t border-ll-line">
            <DisplayAllStudents refreshKey={refreshKey} />
          </section>

          <section className="pt-6 border-t border-ll-line">
            <h3 className="text-[15px] font-semibold text-ll-ink mb-4">
              {t("admin.teacherSchedulesTitle")}
            </h3>
            <TeacherSchedulesViewer teachers={teachers} />
          </section>

        </div>
      </div>

      <UserModal show={showUserModal} handleClose={toggleUserModal} onCreated={refresh} />
      <DeleteUserModal show={showDeleteModal} handleClose={toggleDeleteModal} onDeleted={refresh} teachers={teachers} />
    </div>
  );
};

export default Admin;
