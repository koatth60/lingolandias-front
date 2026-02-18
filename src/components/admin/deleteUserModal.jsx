import { useState } from "react";
import Swal from "sweetalert2";
import { FiUserX, FiMail, FiAlertTriangle, FiX } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const DeleteUserModal = ({ show, handleClose }) => {
  const [email, setEmail] = useState("");

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.error) {
        Swal.fire({ title: "Error!", text: data.error, icon: "error", confirmButtonText: "Ok" });
      } else {
        Swal.fire({ title: "Deleted!", text: "User deleted successfully.", icon: "success", confirmButtonText: "Ok" }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {}

    setEmail("");
    handleClose();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(13,10,30,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Top red accent */}
        <div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{ background: "linear-gradient(90deg, #ef4444, #f97316, transparent)" }}
        />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)" }}
            >
              <FiUserX size={17} style={{ color: "#ef4444" }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white leading-tight">Delete User</h2>
              <p className="text-xs text-gray-500">This action is irreversible</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto text-gray-500 hover:text-white transition-colors duration-200 p-1"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-6 opacity-20"
            style={{ background: "linear-gradient(90deg, transparent, #ef4444, #f97316, transparent)" }}
          />

          {/* Warning box */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl mb-5"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}
          >
            <FiAlertTriangle size={15} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>
              Enter the email address of the user you wish to delete. All associated data will be permanently removed.
            </p>
          </div>

          <form onSubmit={handleDeleteUser} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <FiMail
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                size={14}
                style={{ color: "#6b7280" }}
              />
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 outline-none border transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(239,68,68,0.6)"; e.target.style.background = "rgba(239,68,68,0.06)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
                required
                autoComplete="email"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#9ca3af",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!email}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 4px 20px rgba(239,68,68,0.30)",
                }}
              >
                <FiUserX size={14} />
                Delete User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
