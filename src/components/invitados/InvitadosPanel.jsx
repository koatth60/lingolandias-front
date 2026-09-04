import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FiUserPlus, FiUser, FiMail, FiX, FiTrash2, FiUsers } from "react-icons/fi";
import { fetchInvitados, createInvitado, deleteInvitado } from "../../data/invitadosApi";
import { removeStudent } from "../../redux/userSlice";

const onFocus = (e) => {
  e.target.style.borderColor = "rgba(158,47,208,0.7)";
  e.target.style.background = document.documentElement.classList.contains("dark")
    ? "rgba(158,47,208,0.10)"
    : "rgba(158,47,208,0.06)";
};
const onBlur = (e) => {
  e.target.style.borderColor = "";
  e.target.style.background = "";
};

const inputCls =
  "w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none border transition-all duration-200 " +
  "bg-gray-100 border-gray-200 text-gray-800 placeholder-gray-400 " +
  "dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder-gray-600";

const CreateInvitadoModal = ({ show, handleClose, onCreated }) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createInvitado({ name, lastName, email });
      Swal.fire({ title: t("common.success"), text: t("invitadosPanel.createdSuccess"), icon: "success", confirmButtonText: "Ok" });
      setName(""); setLastName(""); setEmail("");
      handleClose();
      onCreated?.();
    } catch (error) {
      Swal.fire({ title: t("common.error"), text: error.message, icon: "error", confirmButtonText: "Ok" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-md rounded-3xl overflow-y-auto max-h-[92vh]" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.25)" }}>
        <div className="absolute inset-0 dark:hidden rounded-3xl" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(0,0,0,0.08)" }} />
        <div className="absolute inset-0 hidden dark:block rounded-3xl" style={{ background: "rgba(13,10,30,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)" }} />
        <div className="absolute top-0 left-0 w-full h-[2px] z-10 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #26D9A1, #9E2FD0, #F6B82E)" }} />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(38,217,161,0.12)", border: "1px solid rgba(38,217,161,0.28)" }}>
              <FiUserPlus size={17} style={{ color: "#26D9A1" }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 dark:text-white leading-tight">{t("invitadosPanel.createTitle")}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("invitadosPanel.createSubtitle")}</p>
            </div>
            <button onClick={handleClose} className="ml-auto text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white transition-colors duration-200 p-1">
              <FiX size={18} />
            </button>
          </div>

          <div className="h-px mb-6 opacity-20" style={{ background: "linear-gradient(90deg, transparent, #9E2FD0, #F6B82E, transparent)" }} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
                <input type="text" placeholder={t("invitadosPanel.firstName")} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
                <input type="text" placeholder={t("invitadosPanel.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
              </div>
            </div>

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2" size={14} style={{ color: "#9ca3af" }} />
              <input type="email" placeholder={t("invitadosPanel.email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/10">
                {t("invitadosPanel.cancel")}
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 20px rgba(38,217,161,0.35)" }}>
                <FiUserPlus size={14} />
                {t("invitadosPanel.submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const InvitadosPanel = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [invitados, setInvitados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInvitados();
      setInvitados(data);
    } catch (error) {
      console.error("Error loading invitados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (invitado) => {
    const result = await Swal.fire({
      title: t("invitadosPanel.deleteConfirmTitle"),
      text: t("invitadosPanel.deleteConfirmText", { name: `${invitado.name} ${invitado.lastName}` }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("invitadosPanel.deleteConfirmButton"),
      cancelButtonText: t("invitadosPanel.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      await deleteInvitado(invitado.id);
      Swal.fire({ title: t("common.success"), text: t("invitadosPanel.deleteSuccess"), icon: "success", confirmButtonText: "Ok" });
      setInvitados((prev) => prev.filter((i) => i.id !== invitado.id));
      // The invitado also shows up in the teacher's own `user.students` list
      // (Schedule page's Teacher Panel) — that's separate Redux state loaded
      // at login, so without this it keeps showing the deleted invitado until
      // a full reload even though the backend row is already gone.
      dispatch(removeStudent(invitado.id));
    } catch (error) {
      Swal.fire({ title: t("common.error"), text: error.message, icon: "error", confirmButtonText: "Ok" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold text-gray-800 dark:text-white">{t("invitadosPanel.title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("invitadosPanel.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #26D9A1, #1fa07a)", boxShadow: "0 4px 20px rgba(38,217,161,0.35)" }}
        >
          <FiUserPlus size={15} />
          {t("invitadosPanel.create")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">…</div>
      ) : invitados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <FiUsers size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("invitadosPanel.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invitados.map((invitado) => (
            <div
              key={invitado.id}
              className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03]"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
              >
                {invitado.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {invitado.name} {invitado.lastName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{invitado.email}</p>
                {invitado.createdAt && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
                    {t("invitadosPanel.createdAt", { date: new Date(invitado.createdAt).toLocaleDateString(i18n.language) })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(invitado)}
                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors duration-200 flex-shrink-0"
                title={t("invitadosPanel.deleteConfirmButton")}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateInvitadoModal show={showCreate} handleClose={() => setShowCreate(false)} onCreated={load} />
    </div>
  );
};

export default InvitadosPanel;
