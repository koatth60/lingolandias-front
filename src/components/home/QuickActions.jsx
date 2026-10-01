import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiUsers, FiSettings, FiChevronRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const ACTIONS_CONFIG = [
  { icon: FiBarChart2, titleKey: "quickActions.analytics", descKey: "quickActions.analyticsDesc", tile: "bg-ll-violet-tint text-ll-violet-ink", to: "/analytics" },
  { icon: FiUsers, titleKey: "quickActions.manageUsers", descKey: "quickActions.manageUsersDesc", tile: "bg-ll-teal-tint text-ll-teal-ink", to: "/admin" },
  { icon: FiSettings, titleKey: "quickActions.platformSettings", descKey: "quickActions.platformSettingsDesc", tile: "bg-ll-gold-tint text-ll-gold-ink", to: "/settings" },
];

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section>
      <h3 className="text-[13.5px] font-semibold text-ll-ink mb-3">{t("quickActions.title")}</h3>
      <div className="rounded-xl border border-ll-line bg-ll-panel divide-y divide-ll-line overflow-hidden">
        {ACTIONS_CONFIG.map(({ icon: Icon, titleKey, descKey, tile, to }) => (
          <button
            key={titleKey}
            onClick={() => to && navigate(to)}
            className="w-full grid grid-cols-[34px_1fr_auto] items-center gap-3 px-4 py-3 text-left hover:bg-ll-subtle transition-colors"
          >
            <div className={`w-[34px] h-[34px] rounded-[9px] grid place-items-center ${tile}`}>
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ll-ink">{t(titleKey)}</p>
              <p className="text-[12.5px] text-ll-ink3 truncate">{t(descKey)}</p>
            </div>
            <FiChevronRight size={16} className="text-ll-ink4" />
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
