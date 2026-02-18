import { useState } from "react";
import Dashboard from "./dashboard";
import Navbar from "../components/navbar";
import CoursesCard from "../components/coursesCard";
import { FiInfo, FiBookOpen, FiVideo, FiX } from "react-icons/fi";

const Learning = () => {
  const [showBanner, setShowBanner] = useState(true);

  const languageCourses = {
    title: "Interactive Language Courses",
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
    title: "Cultural & Language E-books",
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
    <div className="flex w-full relative min-h-screen">
      {/* Page backgrounds */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      {/* Ambient orbs (dark only) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "500px", height: "500px", top: "-5%", right: "0%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "10%", left: "5%" }} />
      </div>

      <Dashboard />

      <div className="w-full min-w-0 relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar header="Learning Center" />

        <div className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-8 sm:gap-12">

          {/* ── Demo banner ── */}
          {showBanner && (
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(246,184,46,0.28)" }}
            >
              <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(246,184,46,0.07)" }} />
              <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(246,184,46,0.06)" }} />
              <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 p-4">
                <div className="flex items-start sm:items-center gap-3">
                  <FiInfo size={16} style={{ color: "#F6B82E" }} className="flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This page is for demonstration purposes only. All course materials and images are placeholders.
                  </p>
                </div>
                <button onClick={() => setShowBanner(false)} className="flex-shrink-0 transition-opacity hover:opacity-60">
                  <FiX size={16} style={{ color: "#F6B82E" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── Hero ── */}
          <div className="text-center py-4 sm:py-8">
            <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase mb-3">Learning Center</p>
            <h1 className="text-3xl sm:text-5xl font-extrabold login-gradient-text mb-3 sm:mb-4">
              Unlock Your Potential
            </h1>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Dive into our world of languages and cultures.
            </p>
            <div className="h-px mt-6 mx-auto max-w-xs opacity-40"
              style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, #26D9A1, transparent)" }} />
          </div>

          {/* ── Interactive Courses ── */}
          <section>
            <div className="flex items-center gap-3 mb-5 sm:mb-7">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(158,47,208,0.12)", border: "1px solid rgba(158,47,208,0.25)" }}>
                <FiVideo size={15} style={{ color: "#9E2FD0" }} />
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white">
                {languageCourses.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {languageCourses.courses.map((course) => (
                <CoursesCard key={course.id} {...course} />
              ))}
            </div>
          </section>

          {/* ── E-books ── */}
          <section>
            <div className="flex items-center gap-3 mb-5 sm:mb-7">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(38,217,161,0.12)", border: "1px solid rgba(38,217,161,0.25)" }}>
                <FiBookOpen size={15} style={{ color: "#26D9A1" }} />
              </div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-gray-800 dark:text-white">
                {ebooks.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
