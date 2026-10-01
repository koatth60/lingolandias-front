import { alpha } from "../../utils/colorAlpha";
import { useState } from "react";
import { FiVideo, FiUsers, FiGlobe, FiArrowRight, FiRadio } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { meetingRooms } from "../../constants";

const ROOMS = [
  {
    key: meetingRooms.english,
    langKey: "english",
    language: "English",
    code: "EN",
    color: "rgb(var(--ll-violet))",
    colorAlt: "rgb(var(--ll-violet-hover))",
    shadow: "rgb(var(--ll-violet) / 0.35)",
    border: "rgb(var(--ll-violet) / 0.30)",
    glow: "rgb(var(--ll-violet) / 0.12)",
  },
  {
    key: meetingRooms.spanish,
    langKey: "spanish",
    language: "Español",
    code: "ES",
    color: "#1FA48C",
    colorAlt: "#17886F",
    shadow: "rgba(31,164,140,0.30)",
    border: "rgba(31,164,140,0.30)",
    glow: "rgba(31,164,140,0.10)",
  },
  {
    key: meetingRooms.polish,
    langKey: "polish",
    language: "Polski",
    code: "PL",
    color: "#E8A23A",
    colorAlt: "#c8940f",
    shadow: "rgba(232,162,58,0.28)",
    border: "rgba(232,162,58,0.28)",
    glow: "rgba(232,162,58,0.10)",
  },
];

const AdminMeetingRooms = ({ onJoinMeeting }) => {
  const { t } = useTranslation();
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <div className="w-full flex flex-col items-center gap-6 sm:gap-10 py-4 sm:py-6 px-2">

      {/* ── Section header ── */}
      <div className="text-center max-w-xl">
        {/* Live badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{
            background: "rgba(31,164,140,0.10)",
            border: "1px solid rgba(31,164,140,0.28)",
            color: "#1FA48C",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#1FA48C" }}
          />
          <FiRadio size={10} />
          {t("adminRooms.liveRooms")}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold login-gradient-text mb-3">
          {t("adminRooms.title")}
        </h2>
        <p className="text-ll-ink3 text-sm leading-relaxed">
          {t("adminRooms.subtitle")}
        </p>

        {/* Gradient rule */}
        <div
          className="h-px mt-5 mx-auto max-w-xs opacity-40"
          style={{ background: "linear-gradient(90deg, transparent, rgb(var(--ll-violet)), #E8A23A, #1FA48C, transparent)" }}
        />
      </div>

      {/* ── Room cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {ROOMS.map((room) => {
          const isHovered = hoveredKey === room.key;
          return (
            <div
              key={room.key}
              className="relative rounded-2xl overflow-hidden flex flex-col transition-transform duration-200"
              style={{
                border: `1px solid ${room.border}`,
                boxShadow: isHovered
                  ? `0 16px 40px ${room.shadow}, 0 0 0 1px ${room.border}`
                  : `0 6px 24px rgba(0,0,0,0.10)`,
                transform: isHovered ? "translateY(-4px)" : "none",
              }}
              onMouseEnter={() => setHoveredKey(room.key)}
              onMouseLeave={() => setHoveredKey(null)}
            >
              {/* Glass backgrounds */}
              <div
                className="absolute inset-0 dark:hidden"
                style={{
                  background: isHovered
                    ? `linear-gradient(160deg, rgba(255,255,255,0.97) 0%, ${room.glow} 100%)`
                    : "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                }}
              />
              <div
                className="absolute inset-0 hidden dark:block"
                style={{
                  background: isHovered
                    ? `linear-gradient(160deg, rgba(13,10,30,0.95) 0%, ${room.glow} 100%)`
                    : "rgba(13,10,30,0.88)",
                  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                }}
              />

              {/* Top colour accent */}
              <div
                className="absolute top-0 left-0 w-full h-[3px]"
                style={{ background: `linear-gradient(90deg, ${room.color}, ${room.colorAlt})` }}
              />

              {/* Card content */}
              <div className="relative z-10 flex flex-col h-full p-6 gap-4">
                {/* Code icon + language badge */}
                <div className="flex items-center justify-between">
                  {/* Styled language code — no flag emoji (Windows renders them as plain text) */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm tracking-widest"
                    style={{
                      background: `linear-gradient(135deg, ${alpha(room.color,"22")}, ${alpha(room.color,"44")})`,
                      border: `1.5px solid ${alpha(room.color,"55")}`,
                      color: room.color,
                    }}
                  >
                    {room.code}
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase"
                    style={{
                      background: room.glow,
                      border: `1px solid ${room.border}`,
                      color: room.color,
                    }}
                  >
                    {room.language}
                  </span>
                </div>

                {/* Title + tagline */}
                <div>
                  <h3
                    className="text-base font-extrabold leading-tight"
                    style={{ color: room.color }}
                  >
                    {t(`adminRooms.${room.langKey}.label`)}
                  </h3>
                  <p
                    className="text-xs font-medium mt-0.5"
                    style={{ color: room.color, opacity: 0.65 }}
                  >
                    {t(`adminRooms.${room.langKey}.tagline`)}
                  </p>
                </div>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed flex-1"
                  style={{ color: "#9ca3af" }}
                >
                  {t(`adminRooms.${room.langKey}.desc`)}
                </p>

                {/* Divider */}
                <div
                  className="h-px opacity-20"
                  style={{ background: `linear-gradient(90deg, ${room.color}, transparent)` }}
                />

                {/* Footer row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Meta icons */}
                  <div className="flex items-center gap-3" style={{ color: "#9ca3af" }}>
                    <span className="flex items-center gap-1 text-[10px]">
                      <FiUsers size={11} />
                      {t("adminRooms.teachers")}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <FiGlobe size={11} />
                      {t("adminRooms.live")}
                    </span>
                  </div>

                  {/* Join button */}
                  <button
                    onClick={() => onJoinMeeting(room.key)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all duration-150 hover:scale-[1.04] active:scale-[0.97] group"
                    style={{
                      background: `linear-gradient(135deg, ${room.color}, ${room.colorAlt})`,
                      boxShadow: `0 4px 14px ${room.shadow}`,
                    }}
                  >
                    <FiVideo size={12} />
                    {t("adminRooms.joinRoom")}
                    <FiArrowRight
                      size={11}
                      className="group-hover:translate-x-0.5 transition-transform duration-150"
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom info strip ── */}
      <div
        className="w-full max-w-4xl rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4"
        style={{
          border: "1px solid rgb(var(--ll-violet) / 0.12)",
          background: "rgb(var(--ll-violet) / 0.04)",
        }}
      >
        <div className="flex items-center gap-2 text-ll-ink3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgb(var(--ll-violet) / 0.12)", border: "1px solid rgb(var(--ll-violet) / 0.20)" }}
          >
            <FiVideo size={13} style={{ color: "rgb(var(--ll-violet))" }} />
          </div>
          <span className="text-xs leading-snug">
            {t("adminRooms.stripText")}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgb(var(--ll-violet))" }}>
          <FiUsers size={12} />
          {t("adminRooms.activeDepts")}
        </div>
      </div>
    </div>
  );
};

export default AdminMeetingRooms;
