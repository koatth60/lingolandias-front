import PropTypes from 'prop-types';
import { FiCalendar, FiUser, FiArrowRight } from 'react-icons/fi';

export const UpcomingClass = ({ time, teacher, date, onJoin }) => (
  <div
    className="relative rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-sm dark:shadow-none"
    style={{ border: '1px solid rgba(158,47,208,0.15)' }}
  >
    <div className="dark:hidden absolute inset-0 bg-white" />
    <div
      className="hidden dark:block absolute inset-0"
      style={{ background: 'linear-gradient(135deg, rgba(13,10,30,0.94), rgba(26,26,46,0.92))' }}
    />

    <div className="relative z-10 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-center min-w-[44px]">
          <p className="text-base font-extrabold text-[#9E2FD0] leading-none">{time.split(' ')[0]}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{time.split(' ')[1]}</p>
        </div>
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#9E2FD0]/25 to-transparent flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
            <FiUser size={12} className="text-gray-400 flex-shrink-0" />
            {teacher}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
            <FiCalendar size={11} className="text-gray-400 flex-shrink-0" />
            {date}
          </p>
        </div>
      </div>
      <button
        onClick={onJoin}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-opacity hover:opacity-85"
        style={{ background: 'linear-gradient(135deg, #9E2FD0, #7b22a8)', boxShadow: '0 3px 10px rgba(158,47,208,0.35)' }}
      >
        Join <FiArrowRight size={12} />
      </button>
    </div>
  </div>
);

UpcomingClass.propTypes = {
  time: PropTypes.string.isRequired,
  teacher: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  onJoin: PropTypes.func.isRequired,
};
