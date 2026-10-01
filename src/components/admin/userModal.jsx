import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { FiUserPlus, FiUser, FiMail, FiLock, FiX, FiChevronDown, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const onFocus = (e) => {
  e.target.style.borderColor = "rgb(var(--ll-violet) / 0.7)";
  e.target.style.background = document.documentElement.classList.contains("dark")
    ? "rgb(var(--ll-violet) / 0.10)"
    : "rgb(var(--ll-violet) / 0.06)";
};
const onBlur = (e) => {
  e.target.style.borderColor = "";
  e.target.style.background = "";
};

const inputCls =
  "w-full h-10 pl-10 pr-3 rounded-lg text-[13.5px] outline-none border border-ll-line2 bg-ll-panel text-ll-ink " +
  "placeholder:text-ll-ink3 focus:border-ll-violet/60 transition-colors";

/* ── Reusable custom dropdown ── */
const CustomSelect = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all duration-200 border"
        style={{
          background: document.documentElement.classList.contains("dark")
            ? "rgba(255,255,255,0.05)"
            : "rgba(243,244,246,1)",
          borderColor: open ? "rgb(var(--ll-violet) / 0.7)" : "rgba(209,213,219,1)",
          color: selected ? "inherit" : "rgba(156,163,175,1)",
        }}
      >
        <span className="flex-1 text-left text-ll-ink">
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden z-50"
          style={{
            border: "1px solid rgb(var(--ll-violet) / 0.25)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
          }}
        >
          {/* Light bg */}
          <div className="absolute inset-0 dark:hidden bg-white" />
          {/* Dark bg */}
          <div className="absolute inset-0 hidden dark:block" style={{ background: "#0d0a1e" }} />
          {/* Accent line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-ll-violet via-[#E8A23A] to-[#1FA48C]" />

          <div className="relative z-10 py-1 pt-2">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 text-gray-800 dark:text-gray-200"
                  style={isSelected ? { background: "rgb(var(--ll-violet) / 0.10)", color: "rgb(var(--ll-violet))", fontWeight: 700 } : {}}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgb(var(--ll-violet) / 0.06)"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ""; }}
                >
                  {opt.flag && <span className="text-base leading-none">{opt.flag}</span>}
                  <span className="flex-1 text-left">{opt.label}</span>
                  {isSelected && <FiCheck size={13} className="text-ll-violet" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const UserModal = ({ show, handleClose, onCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [language, setLanguage] = useState("");

  const createUser = async (e) => {
    e.preventDefault();
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lastName, email, password, role, language }),
    });
    const data = await response.json();
    try {
      if (data.error) {
        Swal.fire({ title: t("common.error"), text: data.error, icon: "error", confirmButtonText: "Ok" });
      } else {
        Swal.fire({ title: t("common.success"), text: t("admin.assignSuccess"), icon: "success", confirmButtonText: "Ok" }).then(() => {
          handleClose();
          onCreated?.();
        });
      }
    } catch (error) {}

    setName(""); setLastName(""); setEmail(""); setPassword(""); setRole("user"); setLanguage("");
    handleClose();
  };

  const roleOptions = [
    { value: "user",    label: t("userModal.roles.user") },
    { value: "teacher", label: t("userModal.roles.teacher") },
    { value: "admin",   label: t("userModal.roles.admin") },
  ];

  const langOptions = [
    { value: "english", label: t("userModal.languages.english"), flag: "🇬🇧" },
    { value: "spanish", label: t("userModal.languages.spanish"), flag: "🇪🇸" },
    { value: "polish",  label: t("userModal.languages.polish"),  flag: "🇵🇱" },
  ];

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-md rounded-3xl overflow-y-auto max-h-[92vh]"
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}
      >
        {/* Light mode background */}
        <div
          className="absolute inset-0 dark:hidden rounded-3xl"
          style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.08)" }}
        />
        {/* Dark mode background */}
        <div
          className="absolute inset-0 hidden dark:block rounded-3xl"
          style={{ background: "rgba(13,10,30,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}
        />

        {/* Top accent */}
        <div
          className="absolute top-0 left-0 w-full h-[2px] z-10 rounded-t-3xl"
          style={{ background: "linear-gradient(90deg, #1FA48C, rgb(var(--ll-violet)), #E8A23A)" }}
        />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(31,164,140,0.12)", border: "1px solid rgba(31,164,140,0.28)" }}
            >
              <FiUserPlus size={17} style={{ color: "#1FA48C" }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-ll-ink leading-tight">{t("userModal.title")}</h2>
              <p className="text-xs text-ll-ink3">{t("userModal.subtitle")}</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-colors duration-200 p-1"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-6 opacity-20"
            style={{ background: "linear-gradient(90deg, transparent, rgb(var(--ll-violet)), #E8A23A, transparent)" }}
          />

          <form onSubmit={createUser} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder={t("userModal.firstName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  required
                />
              </div>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder={t("userModal.lastName")}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputCls}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
              <input
                type="email"
                placeholder={t("userModal.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
              <input
                type="password"
                placeholder={t("userModal.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
            </div>

            {/* Role */}
            <CustomSelect
              value={role}
              onChange={setRole}
              placeholder={t("userModal.role")}
              options={roleOptions}
            />

            {/* Language */}
            <CustomSelect
              value={language}
              onChange={setLanguage}
              placeholder={t("userModal.language")}
              options={langOptions}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="ll-btn ll-btn-secondary flex-1 justify-center"
              >
                {t("userModal.cancel")}
              </button>
              <button
                type="submit"
                className="ll-btn ll-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiUserPlus size={14} />
                {t("userModal.create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
