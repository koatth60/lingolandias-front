import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiUser, FiRefreshCw, FiVideo } from "react-icons/fi";
import Swal from "sweetalert2";
import RecordingCard from "./RecordingCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MyRecordingsPage = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo.user);
  const isTeacher = user?.role === "teacher";

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Teacher: grouped by student. Student: flat list.
  const [grouped, setGrouped] = useState({});
  const [activeStudent, setActiveStudent] = useState(null);
  const [flatList, setFlatList] = useState([]);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const res = await fetch(`${BACKEND_URL}/upload/recordings/teacher/${user.id}`);
        const data = await res.json();
        setGrouped(data);
        const keys = Object.keys(data);
        setActiveStudent((prev) => (prev && data[prev] ? prev : keys[0] || null));
      } else {
        const res = await fetch(`${BACKEND_URL}/upload/recordings/student/${user.id}`);
        const data = await res.json();
        setFlatList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isTeacher]);

  const handleDelete = async (key, filename) => {
    const result = await Swal.fire({
      title: t("recordings.deleteTitle"),
      text: t("recordings.deleteText", { filename }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("recordings.delete"),
      cancelButtonText: t("recordings.cancel"),
      background: "#1a1a2e",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#4b5563",
    });
    if (!result.isConfirmed) return;

    setDeleting(key);
    try {
      await fetch(`${BACKEND_URL}/upload/recording`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      await fetchRecordings();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  const students = Object.keys(grouped);
  const currentRecordings = isTeacher
    ? (grouped[activeStudent]?.recordings || []).slice().sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    : flatList.slice().sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  const totalCount = isTeacher
    ? Object.values(grouped).reduce((sum, g) => sum + (g?.recordings?.length || 0), 0)
    : flatList.length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">{t("recordings.title")}</h1>
          <p className="text-ll-ink3 mt-1 text-[13.5px]">
            {loading ? t("common.loading") : t("recordings.count", { count: totalCount })}
          </p>
        </div>
        <button
          onClick={fetchRecordings}
          className="w-[30px] h-[30px] grid place-items-center rounded-[7px] border border-ll-line text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink transition-colors"
          title={t("recordings.refresh")}
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-[3px] border-ll-violet/30 border-t-ll-violet animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6" style={{ minHeight: "50vh" }}>
          {isTeacher && (
            <div className="w-full md:w-60 md:flex-shrink-0">
              <div className="space-y-0.5 max-h-[70vh] overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-[12.5px] text-ll-ink3 text-center py-8">
                    {t("recordings.noRecordings")}
                  </p>
                ) : (
                  students.map((studentId) => {
                    const group = grouped[studentId];
                    const isActive = activeStudent === studentId;
                    return (
                      <button
                        key={studentId}
                        onClick={() => setActiveStudent(studentId)}
                        className={`w-full text-left px-3 py-2 rounded-[9px] text-[13.5px] font-medium transition-colors flex items-center justify-between gap-2 ${
                          isActive ? "bg-ll-violet-tint text-ll-violet-ink" : "text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FiUser size={13} className="flex-shrink-0" />
                          <span className="truncate">{group.displayName}</span>
                        </span>
                        <span
                          className={`flex-shrink-0 font-mono text-[11px] px-1.5 py-px rounded-[5px] ${
                            isActive ? "bg-ll-panel text-ll-violet-ink" : "bg-ll-hover text-ll-ink3"
                          }`}
                        >
                          {group.recordings.length}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {currentRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center bg-ll-violet-tint text-ll-violet-ink">
                  <FiVideo size={22} />
                </div>
                <p className="text-[14px] font-semibold text-ll-ink">{t("recordings.noRecordings")}</p>
                <p className="text-[13px] text-ll-ink3 mt-1">{t("recordings.noRecordingsText")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentRecordings.map((rec) => (
                  <RecordingCard
                    key={rec.key}
                    rec={rec}
                    onDelete={isTeacher ? handleDelete : undefined}
                    deleting={deleting}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecordingsPage;
