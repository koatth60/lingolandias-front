import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Dropdown = ({ children, buttonText = "Actions", buttonClassName, buttonStyle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={buttonClassName || "ll-btn ll-btn-secondary"}
          style={buttonStyle || {}}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{buttonText}</span>
          <FiChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-ll-violet' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="ll-card absolute right-0 mt-2 w-56 overflow-hidden z-[101] shadow-ll-pop py-1">
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export default Dropdown;