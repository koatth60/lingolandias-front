import HalloweenWeb from "../common/HalloweenWeb";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { selectUserInfo, selectAllSchedules, selectAllUsers } from "../../redux/selectors";
import { setSchedulesData } from "../../redux/schedulesSlice";
import { FiVideo } from "react-icons/fi";
import AdminStats from "./AdminStats";
import LanguageFilter from "./LanguageFilter";
import ClassCard from "./ClassCard";
import QuickActions from "./QuickActions";
import AdminChatViewModal from "./AdminChatViewModal";
import RecordingsModal from "./RecordingsModal";

import { getTodayDayName } from "../../data/dateUtils";
import { filterUsers } from "../../data/userUtils";
import { getTodaysSchedules, organizeClassesByLanguage } from "../../data/scheduleUtils";
import { getFilteredClasses } from "../../data/filterClasses";

const AdminHomeDashboard = () => {
  const [activeSection, setActiveSection] = useState("all");
  const [loading, setLoading] = useState(true);
  const [chatModal, setChatModal] = useState(null); // holds classItem or null
  const [showRecordings, setShowRecordings] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const admin = useSelector(selectUserInfo);
  const allSchedules = useSelector(selectAllSchedules);
  const allUsers = useSelector(selectAllUsers);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/users/admin-dashboard`);
        const { users, schedules } = await res.json();
        dispatch(setSchedulesData({ schedules, users }));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Re-derives instantly whenever allSchedules or allUsers changes in Redux
  const todaysClasses = useMemo(() => {
    const todaysSchedules = getTodaysSchedules(allSchedules);
    return organizeClassesByLanguage(todaysSchedules, allUsers);
  }, [allSchedules, allUsers]);

  const { teachers, allStudents, unassignedStudents } = useMemo(
    () => filterUsers(allUsers),
    [allUsers]
  );
  const filteredClasses = useMemo(
    () => getFilteredClasses(activeSection, todaysClasses),
    [activeSection, todaysClasses]
  );

  // Join class as a silent admin observer — room is the student's ID for a
  // 1:1 class, or the class's own shared roomId for a group class. Passes
  // the same full param set the real teacher/student join flow uses
  // (joinClassHandler.js) so the in-call chat panel resolves the right
  // conversation — safe to do even though admin isn't a real participant,
  // since JitsiClassRoom skips the "ensure DM"/"ring the other side" side
  // effects entirely for role==='admin'.
  const handleJoinClass = (classItem) => {
    const roomId = classItem.roomId || classItem.studentId;
    navigate("/classroom", {
      state: {
        roomId,
        chatRoomId: roomId,
        otherUserId: classItem.studentId,
        chatName: classItem.groupName || classItem.studentName,
        chatType: classItem.groupName ? "group" : "private",
        userName: admin.name,
        email: admin.email,
        // Tells JitsiClassRoom to join camera/mic muted by default — the
        // admin is here to observe, not participate. Note this is not full
        // invisibility: Jitsi still shows a (muted) tile for them in the
        // room unless/until the server's own "visitor" mode is set up.
        observer: true,
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
              border: "3px solid rgb(var(--ll-violet) / 0.15)",
              borderTopColor: "rgb(var(--ll-violet))",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p className="text-[13px] text-ll-ink3">{t("adminHome.loading")}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="relative w-full max-w-6xl mx-auto px-3 sm:px-7 py-6 sm:py-8 space-y-8 overflow-x-hidden">
        <HalloweenWeb />

        {/* ── Header ── */}
        <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="hw-gothic text-[30px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.05] text-ll-ink">
              {t("adminHome.adminDashboard")}
            </h1>
            <p className="text-[14px] text-ll-ink3 mt-2">
              {t("adminHome.todayClasses", { day: getTodayDayName() })}
            </p>
          </div>
          <button onClick={() => setShowRecordings(true)} className="ll-btn ll-btn-secondary self-start sm:self-auto flex-shrink-0">
            <FiVideo size={15} />
            {t("adminHome.classRecordings")}
          </button>
        </section>

        {/* ── Stats ── */}
        <AdminStats
          teachersCount={teachers.length}
          studentsCount={allStudents.length}
          unassignedStudentsCount={unassignedStudents.length}
          totalUsers={allUsers.length}
          todaysClassesCount={filteredClasses.length}
        />

        {/* ── Today's Classes ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[13.5px] font-semibold text-ll-ink">{t("adminHome.todaysClasses")}</h2>
            <span className="font-mono text-[11.5px] text-ll-ink3 px-1.5 py-px rounded-[5px] bg-ll-hover">{filteredClasses.length}</span>
          </div>

          <LanguageFilter activeSection={activeSection} setActiveSection={setActiveSection} />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
            <div className="text-center py-14 rounded-xl border border-dashed border-ll-line2 bg-ll-subtle">
              <h3 className="text-[14px] font-semibold text-ll-ink mb-1">
                {t("adminHome.noClasses", { day: getTodayDayName() })}
              </h3>
              <p className="text-[13px] text-ll-ink3">{t("adminHome.checkSchedule")}</p>
            </div>
          )}
        </section>

        <QuickActions />
      </main>

      {/* ── Chat observer modal ── */}
      {chatModal && (
        <AdminChatViewModal
          classItem={chatModal}
          adminUserId={admin.id}
          onClose={() => setChatModal(null)}
        />
      )}

      {/* ── Recordings modal ── */}
      {showRecordings && (
        <RecordingsModal onClose={() => setShowRecordings(false)} />
      )}
    </>
  );
};

export default AdminHomeDashboard;
