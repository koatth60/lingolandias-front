const FILTERS = [
  { id: "all", label: "All Languages", emoji: "🌍" },
  { id: "english", label: "English", emoji: "🇺🇸" },
  { id: "spanish", label: "Spanish", emoji: "🇪🇸" },
  { id: "polish", label: "Polish", emoji: "🇵🇱" },
];

const LanguageFilter = ({ activeSection, setActiveSection }) => (
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
                background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                color: "#fff",
                boxShadow: "0 3px 10px rgba(158,47,208,0.35)",
              }
            : {
                background: "rgba(158,47,208,0.08)",
                border: "1px solid rgba(158,47,208,0.15)",
              }
        }
      >
        <span>{filter.emoji}</span>
        {filter.label}
      </button>
    ))}
  </div>
);

export default LanguageFilter;
