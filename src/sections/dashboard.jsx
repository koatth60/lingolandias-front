// dashboard.jsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toggleSidebar } from "../redux/sidebarSlice";
import {
  FiHome, FiCalendar, FiBookOpen, FiMessageSquare, FiUser,
  FiSettings, FiHelpCircle, FiUsers, FiChevronLeft, FiVideo,
  FiRadio,
  FiGrid, FiLogOut, FiBarChart2, FiActivity
} from "react-icons/fi";
import { socket } from "../socket";
import { toast } from "react-toastify";
import { updateUserStatus } from "../redux/userSlice";
import logo from "../assets/logos/logo3.png";
import { useLogout } from "../hooks/customHooks";
import { logout } from "../redux/userSlice";
import { selectTotalUnread } from "../redux/notificationsSlice";
import { prefetchRoute } from "../routePrefetch";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Dashboard = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [activeLink, setActiveLink] = useState("");

  const dispatch = useDispatch();
  const logoutAndNavigate = useLogout();
  const user = useSelector((state) => state.user.userInfo.user);
  const isSidebarOpen = useSelector((state) => state.sidebar.isSidebarOpen);
  const { unreadCounts } = useSelector((state) => state.messages);
  const supportUnreadCount = unreadCounts?.supportRoom || 0;
  // Both fed by NotificationsListener (mounted once at the App level, not
  // here) — this component only renders the badges, it no longer owns any
  // of the socket listeners or fetches behind them.
  const conversationsUnread = useSelector(selectTotalUnread);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  // Was creating its own raw `io(BACKEND_URL)` connection on every mount —
  // Dashboard is the shared layout every page renders, so every single
  // navigation between pages (not just login) tore down and reconnected an
  // entirely separate, unauthenticated socket (no token passed to io() here
  // at all). Each cycle re-broadcast this user's online/offline status to
  // everyone, which is what caused the flood of duplicate "X is now
  // online/offline" toasts, worst when a backgrounded tab's throttled timers
  // let several of these cycles queue up and then fire in a burst on focus.
  // The already-connected, already-registered global singleton (see
  // useGlobalSocket, mounted once via RequireAuth) is what every other part
  // of the app already listens on — just attach to that instead.
  useEffect(() => {
    if (user?.id) {
      socket.on("userStatus", (data) => {
        const { id, online, name } = data;
        // A backgrounded tab still receives every queued userStatus event on
        // reconnect/focus — toasting each one turns a normal status backlog
        // (several people logging in/out while you were away) into a long
        // trickle of toasts, since react-toastify's `limit` only caps how
        // many show AT ONCE, not the queue behind them. Nobody needs to be
        // told "X went online 10 minutes ago" after the fact — only toast
        // for a change that's actually happening while someone's looking.
        if (id !== user.id && document.visibilityState === "visible") {
          toast(
            <div>
              <b>{name}</b> is now {online}
            </div>,
            { theme: "light" }
          );
        }
        dispatch(updateUserStatus({ id, online }));
      });
    }
    return () => {
      if (user?.id) {
        socket.off("userStatus");
        // Deliberately no socket.disconnect() — this is the shared
        // singleton every other part of the app relies on staying
        // connected; its lifecycle belongs to useGlobalSocket alone.
      }
    };
  }, [user?.id, dispatch]);

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

  const navLinks = [
    { to: "/home", icon: FiHome, text: t("nav.dashboard") },
    user?.role === "admin"
      ? { to: "/schedule", icon: FiVideo, text: t("nav.meetings") }
      // No unread badge here — Schedule's own chat list is hidden (see
      // schedule.jsx), so a count with nowhere to click through to just
      // looked like a bug. New-message badges now live only on Messages.
      : { to: "/schedule", icon: FiCalendar, text: t("nav.schedule") },
    // { to: "/learning", icon: FiBookOpen, text: t("nav.learning") }, // Hidden — work in progress
    { to: "/messages", icon: FiMessageSquare, text: t("nav.messages"), unread: conversationsUnread },
    ...(user?.role === "teacher" || user?.role === "user"
      ? [{ to: "/recordings", icon: FiVideo, text: t("recordings.title") }]
      : []),
    ...(user?.role === "teacher" || user?.role === "admin"
      ? [{ to: "/support", icon: FiRadio, text: t("nav.support"), unread: supportUnreadCount, accent: true }]
      : []),
    ...(user?.role === 'teacher' || user?.role === 'admin'
      ? [{ to: '/trello', icon: FiGrid, text: 'Trello 2.0' }]
      : []),
    ...(user?.role === 'admin'
      ? [{ to: '/analytics', icon: FiBarChart2, text: 'Analytics' }]
      : []),
  ];

  const bottomLinks = [
    { to: "/profile", icon: FiUser, text: t("nav.profile") },
    ...(user?.role === "admin" ? [
      { to: "/admin", icon: FiUsers, text: t("nav.admin") },
      { to: "/admin-trello", icon: FiGrid, text: "Trello Admin" },
      { to: "/admin-meeting-logs", icon: FiActivity, text: "Meeting Logs" },
    ] : []),
    { to: "/settings", icon: FiSettings, text: t("nav.settings") },
    { to: "/help-center", icon: FiHelpCircle, text: t("nav.helpCenter") },
  ];

  return (
    <>
      <div
        className={`h-screen flex flex-col fixed top-0 left-0 z-50 lg:sticky lg:top-0 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f8fa 100%)',
          transition: 'width 300ms cubic-bezier(0.4,0,0.2,1), transform 300ms cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}
      >
        {/* Dark mode bg — login-identical gradient */}
        <div
          className="hidden dark:block absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)' }}
        />

        {/* Gradient right border */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#9E2FD0]/25 to-transparent dark:via-[#9E2FD0]/40 pointer-events-none" />

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Light mode orbs — very subtle on clean white */}
          <div
            className="absolute rounded-full blur-3xl dark:hidden"
            style={{
              background: 'radial-gradient(circle, rgba(158,47,208,0.07), transparent 70%)',
              width: '260px', height: '260px',
              top: '-10%', left: '-30%',
            }}
          />
          <div
            className="absolute rounded-full blur-3xl dark:hidden"
            style={{
              background: 'radial-gradient(circle, rgba(246,184,46,0.05), transparent 70%)',
              width: '200px', height: '200px',
              bottom: '-6%', right: '-30%',
            }}
          />

          {/* Dark mode orbs — same as login */}
          <div
            className="absolute rounded-full blur-3xl opacity-20 hidden dark:block"
            style={{
              background: 'radial-gradient(circle, rgba(158,47,208,0.35), transparent 70%)',
              width: '520px', height: '520px',
              top: '-8%', left: '-8%',
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-15 hidden dark:block"
            style={{
              background: 'radial-gradient(circle, rgba(246,184,46,0.22), transparent 70%)',
              width: '420px', height: '420px',
              bottom: '-8%', right: '-6%',
            }}
          />
          <div
            className="absolute rounded-full blur-3xl opacity-10 hidden dark:block"
            style={{
              background: 'radial-gradient(circle, rgba(38,217,161,0.14), transparent 70%)',
              width: '320px', height: '320px',
              top: '38%', right: '22%',
            }}
          />
        </div>

        {/* Subtle grid texture — very faint on white, same as login in dark */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.018] dark:opacity-[0.025]"
          aria-hidden="true"
          style={{
            backgroundImage: `
              linear-gradient(rgba(158,47,208,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(158,47,208,0.6) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* ─── MAIN CONTENT ─── */}
        <div className="relative z-10 flex flex-col h-full">

          {/* ── Logo Section ── */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between h-24 px-4 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20">
              <Link to="/home" className="flex items-center gap-4 min-w-0 group">

                {/* Logo with spinning conic ring — mirrors login logo */}
                <div className="relative w-12 h-12 flex-shrink-0">
                  {/* Spinning gradient ring */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      inset: '-4px',
                      background: 'conic-gradient(from 0deg, #9E2FD0, #c084fc, #F6B82E, #26D9A1, #9E2FD0)',
                      animation: 'spin 7s linear infinite',
                      WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                      mask:        'radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 2px))',
                      opacity: 0.80,
                    }}
                  />
                  {/* Ambient glow behind logo */}
                  <div
                    className="absolute rounded-full blur-lg opacity-35 pointer-events-none"
                    style={{
                      inset: '-8px',
                      background: 'radial-gradient(circle, rgba(158,47,208,0.5), rgba(246,184,46,0.15), transparent 70%)',
                    }}
                  />
                  <img
                    src={logo}
                    alt="Lingolandias"
                    className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Pulsing accent dot */}
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#F6B82E]"
                    style={{
                      boxShadow: '0 0 8px rgba(246,184,46,0.9)',
                      animation: 'loginPulseOrb 2s ease-in-out infinite',
                    }}
                  />
                </div>

                {isSidebarOpen && (
                  <span className="text-xl font-extrabold whitespace-nowrap login-gradient-text">
                    Lingolandias
                  </span>
                )}
              </Link>

              {isSidebarOpen && (
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="lg:hidden text-gray-400 dark:text-gray-400 hover:text-[#9E2FD0] dark:hover:text-white flex-shrink-0 transition-colors duration-200"
                >
                  <FiChevronLeft size={20} />
                </button>
              )}
            </div>
          </div>

          {/* ── Main Nav — scrollable ── */}
          <div
            className="flex-1 overflow-y-auto min-h-0"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            <nav className="py-4 px-2">
              <ul className="space-y-1">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeLink === item.to;

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onMouseEnter={() => prefetchRoute(item.to)}
                        onFocus={() => prefetchRoute(item.to)}
                        onTouchStart={() => prefetchRoute(item.to)}
                        className={`relative flex items-center rounded-xl transition-colors duration-200 ${
                          isSidebarOpen ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
                        } ${
                          isActive
                            ? ""
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5"
                        }`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(158,47,208,0.13) 0%, rgba(246,184,46,0.06) 100%)',
                          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                          border: '1px solid rgba(158,47,208,0.28)',
                          boxShadow: '0 2px 14px rgba(158,47,208,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                        } : {}}
                      >
                        {/* Left accent bar for active item */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-[#9E2FD0] to-[#F6B82E]" />
                        )}

                        <Icon
                          size={18}
                          className="flex-shrink-0"
                          style={isActive ? { color: '#9E2FD0' } : {}}
                        />

                        {isSidebarOpen && (
                          <span
                            className={`text-sm font-medium truncate ${isActive ? "login-gradient-text" : ""}`}
                          >
                            {item.text}
                          </span>
                        )}

                        {item.unread > 0 && (
                          <span
                            className={`absolute flex items-center justify-center bg-[#26D9A1] text-white dark:text-[#0d0a1e] text-[10px] font-bold rounded-full flex-shrink-0 notification-badge ${
                              isSidebarOpen
                                ? "right-3 w-4 h-4"
                                : "top-1 right-1 w-3.5 h-3.5"
                            }`}
                          >
                            {item.unread > 9 ? "9+" : item.unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* ── Footer — fixed ── */}
          <div className="flex-shrink-0">
            {/* Gradient divider line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/30 to-transparent dark:via-[#9E2FD0]/50" />

            <div className="p-2">
              {/* Bottom nav links */}
              <div className="space-y-1">
                {bottomLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeLink === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onMouseEnter={() => prefetchRoute(item.to)}
                      onFocus={() => prefetchRoute(item.to)}
                      onTouchStart={() => prefetchRoute(item.to)}
                      className={`relative flex items-center rounded-xl transition-colors duration-200 ${
                        isSidebarOpen ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
                      } ${
                        isActive
                          ? ""
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5"
                      }`}
                      style={isActive ? {
                        background: 'linear-gradient(135deg, rgba(158,47,208,0.13) 0%, rgba(246,184,46,0.06) 100%)',
                        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(158,47,208,0.28)',
                        boxShadow: '0 2px 14px rgba(158,47,208,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                      } : {}}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-[#9E2FD0] to-[#F6B82E]" />
                      )}
                      <Icon
                        size={18}
                        className="flex-shrink-0"
                        style={isActive ? { color: '#9E2FD0' } : {}}
                      />
                      {isSidebarOpen && (
                        <span
                          className={`text-sm font-medium truncate ${isActive ? "login-gradient-text" : ""}`}
                        >
                          {item.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="mt-2">
                <div className="h-px bg-gradient-to-r from-transparent via-[#9E2FD0]/20 to-transparent dark:via-[#9E2FD0]/30 mb-2" />
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center rounded-xl transition-colors duration-200 text-gray-500 dark:text-gray-400 hover:text-[#F6B82E] hover:bg-[#F6B82E]/8 dark:hover:bg-white/5 ${
                    isSidebarOpen ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
                  }`}
                >
                  <FiLogOut size={18} className="flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium truncate">{t("nav.logout")}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

    </>
  );
};

export default Dashboard;
