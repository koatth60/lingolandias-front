import { useState, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FiX, FiSearch, FiUsers, FiCheck, FiCamera, FiLink, FiUpload } from "react-icons/fi";
import useUserSearch from "../../hooks/useUserSearch";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getInitials = (name, lastName) => {
  const a = (name || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

const NewGroupModal = ({ currentUserId, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const { results, loading } = useUserSearch(query, currentUserId);

  const toggleMember = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/upload/chat-upload`, formData);
      setAvatarUrl(res.data.fileUrl);
      setAvatarMenuOpen(false);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const applyAvatarUrl = () => {
    if (avatarUrlInput.trim()) setAvatarUrl(avatarUrlInput.trim());
    setShowUrlInput(false);
    setAvatarUrlInput("");
    setAvatarMenuOpen(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selected.length || submitting) return;
    setSubmitting(true);
    await onCreate({ name: name.trim(), avatarUrl: avatarUrl || undefined, memberIds: selected.map((u) => u.id) });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 55%, #f0f0f0 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dark:block hidden absolute inset-0" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />

        <div className="relative z-10 p-5 flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#F6B82E]/15">
                <FiUsers size={15} className="text-[#F6B82E]" />
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("messagesExtra.newGroupTitle")}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
              <FiX size={18} />
            </button>
          </div>

          {/* Avatar picker */}
          <div className="flex justify-center mb-4 flex-shrink-0 relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((v) => !v)}
              className="relative w-16 h-16 rounded-full overflow-hidden group"
              title={t("messagesExtra.groupAvatar")}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold" style={{ background: "linear-gradient(135deg, #F6B82E, #9E2FD0)" }}>
                  <FiUsers size={22} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <FiCamera size={18} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            {avatarMenuOpen && (
              <div
                className="absolute top-full mt-2 z-20 w-48 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1b35] overflow-hidden"
              >
                {!showUrlInput ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <FiUpload size={13} /> {t("messagesExtra.uploadPhoto")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-100 dark:border-white/5"
                    >
                      <FiLink size={13} /> {t("messagesExtra.useImageUrl")}
                    </button>
                  </>
                ) : (
                  <div className="p-2 flex gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyAvatarUrl()}
                      placeholder="https://..."
                      className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 outline-none focus:border-[#9E2FD0]"
                    />
                    <button
                      type="button"
                      onClick={applyAvatarUrl}
                      className="px-2 rounded-lg text-white text-xs font-medium"
                      style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
                    >
                      <FiCheck size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("messagesExtra.groupNamePlaceholder")}
            className="w-full mb-3 px-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0] transition-colors flex-shrink-0"
          />

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
              {selected.map((u) => (
                <span
                  key={u.id}
                  onClick={() => toggleMember(u)}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-[#9E2FD0]/10 text-[#9E2FD0] dark:bg-[#9E2FD0]/20 cursor-pointer hover:bg-[#9E2FD0]/20"
                >
                  {u.name}
                  <FiX size={11} />
                </span>
              ))}
            </div>
          )}

          <div className="relative mb-3 flex-shrink-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("messagesExtra.searchMembersPlaceholder")}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0] transition-colors"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1">
            {loading && <p className="text-xs text-gray-400 text-center py-4">{t("messagesExtra.searching")}</p>}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">{t("messagesExtra.noResults")}</p>
            )}
            {results.map((u) => {
              const isSelected = selected.some((s) => s.id === u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleMember(u)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? "bg-[#9E2FD0]/10 dark:bg-[#9E2FD0]/15" : "hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                      {getInitials(u.name, u.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{u.name} {u.lastName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                  </div>
                  {isSelected && <FiCheck size={16} className="text-[#9E2FD0] flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !selected.length || submitting}
            className="mt-4 w-full py-2.5 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 4px 15px rgba(158,47,208,0.3)" }}
          >
            {submitting ? t("messagesExtra.creating") : t("messagesExtra.createGroup")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
