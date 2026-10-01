import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiBookOpen, FiHome, FiArrowRight, FiX } from "react-icons/fi";
import { updateUserSettings } from "../../redux/userSlice";

// Dismissible, non-modal announcement shown once on Home for anyone who
// hasn't seen it yet (new signups and pre-existing accounts alike) —
// points at the real sidebar location instead of a static screenshot, so it
// can never go stale and already matches light/dark mode for free.
const CourseAnnouncementBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo?.user);

  if (!user || user.role === "admin" || user.settings?.courseAnnouncementSeen) {
    return null;
  }

  const dismiss = () => dispatch(updateUserSettings({ courseAnnouncementSeen: true }));
  const goToCourse = () => {
    dismiss();
    navigate("/course");
  };

  return (
    <section className="ll-card relative" style={{ animation: "courseCelebrationPop 0.35s cubic-bezier(0.16,1,0.3,1) both" }}>
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-ll-ink3 hover:text-ll-ink hover:bg-ll-hover transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>

      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Mini live preview of the sidebar entry — mirrors dashboard.jsx's own active-item styling exactly */}
        <div className="hidden sm:block flex-shrink-0 rounded-lg p-2.5 w-[168px] bg-ll-subtle border border-ll-line">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md text-ll-ink4">
            <FiHome size={14} />
            <span className="text-[11px] font-medium">{t("nav.dashboard")}</span>
          </div>
          <div className="relative flex items-center gap-2.5 px-2 py-2 rounded-md mt-1 bg-ll-violet-tint text-ll-violet-ink font-medium">
            <FiBookOpen size={14} />
            <span className="text-[11px]">{t("nav.course")}</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ll-teal flex-shrink-0" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="ll-pill font-semibold" style={{ background: 'rgb(var(--ll-teal))', color: 'rgb(var(--ll-on-violet))' }}>
              {t("course.announcementBadge")}
            </span>
            <h2 className="text-[15px] font-semibold text-ll-ink">
              {t("course.announcementTitle")}
            </h2>
          </div>
          <p className="text-[13.5px] text-ll-ink2 leading-relaxed max-w-xl">
            {t(user.role === "teacher" ? "course.announcementBodyTeacher" : "course.announcementBodyStudent")}
          </p>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={goToCourse} className="ll-btn ll-btn-primary">
              {t("course.announcementCta")} <FiArrowRight size={13} />
            </button>
            <button onClick={dismiss} className="ll-btn ll-btn-ghost">
              {t("course.announcementDismiss")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseAnnouncementBanner;
