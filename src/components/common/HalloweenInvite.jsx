import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHalloween, isHalloweenSeason } from "../../context/HalloweenContext";
import { nextPrompt, readChoice, writeChoice } from "../../context/halloweenChoice";

// Seasonal flow, once per account (October only):
//   1. "invite"  – on sign-in, offers the Halloween theme and says where to undo it.
//   2. "confirm" – right after they try it: keep it for the rest of October, or go back.
// The answers are remembered (see halloweenChoice.js), so neither dialog repeats.
// Dialog text lives in the "halloween" i18n block (en / es / pl).

const Pumpkin = () => (
  <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
    <path d="M24 13c-.5-3.5 1-6 3.5-7.5" stroke="#3CCB8F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <ellipse cx="16" cy="28" rx="10" ry="12" fill="#D96A16" />
    <ellipse cx="32" cy="28" rx="10" ry="12" fill="#D96A16" />
    <ellipse cx="24" cy="28" rx="10" ry="13.5" fill="#F08A2C" />
    <path d="M15.5 25.5 19 21l3 4.5zM26 25.5 29 21l3.5 4.5z" fill="#FFD08A" />
    <path d="M15 32c5 5.5 13 5.5 18 0l-3 .8-2-1.8-2.5 1.9-2.5-1.9-2 1.8z" fill="#FFD08A" />
  </svg>
);

const HalloweenInvite = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo?.user);
  const { enabled, setEnabled } = useHalloween();
  const [prompt, setPrompt] = useState(null); // null | "invite" | "confirm"
  const decidedFor = useRef(null);
  const primaryRef = useRef(null);

  // Decide once per signed-in account, from what was stored and the theme state at that moment.
  useEffect(() => {
    if (!user?.id) {
      decidedFor.current = null;
      setPrompt(null);
      return;
    }
    if (decidedFor.current === user.id) return;
    decidedFor.current = user.id;
    setPrompt(nextPrompt({ seasonal: isHalloweenSeason(), enabled, choice: readChoice(user.id) }));
  }, [user?.id, enabled]);

  useEffect(() => {
    if (prompt) primaryRef.current?.focus();
  }, [prompt]);

  const notNow = () => {
    writeChoice(user.id, "declined");
    setPrompt(null);
  };
  const tryIt = () => {
    writeChoice(user.id, "trying");
    setEnabled(true);
    setPrompt("confirm");
  };
  const keep = () => {
    writeChoice(user.id, "kept");
    setPrompt(null);
  };
  const revert = () => {
    setEnabled(false);
    writeChoice(user.id, "declined");
    setPrompt(null);
  };

  if (!user || !prompt) return null;

  const isInvite = prompt === "invite";
  const onKeyDown = (e) => {
    // Esc only dismisses the invite; the follow-up needs an actual answer.
    if (e.key === "Escape" && isInvite) notNow();
  };

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-6 ${isInvite ? "bg-black/60" : "bg-black/35"} ll-fade-in`}
      onKeyDown={onKeyDown}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hw-dialog-title"
        aria-describedby="hw-dialog-body"
        className="ll-pop w-full sm:max-w-[26rem] bg-ll-panel border border-ll-line-2 sm:rounded-2xl rounded-t-2xl p-6 shadow-ll-pop"
        style={{
          borderColor: "rgb(var(--ll-line-2))",
          boxShadow: "0 1px 2px rgba(0,0,0,.4), 0 24px 60px -20px rgba(240,138,44,.4)",
          paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex-shrink-0 grid place-items-center"
            style={{ background: "radial-gradient(circle at 50% 60%,#3A1D0A,#1A0F24)" }}
          >
            <Pumpkin />
          </div>
          <h2
            id="hw-dialog-title"
            className="text-ll-ink leading-[1.1]"
            style={{ fontFamily: "'Pirata One', Georgia, serif", fontWeight: 400, fontSize: 26, letterSpacing: ".01em" }}
          >
            {isInvite ? t("halloween.inviteTitle") : t("halloween.confirmTitle")}
          </h2>
        </div>

        <p id="hw-dialog-body" className="mt-4 text-[14px] leading-[1.55] text-ll-ink2">
          {isInvite ? t("halloween.inviteBody") : t("halloween.confirmBody")}
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={isInvite ? notNow : revert}
            className="h-10 sm:h-9 px-4 rounded-lg text-[13.5px] font-medium text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink transition-colors"
          >
            {isInvite ? t("halloween.notNow") : t("halloween.revert")}
          </button>
          <button
            type="button"
            ref={primaryRef}
            onClick={isInvite ? tryIt : keep}
            className="h-10 sm:h-9 px-4 rounded-lg text-[13.5px] font-semibold transition-colors"
            style={{ background: "#F08A2C", color: "#1A0D02" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F59B45"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F08A2C"; }}
          >
            {isInvite ? t("halloween.try") : t("halloween.keep")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HalloweenInvite;
