import Dashboard from "./dashboard";
import Navbar from "../components/navbar";
import SupportChatWindow from "../components/messages/SupportChatWindow";

const Support = () => {
  return (
    <div className="flex w-full relative h-screen">
      <Dashboard />
      <div className="w-full flex flex-col min-w-0">
        <Navbar header="Updates & Support" />
        <section className="flex-1 min-h-0">
          <SupportChatWindow />
        </section>
      </div>
    </div>
  );
};

export default Support;
