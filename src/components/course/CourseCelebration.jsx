import { useTranslation } from "react-i18next";
import { FiAward, FiX } from "react-icons/fi";

const CONFETTI_COLORS = ["#6A2BD8", "#E8A23A", "#1FA48C", "#B89EFF"];
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
      className="relative overflow-hidden rounded-xl mb-6 border border-ll-line bg-ll-panel"
      style={{ animation: "courseCelebrationPop 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
    >
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

      <div className="relative z-10 flex items-start sm:items-center gap-4 p-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-violet-tint text-ll-violet-ink">
          <FiAward size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-ll-ink">{t("course.celebrationTitle")}</h3>
          <p className="text-[13.5px] text-ll-ink2 mt-0.5">{t("course.celebrationBody")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onDismiss} className="hidden sm:inline-flex ll-btn ll-btn-primary ll-btn-sm">
            {t("course.celebrationCta")}
          </button>
          <button
            onClick={onDismiss}
            className="w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink3 hover:bg-ll-hover hover:text-ll-ink transition-colors"
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
