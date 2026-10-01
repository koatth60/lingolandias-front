import { FiArrowRight, FiClock } from "react-icons/fi";

const LEVEL_TINT = {
  "Beginner":     "bg-ll-teal-tint text-ll-teal-ink",
  "Intermediate": "bg-ll-gold-tint text-ll-gold-ink",
  "Advanced":     "bg-red-500/10 text-red-600 dark:text-red-400",
  "All Levels":   "bg-ll-violet-tint text-ll-violet-ink",
};

const CoursesCard = ({ title, description, image, button, level, duration }) => {
  const tint = LEVEL_TINT[level] || LEVEL_TINT["All Levels"];

  return (
    <div className="rounded-xl overflow-hidden flex flex-col border border-ll-line bg-ll-panel transition-shadow duration-200 hover:shadow-ll-2">
      <div className="relative overflow-hidden bg-ll-hover" style={{ height: "168px" }}>
        <img className="w-full h-full object-cover" src={image} alt={title} />
        <span className={`absolute top-3 left-3 inline-flex items-center h-5 px-2 rounded-full text-[11.5px] font-medium ${tint}`}>
          {level}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-[14.5px] font-semibold text-ll-ink mb-1.5 leading-snug">{title}</h3>
        <p className="text-[13px] text-ll-ink3 leading-relaxed flex-grow mb-3">{description}</p>

        <div className="flex items-center gap-1.5 text-[12px] text-ll-ink3 mb-3.5">
          <FiClock size={12} />
          <span>{duration}</span>
        </div>

        <button className="ll-btn ll-btn-secondary w-full justify-center group">
          {button}
          <FiArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
        </button>
      </div>
    </div>
  );
};

export default CoursesCard;
