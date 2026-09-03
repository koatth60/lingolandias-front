import { useTranslation } from "react-i18next";
import { FiRefreshCw } from "react-icons/fi";
import useAppUpdateAvailable from "../../hooks/useAppUpdateAvailable";

const UpdateAvailableBanner = () => {
  const { t } = useTranslation();
  const updateAvailable = useAppUpdateAvailable();
  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2.5 rounded-full shadow-2xl text-sm text-white"
      style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 8px 24px rgba(158,47,208,0.4)" }}>
      <span className="font-medium">{t("common.updateAvailable")}</span>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors font-semibold"
      >
        <FiRefreshCw size={13} />
        {t("common.refreshNow")}
      </button>
    </div>
  );
};

export default UpdateAvailableBanner;
