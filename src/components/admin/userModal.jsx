import { useState } from "react";
import Swal from "sweetalert2";
import { FiUserPlus, FiUser, FiMail, FiLock, FiX } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Detect dark mode from the DOM (class-based dark mode)
const isDark = () => !!document.querySelector(".dark");

const onFocus = (e) => {
  e.target.style.borderColor = "rgba(158,47,208,0.7)";
  e.target.style.background = isDark() ? "rgba(158,47,208,0.10)" : "rgba(158,47,208,0.06)";
};
const onBlur = (e) => {
  e.target.style.borderColor = "";
  e.target.style.background = "";
};

const inputCls =
  "w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none border transition-all duration-200 " +
  "bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-400 " +
  "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-600";

const selectCls =
  "w-full px-4 py-3 rounded-xl text-sm outline-none border transition-all duration-200 appearance-none " +
  "bg-gray-100 border-gray-200 text-gray-800 " +
  "dark:bg-white/5 dark:border-white/10 dark:text-white";

const onSelectFocus = (e) => {
  e.target.style.borderColor = "rgba(158,47,208,0.7)";
  e.target.style.background = isDark() ? "rgba(158,47,208,0.10)" : "rgba(158,47,208,0.06)";
};
const onSelectBlur = (e) => {
  e.target.style.borderColor = "";
  e.target.style.background = "";
};

const UserModal = ({ show, handleClose }) => {
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
        Swal.fire({ title: "Error!", text: data.error, icon: "error", confirmButtonText: "Ok" });
      } else {
        Swal.fire({ title: "Success!", text: "User created successfully.", icon: "success", confirmButtonText: "Ok" }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {}

    setName(""); setLastName(""); setEmail(""); setPassword(""); setRole("user"); setLanguage("");
    handleClose();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-md rounded-3xl overflow-y-auto max-h-[92vh]"
        style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}
      >
        {/* Light mode background */}
        <div
          className="absolute inset-0 dark:hidden rounded-3xl"
          style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.08)" }}
        />
        {/* Dark mode background */}
        <div
          className="absolute inset-0 hidden dark:block rounded-3xl"
          style={{ background: "rgba(13,10,30,0.98)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }}
        />

        {/* Top accent */}
        <div
          className="absolute top-0 left-0 w-full h-[2px] z-10 rounded-t-3xl"
          style={{ background: "linear-gradient(90deg, #26D9A1, #9E2FD0, #F6B82E)" }}
        />

        <div className="relative z-10 p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(38,217,161,0.12)", border: "1px solid rgba(38,217,161,0.28)" }}
            >
              <FiUserPlus size={17} style={{ color: "#26D9A1" }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 dark:text-white leading-tight">Create New User</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Fill in the details below</p>
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
            style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, transparent)" }}
          />

          <form onSubmit={createUser} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
                <input
                  type="text"
                  placeholder="First Name"
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
                  placeholder="Last Name"
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
                placeholder="Email Address"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                onFocus={onFocus}
                onBlur={onBlur}
                required
              />
            </div>

            {/* Role */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={selectCls}
              onFocus={onSelectFocus}
              onBlur={onSelectBlur}
            >
              <option value="user">user</option>
              <option value="teacher">teacher</option>
              <option value="admin">admin</option>
            </select>

            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={selectCls}
              onFocus={onSelectFocus}
              onBlur={onSelectBlur}
            >
              <option value="" disabled>select language</option>
              <option value="english">english</option>
              <option value="spanish">spanish</option>
              <option value="polish">polish</option>
            </select>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 20px rgba(38,217,161,0.35)" }}
              >
                <FiUserPlus size={14} />
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
