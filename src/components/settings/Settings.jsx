import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiMoon, FiBell, FiUser, FiEye, FiDroplet, FiType,
  FiShield, FiLogOut, FiGlobe, FiInfo, FiX, FiSun, FiCheck,
} from "react-icons/fi";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";
import { updateUserSettings } from "../../redux/userSlice";

const glassCard = {
  border: "1px solid rgba(158,47,208,0.15)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)",
};

const TABS = [
  { id: "appearance",    label: "Appearance",   icon: FiEye  },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "account",       label: "Account",       icon: FiUser },
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

const BrandSelect = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="text-sm rounded-xl outline-none border transition-all duration-200 appearance-none px-3 py-2 text-gray-700 dark:text-gray-200"
    style={{
      background: "rgba(158,47,208,0.06)",
      borderColor: "rgba(158,47,208,0.20)",
      minWidth: "120px",
    }}
    onFocus={(e) => { e.target.style.borderColor = "rgba(158,47,208,0.6)"; }}
    onBlur={(e) => { e.target.style.borderColor = "rgba(158,47,208,0.20)"; }}
  >
    {children}
  </select>
);

const Settings = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("appearance");
  const [showBanner, setShowBanner] = useState(true);

  const darkMode = userInfo?.user?.settings?.darkMode || false;
  const [accentColor, setAccentColor] = useState("#9E2FD0");
  const [fontSize, setFontSize] = useState("medium");
  const [classReminders, setClassReminders] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [language, setLanguage] = useState("en");

  const handleDarkModeToggle = () => {
    dispatch(updateUserSettings({ darkMode: !darkMode }));
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
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">Appearance</h2>
            </div>
            <SettingRow icon={darkMode ? FiMoon : FiSun} label="Dark Mode">
              <BrandToggle checked={darkMode} onChange={handleDarkModeToggle} />
            </SettingRow>
            <SettingRow icon={FiDroplet} label="Accent Color">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer"
                style={{ border: "none", padding: 0, background: "none" }}
              />
            </SettingRow>
            <SettingRow icon={FiType} label="Font Size">
              <BrandSelect value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </BrandSelect>
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FiBell size={15} style={{ color: "#26D9A1" }} />
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">Notifications</h2>
            </div>
            <SettingRow icon={FiBell} label="Class Reminders">
              <BrandToggle checked={classReminders} onChange={() => setClassReminders((p) => !p)} />
            </SettingRow>
            <SettingRow icon={FiBell} label="New Messages">
              <BrandToggle checked={messageNotifications} onChange={() => setMessageNotifications((p) => !p)} />
            </SettingRow>
          </div>
        );

      case "account":
        return (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <FiUser size={15} style={{ color: "#F6B82E" }} />
              <h2 className="text-base font-extrabold text-gray-800 dark:text-white">Account</h2>
            </div>
            <SettingRow icon={FiGlobe} label="Language">
              <BrandSelect value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </BrandSelect>
            </SettingRow>

            <div className="py-3 border-b border-black/5 dark:border-white/5">
              <button
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                style={{ background: "rgba(158,47,208,0.05)", border: "1px solid rgba(158,47,208,0.10)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(158,47,208,0.08)", border: "1px solid rgba(158,47,208,0.15)" }}
                >
                  <FiShield size={14} style={{ color: "#9E2FD0" }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Change Password</span>
              </button>
            </div>

            <div className="pt-3">
              <button
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)" }}
                >
                  <FiLogOut size={14} style={{ color: "#ef4444" }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>Logout</span>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
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
        <Navbar header="Settings" />

        <div className="px-3 sm:px-6 md:px-8 py-5 sm:py-8 flex flex-col gap-5 sm:gap-8 max-w-4xl mx-auto w-full">

          {/* ── Demo banner ── */}
          {showBanner && (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(246,184,46,0.28)" }}>
              <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(246,184,46,0.07)" }} />
              <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(246,184,46,0.06)" }} />
              <div className="relative z-10 flex items-start sm:items-center justify-between gap-3 p-4">
                <div className="flex items-start sm:items-center gap-3">
                  <FiInfo size={15} style={{ color: "#F6B82E" }} className="flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    This page is for demonstration purposes only. Settings are not yet fully functional.
                  </p>
                </div>
                <button onClick={() => setShowBanner(false)} className="flex-shrink-0 transition-opacity hover:opacity-60">
                  <FiX size={15} style={{ color: "#F6B82E" }} />
                </button>
              </div>
            </div>
          )}

          {/* ── Page header ── */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-[#9E2FD0] uppercase mb-1">Preferences</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold login-gradient-text">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your platform preferences</p>
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
  );
};

export default Settings;
