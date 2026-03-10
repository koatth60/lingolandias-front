import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import AnalyticsDashboard from "../components/analytics/AnalyticsDashboard";
import ErrorBoundary from "../components/common/ErrorBoundary";

const Analytics = () => (
  <ErrorBoundary>
    <div className="flex w-full relative min-h-screen">
      <Dashboard />
      <div className="flex-1 relative z-10 flex flex-col min-h-screen overflow-hidden">
        <Navbar header="Analytics" />
        <div className="flex-1 p-6 overflow-auto">
          <AnalyticsDashboard />
        </div>
      </div>
    </div>
  </ErrorBoundary>
);

export default Analytics;
