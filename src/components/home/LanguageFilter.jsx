import { useTranslation } from "react-i18next";

const FILTERS = [
  { id: "all", labelKey: "languageFilter.all" },
  { id: "english", labelKey: "languageFilter.english" },
  { id: "spanish", labelKey: "languageFilter.spanish" },
  { id: "polish", labelKey: "languageFilter.polish" },
];

const LanguageFilter = ({ activeSection, setActiveSection }) => {
  const { t } = useTranslation();
  return (
    <div className="inline-flex flex-wrap gap-0.5 p-0.5 mb-5 rounded-lg bg-ll-hover border border-ll-line">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActiveSection(filter.id)}
          className={`px-3 h-7 rounded-md text-[12.5px] font-medium transition-colors ${
            activeSection === filter.id ? "bg-ll-panel text-ll-ink shadow-ll-1" : "text-ll-ink3 hover:text-ll-ink"
          }`}
        >
          {t(filter.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default LanguageFilter;
