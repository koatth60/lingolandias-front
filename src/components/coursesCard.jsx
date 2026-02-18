import { FiArrowRight, FiClock } from "react-icons/fi";

const LEVEL_COLORS = {
  "Beginner":     { color: "#26D9A1", bg: "rgba(38,217,161,0.15)",  border: "rgba(38,217,161,0.35)" },
  "Intermediate": { color: "#F6B82E", bg: "rgba(246,184,46,0.15)",  border: "rgba(246,184,46,0.35)" },
  "Advanced":     { color: "#ef4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)"  },
  "All Levels":   { color: "#9E2FD0", bg: "rgba(158,47,208,0.15)",  border: "rgba(158,47,208,0.35)" },
};

const CoursesCard = ({ title, description, image, button, level, duration }) => {
  const lc = LEVEL_COLORS[level] || LEVEL_COLORS["All Levels"];

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
      style={{ border: "1px solid rgba(158,47,208,0.15)", boxShadow: "0 6px 24px rgba(0,0,0,0.08)" }}
    >
      {/* Glass backgrounds */}
      <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }} />
      <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.80)", backdropFilter: "blur(12px)" }} />

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-[2px] z-10" style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

      {/* Image */}
      <div className="relative z-10 overflow-hidden" style={{ height: "180px" }}>
        <img className="w-full h-full object-cover" src={image} alt={title} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(13,10,30,0.55) 100%)" }} />
        {/* Level badge */}
        <span
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: lc.bg, border: `1px solid ${lc.border}`, color: lc.color, backdropFilter: "blur(8px)" }}
        >
          {level}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 flex flex-col flex-grow">
        <h3 className="text-base font-extrabold text-gray-800 dark:text-white mb-2 leading-snug">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-grow mb-4">{description}</p>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-4">
          <FiClock size={11} />
          <span>{duration}</span>
        </div>

        {/* Button */}
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
          style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 14px rgba(158,47,208,0.30)" }}
        >
          {button}
          <FiArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
        </button>
      </div>
    </div>
  );
};

export default CoursesCard;
