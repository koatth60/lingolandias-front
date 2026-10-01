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
    <div className="max-w-6xl mx-auto">
      {/* Progress header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <CourseProgressRing percent={percent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">{t("course.pageTitle")}</h1>
            {isComplete && (
              <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11.5px] font-medium bg-ll-teal-tint text-ll-teal-ink">
                <FiCheckCircle size={11} /> {t("course.complete")}
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-ll-ink3 mt-0.5">
            {t(user.role === "teacher" ? "course.subtitleTeacher" : "course.subtitleStudent")}
          </p>
          <p className="text-[12.5px] font-medium text-ll-violet-ink mt-1">
            {t("course.progress", { done: doneCount, total: totalCount })}
          </p>
        </div>
      </div>

      {showCelebration && <CourseCelebration onDismiss={() => setShowCelebration(false)} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2">
          <div
            className="relative w-full rounded-xl overflow-hidden bg-black border border-ll-line"
            style={{ paddingTop: "56.25%" }}
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
              <p className="text-[12.5px] font-medium text-ll-violet-ink mb-1">
                {t("course.videoOf", { current: currentIndex + 1, total: totalCount })}
              </p>
              <h2 className="text-[17px] font-semibold text-ll-ink">
                {t(`course.items.${current.id}.title`)}
              </h2>
              <p className="text-[13.5px] text-ll-ink3 mt-1">
                {t(`course.items.${current.id}.desc`)}
              </p>
            </div>
            <button
              onClick={() => setWatched(current.id, !progress[current.id])}
              className={`ll-btn ll-btn-sm flex-shrink-0 ${progress[current.id] ? "bg-ll-teal-tint text-ll-teal-ink" : "ll-btn-primary"}`}
            >
              {progress[current.id] ? <FiCheckCircle size={14} /> : <FiCircle size={14} />}
              {t(progress[current.id] ? "course.markUnwatched" : "course.markWatched")}
            </button>
          </div>

          {(prev || next) && (
            <div className="flex items-stretch gap-3 mt-4">
              {prev && (
                <button onClick={() => goTo(prev.id)} className="ll-btn ll-btn-secondary flex-shrink-0 !h-auto py-2.5">
                  <FiChevronLeft size={16} /> {t("course.previous")}
                </button>
              )}
              {next && (
                <button
                  onClick={() => goTo(next.id)}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-ll-line bg-ll-subtle hover:bg-ll-hover transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[12.5px] text-ll-ink3 flex-shrink-0">{t("course.next")}:</span>
                    <span className="text-[13.5px] font-medium text-ll-ink truncate">
                      {t(`course.items.${next.id}.title`)}
                    </span>
                  </span>
                  <FiChevronRight size={16} className="text-ll-ink3 flex-shrink-0" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sections list */}
        <div>
          <h3 className="text-[13.5px] font-semibold text-ll-ink mb-2.5 px-1">
            {t("course.sectionsTitle")}
          </h3>
          <div className="space-y-0.5">
            {sections.map((s, i) => {
              const watched = !!progress[s.id];
              const active = s.id === current.id;
              const Icon = s.icon;
              const dur = formatDuration(durations[s.id]);
              return (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-[9px] text-left transition-colors ${active ? "bg-ll-violet-tint" : "hover:bg-ll-hover"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      watched ? "bg-ll-teal-tint text-ll-teal-ink" : active ? "bg-ll-violet text-ll-on-violet" : "bg-ll-hover text-ll-ink3"
                    }`}
                  >
                    {watched ? <FiCheckCircle size={15} /> : <Icon size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13.5px] truncate text-ll-ink ${active ? "font-semibold" : "font-medium"}`}>
                      {i + 1}. {t(`course.items.${s.id}.title`)}
                    </p>
                    <p className="text-[12px] text-ll-ink3 truncate mt-0.5">
                      {t(`course.items.${s.id}.desc`)}
                    </p>
                  </div>
                  {dur && (
                    <span className="font-mono text-[11px] text-ll-ink3 flex-shrink-0">{dur}</span>
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
