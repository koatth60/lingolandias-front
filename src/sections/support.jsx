import Dashboard from "./dashboard";
import Navbar from "../components/navbar";
import SupportChatWindow from "../components/messages/SupportChatWindow";
import { useTranslation } from "react-i18next";

const Support = () => {
  const { t } = useTranslation();
  return (
    <div className="flex w-full relative h-screen">
      <Dashboard />
      <div className="w-full flex flex-col min-w-0">
        <Navbar header={t("support.title")} />
        <section className="flex-1 min-h-0">
          <SupportChatWindow />
        </section>
      </div>
    </div>
  );
};

export default Support;
