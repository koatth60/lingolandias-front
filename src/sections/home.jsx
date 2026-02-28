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
    <div className="flex w-full min-h-screen bg-white dark:bg-brand-dark">
      <Dashboard />

      <div className="w-full min-w-0 overflow-x-hidden">
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