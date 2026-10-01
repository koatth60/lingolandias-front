import PropTypes from 'prop-types';

export const InfoCard = ({ question, answer, topRow }) => (
  <div className={`py-4 ${topRow ? "border-t-0 pt-0" : "border-t border-ll-line"}`}>
    <h3 className="text-[14.5px] font-semibold text-ll-ink mb-1.5">{question}</h3>
    <p className="text-[13.5px] text-ll-ink2 leading-relaxed">{answer}</p>
  </div>
);

InfoCard.propTypes = {
  question: PropTypes.string.isRequired,
  answer: PropTypes.string.isRequired,
  topRow: PropTypes.bool,
};
