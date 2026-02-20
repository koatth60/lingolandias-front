import { useState } from "react";
import { FiVideo, FiUsers, FiGlobe, FiArrowRight, FiRadio } from "react-icons/fi";
import { meetingRooms } from "../../constants";

const ROOMS = [
  {
    key: meetingRooms.english,
    label: "English Room",
    language: "English",
    code: "EN",
    tagline: "British & American English",
    description: "Coordinate lessons, share resources and host live sessions with the English teaching team.",
    color: "#9E2FD0",
    colorAlt: "#7b22a8",
    shadow: "rgba(158,47,208,0.35)",
    border: "rgba(158,47,208,0.30)",
    glow: "rgba(158,47,208,0.12)",
  },
  {
    key: meetingRooms.spanish,
    label: "Spanish Room",
    language: "Español",
    code: "ES",
    tagline: "Latin & Castilian Spanish",
    description: "Sync with the Spanish department, plan group activities and run real-time class reviews.",
    color: "#26D9A1",
    colorAlt: "#1fa07a",
    shadow: "rgba(38,217,161,0.30)",
    border: "rgba(38,217,161,0.30)",
    glow: "rgba(38,217,161,0.10)",
  },
  {
    key: meetingRooms.polish,
    label: "Polish Room",
    language: "Polski",
    code: "PL",
    tagline: "Central European Linguistics",
    description: "Bring the Polish teaching staff together for curriculum alignment and collaborative planning.",
    color: "#F6B82E",
    colorAlt: "#c8940f",
    shadow: "rgba(246,184,46,0.28)",
    border: "rgba(246,184,46,0.28)",
    glow: "rgba(246,184,46,0.10)",
  },
];

const AdminMeetingRooms = ({ onJoinMeeting }) => {
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <div className="w-full flex flex-col items-center gap-6 sm:gap-10 py-4 sm:py-6 px-2">

      {/* ── Section header ── */}
      <div className="text-center max-w-xl">
        {/* Live badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{
            background: "rgba(38,217,161,0.10)",
            border: "1px solid rgba(38,217,161,0.28)",
            color: "#26D9A1",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#26D9A1" }}
          />
          <FiRadio size={10} />
          Live Rooms Available
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold login-gradient-text mb-3">
          Teacher Meeting Rooms
        </h2>
        <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed">
          Join any active language department room to monitor sessions, coordinate with teachers,
          or facilitate live classes across all language tracks.
        </p>

        {/* Gradient rule */}
        <div
          className="h-px mt-5 mx-auto max-w-xs opacity-40"
          style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, #26D9A1, transparent)" }}
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
                      background: `linear-gradient(135deg, ${room.color}22, ${room.color}44)`,
                      border: `1.5px solid ${room.color}55`,
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
                    {room.label}
                  </h3>
                  <p
                    className="text-xs font-medium mt-0.5"
                    style={{ color: room.color, opacity: 0.65 }}
                  >
                    {room.tagline}
                  </p>
                </div>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed flex-1"
                  style={{ color: "#9ca3af" }}
                >
                  {room.description}
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
                      Teachers
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <FiGlobe size={11} />
                      Live
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
                    Join Room
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
          border: "1px solid rgba(158,47,208,0.12)",
          background: "rgba(158,47,208,0.04)",
        }}
      >
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-300">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(158,47,208,0.12)", border: "1px solid rgba(158,47,208,0.20)" }}
          >
            <FiVideo size={13} style={{ color: "#9E2FD0" }} />
          </div>
          <span className="text-xs leading-snug">
            Joining a room starts a live video session with all connected teachers in that department.
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#9E2FD0" }}>
          <FiUsers size={12} />
          3 active departments
        </div>
      </div>
    </div>
  );
};

export default AdminMeetingRooms;
