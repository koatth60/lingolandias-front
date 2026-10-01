import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiX, FiSearch, FiUsers, FiCheck } from "react-icons/fi";
import useUserSearch from "../../hooks/useUserSearch";
import AvatarPicker from "./AvatarPicker";

const getInitials = (name, lastName) => {
  const a = (name || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

const NewGroupModal = ({ currentUserId, currentUserRole, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [scheduleAsClass, setScheduleAsClass] = useState(false);
  const { results, loading } = useUserSearch(query, currentUserId);
  const isTeacher = currentUserRole === "teacher";

  const toggleMember = (user) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selected.length || submitting) return;
    setSubmitting(true);
    await onCreate({
      name: name.trim(),
      avatarUrl: avatarUrl || undefined,
      memberIds: selected.map((u) => u.id),
      members: selected,
      scheduleAsClass: isTeacher && scheduleAsClass,
    });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col bg-ll-panel border border-ll-line"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="relative z-10 p-5 flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-ll-gold-tint">
                <FiUsers size={15} className="text-ll-gold-ink" />
              </div>
              <h2 className="text-base font-bold text-ll-ink">{t("messagesExtra.newGroupTitle")}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-ll-ink3 hover:bg-ll-hover">
              <FiX size={18} />
            </button>
          </div>

          {/* Avatar picker */}
          <div className="flex justify-center mb-4 flex-shrink-0">
            <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} size={64} />
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("messagesExtra.groupNamePlaceholder")}
            className="w-full mb-3 px-3.5 py-2.5 rounded-xl text-sm bg-ll-subtle border border-ll-line text-ll-ink placeholder:text-ll-ink3 outline-none focus:border-ll-violet transition-colors flex-shrink-0"
          />

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
              {selected.map((u) => (
                <span
                  key={u.id}
                  onClick={() => toggleMember(u)}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-ll-violet/10 text-ll-violet dark:bg-ll-violet/20 cursor-pointer hover:bg-ll-violet/20"
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
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-ll-subtle border border-ll-line text-ll-ink placeholder:text-ll-ink3 outline-none focus:border-ll-violet transition-colors"
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
                    isSelected ? "bg-ll-violet/10 dark:bg-ll-violet/15" : "hover:bg-ll-hover"
                  }`}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))" }}>
                      {getInitials(u.name, u.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ll-ink truncate">{u.name} {u.lastName}</p>
                    <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                  </div>
                  {isSelected && <FiCheck size={16} className="text-ll-violet flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          {isTeacher && (
            <label className="flex items-center gap-2 mt-3 px-1 text-xs text-ll-ink2 flex-shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleAsClass}
                onChange={(e) => setScheduleAsClass(e.target.checked)}
                className="accent-ll-violet"
              />
              {t("messagesExtra.scheduleAsClassToggle")}
            </label>
          )}

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !selected.length || submitting}
            className="mt-4 w-full py-2.5 rounded-xl font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgb(var(--ll-violet)), rgb(var(--ll-violet-hover)))", boxShadow: "0 4px 15px rgb(var(--ll-violet) / 0.3)" }}
          >
            {submitting ? t("messagesExtra.creating") : t("messagesExtra.createGroup")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;
