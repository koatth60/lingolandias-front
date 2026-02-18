import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-[#9E2FD0]/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 focus:outline-none group"
      >
        <span className="text-lg font-medium text-gray-800 dark:text-white group-hover:text-[#9E2FD0] transition-colors">
          {title}
        </span>
        <FiChevronDown 
          size={20} 
          className={`text-gray-500 dark:text-gray-400 transition-all duration-300 ${
            isOpen ? 'rotate-180 text-[#9E2FD0]' : ''
          }`}
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 text-gray-600 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;