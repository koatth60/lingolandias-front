// navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import avatar from "../../assets/logos/avatar.jpg";
import { useLogout } from "../../hooks/customHooks";
import { performLogout } from "../../auth/session";
import { toggleSidebar } from "../../redux/sidebarSlice";
import ThemeToggleButton from "../buttons/ThemeToggleButton";
import { FiChevronDown, FiMenu, FiChevronLeft, FiUser, FiSettings, FiHelpCircle, FiLogOut, FiBookOpen } from "react-icons/fi";


const Navbar = ({ header }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo.user);
  const isSidebarOpen = useSelector((state) => state.sidebar.isSidebarOpen);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const logoutAndNavigate = useLogout();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    performLogout(dispatch);
    logoutAndNavigate();
  };

  return (
    <header className="ll-navbar sticky top-0 z-50 w-full bg-ll-panel border-b border-ll-line">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 md:px-6">

        {/* Left — sidebar toggle + page title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden lg:block p-1.5 sm:p-2 rounded-lg text-ll-ink3 hover:text-ll-ink hover:bg-ll-hover transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen
              ? <FiChevronLeft size={18} className="sm:w-5 sm:h-5" />
              : <FiMenu size={18} className="sm:w-5 sm:h-5" />
            }
          </button>

          {/* Online dot + page header */}
          <div className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-ll-teal flex-shrink-0"
              style={{ boxShadow: '0 0 0 3px rgb(var(--ll-teal-tint))' }}
            />
            <h1 className="text-sm sm:text-[15px] font-semibold text-ll-ink tracking-tight">
              {header}
            </h1>
          </div>
        </div>

        {/* Right — theme toggle + user menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <ThemeToggleButton />

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 sm:gap-2 md:gap-3 p-1 sm:p-1.5 rounded-lg hover:bg-ll-hover transition-colors duration-150"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                <img
                  src={user?.avatarUrl || avatar}
                  alt={user?.name}
                  className="relative w-full h-full rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-ll-teal rounded-full ring-2 ring-ll-panel" />
              </div>

              <span className="hw-gothic ll-nav-name hidden sm:inline-block text-[13px] font-medium text-ll-ink">
                {user?.name?.split(' ')[0]}
              </span>

              <FiChevronDown
                size={14}
                className={`hidden sm:block text-ll-ink3 transition-transform duration-150 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="ll-user-menu ll-fade-up absolute right-0 top-10 sm:top-12 w-56 sm:w-64 rounded-xl z-50 overflow-hidden bg-ll-panel border border-ll-line shadow-ll-pop">
                <div className="relative px-4 py-3 border-b border-ll-line">
                  <svg className="hw-only absolute right-0 top-0 w-[84px] h-[84px] pointer-events-none opacity-70" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8 }} viewBox="0 0 150 150" aria-hidden="true"><path d="M150 0 40 110M150 0 95 150M150 0 0 60M150 0 0 5" /><path d="M118 0c2 10 8 18 20 21 4 1 8 2 12 2M86 0c3 22 15 37 36 42 9 2 19 3 28 3M52 0c4 34 23 57 55 64 14 3 29 4 43 4M20 1c6 48 34 79 79 90 17 4 34 5 51 5" /></svg>
                  <div className="hw-only ll-dangle absolute right-[54px] top-0 w-4 pointer-events-none" aria-hidden="true">
                    <i className="block w-px h-5 mx-auto" style={{ background: 'rgb(var(--ll-ink-3))' }} />
                    <svg className="block w-4 h-[14px] -mt-px" viewBox="0 0 20 18"><g stroke="#120A1C" strokeWidth="1.2" fill="none" strokeLinecap="round"><path d="M7 7 2 3M7 9 1 8M7 11l-5 4M8 12l-3 5M13 7l5-4M13 9l6-1M13 11l5 4M12 12l3 5" /></g><ellipse cx="10" cy="9.5" rx="3.6" ry="4.2" fill="#120A1C" /><circle cx="10" cy="4.8" r="2.2" fill="#120A1C" /><circle cx="9.2" cy="4.6" r=".5" fill="#F08A2C" /><circle cx="10.8" cy="4.6" r=".5" fill="#F08A2C" /></svg>
                  </div>
                  <p className="relative text-[13.5px] font-semibold text-ll-ink hw-gothic ll-menu-name">
                    {user?.name} {user?.lastName}
                  </p>
                  <p className="text-xs text-ll-ink3 mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-ll-teal" />
                    <span className="text-xs text-ll-teal-ink font-medium">{t("navbar.online")}</span>
                  </div>
                </div>

                <div className="py-1.5">
                  {[
                    { href: '/profile', label: t("navbar.profile"), icon: FiUser },
                    { href: '/settings', label: t("navbar.settings"), icon: FiSettings },
                    { href: '/help-center', label: t("navbar.helpCenter"), icon: FiHelpCircle },
                    ...(user?.role !== 'admin'
                      ? [{ href: '/course', label: t("nav.course"), icon: FiBookOpen }]
                      : []),
                  ].map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 px-4 py-2.5 sm:py-2 text-sm text-ll-ink2 hover:bg-ll-hover hover:text-ll-ink transition-colors duration-150"
                    >
                      <Icon size={14} className="flex-shrink-0 opacity-70" />
                      {label}
                    </a>
                  ))}
                </div>

                <div className="h-px bg-ll-line mx-3" />

                <div className="relative py-1.5">
                  <svg className="hw-only absolute right-0 bottom-0 w-[120px] h-[34px] pointer-events-none" viewBox="0 0 120 34" aria-hidden="true">
                    <path d="M0 26c30-8 60-6 120-2v10H0z" fill="#1A1226" />
                    <path d="M70 28V18a7 7 0 0 1 14 0v10z" fill="#241A33" />
                    <path d="M95 28V10M89 15h12" stroke="#241A33" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="56" cy="27" rx="6" ry="4.5" fill="#F08A2C" />
                    <path className="ll-flicker" d="M53 26.5l1.4-1.8 1.4 1.8zM57 26.5l1.4-1.8 1.4 1.8zM53.5 29c1.7 1.4 4 1.4 5.5 0" fill="#FFE08A" stroke="#FFE08A" strokeWidth=".6" />
                  </svg>
                  <button
                    onClick={handleLogout}
                    className="relative w-full text-left flex items-center gap-2.5 px-4 py-2.5 sm:py-2 text-sm font-medium text-ll-danger hover:bg-ll-hover transition-colors duration-150"
                  >
                    <FiLogOut size={14} className="flex-shrink-0 opacity-80" />
                    {t("navbar.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
