import PropTypes from 'prop-types';
import { FiHelpCircle } from 'react-icons/fi';

export const InfoCard = ({ question, answer }) => (
  <div
    className="relative rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-1 shadow-sm dark:shadow-none"
    style={{ border: '1px solid rgba(158,47,208,0.15)' }}
  >
    <div className="dark:hidden absolute inset-0 bg-white" />
    <div
      className="hidden dark:block absolute inset-0"
      style={{ background: 'linear-gradient(135deg, rgba(13,10,30,0.94), rgba(26,26,46,0.92))' }}
    />
    <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-50" />

    <div className="relative z-10 p-5">
      <div className="flex items-start gap-3 mb-3">
        <FiHelpCircle className="text-[#9E2FD0] flex-shrink-0 mt-0.5" size={15} />
        <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-snug">{question}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-6">{answer}</p>
    </div>
  </div>
);

InfoCard.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
};
