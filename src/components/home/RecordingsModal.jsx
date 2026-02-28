import { useState, useEffect } from "react";
import { FiVideo, FiTrash2, FiExternalLink, FiX, FiUsers, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const formatSize = (bytes) => {
  if (!bytes) return "–";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const formatDate = (iso) => {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFilename = (filename) =>
  decodeURIComponent(filename).replace(/^\d+-/, "");

const RecordingCard = ({ rec, onDelete, deleting, t }) => (
  <div
    className="flex items-center justify-between gap-3 p-4 rounded-xl transition-all"
    style={{
      border: "1px solid rgba(158,47,208,0.15)",
      background: "rgba(255,255,255,0.03)",
    }}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(158,47,208,0.2), rgba(123,34,168,0.1))",
          border: "1px solid rgba(158,47,208,0.2)",
        }}
      >
        🎬
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {formatFilename(rec.filename)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(rec.lastModified)} · {formatSize(rec.size)}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-shrink-0">
      <a
        href={rec.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        <FiExternalLink size={12} />
        {t("recordings.view")}
      </a>
      <button
        onClick={() => onDelete(rec.key, rec.filename)}
        disabled={deleting === rec.key}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-80 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
      >
        <FiTrash2 size={12} />
        {deleting === rec.key ? "…" : t("recordings.delete")}
      </button>
    </div>
  </div>
);

const RecordingsModal = ({ onClose }) => {
  const [recordings, setRecordings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/upload/recordings`);
      const data = await res.json();
      // data: { [emailKey]: { displayName, recordings } }
      setRecordings(data);
      const keys = Object.keys(data);
      const nonOthers = keys.filter((k) => k !== "others");
      setActiveTeacher(nonOthers[0] || keys[0] || null);
    } catch (err) {
      console.error("Failed to fetch recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key, filename) => {
    const result = await Swal.fire({
      title: t("recordings.deleteTitle"),
      text: t("recordings.deleteText", { filename: formatFilename(filename) }),
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

  const teachers = Object.keys(recordings).filter((k) => k !== "others").sort();
  const hasOthers = "others" in recordings && recordings["others"]?.recordings?.length > 0;
  const allTabs = [...teachers, ...(hasOthers ? ["others"] : [])];
  const totalCount = Object.values(recordings).reduce(
    (sum, group) => sum + (group?.recordings?.length || 0),
    0
  );
  const currentRecordings = (recordings[activeTeacher]?.recordings || []).sort(
    (a, b) => new Date(b.lastModified) - new Date(a.lastModified)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          border: "1px solid rgba(158,47,208,0.25)",
          maxHeight: "85vh",
        }}
      >
        {/* Gradient bar */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(13,10,30,0.98) 0%, rgba(26,26,46,0.97) 100%)",
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[rgba(158,47,208,0.15)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
            >
              <FiVideo className="text-white" size={17} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t("recordings.title")}</h2>
              <p className="text-xs text-gray-400">
                {loading ? t("common.loading") : t("recordings.count", { count: totalCount })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRecordings}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title={t("recordings.refresh")}
            >
              <FiRefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

          {/* Sidebar */}
          {allTabs.length > 0 && (
            <div className="w-52 flex-shrink-0 border-r border-[rgba(158,47,208,0.12)] overflow-y-auto p-3 space-y-1">
              {allTabs.map((teacher) => {
                const group = recordings[teacher];
                const count = group?.recordings?.length || 0;
                const displayName = group?.displayName || teacher;
                const isOthers = teacher === "others";
                const isActive = activeTeacher === teacher;
                return (
                  <button
                    key={teacher}
                    onClick={() => setActiveTeacher(teacher)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                    style={
                      isActive
                        ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }
                        : {}
                    }
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-2 min-w-0">
                        {isOthers ? (
                          <FiUsers size={13} className="flex-shrink-0 mt-0.5" />
                        ) : (
                          <FiVideo size={13} className="flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight">
                            {displayName}
                          </p>
                          {!isOthers && (
                            <p className="truncate text-[10px] opacity-60 leading-tight mt-0.5">
                              {teacher}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[rgba(158,47,208,0.15)] text-[#9E2FD0]"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center h-full py-20">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    border: "2px solid rgba(158,47,208,0.2)",
                    borderTopColor: "#9E2FD0",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : allTabs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <div className="text-5xl mb-4">🎥</div>
                <p className="font-semibold text-gray-400">{t("recordings.noRecordings")}</p>
                <p className="text-sm mt-1 text-gray-500">
                  {t("recordings.noRecordingsText")}
                </p>
              </div>
            ) : currentRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">{t("recordings.noRecordingsTeacher")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentRecordings.map((rec) => (
                  <RecordingCard
                    key={rec.key}
                    rec={rec}
                    onDelete={handleDelete}
                    deleting={deleting}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingsModal;
