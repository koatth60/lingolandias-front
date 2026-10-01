import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import TrelloDashboard from "../components/trello/TrelloDashboard";
import ErrorBoundary from "../components/common/ErrorBoundary";

const Trello = () => {
  return (
    <ErrorBoundary>
      <div className="flex w-full relative min-h-screen bg-ll-canvas">
        <Dashboard />
        <div className="ll-shell flex-1 relative z-10 flex flex-col min-w-0">
          <Navbar header="Trello 2.0" />
          <div className="flex-1 p-6 overflow-auto">
            <TrelloDashboard />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Trello;