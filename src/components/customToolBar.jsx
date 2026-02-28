import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const CustomToolbar = ({ label, onNavigate, onView, view }) => {
  const { t } = useTranslation();
  const views = ['week', 'day', 'agenda'];
  const viewLabels = {
    week: t('toolbar.week'),
    day: t('toolbar.day'),
    agenda: t('toolbar.agenda'),
  };

  return (
    <div className="relative overflow-hidden">
      {/* Light mode bg */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,255,0.95) 100%)',
        }}
      />
      {/* Dark mode bg */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: 'linear-gradient(135deg, rgba(13,10,30,0.85) 0%, rgba(26,26,46,0.85) 100%)',
        }}
      />
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-5 py-4 gap-3 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20">

        {/* Left: title + navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)', boxShadow: '0 2px 8px rgba(158,47,208,0.35)' }}
            >
              <FiCalendar size={14} className="text-white" />
            </div>
            <span className="text-sm font-extrabold login-gradient-text whitespace-nowrap">
              {t('toolbar.classesSchedule')}
            </span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => onNavigate('TODAY')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors text-[#9E2FD0] dark:text-[#c084fc] bg-[#9E2FD0]/8 dark:bg-[#9E2FD0]/15 hover:bg-[#9E2FD0]/15 dark:hover:bg-[#9E2FD0]/25 border border-[#9E2FD0]/20 dark:border-[#9E2FD0]/30"
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => onNavigate('PREV')}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#9E2FD0] dark:hover:text-[#c084fc] hover:bg-[#9E2FD0]/8 dark:hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => onNavigate('NEXT')}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#9E2FD0] dark:hover:text-[#c084fc] hover:bg-[#9E2FD0]/8 dark:hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Center: current period label */}
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200 order-first sm:order-none tracking-tight">
          {label}
        </span>

        {/* Right: view toggle pill */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-[#9E2FD0]/15">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                view === v
                  ? 'text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-white/5'
              }`}
              style={view === v ? {
                background: 'linear-gradient(135deg, #9E2FD0 0%, #7b22a8 100%)',
                boxShadow: '0 2px 10px rgba(158,47,208,0.45)',
              } : {}}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomToolbar;
