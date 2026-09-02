import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiUser, FiRefreshCw } from "react-icons/fi";
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-800 dark:text-white">{t("recordings.title")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {loading ? t("common.loading") : t("recordings.count", { count: totalCount })}
          </p>
        </div>
        <button
          onClick={fetchRecordings}
          className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-white transition-all"
          style={{ border: "1px solid rgba(158,47,208,0.2)" }}
          title={t("recordings.refresh")}
        >
          <FiRefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-[#9E2FD0] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="flex gap-6" style={{ minHeight: "50vh" }}>
          {isTeacher && (
            <div className="w-64 flex-shrink-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(158,47,208,0.15)" }}>
              <div className="p-3 space-y-1 max-h-[70vh] overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
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
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                          isActive ? "text-white shadow-lg" : "text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-white/5"
                        }`}
                        style={isActive ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FiUser size={13} className="flex-shrink-0" />
                          <span className="truncate">{group.displayName}</span>
                        </span>
                        <span
                          className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? "bg-white/20 text-white" : "bg-[rgba(158,47,208,0.15)] text-[#9E2FD0]"
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

          <div className="flex-1">
            {currentRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
                <div className="text-5xl mb-4">🎥</div>
                <p className="font-semibold">{t("recordings.noRecordings")}</p>
                <p className="text-sm mt-1">{t("recordings.noRecordingsText")}</p>
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
