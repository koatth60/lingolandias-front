import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import MeetingLogsPanel from "../components/admin/MeetingLogsPanel";
import ErrorBoundary from "../components/common/ErrorBoundary";

const AdminMeetingLogs = () => {
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
          <Navbar header="Meeting Logs" />
          <div className="flex-1 p-6 overflow-auto">
            <MeetingLogsPanel />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminMeetingLogs;
