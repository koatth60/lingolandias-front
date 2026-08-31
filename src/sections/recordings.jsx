import { useTranslation } from "react-i18next";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import MyRecordingsPage from "../components/recordings/MyRecordingsPage";
import ErrorBoundary from "../components/common/ErrorBoundary";

const Recordings = () => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary>
      <div className="flex w-full relative min-h-screen">
        {/* Page background */}
        <div
          className="absolute inset-0 pointer-events-none dark:hidden"
          style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none hidden dark:block"
          style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }}
        />
        <Dashboard />
        <div className="flex-1 relative z-10 flex flex-col min-h-screen overflow-hidden">
          <Navbar header={t("recordings.title")} />
          <div className="flex-1 p-6 overflow-auto">
            <MyRecordingsPage />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Recordings;
