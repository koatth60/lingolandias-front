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
    <section
      className="relative rounded-2xl overflow-hidden shadow-sm dark:shadow-none"
      style={{ border: "1px solid rgba(158,47,208,0.22)", animation: "courseCelebrationPop 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      <div className="dark:hidden absolute inset-0 bg-white" />
      <div
        className="hidden dark:block absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.96) 0%, rgba(26,26,46,0.95) 100%)" }}
      />
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />
      <div
        className="absolute top-[-60px] right-[10%] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(158,47,208,0.14), transparent 70%)" }}
      />

      <button
        onClick={dismiss}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>

      <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Mini live preview of the sidebar entry — mirrors dashboard.jsx's own active-item styling exactly */}
        <div
          className="hidden sm:block flex-shrink-0 rounded-xl p-3 w-[168px]"
          style={{ background: "rgba(158,47,208,0.05)", border: "1px solid rgba(158,47,208,0.15)" }}
        >
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-gray-400 dark:text-gray-500">
            <FiHome size={14} />
            <span className="text-[11px] font-medium">{t("nav.dashboard")}</span>
          </div>
          <div
            className="relative flex items-center gap-2.5 px-2 py-2 rounded-lg mt-1"
            style={{
              background: "linear-gradient(135deg, rgba(158,47,208,0.16) 0%, rgba(246,184,46,0.07) 100%)",
              border: "1px solid rgba(158,47,208,0.35)",
            }}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-gradient-to-b from-[#9E2FD0] to-[#F6B82E]" />
            <FiBookOpen size={14} style={{ color: "#9E2FD0" }} />
            <span className="text-[11px] font-bold login-gradient-text">{t("nav.course")}</span>
            <span
              className="ml-auto w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ background: "#26D9A1", boxShadow: "0 0 6px rgba(38,217,161,0.7)", animation: "loginPulseOrb 2s ease-in-out infinite" }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(38,217,161,0.15)", color: "#1fa07a" }}
            >
              {t("course.announcementBadge")}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              {t("course.announcementTitle")}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
            {t(user.role === "teacher" ? "course.announcementBodyTeacher" : "course.announcementBodyStudent")}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={goToCourse}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #c084fc)", boxShadow: "0 4px 14px rgba(158,47,208,0.35)" }}
            >
              {t("course.announcementCta")} <FiArrowRight size={14} />
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              {t("course.announcementDismiss")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseAnnouncementBanner;
