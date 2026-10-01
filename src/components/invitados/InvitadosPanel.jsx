import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FiUserPlus, FiUser, FiMail, FiX, FiTrash2, FiUsers } from "react-icons/fi";
import { fetchInvitados, createInvitado, deleteInvitado } from "../../data/invitadosApi";
import { removeStudent } from "../../redux/userSlice";

const onFocus = undefined;
const onBlur = undefined;

const inputCls =
  "w-full h-9 pl-9 pr-3 rounded-lg text-[13.5px] outline-none border border-ll-line2 bg-ll-panel text-ll-ink " +
  "placeholder:text-ll-ink3 focus:border-ll-violet/60 transition-colors";

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
        <div className="absolute top-0 left-0 w-full h-[2px] z-10 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #1FA48C, rgb(var(--ll-violet)), #E8A23A)" }} />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h2 className="text-[16px] font-semibold text-ll-ink leading-tight">{t("invitadosPanel.createTitle")}</h2>
              <p className="text-[12.5px] text-ll-ink3 mt-0.5">{t("invitadosPanel.createSubtitle")}</p>
            </div>
            <button onClick={handleClose} className="ml-auto w-[30px] h-[30px] grid place-items-center rounded-[7px] text-ll-ink3 hover:bg-ll-hover hover:text-ll-ink transition-colors">
              <FiX size={18} />
            </button>
          </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3 pointer-events-none" size={14} />
                <input type="text" placeholder={t("invitadosPanel.firstName")} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
              </div>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3 pointer-events-none" size={14} />
                <input type="text" placeholder={t("invitadosPanel.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
              </div>
            </div>

            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-ll-ink3 pointer-events-none" size={14} />
              <input type="email" placeholder={t("invitadosPanel.email")} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} onFocus={onFocus} onBlur={onBlur} required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleClose} className="ll-btn ll-btn-secondary flex-1 justify-center">
                {t("invitadosPanel.cancel")}
              </button>
              <button type="submit" disabled={submitting} className="ll-btn ll-btn-primary flex-1 justify-center disabled:opacity-50">
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
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ll-ink">{t("invitadosPanel.title")}</h1>
          <p className="text-[13.5px] text-ll-ink3 mt-1">{t("invitadosPanel.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="ll-btn ll-btn-primary"
        >
          <FiUserPlus size={15} />
          {t("invitadosPanel.create")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-ll-ink3 text-sm">…</div>
      ) : invitados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-ll-line2 bg-ll-subtle">
          <FiUsers size={26} className="text-ll-ink4 mb-3" />
          <p className="text-[13.5px] text-ll-ink3">{t("invitadosPanel.empty")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-ll-line divide-y divide-ll-line overflow-hidden">
          {invitados.map((invitado) => (
            <div
              key={invitado.id}
              className="flex items-center gap-3 px-4 py-3 bg-ll-panel hover:bg-ll-subtle transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-semibold bg-ll-violet-tint text-ll-violet-ink"
              >
                {invitado.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-ll-ink truncate">
                  {invitado.name} {invitado.lastName}
                </p>
                <p className="text-[12px] text-ll-ink3 truncate">{invitado.email}</p>
                {invitado.createdAt && (
                  <p className="text-[11.5px] text-ll-ink4 mt-0.5">
                    {t("invitadosPanel.createdAt", { date: new Date(invitado.createdAt).toLocaleDateString(i18n.language) })}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(invitado)}
                className="w-8 h-8 grid place-items-center rounded-lg text-ll-ink3 hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0"
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
