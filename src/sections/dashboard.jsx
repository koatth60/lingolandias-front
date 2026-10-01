// dashboard.jsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { toggleSidebar } from "../redux/sidebarSlice";
import {
  FiHome, FiCalendar, FiBookOpen, FiMessageSquare, FiUser,
  FiSettings, FiHelpCircle, FiUsers, FiChevronLeft, FiChevronDown, FiVideo,
  FiRadio,
  FiGrid, FiLogOut, FiBarChart2, FiActivity, FiUserPlus
} from "react-icons/fi";
import { socket } from "../socket";
import { toast } from "react-toastify";
import { updateUserStatus } from "../redux/userSlice";
import { useLogout } from "../hooks/customHooks";
import { performLogout } from "../auth/session";
import { selectTotalUnread } from "../redux/notificationsSlice";
import { prefetchRoute } from "../routePrefetch";
import MobileTabBar from "../components/layout/MobileTabBar";


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

  const handleLogout = () => {
    performLogout(dispatch);
    logoutAndNavigate();
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
      ? [{ to: "/recordings", icon: FiVideo, text: t("recordings.title"), short: t("recordings.short") }]
      : []),
    ...(user?.role === "teacher" || user?.role === "admin"
      ? [{ to: "/support", icon: FiRadio, text: t("nav.support"), unread: supportUnreadCount, accent: true }]
      : []),
  ];

  const workspaceLinks = [
    ...(user?.role === 'teacher' || user?.role === 'admin'
      ? [{ to: '/trello', icon: FiGrid, text: 'Trello 2.0' }]
      : []),
    ...(user?.role === 'teacher'
      ? [{ to: '/invitados', icon: FiUserPlus, text: t('nav.invitados') }]
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

  const linkClass = (isActive) =>
    `relative flex items-center rounded-lg border transition-colors duration-150 ${
      isSidebarOpen ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
    } ${
      isActive
        ? "ll-nav-active bg-ll-panel border-ll-line text-ll-ink font-medium shadow-ll-1"
        : "border-transparent text-ll-ink3 hover:text-ll-ink hover:bg-ll-hover"
    }`;
  const iconClass = (isActive) => (isActive ? "text-ll-violet-ink flex-shrink-0" : "flex-shrink-0");

  return (
    <>
      <div
        className={`h-screen hidden lg:flex flex-col fixed top-0 left-0 z-50 lg:z-[5] lg:sticky lg:top-0 bg-ll-sidebar ${
          isSidebarOpen
            ? "w-[232px] flex-shrink-0 translate-x-0"
            : "w-[232px] flex-shrink-0 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
        style={{
          transition: 'width 200ms cubic-bezier(0.4,0,0.2,1), transform 200ms cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}
      >
        <div className="flex flex-col h-full pt-3.5 px-2.5 pb-3">

          {/* ── Logo Section ── */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between gap-2 px-1.5 pb-3.5">
              <Link to="/home" className="flex items-center gap-2.5 min-w-0 group">
                <div className="ll-logo-orb w-6 h-6 flex-shrink-0 relative text-xs">
                  L
                <svg className="hw-only absolute -left-1.5 -top-[13px] w-[26px] h-5 -rotate-[14deg] pointer-events-none" viewBox="0 0 26 20" aria-hidden="true"><path d="M1 17.5c4 1.6 20 1.6 24 0-1.5-1.4-5-2-6.5-2L15 2.5c-.4-1-1.8-1.2-2.4-.3L8.6 15.5c-2 .1-5.6.7-7.6 2z" fill="#140A1F" stroke="#F08A2C" strokeWidth=".8" /><path d="M8.2 14.2c3 .6 7 .6 10 0" stroke="#F08A2C" strokeWidth="1.6" /></svg>
                </div>

                {isSidebarOpen && (
                  <>
                    <span className="text-[17px] font-semibold whitespace-nowrap text-ll-ink tracking-tight">
                      Lingolandias
                    </span>
                    <FiChevronDown size={14} className="text-ll-ink3 flex-shrink-0" />
                  </>
                )}
              </Link>

              {isSidebarOpen && (
                <button
                  onClick={() => dispatch(toggleSidebar())}
                  className="lg:hidden text-ll-ink3 hover:text-ll-ink flex-shrink-0 transition-colors duration-150"
                >
                  <FiChevronLeft size={18} />
                </button>
              )}
            </div>
          </div>

          {/* ── Main Nav — scrollable ── */}
          <div
            className="flex-1 overflow-y-auto min-h-0 custom-scrollbar"
            style={{ overscrollBehaviorY: 'contain' }}
          >
            <nav>
              <ul className="space-y-0.5">
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
                        className={linkClass(isActive)}
                      >
                        <Icon size={17} className={iconClass(isActive)} />

                        {isSidebarOpen && (
                          <span className="text-[13.5px] truncate">
                            {item.text}
                          </span>
                        )}

                        {item.unread > 0 && (
                          <span
                            className={`absolute flex items-center justify-center bg-ll-teal text-white text-[10px] font-semibold rounded-full flex-shrink-0 ${
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

            {workspaceLinks.length > 0 && (
              <nav className="pt-1">
                {isSidebarOpen && (
                  <p className="px-3 pt-2 pb-1.5 text-[11px] font-medium tracking-wide text-ll-ink4 uppercase">
                    {t('nav.workspace')}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {workspaceLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeLink === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onMouseEnter={() => prefetchRoute(item.to)}
                          onFocus={() => prefetchRoute(item.to)}
                          onTouchStart={() => prefetchRoute(item.to)}
                          className={linkClass(isActive)}
                        >
                          <Icon size={17} className={iconClass(isActive)} />
                          {isSidebarOpen && (
                            <span className="text-[13.5px] truncate">{item.text}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>

          {/* ── Footer — fixed ── */}
          <div className="flex-shrink-0 mt-auto">
            {isSidebarOpen && (
              <svg className="hw-only block w-full h-[74px] mb-1.5" viewBox="0 0 200 74" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
                <path d="M0 62c30-10 60-8 100-6s70-4 100 0v18H0z" fill="#1A1226" />
                <path d="M28 60V40a11 11 0 0 1 22 0v20z" fill="#241A33" />
                <path d="M34 47h10M39 42v12" stroke="#3A2D4C" strokeWidth="2" />
                <path d="M118 58V44a8 8 0 0 1 16 0v14z" fill="#241A33" />
                <path d="M160 58V30M152 38h16" stroke="#241A33" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="80" cy="58" rx="9" ry="7" fill="#F08A2C" />
                <path d="M80 51c0-2 1-3 2.5-3.5" stroke="#3CCB8F" strokeWidth="1.6" fill="none" />
                <path className="ll-flicker" d="M75.5 57l2-2.5 2 2.5zM80.5 57l2-2.5 2 2.5zM76 60c2.5 2 5.5 2 8 0" fill="#FFE08A" stroke="#FFE08A" strokeWidth=".8" />
                <path d="M0 70c40-8 80-2 120-4s60-6 80-2v10H0z" fill="rgba(200,185,255,.08)" />
              </svg>
            )}
            <div className="pt-3">
              {/* Bottom nav links */}
              <div className="space-y-0.5">
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
                      className={linkClass(isActive)}
                    >
                      <Icon size={17} className={iconClass(isActive)} />
                      {isSidebarOpen && (
                        <span className="text-[13.5px] truncate">{item.text}</span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="mt-1.5 pt-1.5 border-t border-ll-line">
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center rounded-lg transition-colors duration-150 text-ll-ink3 hover:text-ll-danger hover:bg-ll-hover ${
                    isSidebarOpen ? "px-3 py-2.5 gap-3" : "p-2.5 justify-center"
                  }`}
                >
                  <FiLogOut size={17} className="flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-[13.5px]">{t("nav.logout")}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Phone: bottom tab bar replaces the sidebar drawer */}
      <MobileTabBar
        primary={navLinks.slice(0, 4)}
        more={[
          { key: "main", items: navLinks.slice(4) },
          { key: "workspace", label: t("nav.workspace"), items: workspaceLinks },
          { key: "account", items: bottomLinks },
        ].filter((g) => g.items.length > 0)}
        onLogout={handleLogout}
      />

    </>
  );
};

export default Dashboard;
