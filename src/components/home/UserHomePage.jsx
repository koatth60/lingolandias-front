import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiCalendar, FiMessageSquare, FiBookOpen, FiArrowRight, FiHelpCircle } from "react-icons/fi";
import { InfoCard } from "./InfoCard";
import { UpcomingClass } from "./UpcomingClass";
import { getNextClasses } from "../../data/helpers";
import { handleJoinClass } from "../../data/joinClassHandler";

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

const QUICK_NAV = [
  {
    icon: FiCalendar,
    label: "Schedule",
    description: "View your upcoming classes and sessions",
    href: "/schedule",
    gradient: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
    shadow: "rgba(158,47,208,0.35)",
  },
  {
    icon: FiMessageSquare,
    label: "Messages",
    description: "Chat with your teacher or students",
    href: "/messages",
    gradient: "linear-gradient(135deg, #26D9A1, #1fa07a)",
    shadow: "rgba(38,217,161,0.35)",
  },
  {
    icon: FiBookOpen,
    label: "Learning",
    description: "Access your learning materials and activities",
    href: "/learning",
    gradient: "linear-gradient(135deg, #F6B82E, #d4981a)",
    shadow: "rgba(246,184,46,0.35)",
  },
];

const FAQ_ITEMS = [
  {
    question: "How long will it take?",
    answer: "Our tailored approach ensures you start communicating effectively as soon as possible by setting achievable goals together.",
  },
  {
    question: "Why do I lack freedom in speaking?",
    answer: "We identify and address the root causes of hesitation, guaranteeing a significant boost in your speaking confidence.",
  },
  {
    question: "Will we learn grammar?",
    answer: "Absolutely. Our innovative methods integrate grammar seamlessly, so you'll learn the rules without tedious drills.",
  },
  {
    question: "What if we can't attend classes?",
    answer: "Flexibility is key. You can reschedule up to 24 hours before your class, and we're always understanding in emergencies.",
  },
];

const UserHomePage = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const nextClasses = getNextClasses(user);
  const navigate = useNavigate();

  // Advances once per calendar day (UTC epoch days), cycles through the full tips array
  const tip = LANGUAGE_TIPS[Math.floor(Date.now() / 86400000) % LANGUAGE_TIPS.length];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Hero banner ── */}
      <section className="relative rounded-2xl overflow-hidden shadow-sm dark:shadow-none" style={{ border: "1px solid rgba(158,47,208,0.12)" }}>
        <div className="dark:hidden absolute inset-0 bg-white" />
        <div
          className="hidden dark:block absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.96) 0%, rgba(26,26,46,0.95) 100%)" }}
        />
        {/* top accent */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />
        {/* ambient orbs */}
        <div
          className="absolute top-[-60px] right-[-40px] w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.18), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-40px] left-[8%] w-[180px] h-[180px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.12), transparent 70%)" }}
        />
        <div className="relative z-10 px-6 sm:px-10 py-10">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-2 h-2 rounded-full bg-[#26D9A1] flex-shrink-0"
              style={{ boxShadow: "0 0 6px rgba(38,217,161,0.8)", animation: "loginPulseOrb 2.5s ease-in-out infinite" }}
            />
            <span className="text-xs font-bold tracking-widest text-[#26D9A1] uppercase">Online</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold login-gradient-text mb-3">
            Welcome back, {user.name}!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            Your journey to fluency continues. Every session brings you one step closer to your goals.
          </p>
        </div>
      </section>

      {/* ── Quick navigation ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUICK_NAV.map(({ icon: Icon, label, description, href, gradient, shadow }) => (
          <a
            key={label}
            href={href}
            className="group relative rounded-2xl p-5 flex items-start gap-4 transition-transform duration-200 hover:-translate-y-1 shadow-sm dark:shadow-none"
            style={{ border: "1px solid rgba(158,47,208,0.15)" }}
          >
            <div className="dark:hidden absolute inset-0 rounded-2xl bg-white" />
            <div
              className="hidden dark:block absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.90), rgba(26,26,46,0.88))" }}
            />
            <div
              className="relative z-10 p-2.5 rounded-xl flex-shrink-0"
              style={{ background: gradient, boxShadow: `0 4px 14px ${shadow}` }}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-bold text-gray-800 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <FiArrowRight
              size={14}
              className="relative z-10 text-gray-400 dark:text-gray-500 group-hover:text-[#9E2FD0] dark:group-hover:text-white transition-colors flex-shrink-0 self-center"
            />
          </a>
        ))}
      </section>

      {/* ── Word of the day ── */}
      <section>
        <div
          className="relative rounded-2xl overflow-hidden shadow-sm dark:shadow-none"
          style={{ border: "1px solid rgba(158,47,208,0.18)" }}
        >
          <div className="dark:hidden absolute inset-0 bg-white" />
          <div
            className="hidden dark:block absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.92) 0%, rgba(26,26,46,0.90) 100%)" }}
          />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />

          <div className="relative z-10 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-shrink-0">
              <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase mb-1">
                Word of the Day · {tip.lang}
              </p>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{tip.word}</p>
              <p className="text-sm font-semibold text-[#26D9A1] mt-0.5">{tip.meaning}</p>
            </div>
            <div className="w-full h-px sm:w-px sm:h-12 bg-gradient-to-r sm:bg-gradient-to-b from-transparent via-[#9E2FD0]/25 to-transparent flex-shrink-0" />
            <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">
              "{tip.sentence}"
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ + Next Sessions ── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* FAQ */}
        <section className="lg:col-span-2">
          <h2 className="text-base font-bold text-gray-800 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full flex-shrink-0" style={{ background: "linear-gradient(to bottom, #9E2FD0, #F6B82E)" }} />
            <FiHelpCircle size={15} className="text-[#9E2FD0]" />
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {FAQ_ITEMS.map((faq) => (
              <InfoCard key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* Next Sessions */}
        <section>
          <h2 className="text-base font-bold text-gray-800 dark:text-white tracking-tight mb-4 flex items-center gap-2">
            <span className="inline-block w-1 h-4 rounded-full flex-shrink-0" style={{ background: "linear-gradient(to bottom, #26D9A1, #9E2FD0)" }} />
            <FiCalendar size={15} className="text-[#26D9A1]" />
            Next Sessions
          </h2>
          <div className="space-y-3">
            {nextClasses.length === 0 && (
              <div
                className="relative rounded-xl px-5 py-8 text-center overflow-hidden shadow-sm dark:shadow-none"
                style={{ border: "1px solid rgba(158,47,208,0.15)" }}
              >
                <div className="dark:hidden absolute inset-0 bg-white" />
                <div
                  className="hidden dark:block absolute inset-0"
                  style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.90), rgba(26,26,46,0.88))" }}
                />
                <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400">
                  No upcoming sessions scheduled.
                </p>
              </div>
            )}
            {nextClasses.map((classSession) => {
              const displayDate =
                user.role === "teacher"
                  ? classSession.nextOccurrence
                  : classSession.occurrence;
              return (
                <UpcomingClass
                  key={`${classSession.id}-${displayDate.format()}`}
                  time={displayDate.format("h:mm A")}
                  teacher={
                    user.role === "teacher"
                      ? classSession.studentName
                      : classSession.teacherName
                  }
                  date={displayDate.format("MMM D")}
                  onJoin={() => handleJoinClass({ user, classSession, navigate })}
                />
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default UserHomePage;
