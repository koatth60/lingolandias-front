import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const CustomToolbar = ({ label, onNavigate, onView, view, actionsBar }) => {
  const { t } = useTranslation();
  const views = ['week', 'day', 'agenda'];
  const viewLabels = {
    week: t('toolbar.week'),
    day: t('toolbar.day'),
    agenda: t('toolbar.agenda'),
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 border-b border-ll-line">

      {/* Left: title + navigation */}
      <div className="flex items-center gap-3">
        <span className="text-[13.5px] font-semibold text-ll-ink whitespace-nowrap">
          {t('toolbar.classesSchedule')}
        </span>

        <div className="flex items-center gap-1.5 ml-1">
          <button onClick={() => onNavigate('TODAY')} className="ll-btn ll-btn-secondary ll-btn-sm">
            {t('common.today')}
          </button>
          <div className="flex border border-ll-line2 rounded-lg overflow-hidden">
            <button onClick={() => onNavigate('PREV')} className="w-7 h-7 flex items-center justify-center text-ll-ink2 hover:bg-ll-hover border-r border-ll-line">
              <FiChevronLeft size={15} />
            </button>
            <button onClick={() => onNavigate('NEXT')} className="w-7 h-7 flex items-center justify-center text-ll-ink2 hover:bg-ll-hover">
              <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Center: current period label */}
      <span className="text-[13px] font-mono tabular text-ll-ink order-first sm:order-none">
        {label}
      </span>

      {/* Right: legend + actions dropdown + view toggle */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 text-[11.5px] text-ll-ink3">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ll-violet" />{t('toolbar.oneOnOne', '1:1')}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-ll-teal" />{t('toolbar.group', 'Group')}</span>
        </div>
        {actionsBar}
        <div className="flex items-center p-0.5 rounded-lg bg-ll-hover border border-ll-line">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => onView(v)}
              className={`px-2.5 py-1 text-[12px] font-medium rounded-md capitalize transition-colors ${
                view === v
                  ? 'bg-ll-panel text-ll-ink shadow-ll-1'
                  : 'text-ll-ink3 hover:text-ll-ink'
              }`}
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
