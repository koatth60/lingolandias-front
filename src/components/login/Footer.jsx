import { FiFacebook, FiInstagram, FiTwitter } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#161625] py-6 border-t border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-y-4 md:flex-row md:justify-between">
          {/* Branding */}
          <div className="text-sm text-gray-400">
            {t("footer.rights", { year: new Date().getFullYear() })}
          </div>
          
          {/* Social icons */}
          <div className="flex space-x-4">
            <a 
              href="https://www.facebook.com/lingolandias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              <FiFacebook size={20} />
            </a>
            <a 
              href="https://www.instagram.com/lingolandias" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              <FiInstagram size={20} />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              <FiTwitter size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;