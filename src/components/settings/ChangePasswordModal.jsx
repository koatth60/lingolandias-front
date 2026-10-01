import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiLock, FiEye, FiEyeOff, FiX } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { changePassword } from "../../redux/userSlice";

const PasswordField = ({ label, value, onChange, fieldKey, placeholder, show, onToggleShow }) => (
  <div className="group">
    <label className="block text-ll-ink2 text-[12.5px] font-medium mb-1.5">
      {label}
    </label>
    <div className="relative">
      <FiLock
        className="absolute left-4 top-1/2 -translate-y-1/2 text-ll-ink3 group-focus-within:text-ll-violet transition-colors duration-200"
        size={15}
      />
      <input
        className="w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all duration-200 outline-none border
 text-ll-ink
 placeholder:text-ll-ink3
 bg-ll-panel
 border-ll-line
 focus:border-ll-violet/60 focus:ring-2 focus:ring-ll-violet/10
 dark:focus:bg-[rgb(var(--ll-violet) / 0.08)]"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <button
        type="button"
        onClick={() => onToggleShow(fieldKey)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-ll-ink3 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
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
          border: "1px solid rgb(var(--ll-violet) / 0.22)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 4px 16px rgb(var(--ll-violet) / 0.12)",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-ll-violet via-[#E8A23A] to-[#1FA48C]" />

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
              <h2 className="text-ll-ink font-extrabold text-lg">{t("changePasswordExtra.updatePassword")}</h2>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{t("changePasswordExtra.updateSubtitle")}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ll-ink3 hover:text-ll-ink transition-colors duration-200"
              style={{ background: "rgb(var(--ll-violet) / 0.07)", border: "1px solid rgb(var(--ll-violet) / 0.15)" }}
            >
              <FiX size={15} />
            </button>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-5 opacity-40"
            style={{ background: "linear-gradient(90deg, transparent, rgb(var(--ll-violet)), #E8A23A, transparent)" }}
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
                className="ll-btn ll-btn-secondary flex-1 justify-center"
              >
                {t("changePassword.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="ll-btn ll-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
