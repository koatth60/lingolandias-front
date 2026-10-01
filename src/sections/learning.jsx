import { useState } from "react";
import { useTranslation } from "react-i18next";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import CoursesCard from "../components/home/coursesCard";
import { FiInfo, FiX } from "react-icons/fi";

const Learning = () => {
  const [showBanner, setShowBanner] = useState(true);
  const { t } = useTranslation();

  const languageCourses = {
    title: t("learning.coursesTitle"),
    courses: [
      {
        id: 1,
        title: "Spanish for Beginners",
        description: "Master the fundamentals of Spanish with interactive lessons, quizzes, and real-life conversation practice.",
        image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1966&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Start Learning",
        level: "Beginner",
        duration: "8 Weeks",
      },
      {
        id: 2,
        title: "Advanced English",
        description: "Elevate your English proficiency by exploring complex grammar, literature, and cultural nuances.",
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1973&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Continue Learning",
        level: "Advanced",
        duration: "12 Weeks",
      },
      {
        id: 3,
        title: "Conversational Italian",
        description: "Build confidence in your Italian speaking skills through immersive role-playing and guided conversations.",
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Start Speaking",
        level: "Intermediate",
        duration: "6 Weeks",
      },
    ],
  };

  const ebooks = {
    title: t("learning.ebooksTitle"),
    courses: [
      {
        id: 1,
        title: "The Art of Italian Cooking",
        description: "A culinary journey through Italy that will enrich your vocabulary and tantalize your taste buds.",
        image: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Read Now",
        level: "All Levels",
        duration: "Self-paced",
      },
      {
        id: 2,
        title: "Japanese Folklore and Mythology",
        description: "Delve into the enchanting world of Japanese myths and legends while expanding your language skills.",
        image: "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Discover More",
        level: "Advanced",
        duration: "Self-paced",
      },
      {
        id: 3,
        title: "A Guide to Business English",
        description: "Equip yourself with the essential language and etiquette for success in the global marketplace.",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3",
        button: "Enhance Your Career",
        level: "Intermediate",
        duration: "Self-paced",
      },
    ],
  };

  return (
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full min-w-0 relative z-10 flex flex-col">
        <Navbar header={t("learning.title")} />

        <div className="px-3 sm:px-7 py-5 sm:py-8 flex flex-col gap-8 max-w-6xl w-full mx-auto">

          {/* ── Demo banner ── */}
          {showBanner && (
            <div className="flex items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-ll-line bg-ll-gold-tint">
              <div className="flex items-start sm:items-center gap-3">
                <FiInfo size={16} className="flex-shrink-0 mt-0.5 sm:mt-0 text-ll-gold-ink" />
                <p className="text-[13.5px] text-ll-ink2">{t("learning.demoNotice")}</p>
              </div>
              <button onClick={() => setShowBanner(false)} className="flex-shrink-0 text-ll-gold-ink hover:opacity-70 transition-opacity">
                <FiX size={16} />
              </button>
            </div>
          )}

          {/* ── Hero ── */}
          <div>
            <p className="text-[12.5px] font-medium text-ll-violet-ink mb-1">{t("learning.heroBadge")}</p>
            <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-[-0.03em] leading-[1.1] text-ll-ink">
              {t("learning.heroTitle")}
            </h1>
            <p className="text-[14.5px] text-ll-ink3 mt-2 max-w-xl">{t("learning.heroSubtitle")}</p>
          </div>

          {/* ── Interactive Courses ── */}
          <section>
            <h2 className="text-[13.5px] font-semibold text-ll-ink mb-3">{languageCourses.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {languageCourses.courses.map((course) => (
                <CoursesCard key={course.id} {...course} />
              ))}
            </div>
          </section>

          {/* ── E-books ── */}
          <section>
            <h2 className="text-[13.5px] font-semibold text-ll-ink mb-3">{ebooks.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ebooks.courses.map((course) => (
                <CoursesCard key={course.id} {...course} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Learning;
