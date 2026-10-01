import PropTypes from 'prop-types';
import { FiCalendar, FiArrowRight, FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export const UpcomingClass = ({ time, teacher, date, isGroupClass, onJoin, onMessage, onViewCalendar }) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 min-h-[68px] flex items-center justify-between gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 text-center min-w-[46px] font-mono tabular">
          <p className="text-sm font-medium text-ll-ink leading-none">{time.split(' ')[0]}</p>
          <p className="text-[10px] text-ll-ink3 uppercase tracking-wide mt-1">{time.split(' ')[1]}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium text-ll-ink truncate">{teacher}</p>
          <p className="text-[12px] text-ll-ink3 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1.5">
              <FiCalendar size={11} className="flex-shrink-0" />
              {date}
            </span>
            <span className="ll-pill" style={
              isGroupClass
                ? { background: 'rgb(var(--ll-teal-tint))', color: 'rgb(var(--ll-teal-ink))' }
                : { background: 'rgb(var(--ll-violet-tint))', color: 'rgb(var(--ll-violet-ink))' }
            }>
              <span className="ll-pill-dot" style={{ background: isGroupClass ? 'rgb(var(--ll-teal))' : 'rgb(var(--ll-violet))' }} />
              {isGroupClass ? t("toolbar.group", "Group") : t("toolbar.oneOnOne", "1:1")}
            </span>
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        {onMessage && (
          <button
            onClick={onMessage}
            title={t("upcomingClass.message")}
            className="ll-btn ll-btn-ghost ll-btn-sm !px-1.5"
          >
            <FiMessageSquare size={14} />
          </button>
        )}
        {onViewCalendar && (
          <button
            onClick={onViewCalendar}
            title={t("upcomingClass.viewInCalendar")}
            className="ll-btn ll-btn-ghost ll-btn-sm !px-1.5"
          >
            <FiCalendar size={14} />
          </button>
        )}
        <button onClick={onJoin} className="ll-btn ll-btn-primary ll-btn-sm">
          {t("upcomingClass.join")} <FiArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

UpcomingClass.propTypes = {
  time: PropTypes.string.isRequired,
  teacher: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  isGroupClass: PropTypes.bool,
  onJoin: PropTypes.func.isRequired,
  onMessage: PropTypes.func,
  onViewCalendar: PropTypes.func,
};
