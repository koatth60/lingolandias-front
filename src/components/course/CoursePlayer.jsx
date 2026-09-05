import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { updateUserSettings } from "../../redux/userSlice";
import { COURSE_SECTIONS, getCourseKeyForRole } from "../../data/courseData";
import CourseProgressRing from "./CourseProgressRing";
import CourseCelebration from "./CourseCelebration";

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const CoursePlayer = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo.user);
  const courseKey = getCourseKeyForRole(user.role);
  const sections = COURSE_SECTIONS[courseKey];
  const progress = user.settings?.courseProgress || {};

  const doneCount = sections.filter((s) => progress[s.id]).length;
  const totalCount = sections.length;
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const isComplete = doneCount === totalCount;

  const [currentId, setCurrentId] = useState(
    () => sections.find((s) => !progress[s.id])?.id || sections[0].id
  );
  const [durations, setDurations] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const wasCompleteRef = useRef(isComplete);
  const videoRef = useRef(null);

  // Only pop the confetti card the moment the user CROSSES into 100% this
  // session — not on every page load once they're already done, which would
  // just be noise for someone rewatching a section later.
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setShowCelebration(true);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);

  const currentIndex = Math.max(0, sections.findIndex((s) => s.id === currentId));
  const current = sections[currentIndex];
  const prev = sections[currentIndex - 1];
  const next = sections[currentIndex + 1];

  const setWatched = (id, value) => {
    dispatch(updateUserSettings({ courseProgress: { ...progress, [id]: value } }));
  };

  const handleLoadedMetadata = (e) => {
    const d = e.target.duration;
    if (Number.isFinite(d)) {
      setDurations((prevDurations) => ({ ...prevDurations, [current.id]: d }));
    }
  };

  const goTo = (id) => {
    setCurrentId(id);
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Progress header */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6"
        style={{ border: "1px solid rgba(158,47,208,0.15)" }}
      >
        <div className="dark:hidden absolute inset-0 bg-white" />
        <div
          className="hidden dark:block absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.96) 0%, rgba(26,26,46,0.95) 100%)" }}
        />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />
        <div className="relative z-10 flex flex-wrap items-center gap-5 p-5 sm:p-6">
          <CourseProgressRing percent={percent} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold login-gradient-text">{t("course.pageTitle")}</h1>
              {isComplete && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: "rgba(38,217,161,0.15)", color: "#1fa07a" }}
                >
                  <FiCheckCircle size={11} /> {t("course.complete")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t(user.role === "teacher" ? "course.subtitleTeacher" : "course.subtitleStudent")}
            </p>
            <p className="text-xs font-semibold text-[#9E2FD0] dark:text-[#c084fc] mt-1.5">
              {t("course.progress", { done: doneCount, total: totalCount })}
            </p>
          </div>
        </div>
      </div>

      {showCelebration && <CourseCelebration onDismiss={() => setShowCelebration(false)} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2">
          <div
            className="relative w-full rounded-2xl overflow-hidden bg-black"
            style={{ paddingTop: "56.25%", border: "1px solid rgba(158,47,208,0.2)" }}
          >
            <video
              ref={videoRef}
              key={current.id}
              src={current.url}
              className="absolute inset-0 w-full h-full"
              controls
              controlsList="nodownload"
              onEnded={() => setWatched(current.id, true)}
              onLoadedMetadata={handleLoadedMetadata}
            />
          </div>

          <div className="flex items-start justify-between gap-4 mt-4">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-[#9E2FD0] dark:text-[#c084fc] uppercase mb-1">
                {t("course.videoOf", { current: currentIndex + 1, total: totalCount })}
              </p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t(`course.items.${current.id}.title`)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t(`course.items.${current.id}.desc`)}
              </p>
            </div>
            <button
              onClick={() => setWatched(current.id, !progress[current.id])}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all duration-200 hover:opacity-90"
              style={
                progress[current.id]
                  ? { color: "#1fa07a", background: "rgba(38,217,161,0.12)" }
                  : { color: "#fff", background: "linear-gradient(135deg, #9E2FD0, #c084fc)", boxShadow: "0 4px 14px rgba(158,47,208,0.3)" }
              }
            >
              {progress[current.id] ? <FiCheckCircle size={14} /> : <FiCircle size={14} />}
              {t(progress[current.id] ? "course.markUnwatched" : "course.markWatched")}
            </button>
          </div>

          {(prev || next) && (
            <div className="flex items-stretch gap-3 mt-4">
              {prev && (
                <button
                  onClick={() => goTo(prev.id)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 transition-colors hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex-shrink-0"
                  style={{ border: "1px solid rgba(158,47,208,0.15)" }}
                >
                  <FiChevronLeft size={16} /> {t("course.previous")}
                </button>
              )}
              {next && (
                <button
                  onClick={() => goTo(next.id)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ border: "1px solid rgba(158,47,208,0.15)", background: "rgba(158,47,208,0.04)" }}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{t("course.next")}:</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                      {t(`course.items.${next.id}.title`)}
                    </span>
                  </span>
                  <FiChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sections list */}
        <div>
          <h3 className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-3 px-1">
            {t("course.sectionsTitle")}
          </h3>
          <div className="space-y-1.5">
            {sections.map((s, i) => {
              const watched = !!progress[s.id];
              const active = s.id === current.id;
              const Icon = s.icon;
              const dur = formatDuration(durations[s.id]);
              return (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200"
                  style={
                    active
                      ? {
                          background: "linear-gradient(135deg, rgba(158,47,208,0.13) 0%, rgba(246,184,46,0.06) 100%)",
                          border: "1px solid rgba(158,47,208,0.3)",
                        }
                      : { border: "1px solid transparent" }
                  }
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={
                      watched
                        ? { background: "rgba(38,217,161,0.15)", color: "#1fa07a" }
                        : active
                        ? { background: "linear-gradient(135deg, #9E2FD0, #c084fc)", color: "#fff" }
                        : { background: "rgba(158,47,208,0.08)", color: "#9E2FD0" }
                    }
                  >
                    {watched ? <FiCheckCircle size={15} /> : <Icon size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${active ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      {i + 1}. {t(`course.items.${s.id}.title`)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {t(`course.items.${s.id}.desc`)}
                    </p>
                  </div>
                  {dur && (
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0">{dur}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
