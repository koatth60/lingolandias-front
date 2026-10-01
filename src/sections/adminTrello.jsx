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
        
        {/* Ambient orbs — dark mode */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
          <div
            className="absolute rounded-full blur-3xl opacity-10"
            style={{
              background: "radial-gradient(circle, rgb(var(--ll-violet) / 0.6), transparent 70%)",
              width: "600px", height: "600px", top: "-10%", right: "-5%",
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-8"
            style={{
              background: "radial-gradient(circle, rgba(31,164,140,0.4), transparent 70%)",
              width: "400px", height: "400px", bottom: "5%", left: "10%",
            }}
          />
        </div>
        {/* Grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]"
          style={{
            backgroundImage: `linear-gradient(rgb(var(--ll-violet) / 0.8) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ll-violet) / 0.8) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
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
