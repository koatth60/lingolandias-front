import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pl";
import { FiCalendar, FiMessageSquare, FiBookOpen, FiChevronRight, FiArrowRight } from "react-icons/fi";
import { InfoCard } from "./InfoCard";
import { UpcomingClass } from "./UpcomingClass";
import CourseAnnouncementBanner from "./CourseAnnouncementBanner";
import { getNextClasses } from "../../data/helpers";
import { handleJoinClass } from "../../data/joinClassHandler";
import { setStudentSchedules, setTeacherSchedules, setStudentTeacher } from "../../redux/userSlice";
import { useHalloween } from "../../context/HalloweenContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const LANGUAGE_TIPS = [
  { lang: "Spanish",  word: "Perseverancia", meaning: "Perseverance",   sentence: "La perseverancia es la clave del éxito." },
  { lang: "English",  word: "Eloquent",      meaning: "Elocuente",      sentence: "She gave an eloquent speech that moved the crowd." },
  { lang: "Polish",   word: "Wytrwałość",    meaning: "Perseverance",   sentence: "Wytrwałość jest kluczem do sukcesu." },
  { lang: "Spanish",  word: "Confianza",     meaning: "Confidence",     sentence: "Tengo confianza en mis habilidades." },
  { lang: "English",  word: "Fluent",        meaning: "Fluido",         sentence: "He became fluent in French after two years." },
  { lang: "Polish",   word: "Ciekawość",     meaning: "Curiosity",      sentence: "Ciekawość to podstawa nauki języków." },
  { lang: "Spanish",  word: "Aprendizaje",   meaning: "Learning",       sentence: "El aprendizaje es un viaje sin fin." },
  { lang: "English",  word: "Resilience",    meaning: "Resiliencia",    sentence: "Resilience is the key to mastering a new language." },
  { lang: "Polish",   word: "Odwaga",        meaning: "Courage",        sentence: "Odwaga to pierwsza zasada nauki języków." },
  { lang: "Spanish",  word: "Dedicación",    meaning: "Dedication",     sentence: "La dedicación diaria hace al maestro." },
  { lang: "English",  word: "Immersion",     meaning: "Inmersión",      sentence: "Language immersion accelerates learning dramatically." },
  { lang: "Polish",   word: "Słownictwo",    meaning: "Vocabulary",     sentence: "Bogate słownictwo otwiera nowe możliwości." },
  { lang: "Spanish",  word: "Pronunciación", meaning: "Pronunciation",  sentence: "Una buena pronunciación te abrirá muchas puertas." },
  { lang: "English",  word: "Tenacity",      meaning: "Tenacidad",      sentence: "Tenacity separates those who learn from those who give up." },
  { lang: "Polish",   word: "Wymowa",        meaning: "Pronunciation",  sentence: "Dobra wymowa to połowa sukcesu." },
  { lang: "Spanish",  word: "Fluidez",       meaning: "Fluency",        sentence: "La fluidez llega con la práctica constante." },
  { lang: "English",  word: "Persevere",     meaning: "Perseverar",     sentence: "Those who persevere always find a way forward." },
  { lang: "Polish",   word: "Postęp",        meaning: "Progress",       sentence: "Każdy dzień to nowy krok naprzód." },
  { lang: "Spanish",  word: "Motivación",    meaning: "Motivation",     sentence: "La motivación es el motor del aprendizaje." },
  { lang: "English",  word: "Vocabulary",    meaning: "Vocabulario",    sentence: "Building vocabulary daily is the fastest path to fluency." },
  { lang: "Polish",   word: "Nauka",         meaning: "Learning",       sentence: "Nauka języka to podróż bez końca." },
];

const HALLOWEEN_TIP = { lang: "Spanish", word: "Calabaza", meaning: "Pumpkin", sentence: "La calabaza brilla en la noche de Halloween." };

const QUICK_NAV_CONFIG = [
  { icon: FiCalendar, labelKey: "home.schedule", descKey: "home.scheduleDesc", href: "/schedule", tint: "v" },
  { icon: FiMessageSquare, labelKey: "home.messages", descKey: "home.messagesDesc", href: "/messages", tint: "t" },
  { icon: FiBookOpen, labelKey: "home.learning", descKey: "home.learningDesc", href: null, tint: "g" },
];

const FAQ_KEYS = [
  { qKey: "home.faqItems.q1", aKey: "home.faqItems.a1" },
  { qKey: "home.faqItems.q2", aKey: "home.faqItems.a2" },
  { qKey: "home.faqItems.q3", aKey: "home.faqItems.a3" },
  { qKey: "home.faqItems.q4", aKey: "home.faqItems.a4" },
];

// Matches the mockup's plain `.sh` section header: 13.5px/600, full ink
// color, no icon, no uppercase — an optional right-aligned link, never a pill.
const SectionHeader = ({ title, linkText, onLink, right }) => (
  <div className="flex items-baseline justify-between mb-3">
    <h2 className="text-[13.5px] font-semibold text-ll-ink">{title}</h2>
    {right}
    {linkText && (
      <button onClick={onLink} className="text-[12.5px] text-ll-ink3 hover:text-ll-violet-ink inline-flex items-center gap-1">
        {linkText} <FiArrowRight size={12} />
      </button>
    )}
  </div>
);

const TINT_CLASS = {
  v: "bg-ll-violet-tint text-ll-violet-ink",
  t: "bg-ll-teal-tint text-ll-teal-ink",
  g: "bg-ll-gold-tint text-ll-gold-ink",
};

// "Starts in 2h 14m" — recomputed every 30s. `target` is a dayjs; returns
// null before the class is confirmed loaded or once it has already started,
// so the caller can fall back to the plain date/time line.
const useCountdown = (target) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diffMs = target.valueOf() - now;
  if (diffMs <= 0) return null;
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
};

const UserHomePage = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const nextClasses = getNextClasses(user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { enabled: halloween } = useHalloween();

  // "Next Sessions" reads user.teacherSchedules/studentSchedules straight out
  // of Redux, which is only ever set at login (or via a live socket event
  // that requires the Schedule page to be mounted to catch — see
  // schedule.jsx). A class renamed/regrouped from Messages while this user
  // never had Schedule open left this card showing the old raw name
  // forever. schedule.jsx already solved this exact problem for itself with
  // a mount-time refetch — mirrored here so Home is just as fresh.
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (user.role === "user" || user.role === "invitado") {
      fetch(`${BACKEND_URL}/users/student-profile/${user.id}`, { headers })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          if (Array.isArray(data.studentSchedules)) dispatch(setStudentSchedules(data.studentSchedules));
          dispatch(setStudentTeacher(data.teacher ?? null));
        })
        .catch((err) => console.error("Failed to refresh student profile:", err));
    } else if (user.role === "teacher") {
      fetch(`${BACKEND_URL}/users/teacher-profile/${user.id}`, { headers })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.teacherSchedules)) dispatch(setTeacherSchedules(data.teacherSchedules));
        })
        .catch((err) => console.error("Failed to refresh teacher profile:", err));
    }
  }, [user?.id, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advances once per calendar day (UTC epoch days), cycles through the full tips array
  const tip = halloween ? HALLOWEEN_TIP : LANGUAGE_TIPS[Math.floor(Date.now() / 86400000) % LANGUAGE_TIPS.length];
  const firstClass = nextClasses[0];
  const firstClassDate = firstClass ? (user.role === "teacher" ? firstClass.nextOccurrence : firstClass.occurrence) : null;
  const startsIn = useCountdown(firstClassDate);

  const classDisplay = (classSession) => {
    const displayDate = user.role === "teacher" ? classSession.nextOccurrence : classSession.occurrence;
    const otherUserId = (user.role === "user" || user.role === "invitado") ? user.teacher?.id : classSession.studentId;
    const otherUserName = user.role === "teacher" ? classSession.studentName : classSession.teacherName;
    const displayName = classSession.groupName || otherUserName;
    const isGroupClass = !!classSession.groupName;
    // startTime/endTime anchor the ORIGINAL occurrence — nextOccurrence/occurrence
    // only shifts by whole weeks, so the start-to-end duration is stable and can
    // be replayed onto the projected date to get this occurrence's end time.
    const durationMin = classSession.startTime && classSession.endTime
      ? dayjs(classSession.endTime).diff(dayjs(classSession.startTime), "minute")
      : null;
    const displayEndDate = durationMin != null ? displayDate.add(durationMin, "minute") : null;
    return { displayDate, displayEndDate, otherUserId, otherUserName, displayName, isGroupClass };
  };

  return (
    <main className="relative max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-10 space-y-7">
      <svg className="hw-only absolute right-0 top-0 w-[150px] h-[150px] pointer-events-none opacity-55" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8 }} viewBox="0 0 150 150" aria-hidden="true"><path d="M150 0 40 110M150 0 95 150M150 0 0 60M150 0 0 5" /><path d="M118 0c2 10 8 18 20 21 4 1 8 2 12 2M86 0c3 22 15 37 36 42 9 2 19 3 28 3M52 0c4 34 23 57 55 64 14 3 29 4 43 4M20 1c6 48 34 79 79 90 17 4 34 5 51 5" /></svg>
      <div className="hw-only hw-sm-up ll-dangle absolute right-[126px] top-0 w-5 z-[1] pointer-events-none" aria-hidden="true">
        <i className="block w-px h-24 mx-auto" style={{ background: 'linear-gradient(rgb(var(--ll-ink-4)), rgb(var(--ll-ink-3)))' }} />
        <svg className="block w-5 h-[18px] -mt-px" viewBox="0 0 20 18"><g stroke="#120A1C" strokeWidth="1.1" fill="none" strokeLinecap="round"><path d="M7 7 2 3M7 9 1 8M7 11l-5 4M8 12l-3 5M13 7l5-4M13 9l6-1M13 11l5 4M12 12l3 5" /></g><ellipse cx="10" cy="9.5" rx="3.6" ry="4.2" fill="#120A1C" /><circle cx="10" cy="4.8" r="2.2" fill="#120A1C" /><circle cx="9.2" cy="4.6" r=".5" fill="#F08A2C" /><circle cx="10.8" cy="4.6" r=".5" fill="#F08A2C" /></svg>
      </div>

      {/* ── Greeting ── */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ll-teal flex-shrink-0" style={{ boxShadow: '0 0 0 3px rgb(var(--ll-teal-tint))' }} />
            <span className="text-[11px] font-medium tracking-wide text-ll-teal-ink uppercase">{t("home.online")}</span>
          </div>
          <h1 className={`font-semibold tracking-[-0.03em] text-ll-ink leading-[1.05] ${halloween ? 'hw-gothic text-[44px] sm:text-[58px]' : 'text-[34px] sm:text-[42px]'}`}>
            {halloween
              ? <span style={{ color: '#FFE9C7', textShadow: '0 0 28px rgba(240,138,44,.35)' }}>{t("home.happyHaunting", { name: user.name, defaultValue: "Happy haunting, {{name}}" })}</span>
              : t("home.welcomeBack", { name: user.name })}
          </h1>
          <p className="text-[14px] text-ll-ink2 max-w-xl mt-2">
            {t("home.subtitle")}
          </p>
        </div>
        <div className="hw-hide text-right text-[13px] text-ll-ink3 leading-snug">
          <p className="font-medium text-ll-ink">{dayjs().locale(i18n.language).format("dddd, D MMMM")}</p>
          <p>{t("home.upcomingCount", { count: nextClasses.length })}</p>
        </div>
        <div
          className="hw-only hw-sm-up relative w-28 h-28 rounded-full flex-none mr-11 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 38% 35%,#FFF6E0 0%,#FFE3A8 42%,#F2C46A 78%,#D9A24A 100%)', boxShadow: '0 0 60px 10px rgba(245,196,81,.25),0 0 180px 50px rgba(240,138,44,.12)' }}
          aria-hidden="true"
        >
          <span className="absolute rounded-full" style={{ width: 22, height: 22, left: 58, top: 26, background: 'rgba(170,110,40,.22)' }} />
          <span className="absolute rounded-full" style={{ width: 14, height: 14, left: 30, top: 66, background: 'rgba(170,110,40,.22)', boxShadow: '40px 8px 0 -3px rgba(170,110,40,.2)' }} />
        </div>
      </section>

      <CourseAnnouncementBanner />

      {/* ── Up next + Word of the day ── */}
      <section className="grid lg:grid-cols-[1.55fr_1fr] gap-5">
        <div>
          <SectionHeader title={t("home.upNext")} linkText={t("home.openSchedule")} onLink={() => navigate("/schedule")} />
          {firstClass ? (() => {
            const { displayDate, displayEndDate, otherUserId, otherUserName, displayName, isGroupClass } = classDisplay(firstClass);
            return (
              <div className="ll-orb-surface ll-brackets relative rounded-xl overflow-hidden text-white p-6 sm:p-7 flex flex-col min-h-[13.5rem] shadow-ll-2">
                <svg className="hw-only absolute left-0 right-0 bottom-0 w-full h-24 pointer-events-none" viewBox="0 0 660 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                  <path d="M0 74c110-20 220-8 330-12s220-18 330-6v40H0z" fill="#0A0612" />
                  <path d="M16 62h120" stroke="#0A0612" strokeWidth="3" />
                  <g fill="#0A0612"><path d="M22 76V54l3-5 3 5v22zM42 76V54l3-5 3 5v22zM62 76V54l3-5 3 5v22zM82 76V54l3-5 3 5v22zM102 76V54l3-5 3 5v22zM122 76V54l3-5 3 5v22z" /><path d="M232 70V50a12 12 0 0 1 24 0v20z" /><path d="M272 70V58a8 8 0 0 1 16 0v12z" /><path d="M396 66V52a9 9 0 0 1 18 0v14z" /></g>
                  <path d="M300 66V40M290 49h20" stroke="#0A0612" strokeWidth="5" strokeLinecap="round" />
                  <g stroke="#0A0612" strokeLinecap="round" fill="none"><path d="M340 66C342 48 336 34 342 12" strokeWidth="7" /><path d="M341 36c10-6 18-8 28-18M341 44c-10-6-18-10-26-20M342 24c6-6 7-12 12-18M369 18c4 0 8 2 11 0M315 24c-4-1-7 1-10 0" strokeWidth="3" /></g>
                </svg>
                <div className="hw-only ll-fog absolute -left-[10%] -right-[10%] -bottom-1.5 h-[70px] pointer-events-none" style={{ background: 'radial-gradient(50% 60% at 30% 100%,rgba(200,185,255,.22),transparent 70%),radial-gradient(45% 60% at 80% 100%,rgba(200,185,255,.16),transparent 70%)' }} aria-hidden="true" />
                <svg className="hw-only absolute left-[52%] top-[18px] w-[170px] h-[70px] pointer-events-none" style={{ fill: '#0B0612', opacity: .9 }} viewBox="0 0 170 70" aria-hidden="true">
                  {[[10, 30, 40, 16], [70, 8, 28, 11], [118, 44, 22, 9]].map(([x, y, w, h]) => (
                    <svg key={x} x={x} y={y} width={w} height={h} viewBox="0 0 40 16"><path className="ll-bob" d="M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3" /></svg>
                  ))}
                </svg>
                <div className="relative z-[1]">
                  <p className={`font-semibold leading-[1.05] tracking-[-0.035em] ${halloween ? 'hw-gothic text-[40px] sm:text-[48px]' : 'text-[30px] sm:text-[36px]'}`}>{displayName}</p>
                  <p className="text-[13.5px] text-white/80 mt-2.5">
                    {displayDate.locale(i18n.language).format("dddd, D MMM")} · {displayDate.format("h:mm")}{displayEndDate ? ` – ${displayEndDate.format("h:mm A")}` : ` ${displayDate.format("A")}`} · {isGroupClass ? t("upcomingClass.groupClass") : t("upcomingClass.oneOnOneSession")}
                  </p>
                </div>
                <div className="relative z-[1] mt-auto pt-6 flex items-end justify-between gap-4">
                  {startsIn ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] text-white/60">{t("home.startsIn")}</span>
                      <span className="text-[22px] font-semibold tracking-[-0.03em] tabular font-mono">{startsIn}</span>
                    </div>
                  ) : <span />}
                  <div className="flex gap-2">
                    {otherUserId && (
                      <button
                        onClick={() => navigate("/messages", { state: { openDmWithUserId: otherUserId, openDmWithName: otherUserName, openDmWithRole: user.role === "teacher" ? "user" : "teacher" } })}
                        className={`ll-btn ll-btn-sm text-white ${halloween ? "bg-black/35 border border-ll-violet/70 !text-[#FFE9C7] hover:bg-ll-violet/20 hover:border-ll-violet" : "bg-white/10 border border-white/25 hover:bg-white/20"}`}
                      >
                        <FiMessageSquare size={13} /> {t("upcomingClass.message")}
                      </button>
                    )}
                    <button onClick={() => handleJoinClass({ user, classSession: firstClass, navigate })} className={`ll-btn ll-btn-sm ${halloween ? "bg-ll-violet text-ll-on-violet hover:bg-ll-violet-hover" : "bg-white text-[#2A1152] hover:bg-white/90"}`}>
                      <FiCalendar size={13} /> {t("upcomingClass.join")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="ll-card flex items-center justify-center text-center p-8 min-h-[13.5rem]">
              <p className="text-[13.5px] text-ll-ink3">{t("home.noSessions")}</p>
            </div>
          )}
        </div>

        <div>
          <SectionHeader title={t("home.wordOfDayTitle")} right={<span className="ll-pill" style={{ background: 'rgb(var(--ll-gold-tint))', color: 'rgb(var(--ll-gold-ink))' }}>{tip.lang}</span>} />
          <div className="ll-card ll-wotd-surface relative p-6 sm:p-7 flex flex-col min-h-[13.5rem]">
            <div className="hw-only absolute right-5 top-[18px] w-[92px] h-[86px] pointer-events-none" aria-hidden="true">
              <div className="absolute -inset-5 rounded-full" style={{ background: 'radial-gradient(circle,rgba(240,138,44,.35),transparent 65%)' }} />
              <svg className="relative w-full h-full" viewBox="0 0 96 90"><path d="M48 20c-1-7 2-12 7-15" stroke="#3CCB8F" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M55 8c6-3 11-1 14 3-6 1-10 0-14-3z" fill="#3CCB8F" /><ellipse cx="30" cy="53" rx="21" ry="30" fill="#C85E12" /><ellipse cx="66" cy="53" rx="21" ry="30" fill="#C85E12" /><ellipse cx="48" cy="53" rx="22" ry="33" fill="#F08A2C" /><path d="M40 24c-3 8-3 50 0 60M56 24c3 8 3 50 0 60" stroke="#C85E12" strokeWidth="2" fill="none" /><g className="ll-flicker"><path d="M28 47l8-12 8 12zM52 47l8-12 8 12z" fill="#FFE08A" /><path d="M44 56l4-6 4 6z" fill="#FFE08A" /><path d="M24 64c8 9 40 9 48 0l-6 2-4-4-5 4-5-4-5 4-5-4-4 4z" fill="#FFE08A" /></g></svg>
            </div>
            <p className={`ll-brackets inline-block self-start max-w-[calc(100%-6rem)] break-words pr-4 pb-2 font-semibold text-ll-gold-ink leading-[1.05] tracking-[-0.035em] ${halloween ? 'hw-gothic text-[44px] sm:text-[54px]' : 'text-[34px] sm:text-[40px]'}`}>{tip.word}</p>
            <p className="text-[13.5px] text-ll-ink2 mt-0.5">{tip.meaning}</p>
            <p className="text-[13px] text-ll-ink2 italic leading-relaxed mt-auto pt-4 border-t border-ll-line">
              "{tip.sentence}"
            </p>
          </div>
        </div>
      </section>

      {/* ── Next sessions + Go to ── */}
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-5">

        <section className="flex flex-col">
          <SectionHeader title={t("home.nextSessions")} linkText={t("home.viewAll")} onLink={() => navigate("/schedule")} />
          <div className={nextClasses.length === 0 ? undefined : "ll-card divide-y divide-ll-line flex-1 flex flex-col"}>
            {nextClasses.length === 0 && (
              <div className="ll-card px-5 py-8 text-center">
                <p className="text-[13.5px] text-ll-ink3">{t("home.noSessions")}</p>
              </div>
            )}
            {nextClasses.map((classSession) => {
              const { displayDate, otherUserId, otherUserName, displayName, isGroupClass } = classDisplay(classSession);
              return (
                <UpcomingClass
                  key={`${classSession.id}-${displayDate.format()}`}
                  time={displayDate.format("h:mm A")}
                  teacher={displayName}
                  date={displayDate.locale(i18n.language).format("D MMM")}
                  isGroupClass={isGroupClass}
                  onJoin={() => handleJoinClass({ user, classSession, navigate })}
                  onMessage={
                    otherUserId
                      ? () => navigate("/messages", {
                          state: {
                            openDmWithUserId: otherUserId,
                            openDmWithName: otherUserName,
                            // The other person on a class card is always the
                            // opposite role of the viewer — lets Messages'
                            // teacher->student "schedule a class?" prompt fire.
                            openDmWithRole: user.role === "teacher" ? "user" : "teacher",
                          },
                        })
                      : undefined
                  }
                  onViewCalendar={() => navigate("/schedule", { state: { focusDate: displayDate.toISOString() } })}
                />
              );
            })}
          </div>
        </section>

        <section className="relative flex flex-col">
          <svg className="hw-only ll-ghost-in absolute right-1.5 -top-10 w-10 h-[46px] pointer-events-none" style={{ filter: 'drop-shadow(0 6px 14px rgba(200,185,255,.25))' }} viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2C10.5 2 4 9.5 4 19.5V42l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V19.5C36 9.5 29.5 2 20 2z" fill="rgba(246,242,255,.94)" /><ellipse cx="14.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="25.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="20" cy="28" rx="2.4" ry="3" fill="#140E1C" /></svg>
          <SectionHeader title={t("home.goTo")} />
          <div className="ll-card divide-y divide-ll-line flex-1 flex flex-col">
            {QUICK_NAV_CONFIG.map(({ icon: Icon, labelKey, descKey, href, tint }) => (
              <a
                key={labelKey}
                href={href || undefined}
                onClick={href ? undefined : (e) => e.preventDefault()}
                className={`flex-1 min-h-[68px] flex items-center gap-3 px-3.5 py-3 first:rounded-t-xl last:rounded-b-xl transition-colors ${href ? "hover:bg-ll-subtle" : "cursor-not-allowed"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TINT_CLASS[tint]}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${href ? "text-ll-ink" : "text-ll-ink2"}`}>{t(labelKey)}</p>
                  <p className="text-[11.5px] text-ll-ink3">{t(descKey)}</p>
                </div>
                {href ? <FiChevronRight size={14} className="text-ll-ink4 flex-shrink-0" /> : <span className="ll-pill bg-ll-hover text-ll-ink3 flex-shrink-0">{t("home.comingSoon")}</span>}
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* ── FAQ ── */}
      <section>
        <SectionHeader title={t("home.faq")} />
        <div className="grid sm:grid-cols-2 sm:gap-x-10">
          {FAQ_KEYS.map(({ qKey, aKey }, i) => (
            <InfoCard key={qKey} question={t(qKey)} answer={t(aKey)} topRow={i < 2} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default UserHomePage;
