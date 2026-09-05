import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import CoursePlayer from "../components/course/CoursePlayer";
import ErrorBoundary from "../components/common/ErrorBoundary";

const Course = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo?.user);

  // Not part of the teacher/student crash-course rollout — same exclusion
  // the old single-video tutorial modal used.
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/home", { replace: true });
    }
  }, [user?.role, navigate]);

  if (user?.role === "admin") return null;

  return (
    <ErrorBoundary>
      <div className="flex w-full relative min-h-screen">
        <div className="absolute inset-0 pointer-events-none dark:hidden" style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
        <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
          <div className="absolute rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "600px", height: "600px", top: "-10%", right: "-5%" }} />
          <div className="absolute rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "400px", height: "400px", bottom: "5%", left: "10%" }} />
        </div>

        <Dashboard />
        <div className="flex-1 relative z-10 flex flex-col min-h-screen overflow-hidden">
          <Navbar header={t("course.pageTitle")} />
          <div className="flex-1 p-4 sm:p-6 overflow-auto">
            <CoursePlayer />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Course;
