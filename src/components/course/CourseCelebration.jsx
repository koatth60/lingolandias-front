import { useTranslation } from "react-i18next";
import { FiAward, FiX } from "react-icons/fi";

const CONFETTI_COLORS = ["#9E2FD0", "#F6B82E", "#26D9A1", "#c084fc"];
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 173) % 100,
  delay: (i * 0.09) % 1.2,
  duration: 1.6 + ((i * 37) % 10) / 10,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + (i % 3) * 3,
}));

const CourseCelebration = ({ onDismiss }) => {
  const { t } = useTranslation();

  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-6"
      style={{
        border: "1px solid rgba(158,47,208,0.3)",
        animation: "courseCelebrationPop 0.4s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(158,47,208,0.12) 0%, rgba(246,184,46,0.10) 100%)" }} />
      <div className="dark:hidden absolute inset-0 bg-white/60" />
      <div className="hidden dark:block absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.6), rgba(26,26,46,0.6))" }} />
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

      {/* Confetti burst — contained to this card, not the whole page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 0.4,
              background: c.color,
              animation: `courseConfettiFall ${c.duration}s ease-in ${c.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-start sm:items-center gap-4 p-5 sm:p-6">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #9E2FD0, #F6B82E)", boxShadow: "0 4px 14px rgba(158,47,208,0.35)" }}
        >
          <FiAward size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {t("course.celebrationTitle")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
            {t("course.celebrationBody")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDismiss}
            className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #c084fc)", boxShadow: "0 4px 14px rgba(158,47,208,0.3)" }}
          >
            {t("course.celebrationCta")}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCelebration;
