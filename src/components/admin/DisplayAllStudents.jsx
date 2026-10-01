import { useEffect, useRef, useState } from "react";
import { FiUsers, FiSearch, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LANG_CONFIG = {
  english: { labelKey: "admin.englishStudents", code: "EN", tile: "bg-ll-violet-tint text-ll-violet-ink" },
  spanish: { labelKey: "admin.spanishStudents", code: "ES", tile: "bg-ll-teal-tint text-ll-teal-ink" },
  polish:  { labelKey: "admin.polishStudents",  code: "PL", tile: "bg-ll-gold-tint text-ll-gold-ink" },
};

const StudentRow = ({ student }) => (
  <div className="flex items-center gap-3 py-2 px-2.5 rounded-[9px] transition-colors hover:bg-ll-hover">
    {student.avatarUrl ? (
      <img src={student.avatarUrl} alt={`${student.name} ${student.lastName}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 bg-ll-hover text-ll-ink2">
        {student.name.charAt(0)}{student.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[13.5px] font-medium text-ll-ink truncate">{student.name} {student.lastName}</p>
      <p className="text-[12px] text-ll-ink3 truncate">{student.email}</p>
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
    <div className="relative rounded-xl overflow-hidden flex flex-col border border-ll-line">
      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[11px] font-medium flex-shrink-0 ${cfg.tile}`}>
            {cfg.code}
          </div>
          <div className="min-w-0">
            <h3 className="text-[13.5px] font-semibold text-ll-ink leading-tight">{t(cfg.labelKey)}</h3>
            <p className="text-[12px] text-ll-ink3">
              <span className="font-mono">{total}</span> {total === 1 ? t("admin.studentSingular") : t("admin.studentPlural")}
            </p>
          </div>
        </div>

        {/* Student list */}
        <div className="overflow-y-auto custom-scrollbar space-y-1" style={{ maxHeight: "288px" }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-ll-violet/30 border-t-ll-violet animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <FiUsers size={22} className="text-ll-ink4" />
              <p className="text-[12.5px] text-ll-ink3">{t("admin.noStudentsYet")}</p>
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
            className="ll-btn ll-btn-secondary ll-btn-sm w-full justify-center mt-3 disabled:opacity-50"
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-ll-ink">{t("admin.allStudentsByLang")}</h2>
        </div>
        {/* Search bar */}
        <div className="relative sm:ml-auto w-full sm:w-64">
          <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3" />
          <input
            type="text"
            placeholder={t("admin.searchStudents")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 rounded-lg text-[13px] outline-none border border-ll-line2 bg-ll-panel text-ll-ink placeholder:text-ll-ink3 focus:border-ll-violet/60 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ll-ink3 hover:text-ll-ink">
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
