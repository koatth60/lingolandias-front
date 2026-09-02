import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSmile } from "react-icons/fi";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Renders existing reaction pills (emoji + count, highlighted if the current
// user is in that emoji's list) plus a hover-revealed trigger that pops a
// small quick-react strip — mirrors Teams' own default reaction set. Each
// pill's title attribute lists who reacted (native tooltip, no extra fetch —
// reactions already carry {id, name} per person).
const MessageReactions = ({ reactions, currentUserId, onToggle, align = "start" }) => {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const closeOnOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("click", closeOnOutsideClick);
    return () => document.removeEventListener("click", closeOnOutsideClick);
  }, [pickerOpen]);

  const entries = Object.entries(reactions || {}).filter(([, reactors]) => reactors?.length);

  const pick = (emoji) => {
    onToggle(emoji);
    setPickerOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative flex flex-wrap items-center gap-1 mt-1 ${align === "end" ? "justify-end" : ""}`}
    >
      {entries.map(([emoji, reactors]) => {
        const mine = currentUserId && reactors.some((r) => r.id === currentUserId);
        const names = reactors.map((r) => (r.id === currentUserId ? t("messagesExtra.you") : r.name));
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            title={names.join(", ")}
            className={`flex items-center gap-1 text-[11px] leading-none px-1.5 py-0.5 rounded-full border transition-colors ${
              mine
                ? "bg-[#9E2FD0]/15 border-[#9E2FD0]/40 text-[#9E2FD0]"
                : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
            }`}
            style={{ boxShadow: mine ? "0 1px 4px rgba(158,47,208,0.15)" : "0 1px 3px rgba(20,20,40,0.06)" }}
          >
            <span>{emoji}</span>
            <span>{reactors.length}</span>
          </button>
        );
      })}

      <button
        onClick={() => setPickerOpen((v) => !v)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-gray-400 hover:text-[#9E2FD0] hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <FiSmile size={13} />
      </button>

      {pickerOpen && (
        <div
          className={`absolute z-20 bottom-full mb-1 flex gap-1 p-1.5 rounded-xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => pick(emoji)} className="text-base hover:scale-125 transition-transform">
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageReactions;
