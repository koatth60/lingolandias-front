import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Dropdown = ({ children, buttonText = "Actions", buttonClassName, buttonStyle }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className={buttonClassName || "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-[#9E2FD0]/20 transition-all group"}
          style={buttonStyle || {}}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{buttonText}</span>
          <FiChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#9E2FD0]' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50">
            {/* Fondo con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d0a1e] dark:via-[#1a1a2e] dark:to-[#110e28]" />
            
            {/* Ambient glow para dark mode */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
              <div className="absolute w-24 h-24 rounded-full bg-[#9E2FD0]/10 blur-2xl -top-12 -right-12" />
            </div>

            {/* Contenido */}
            <div className="relative z-10 py-1 border border-gray-200 dark:border-[#9E2FD0]/20 rounded-xl">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dropdown;