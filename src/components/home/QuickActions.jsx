import { useNavigate } from "react-router-dom";
import { FiBarChart2, FiUsers, FiSettings } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const ACTIONS_CONFIG = [
  { icon: FiBarChart2, titleKey: "quickActions.analytics", descKey: "quickActions.analyticsDesc", gradient: "linear-gradient(135deg, #9E2FD0, #7b22a8)", shadow: "rgba(158,47,208,0.35)", to: null },
  { icon: FiUsers, titleKey: "quickActions.manageUsers", descKey: "quickActions.manageUsersDesc", gradient: "linear-gradient(135deg, #26D9A1, #1fa07a)", shadow: "rgba(38,217,161,0.35)", to: "/admin" },
  { icon: FiSettings, titleKey: "quickActions.platformSettings", descKey: "quickActions.platformSettingsDesc", gradient: "linear-gradient(135deg, #F6B82E, #d4981a)", shadow: "rgba(246,184,46,0.35)", to: "/settings" },
];

const QuickActions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ACTIONS = ACTIONS_CONFIG.map((a) => ({ ...a, title: t(a.titleKey), description: t(a.descKey) }));

  return (
    <section>
      <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span
          className="inline-block w-1 h-4 rounded-full flex-shrink-0"
          style={{ background: "linear-gradient(to bottom, #9E2FD0, #F6B82E)" }}
        />
        {t("quickActions.title")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {ACTIONS.map(({ icon: Icon, title, description, gradient, shadow, to }) => (
          <button
            key={title}
            onClick={() => to && navigate(to)}
            className="group relative rounded-2xl p-5 flex items-start gap-4 text-left transition-transform duration-200 hover:-translate-y-1 shadow-sm dark:shadow-none"
            style={{ border: "1px solid rgba(158,47,208,0.15)", cursor: to ? "pointer" : "default" }}
          >
            <div className="dark:hidden absolute inset-0 rounded-2xl bg-white" />
            <div
              className="hidden dark:block absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(13,10,30,0.90), rgba(26,26,46,0.88))" }}
            />
            <div
              className="relative z-10 p-2.5 rounded-xl flex-shrink-0"
              style={{ background: gradient, boxShadow: `0 4px 14px ${shadow}` }}
            >
              <Icon size={18} className="text-white" />
            </div>
            <div className="relative z-10">
              <p className="font-bold text-gray-800 dark:text-white text-sm">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
