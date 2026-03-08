import { useEffect, useRef, useState } from "react";
import { FiUsers, FiBookOpen, FiSearch, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LANG_CONFIG = {
  english: { labelKey: "admin.englishStudents", code: "EN", color: "#9E2FD0", glow: "rgba(158,47,208,0.10)", border: "rgba(158,47,208,0.22)" },
  spanish: { labelKey: "admin.spanishStudents", code: "ES", color: "#26D9A1", glow: "rgba(38,217,161,0.10)", border: "rgba(38,217,161,0.22)" },
  polish:  { labelKey: "admin.polishStudents",  code: "PL", color: "#F6B82E", glow: "rgba(246,184,46,0.10)",  border: "rgba(246,184,46,0.22)"  },
};

const StudentRow = ({ student }) => (
  <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5">
    {student.avatarUrl ? (
      <img
        src={student.avatarUrl}
        alt={`${student.name} ${student.lastName}`}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
    ) : (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        {student.name.charAt(0)}{student.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
        {student.name} {student.lastName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
    </div>
  </div>
);

const LangColumn = ({ lang, search, refreshKey }) => {
  const { t } = useTranslation();
  const cfg = LANG_CONFIG[lang];
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const currentSearch = useRef(search);

  const fetchPage = async (newSearch, newPage, append = false) => {
    if (newPage === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: "20", language: lang });
      if (newSearch?.trim()) params.set("search", newSearch.trim());
      const res = await fetch(`${BACKEND_URL}/users/students/paginated?${params}`);
      const data = await res.json();
      setStudents((prev) => append ? [...prev, ...data.data] : data.data);
      setTotal(data.total);
      setPage(newPage);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // On search change or refreshKey — reset to page 1
  useEffect(() => {
    currentSearch.current = search;
    fetchPage(search, 1, false);
  }, [search, lang, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    fetchPage(currentSearch.current, page + 1, true);
  };

  const hasMore = students.length < total;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ border: `1px solid ${cfg.border}` }}
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />
      <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
      <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />

      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs tracking-widest flex-shrink-0"
            style={{ background: cfg.glow, border: `1px solid ${cfg.border}`, color: cfg.color }}
          >
            {cfg.code}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">{t(cfg.labelKey)}</h3>
            <p className="text-xs font-medium" style={{ color: cfg.color }}>
              {total} {total === 1 ? t("admin.studentSingular") : t("admin.studentPlural")}
            </p>
          </div>
        </div>

        <div className="h-px mb-3 opacity-30" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

        {/* Student list */}
        <div className="overflow-y-auto custom-scrollbar space-y-1" style={{ maxHeight: "288px" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${cfg.color} transparent transparent transparent` }} />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FiUsers size={22} className="text-gray-400 dark:text-gray-600" />
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("admin.noStudentsYet")}</p>
            </div>
          ) : (
            students.map((student) => <StudentRow key={student.id} student={student} />)
          )}
        </div>

        {/* Load more */}
        {hasMore && !loading && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{ background: cfg.glow, border: `1px solid ${cfg.border}`, color: cfg.color }}
          >
            {loadingMore ? "…" : `${t("admin.loadMore")} (${total - students.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

const DisplayAllStudents = ({ refreshKey }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <section>
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FiBookOpen size={17} style={{ color: "#9E2FD0" }} />
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">{t("admin.allStudentsByLang")}</h2>
        </div>
        {/* Search bar */}
        <div className="relative sm:ml-auto w-full sm:w-64">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("admin.searchStudents")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded-xl text-sm outline-none border transition-colors duration-200
                       bg-white dark:bg-white/5 border-gray-200 dark:border-white/10
                       text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                       focus:border-purple-400 dark:focus:border-purple-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <FiX size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LangColumn lang="english" search={debouncedSearch} refreshKey={refreshKey} />
        <LangColumn lang="spanish" search={debouncedSearch} refreshKey={refreshKey} />
        <LangColumn lang="polish"  search={debouncedSearch} refreshKey={refreshKey} />
      </div>
    </section>
  );
};

export default DisplayAllStudents;
