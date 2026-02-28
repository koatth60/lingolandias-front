import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Dashboard from "./dashboard";
import Navbar from "../components/navbar";
import UserHomePage from "../components/home/UserHomePage";
import AdminHomeDashboard from "../components/home/AdminHomeDashboard";

const Home = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const { t } = useTranslation();

  return (
    <div className="flex w-full relative min-h-screen">
      <Dashboard />

      <div className="w-full min-w-0 relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar header={t("home.pageTitle")} />
        
        {/* Contenido principal */}
        {user.role === "admin" ? (
          <AdminHomeDashboard />
        ) : (
          <UserHomePage />
        )}
      </div>
    </div>
  );
};

export default Home;