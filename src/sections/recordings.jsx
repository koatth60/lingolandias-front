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
        
        <Dashboard />
        <div className="ll-shell flex-1 relative z-10 flex flex-col min-w-0">
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
