import { useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { FiCamera, FiLink, FiUpload, FiCheck, FiGrid, FiUsers } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Self-hosted so a picked avatar never breaks on a dead external link —
// see public/avatars/. Numbered so adding more later is just dropping in
// preset-09.svg etc.
const PRESET_AVATARS = Array.from({ length: 8 }, (_, i) => `/avatars/preset-${String(i + 1).padStart(2, "0")}.svg`);

// Shared by NewGroupModal (creation) and GroupMembersModal (editing an
// existing group) so both stay in sync automatically if the preset set or
// upload flow ever changes.
const AvatarPicker = ({ value, onChange, size = 64, align = "center" }) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState("menu"); // menu | url | gallery
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const closeMenu = () => {
    setMenuOpen(false);
    setTab("menu");
    setUrlInput("");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${BACKEND_URL}/upload/chat-upload`, formData);
      onChange(res.data.fileUrl);
      closeMenu();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const applyUrl = () => {
    if (urlInput.trim()) onChange(urlInput.trim());
    closeMenu();
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="relative rounded-full overflow-hidden group flex-shrink-0"
        style={{ width: size, height: size }}
        title={t("messagesExtra.groupAvatar")}
      >
        {value ? (
          <img src={value} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{ background: "linear-gradient(135deg, #F6B82E, #9E2FD0)" }}
          >
            <FiUsers size={Math.round(size * 0.35)} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FiCamera size={Math.round(size * 0.3)} className="text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {menuOpen && (
        <div
          className={`absolute top-full mt-2 z-30 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e1b35] overflow-hidden ${
            align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
          }`}
          style={{ width: tab === "gallery" ? 208 : 190 }}
          onClick={(e) => e.stopPropagation()}
        >
          {tab === "menu" && (
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
                onClick={() => setTab("gallery")}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-100 dark:border-white/5"
              >
                <FiGrid size={13} /> {t("messagesExtra.chooseFromGallery")}
              </button>
              <button
                type="button"
                onClick={() => setTab("url")}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 border-t border-gray-100 dark:border-white/5"
              >
                <FiLink size={13} /> {t("messagesExtra.useImageUrl")}
              </button>
            </>
          )}
          {tab === "url" && (
            <div className="p-2 flex gap-1.5">
              <input
                autoFocus
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                placeholder="https://..."
                className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 outline-none focus:border-[#9E2FD0]"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="px-2 rounded-lg text-white text-xs font-medium"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
              >
                <FiCheck size={13} />
              </button>
            </div>
          )}
          {tab === "gallery" && (
            <div className="p-2 grid grid-cols-4 gap-1.5">
              {PRESET_AVATARS.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => { onChange(src); closeMenu(); }}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-[#9E2FD0] transition-colors"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

AvatarPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.number,
  align: PropTypes.oneOf(["center", "start"]),
};

export default AvatarPicker;
