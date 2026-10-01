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
      <div className="flex w-full relative min-h-screen bg-ll-canvas">
        <Dashboard />
        <div className="ll-shell flex-1 relative z-10 flex flex-col min-w-0">
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
