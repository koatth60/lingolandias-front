// navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import avatar from "../assets/logos/avatar.jpg";
import { useLogout } from "../hooks/customHooks";
import { logout } from "../redux/userSlice";
import { toggleSidebar } from "../redux/sidebarSlice";
import ThemeToggleButton from "./buttons/ThemeToggleButton";
import { FiChevronDown, FiMenu, FiChevronLeft, FiUser, FiSettings, FiHelpCircle, FiLogOut } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const handleLogout = async () => {
    dispatch(logout());
    logoutAndNavigate();
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
    >
      {/* Background layer — clean white / dark login gradient */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,248,250,0.95) 100%)' }}
      />
      <div
        className="hidden dark:block absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(13,10,30,0.92) 0%, rgba(26,26,46,0.92) 55%, rgba(17,14,40,0.92) 100%)' }}
      />

      {/* Subtle ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Light mode orbs */}
        <div
          className="navbar-orb dark:hidden"
          style={{
            background: 'radial-gradient(circle, rgba(158,47,208,0.18), transparent 70%)',
            width: '200px', height: '200px',
            top: '-80px', left: '-40px',
            animationDuration: '8s',
          }}
        />
        <div
          className="navbar-orb dark:hidden"
          style={{
            background: 'radial-gradient(circle, rgba(246,184,46,0.12), transparent 70%)',
            width: '160px', height: '160px',
            top: '-60px', right: '10%',
            animationDuration: '11s',
            animationDelay: '3s',
          }}
        />
        {/* Dark mode orbs */}
        <div
          className="navbar-orb hidden dark:block"
          style={{
            background: 'radial-gradient(circle, rgba(158,47,208,0.35), transparent 70%)',
            width: '260px', height: '260px',
            top: '-120px', left: '-60px',
            animationDuration: '8s',
          }}
        />
        <div
          className="navbar-orb hidden dark:block"
          style={{
            background: 'radial-gradient(circle, rgba(246,184,46,0.18), transparent 70%)',
            width: '200px', height: '200px',
            top: '-100px', right: '5%',
            animationDuration: '11s',
            animationDelay: '3s',
          }}
        />
      </div>

      {/* Top accent gradient line — same as login */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-60 dark:opacity-80" />

      {/* Bottom border — gradient */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/20 to-transparent dark:via-[#9E2FD0]/40" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between h-16 px-3 sm:px-4 md:px-6">

        {/* Left — sidebar toggle + page title */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-1.5 sm:p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#9E2FD0] dark:hover:text-white hover:bg-[#9E2FD0]/8 dark:hover:bg-white/5 transition-all duration-200"
            aria-label="Toggle sidebar"
          >
            <span
              key={isSidebarOpen ? 'open' : 'closed'}
              style={{ display: 'flex', animation: 'navbarTitleIn 0.18s ease-out both' }}
            >
              {isSidebarOpen
                ? <FiChevronLeft size={18} className="sm:w-5 sm:h-5" />
                : <FiMenu size={18} className="sm:w-5 sm:h-5" />
              }
            </span>
          </button>

          {/* Online dot + page header */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full bg-[#26D9A1] flex-shrink-0"
              style={{ boxShadow: '0 0 6px rgba(38,217,161,0.8)', animation: 'loginPulseOrb 2.5s ease-in-out infinite' }}
            />
            <h1
              key={header}
              className="text-sm sm:text-base font-bold text-[#9E2FD0] dark:text-white tracking-tight"
              style={{ animation: 'navbarTitleIn 0.25s ease-out both' }}
            >
              {header}
            </h1>
          </div>
        </div>

        {/* Center — theme toggle */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <ThemeToggleButton />
        </div>

        {/* Right — user menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 sm:gap-2 md:gap-3 p-1 sm:p-1.5 rounded-lg hover:bg-[#9E2FD0]/6 dark:hover:bg-white/5 transition-all duration-200"
            >
              {/* Avatar with spinning ring */}
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                {/* Spinning conic ring — same as login logo, smaller */}
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: '-2px',
                    background: 'conic-gradient(from 0deg, #9E2FD0, #c084fc, #F6B82E, #26D9A1, #9E2FD0)',
                    animation: 'spin 7s linear infinite',
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1.5px))',
                    mask:        'radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1.5px))',
                    opacity: 0.9,
                  }}
                />
                <img
                  src={user?.avatarUrl || avatar}
                  alt={user?.name}
                  className="relative w-full h-full rounded-full object-cover"
                />
                {/* Online indicator */}
                <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#26D9A1] rounded-full ring-1 ring-white dark:ring-[#0d0a1e]" />
              </div>

              {/* User name */}
              <span className="hidden sm:inline-block text-sm font-semibold text-gray-700 dark:text-gray-200">
                {user?.name?.split(' ')[0]}
              </span>

              <FiChevronDown
                size={14}
                className={`hidden sm:block text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div
                className="absolute right-0 top-10 sm:top-12 w-56 sm:w-64 rounded-2xl z-50 overflow-hidden"
                style={{
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(158,47,208,0.20)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.08) inset',
                  animation: 'navbarDropdownIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
                  transformOrigin: 'top right',
                }}
              >
                {/* Dropdown bg */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(250,245,255,0.95) 0%, rgba(243,232,255,0.95) 100%)' }}
                />
                <div
                  className="hidden dark:block absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, rgba(13,10,30,0.96) 0%, rgba(26,26,46,0.96) 100%)' }}
                />
                {/* Top accent line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />

                {/* Dropdown content */}
                <div className="relative z-10">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {user?.name} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#26D9A1]" style={{ boxShadow: '0 0 4px rgba(38,217,161,0.8)' }} />
                      <span className="text-xs text-[#26D9A1] font-medium">{t("navbar.online")}</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {[
                      { href: '/profile', label: t("navbar.profile"), icon: FiUser },
                      { href: '/settings', label: t("navbar.settings"), icon: FiSettings },
                      { href: '/help-center', label: t("navbar.helpCenter"), icon: FiHelpCircle },
                    ].map(({ href, label, icon: Icon }, i) => (
                      <a
                        key={href}
                        href={href}
                        className="flex items-center gap-2.5 px-4 py-2.5 sm:py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/8 dark:hover:bg-[#9E2FD0]/15 hover:text-[#9E2FD0] dark:hover:text-white transition-colors duration-200"
                        style={{ animation: `navbarItemFadeIn 0.2s ease-out ${120 + i * 50}ms both` }}
                      >
                        <Icon size={14} className="flex-shrink-0 opacity-70" />
                        {label}
                      </a>
                    ))}
                  </div>

                  {/* Gradient divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/25 to-transparent dark:via-[#9E2FD0]/40 mx-3" />

                  {/* Logout */}
                  <div className="py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 sm:py-2 text-sm font-medium text-[#F6B82E] hover:bg-[#F6B82E]/8 dark:hover:bg-[#F6B82E]/10 transition-colors duration-200"
                      style={{ animation: 'navbarItemFadeIn 0.2s ease-out 270ms both' }}
                    >
                      <FiLogOut size={14} className="flex-shrink-0 opacity-80" />
                      {t("navbar.logout")}
                    </button>
                  </div>
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
