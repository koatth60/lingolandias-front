import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import AdminTrelloPanel from "../components/trello/AdminTrelloPanel";
import ErrorBoundary from "../components/common/ErrorBoundary";

const AdminTrello = () => {
  return (
    <ErrorBoundary>
      <div className="flex w-full relative min-h-screen bg-ll-canvas">
        <Dashboard />
        <div className="ll-shell flex-1 relative z-10 flex flex-col min-w-0">
          <Navbar header="Trello Admin" />
          <div className="flex-1 p-6 overflow-auto">
            <AdminTrelloPanel />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminTrello;
