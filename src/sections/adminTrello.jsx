import Dashboard from "./dashboard";
import Navbar from "../components/navbar";
import AdminTrelloPanel from "../components/trello/AdminTrelloPanel";
import ErrorBoundary from "../components/ErrorBoundary";

const AdminTrello = () => {
  return (
    <ErrorBoundary>
      <div className="flex w-full relative min-h-screen">
        <Dashboard />
        <div className="flex-1 relative z-10 flex flex-col min-h-screen overflow-hidden">
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
