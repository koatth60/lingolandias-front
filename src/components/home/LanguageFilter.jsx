import { useTranslation } from "react-i18next";

const FILTERS = [
  { id: "all", labelKey: "languageFilter.all", emoji: "🌍" },
  { id: "english", labelKey: "languageFilter.english", emoji: "🇺🇸" },
  { id: "spanish", labelKey: "languageFilter.spanish", emoji: "🇪🇸" },
  { id: "polish", labelKey: "languageFilter.polish", emoji: "🇵🇱" },
];

const LanguageFilter = ({ activeSection, setActiveSection }) => {
  const { t } = useTranslation();
  return (
  <div className="flex flex-wrap gap-2 mb-6">
    {FILTERS.map((filter) => (
      <button
        key={filter.id}
        onClick={() => setActiveSection(filter.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
          activeSection !== filter.id ? "text-gray-700 dark:text-gray-200" : ""
        }`}
        style={
          activeSection === filter.id
            ? {
                background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))",
                color: "#fff",
                boxShadow: "0 3px 10px rgb(var(--ll-violet) / 0.35)",
              }
            : {
                background: "rgb(var(--ll-violet) / 0.08)",
                border: "1px solid rgb(var(--ll-violet) / 0.15)",
              }
        }
      >
        <span>{filter.emoji}</span>
        {t(filter.labelKey)}
      </button>
    ))}
  </div>
  );
};

export default LanguageFilter;
