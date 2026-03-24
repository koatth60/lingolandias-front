import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import AdminTrelloPanel from "../components/trello/AdminTrelloPanel";
import ErrorBoundary from "../components/common/ErrorBoundary";

const AdminTrello = () => {
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
        {/* Ambient orbs — dark mode */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
          <div
            className="absolute rounded-full blur-3xl opacity-10"
            style={{
              background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)",
              width: "600px", height: "600px", top: "-10%", right: "-5%",
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-8"
            style={{
              background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)",
              width: "400px", height: "400px", bottom: "5%", left: "10%",
            }}
          />
        </div>
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]"
          style={{
            backgroundImage: `linear-gradient(rgba(158,47,208,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(158,47,208,0.8) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
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
