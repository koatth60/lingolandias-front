import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiMoon, FiBell, FiBellOff, FiUser, FiEye,
  FiShield, FiLogOut, FiGlobe, FiSun, FiCheck, FiChevronDown, FiPlay, FiMessageSquare,
  FiMonitor, FiDownload, FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Dashboard from "../../sections/dashboard";
import Navbar from "../layout/navbar";
import { updateUserSettings } from "../../redux/userSlice";
import { performLogout } from "../../auth/session";
import ChangePasswordModal from "./ChangePasswordModal";
import useNotificationSound from "../../hooks/useNotificationSound";
import useInstallPrompt from "../../hooks/useInstallPrompt";
import { useHalloween } from "../../context/HalloweenContext";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Shared by both push-backed toggles below (class reminders, message
// notifications) — a browser has exactly ONE push subscription per origin,
// so "enabling" either one just needs a subscription to exist; calling
// pushManager.subscribe() again with the same key when one already exists
// is safe and returns the existing subscription rather than duplicating it.
async function subscribeToPush() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("unsupported");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("denied");
  }
  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/vapid-public-key`);
  const { publicKey } = await res.json();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(subscription),
  });
}

// Only call this once BOTH push-backed toggles are off — see the two
// handlers below — since unsubscribing tears down the device's one and only
// subscription, which the other toggle also relies on.
async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
  }
  await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/unsubscribe`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
}

const BrandToggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className={`relative w-10 h-[22px] rounded-full transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? "bg-ll-violet" : "bg-ll-hover border border-ll-line2"}`}
  >
    <div
      className="absolute top-0.5 w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-150 flex items-center justify-center"
      style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
    >
      {checked && <FiCheck size={10} className="text-ll-violet" />}
    </div>
  </button>
);

const LangOption = ({ value: val, label, flag, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(val)}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${selected ? "bg-ll-violet-tint text-ll-violet-ink font-medium" : "text-ll-ink2 hover:bg-ll-hover"}`}
  >
    <span className="text-lg leading-none">{flag}</span>
    <span>{label}</span>
    {selected && <FiCheck size={13} className="ml-auto" />}
  </button>
);

const BrandSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const OPTIONS = [
    { value: "en", label: "English",  flag: "🇬🇧" },
    { value: "es", label: "Español",  flag: "🇪🇸" },
    { value: "pl", label: "Polski",   flag: "🇵🇱" },
  ];

  const selected = OPTIONS.find((o) => o.value === value) || OPTIONS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((p) => !p)} className="ll-btn ll-btn-secondary min-w-[130px] justify-between">
        <span className="flex items-center gap-2">
          <span className="text-base leading-none">{selected.flag}</span>
          <span>{selected.label}</span>
        </span>
        <FiChevronDown size={13} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="ll-card absolute right-0 mt-1.5 min-w-full overflow-hidden z-50 shadow-ll-pop py-1">
          {OPTIONS.map((opt) => (
            <LangOption key={opt.value} {...opt} selected={opt.value === value} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { userInfo } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("appearance");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { enabled: halloween, setEnabled: setHalloween } = useHalloween();

  const darkMode = userInfo?.user?.settings?.darkMode || false;
  const notificationSound = userInfo?.user?.settings?.notificationSound !== false;
  const classReminders = userInfo?.user?.settings?.classReminders === true;
  const messageNotifications = userInfo?.user?.settings?.messageNotifications === true;
  const cardDueReminders = userInfo?.user?.settings?.cardDueReminders === true;
  const canUseTrello = ["teacher", "admin"].includes(userInfo?.user?.role);
  const language = userInfo?.user?.settings?.language || i18n.language || "en";
  const playTestSound = useNotificationSound();
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  const handleInstallApp = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") toast.success(t("settings.appInstalled"));
  };

  const TABS = [
    { id: "appearance",    label: t("settings.appearance"),   icon: FiEye  },
    { id: "notifications", label: t("settings.notifications"), icon: FiBell },
    { id: "app",           label: t("settings.desktopApp"),    icon: FiMonitor },
    { id: "account",       label: t("settings.account"),       icon: FiUser },
  ];

  const SettingRow = ({ icon: Icon, label, description, children }) => (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-ll-line last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-violet-tint text-ll-violet-ink">
          <Icon size={14} />
        </div>
        <div className="min-w-0">
          <span className="block text-[13.5px] font-medium text-ll-ink truncate">{label}</span>
          {description && (
            <span className="block text-[12px] text-ll-ink3 truncate">{description}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const handleDarkModeToggle = () => {
    dispatch(updateUserSettings({ darkMode: !darkMode }));
  };

  const handleNotificationSoundToggle = () => {
    dispatch(updateUserSettings({ notificationSound: !notificationSound }));
  };

  const handleLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    dispatch(updateUserSettings({ language: newLang }));
  };

  const handlePushToggleError = (err) => {
    if (err?.message === "unsupported") toast.error(t("settings.browserNoSupport"));
    else if (err?.message === "denied") toast.error(t("settings.allowNotifications"));
    else toast.error(t("settings.remindersFailed"));
  };

  const handleClassRemindersToggle = async () => {
    const newValue = !classReminders;

    if (newValue) {
      try {
        await subscribeToPush();
        dispatch(updateUserSettings({ classReminders: true }));
        toast.success(t("settings.remindersEnabled"));
      } catch (err) {
        handlePushToggleError(err);
      }
    } else {
      dispatch(updateUserSettings({ classReminders: false }));
      toast.success(t("settings.remindersDisabled"));
      // The device's one push subscription is shared across the three
      // push-backed toggles — only tear it down once none of them need it.
      if (!messageNotifications && !cardDueReminders) {
        try { await unsubscribeFromPush(); } catch { /* best-effort cleanup */ }
      }
    }
  };

  const handleMessageNotificationsToggle = async () => {
    const newValue = !messageNotifications;

    if (newValue) {
      try {
        await subscribeToPush();
        dispatch(updateUserSettings({ messageNotifications: true }));
        toast.success(t("settings.messageNotificationsEnabled"));
      } catch (err) {
        handlePushToggleError(err);
      }
    } else {
      dispatch(updateUserSettings({ messageNotifications: false }));
      toast.success(t("settings.messageNotificationsDisabled"));
      if (!classReminders && !cardDueReminders) {
        try { await unsubscribeFromPush(); } catch { /* best-effort cleanup */ }
      }
    }
  };

  const handleCardDueRemindersToggle = async () => {
    const newValue = !cardDueReminders;

    if (newValue) {
      try {
        await subscribeToPush();
        dispatch(updateUserSettings({ cardDueReminders: true }));
        toast.success(t("settings.cardDueRemindersEnabled"));
      } catch (err) {
        handlePushToggleError(err);
      }
    } else {
      dispatch(updateUserSettings({ cardDueReminders: false }));
      toast.success(t("settings.cardDueRemindersDisabled"));
      if (!classReminders && !messageNotifications) {
        try { await unsubscribeFromPush(); } catch { /* best-effort cleanup */ }
      }
    }
  };

  const handleLogout = () => {
    performLogout(dispatch);
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "appearance":
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiEye size={15} className="text-ll-violet-ink" />
              <h2 className="text-[15px] font-semibold text-ll-ink">{t("settings.appearance")}</h2>
            </div>
            <SettingRow icon={darkMode ? FiMoon : FiSun} label={t("settings.darkMode")} description={halloween ? t("settings.darkModeLockedHalloween") : undefined}>
              <BrandToggle checked={darkMode || halloween} onChange={handleDarkModeToggle} disabled={halloween} />
            </SettingRow>
            <SettingRow
              icon={() => (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 7.5c-4.6 0-7.5 2.8-7.5 6.3S7.4 20 12 20s7.5-2.7 7.5-6.2S16.6 7.5 12 7.5z" />
                  <path d="M12 7.5V5c0-.9.7-1.8 1.8-2" />
                </svg>
              )}
              label={t("settings.halloweenTheme")}
              description={t("settings.halloweenThemeDesc")}
            >
              <BrandToggle checked={halloween} onChange={() => setHalloween(!halloween)} />
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiBell size={15} className="text-ll-teal-ink" />
              <h2 className="text-[15px] font-semibold text-ll-ink">{t("settings.notifications")}</h2>
            </div>
            <SettingRow icon={notificationSound ? FiBell : FiBellOff} label={t("settings.notificationSound")}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={playTestSound}
                  title={t("settings.testSound")}
                  className="ll-btn ll-btn-ghost ll-btn-sm !px-1.5"
                >
                  <FiPlay size={13} />
                </button>
                <BrandToggle checked={notificationSound} onChange={handleNotificationSoundToggle} />
              </div>
            </SettingRow>
            <SettingRow
              icon={FiMessageSquare}
              label={t("settings.messageNotifications")}
              description={t("settings.messageNotificationsDesc")}
            >
              <BrandToggle checked={messageNotifications} onChange={handleMessageNotificationsToggle} />
            </SettingRow>
            <SettingRow icon={FiBell} label={t("settings.classReminders")}>
              <BrandToggle checked={classReminders} onChange={handleClassRemindersToggle} />
            </SettingRow>
            {canUseTrello && (
              <SettingRow
                icon={FiClock}
                label={t("settings.cardDueReminders")}
                description={t("settings.cardDueRemindersDesc")}
              >
                <BrandToggle checked={cardDueReminders} onChange={handleCardDueRemindersToggle} />
              </SettingRow>
            )}
          </div>
        );

      case "app":
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiMonitor size={15} className="text-ll-ink2" />
              <h2 className="text-[15px] font-semibold text-ll-ink">{t("settings.desktopApp")}</h2>
            </div>
            <div className="flex flex-col items-center text-center gap-4 py-6 px-4 rounded-xl bg-ll-subtle border border-ll-line">
              <img src="/icons/icon-96.png" alt="" className="w-14 h-14 rounded-xl" />
              <div>
                <p className="text-[13.5px] font-semibold text-ll-ink">{t("settings.desktopAppTitle")}</p>
                <p className="text-[12.5px] text-ll-ink3 mt-1 max-w-xs">
                  {t("settings.desktopAppDesc")}
                </p>
              </div>

              {isInstalled ? (
                <span className="flex items-center gap-2 text-[13px] font-medium text-ll-teal-ink">
                  <FiCheck size={16} /> {t("settings.appAlreadyInstalled")}
                </span>
              ) : canInstall ? (
                <button onClick={handleInstallApp} className="ll-btn ll-btn-primary">
                  <FiDownload size={16} /> {t("settings.installApp")}
                </button>
              ) : (
                <p className="text-[12px] text-ll-ink3 max-w-xs">{t("settings.installUnavailable")}</p>
              )}
            </div>
          </div>
        );

      case "account":
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FiUser size={15} className="text-ll-gold-ink" />
              <h2 className="text-[15px] font-semibold text-ll-ink">{t("settings.account")}</h2>
            </div>
            <SettingRow icon={FiGlobe} label={t("settings.language")}>
              <BrandSelect value={language} onChange={handleLanguageChange} />
            </SettingRow>

            <div className="py-3 border-b border-ll-line">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-ll-line transition-colors hover:bg-ll-subtle"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-violet-tint text-ll-violet-ink">
                  <FiShield size={14} />
                </div>
                <span className="text-[13.5px] font-medium text-ll-ink">{t("settings.changePassword")}</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-ll-line transition-colors hover:bg-ll-subtle"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgb(var(--ll-danger) / .12)', color: 'rgb(var(--ll-danger))' }}>
                  <FiLogOut size={14} />
                </div>
                <span className="text-[13.5px] font-medium" style={{ color: 'rgb(var(--ll-danger))' }}>{t("settings.logout")}</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full min-w-0 relative z-10 flex flex-col">
        <Navbar header={t("settings.title")} />

        <div className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-5 sm:gap-6 max-w-4xl mx-auto w-full">

          {/* ── Page header ── */}
          <div>
            <p className="text-[11px] font-medium tracking-wide text-ll-ink3 uppercase mb-1">{t("settings.preferences")}</p>
            <h1 className="text-[24px] font-semibold text-ll-ink tracking-tight">{t("settings.title")}</h1>
            <p className="text-[13.5px] text-ll-ink3 mt-1">{t("settings.subtitle")}</p>
          </div>

          {/* ── Layout ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">

            {/* Sidebar tabs */}
            <div className="md:col-span-1">
              <div className="ll-card p-1.5 flex md:flex-col flex-row gap-1 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors whitespace-nowrap flex-shrink-0 md:w-full ${
                        isActive ? "bg-ll-violet-tint text-ll-violet-ink" : "text-ll-ink3 hover:bg-ll-hover hover:text-ll-ink"
                      }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content panel */}
            <div className="md:col-span-3">
              <div className="ll-card p-5 sm:p-6">
                {renderContent()}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {showChangePassword && (
      <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
    )}
    </>
  );
};

export default Settings;
