import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { FiMoreHorizontal, FiLogOut } from "react-icons/fi";
import { prefetchRoute } from "../../routePrefetch";

// Phone-only app chrome: the first four destinations live in a bottom tab bar,
// everything else sits behind "More" in a bottom sheet. Hidden on lg+ (the
// sidebar takes over) and while a chat is open (html.ll-chat-open).
const Badge = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-ll-teal text-white text-[10px] font-semibold rounded-full ring-2 ring-ll-panel">
      {count > 9 ? "9+" : count}
    </span>
  ) : null;
Badge.propTypes = { count: PropTypes.number };

const MobileTabBar = ({ primary, more, onLogout }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close the sheet on any navigation.
  useEffect(() => { setSheetOpen(false); }, [pathname]);

  const moreItems = more.flatMap((g) => g.items);
  const moreActive = moreItems.some((i) => i.to === pathname);
  const moreUnread = moreItems.reduce((n, i) => n + (i.unread || 0), 0);

  return (
    <>
      <nav
        className="ll-tabbar lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ll-panel border-t border-ll-line"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t("nav.workspace", "Navigation")}
      >
        <ul className="flex items-stretch justify-around h-16 px-1">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <li key={item.to} className="flex-1 min-w-0">
                <Link
                  to={item.to}
                  onTouchStart={() => prefetchRoute(item.to)}
                  aria-current={active ? "page" : undefined}
                  className="h-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
                >
                  <span className={`relative w-14 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${active ? "bg-ll-violet-tint text-ll-violet-ink" : "text-ll-ink3"}`}>
                    <Icon size={20} />
                    <Badge count={item.unread} />
                  </span>
                  <span className={`text-[10.5px] leading-none truncate max-w-full px-0.5 ${active ? "font-semibold text-ll-ink" : "text-ll-ink3"}`}>{item.short || item.text}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1 min-w-0">
            <button
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="w-full h-full flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
            >
              <span className={`relative w-14 h-8 flex items-center justify-center rounded-full transition-colors duration-200 ${moreActive || sheetOpen ? "bg-ll-violet-tint text-ll-violet-ink" : "text-ll-ink3"}`}>
                <FiMoreHorizontal size={20} />
                <Badge count={moreUnread} />
              </span>
              <span className={`text-[11px] leading-none ${moreActive || sheetOpen ? "font-semibold text-ll-ink" : "text-ll-ink3"}`}>{t("nav.more", "More")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("nav.more", "More")}>
          <button
            className="ll-fade-in absolute inset-0 bg-black/55"
            onClick={() => setSheetOpen(false)}
            aria-label={t("common.close", "Close")}
          />
          <div
            className="ll-sheet-up absolute bottom-0 inset-x-0 bg-ll-panel border-t border-ll-line rounded-t-2xl max-h-[78vh] overflow-y-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)", overscrollBehavior: "contain" }}
          >
            <div className="flex justify-center pt-2.5 pb-1"><span className="w-9 h-1 rounded-full bg-ll-line2" /></div>
            {more.map((group) => (
              <div key={group.key} className="px-3 pt-2">
                {group.label && <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-ll-ink4 uppercase">{group.label}</p>}
                <ul>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          className={`relative flex items-center gap-3 px-2 py-3 rounded-xl text-[15px] transition-colors ${active ? "bg-ll-violet-tint text-ll-ink font-medium" : "text-ll-ink2 active:bg-ll-hover"}`}
                        >
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-ll-panel text-ll-violet-ink" : "bg-ll-subtle text-ll-ink3"}`}>
                            <Icon size={18} />
                          </span>
                          <span className="flex-1 truncate">{item.text}</span>
                          {item.unread > 0 && <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-ll-teal text-white text-[11px] font-semibold rounded-full">{item.unread > 9 ? "9+" : item.unread}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <div className="px-3 pt-1 mt-1 border-t border-ll-line">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-2 py-3 rounded-xl text-[15px] text-ll-danger active:bg-ll-hover"
              >
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-ll-subtle"><FiLogOut size={18} /></span>
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

MobileTabBar.propTypes = {
  primary: PropTypes.array.isRequired,
  more: PropTypes.array.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default MobileTabBar;
