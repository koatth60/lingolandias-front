import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiMoon, FiBell, FiBellOff, FiUser, FiEye,
  FiShield, FiLogOut, FiGlobe, FiSun, FiCheck, FiChevronDown,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";
import { updateUserSettings, logout } from "../../redux/userSlice";
import ChangePasswordModal from "./ChangePasswordModal";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const glassCard = {
  border: "1px solid rgba(158,47,208,0.15)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
};

const BrandToggle = ({ checked, onChange }) => (
  <div
    className="relative w-11 h-6 cursor-pointer rounded-full transition-colors duration-200"
    style={{
      background: checked ? "#9E2FD0" : "rgba(158,158,158,0.25)",
      border: `1px solid ${checked ? "#9E2FD0" : "rgba(158,158,158,0.3)"}`,
    }}
    onClick={onChange}
  >
    <div
      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 flex items-center justify-center"
      style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
    >
      {checked && <FiCheck size={10} style={{ color: "#9E2FD0" }} />}
    </div>
  </div>
);

const LangOption = ({ value: val, label, flag, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(val)}
    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
    style={
      selected
        ? { background: "rgba(158,47,208,0.12)", color: "#9E2FD0", fontWeight: 700 }
        : { color: "inherit" }
    }
    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "rgba(158,47,208,0.06)"; }}
    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = ""; }}
  >
    <span className="text-lg leading-none">{flag}</span>
    <span>{label}</span>
    {selected && <FiCheck size={13} className="ml-auto text-[#9E2FD0]" />}
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
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: "rgba(158,47,208,0.08)",
          border: `1px solid ${open ? "rgba(158,47,208,0.6)" : "rgba(158,47,208,0.22)"}`,
          minWidth: "130px",
          color: "inherit",
        }}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="flex-1 text-left text-gray-700 dark:text-gray-200">{selected.label}</span>
        <FiChevronDown
          size={13}
          className={`text-[#9E2FD0] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{
            minWidth: "100%",
            border: "1px solid rgba(158,47,208,0.22)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}
        >
          {/* Light bg */}
          <div className="absolute inset-0 dark:hidden bg-white" />
          {/* Dark bg */}
          <div className="absolute inset-0 hidden dark:block" style={{ background: "#1a1a2e" }} />
          {/* top accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

          <div className="relative z-10 py-1 pt-2">
            {OPTIONS.map((opt) => (
              <LangOption
                key={opt.value}
                {...opt}
                selected={opt.value === value}
                onSelect={handleSelect}
              />
            ))}
          </div>
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

  const darkMode = userInfo?.user?.settings?.darkMode || false;
  const notificationSound = userInfo?.user?.settings?.notificationSound !== false;
  const classReminders = userInfo?.user?.settings?.classReminders === true;
  const language = userInfo?.user?.settings?.language || i18n.language || "en";

  const TABS = [
    { id: "appearance",    label: t("settings.appearance"),   icon: FiEye  },
    { id: "notifications", label: t("settings.notifications"), icon: FiBell },
    { id: "account",       label: t("settings.account"),       icon: FiUser },
  ];

  const SettingRow = ({ icon: Icon, label, children }) => (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-black/5 dark:border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(158,47,208,0.08)", border: "1px solid rgba(158,47,208,0.15)" }}
        >
          <Icon size={14} style={{ color: "#9E2FD0" }} />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{label}</span>
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

  const handleClassRemindersToggle = async () => {
    const newValue = !classReminders;

    if (newValue) {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        toast.error(t("settings.browserNoSupport"));
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error(t("settings.allowNotifications"));
        return;
      }

      try {
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

        dispatch(updateUserSettings({ classReminders: true }));
        toast.success(t("settings.remindersEnabled"));
      } catch {
        toast.error(t("settings.remindersFailed"));
      }
    } else {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) await subscription.unsubscribe();
        }

        await fetch(`${import.meta.env.VITE_BACKEND_URL}/push/unsubscribe`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        dispatch(updateUserSettings({ classReminders: false }));
        toast.success(t("settings.remindersDisabled"));
      } catch {
        toast.error(t("settings.remindersDisableFailed"));
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const accentForTab = {
    appearance: "#9E2FD0",
    notifications: "#26D9A1",
    account: "#F6B82E",
  };

  const renderContent = () => {
    switch (activeTab) {
      case "appearance":
        return (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FiEye size={15} style={{ color: "#9E2FD0" }} />
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">{t("settings.appearance")}</h2>
            </div>
            <SettingRow icon={darkMode ? FiMoon : FiSun} label={t("settings.darkMode")}>
              <BrandToggle checked={darkMode} onChange={handleDarkModeToggle} />
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FiBell size={15} style={{ color: "#26D9A1" }} />
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">{t("settings.notifications")}</h2>
            </div>
            <SettingRow icon={notificationSound ? FiBell : FiBellOff} label={t("settings.notificationSound")}>
              <BrandToggle checked={notificationSound} onChange={handleNotificationSoundToggle} />
            </SettingRow>
            <SettingRow icon={FiBell} label={t("settings.classReminders")}>
              <BrandToggle checked={classReminders} onChange={handleClassRemindersToggle} />
            </SettingRow>
          </div>
        );

      case "account":
        return (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FiUser size={15} style={{ color: "#F6B82E" }} />
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">{t("settings.account")}</h2>
            </div>
            <SettingRow icon={FiGlobe} label={t("settings.language")}>
              <BrandSelect value={language} onChange={handleLanguageChange} />
            </SettingRow>

            <div className="py-3 border-b border-black/5 dark:border-white/5">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:opacity-80"
                style={{ background: "rgba(158,47,208,0.05)", border: "1px solid rgba(158,47,208,0.10)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(158,47,208,0.08)", border: "1px solid rgba(158,47,208,0.15)" }}
                >
                  <FiShield size={14} style={{ color: "#9E2FD0" }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t("settings.changePassword")}</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
                >
                  <FiLogOut size={14} style={{ color: "#ef4444" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>{t("settings.logout")}</span>
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
    <div className="flex w-full relative min-h-screen">
      {/* Page backgrounds */}
      <div className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      {/* Ambient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "500px", height: "500px", top: "-5%", right: "0%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8"
          style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "350px", height: "350px", bottom: "10%", left: "5%" }} />
      </div>

      <Dashboard />

      <div className="w-full min-w-0 relative z-10 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar header={t("settings.title")} />

        <div className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-5 sm:gap-8 max-w-4xl mx-auto w-full">

          {/* ── Page header ── */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase mb-1">{t("settings.preferences")}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold login-gradient-text">{t("settings.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("settings.subtitle")}</p>
          </div>

          {/* ── Layout ── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">

            {/* Sidebar tabs */}
            <div className="md:col-span-1">
              <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
                <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
                <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-70" />
                <div className="relative z-10 p-3 flex md:flex-col flex-row gap-1.5 overflow-x-auto">
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap flex-shrink-0 md:w-full"
                        style={
                          isActive
                            ? {
                                background: "linear-gradient(135deg, rgba(158,47,208,0.15), rgba(246,184,46,0.06))",
                                border: "1px solid rgba(158,47,208,0.28)",
                                color: "#9E2FD0",
                              }
                            : {
                                background: "transparent",
                                border: "1px solid transparent",
                                color: "#6b7280",
                              }
                        }
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content panel */}
            <div className="md:col-span-3">
              <div className="relative rounded-2xl overflow-hidden" style={glassCard}>
                <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
                <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
                <div
                  className="absolute top-0 left-0 w-full h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${accentForTab[activeTab]}, transparent)` }}
                />
                <div className="relative z-10 p-5 sm:p-7">
                  {renderContent()}
                </div>
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
