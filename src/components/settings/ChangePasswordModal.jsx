import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiLock, FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { changePassword } from "../../redux/userSlice";

const PasswordField = ({ label, value, onChange, fieldKey, placeholder, show, onToggleShow }) => (
  <div className="group">
    <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
      {label}
    </label>
    <div className="relative">
      <FiLock
        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 group-focus-within:text-[#9E2FD0] transition-colors duration-200"
        size={15}
      />
      <input
        className="w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all duration-200 outline-none border
          text-gray-800 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-600
          bg-white dark:bg-white/5
          border-gray-200 dark:border-white/10
          focus:border-[#9E2FD0]/60 focus:ring-2 focus:ring-[#9E2FD0]/10
          dark:focus:border-[#9E2FD0]/70 dark:focus:bg-[rgba(158,47,208,0.08)]"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => onToggleShow(fieldKey)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
        tabIndex={-1}
      >
        {show ? <FiEyeOff size={15} /> : <FiEye size={15} />}
      </button>
    </div>
  </div>
);

const ChangePasswordModal = ({ onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.user.userInfo?.user?.id);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleShow = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("changePasswordExtra.minLength"));
      return;
    }

    setLoading(true);
    const result = await dispatch(changePassword({ userId, currentPassword, newPassword, confirmPassword }));
    setLoading(false);

    if (changePassword.fulfilled.match(result)) {
      toast.success(t("changePassword.success"));
      onClose();
    } else {
      setError(result.payload || "Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(158,47,208,0.22)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(158,47,208,0.12)",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

        {/* Light mode glass */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        />
        {/* Dark mode glass */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ background: "rgba(15,12,38,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-gray-800 dark:text-white font-extrabold text-lg">{t("changePasswordExtra.updatePassword")}</h2>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{t("changePasswordExtra.updateSubtitle")}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
              style={{ background: "rgba(158,47,208,0.07)", border: "1px solid rgba(158,47,208,0.15)" }}
            >
              <FiX size={15} />
            </button>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-5 opacity-40"
            style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, transparent)" }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label={t("changePassword.currentPassword")}
              value={currentPassword}
              onChange={setCurrentPassword}
              fieldKey="current"
              placeholder={t("changePasswordExtra.currentPlaceholder")}
              show={show.current}
              onToggleShow={toggleShow}
            />
            <PasswordField
              label={t("changePassword.newPassword")}
              value={newPassword}
              onChange={setNewPassword}
              fieldKey="new"
              placeholder={t("changePasswordExtra.newPlaceholder")}
              show={show.new}
              onToggleShow={toggleShow}
            />
            <PasswordField
              label={t("changePassword.confirmPassword")}
              value={confirmPassword}
              onChange={setConfirmPassword}
              fieldKey="confirm"
              placeholder={t("changePasswordExtra.confirmPlaceholder")}
              show={show.confirm}
              onToggleShow={toggleShow}
            />

            {/* Error */}
            {error && (
              <div
                className="p-3 rounded-xl text-red-500 dark:text-red-300 text-xs flex items-start gap-2 border"
                style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.22)" }}
              >
                <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                  text-gray-600 dark:text-gray-400
                  hover:text-gray-900 dark:hover:text-white
                  border border-gray-200 dark:border-white/10
                  hover:border-[#9E2FD0]/30 dark:hover:border-white/20
                  bg-white/60 dark:bg-transparent"
              >
                {t("changePassword.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #9E2FD0 0%, #7b22a8 50%, #b84a10 100%)",
                  boxShadow: "0 4px 20px rgba(158,47,208,0.35)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("changePassword.saving")}
                  </span>
                ) : t("changePasswordExtra.updatePassword")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
