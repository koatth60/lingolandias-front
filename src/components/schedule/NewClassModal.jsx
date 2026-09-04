import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FiCalendar, FiX, FiSearch, FiUserPlus, FiClock } from "react-icons/fi";
import useUserSearch from "../../hooks/useUserSearch";
import TimeInput from "../common/TimeInput";
import { socket } from "../../socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getInitials = (name, lastName) => {
  const a = (name || "").trim()[0] || "";
  const b = (lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

// Click-an-empty-slot entry point for creating a class, complementary to the
// existing "start from a chat" flow in Messages (handleCreateGroup /
// promptScheduleForNewMember) — this one is for when the teacher already
// knows the time and just needs to pick who's coming. Reuses the exact same
// backend contract (a real conversation + POST /users/schedule-group) so a
// class created here behaves identically everywhere else in the app.
const NewClassModal = ({ show, teacherId, teacherName, teacherEmail, teacherAvatarUrl, initialStart, initialEnd, onClose, onCreated }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState(initialStart ? dayjs(initialStart).format("HH:mm") : "");
  const [end, setEnd] = useState(initialEnd ? dayjs(initialEnd).format("HH:mm") : "");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [existingLink, setExistingLink] = useState(null);
  const { results, loading } = useUserSearch(query, teacherId);

  // Same "does this pair already have a class?" check the chat-based flow
  // uses (promptScheduleForNewMember/promptScheduleForStudentDm) — a second
  // time slot with someone you already teach should land on their EXISTING
  // class/chat, not spin up a duplicate conversation. Only meaningful for a
  // single selected person: a specific new group of 2+ people never already
  // has a shared class by definition.
  useEffect(() => {
    if (selected.length !== 1) {
      setExistingLink(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ teacherId, otherUserId: selected[0].id });
    fetch(`${BACKEND_URL}/users/schedule-link?${params}`, { headers: authHeaders() })
      .then((res) => (res.ok ? res.json() : { linked: false }))
      .then((link) => {
        if (cancelled) return;
        setExistingLink(link.linked ? link : null);
        if (link.linked) setName(link.groupName || "");
      })
      .catch(() => { if (!cancelled) setExistingLink(null); });
    return () => { cancelled = true; };
  }, [selected, teacherId]);

  if (!show) return null;

  const selectedIds = new Set(selected.map((p) => p.id));
  const pickable = results.filter((u) => (u.role === "user" || u.role === "invitado") && !selectedIds.has(u.id));

  const addPerson = (person) => {
    setSelected((prev) => [...prev, person]);
    setQuery("");
  };
  const removePerson = (id) => setSelected((prev) => prev.filter((p) => p.id !== id));

  const notifyNewConversation = (conversationId, memberIds) => {
    socket?.emit("newConversationCreated", { conversationId, memberIds });
  };

  const handleSubmit = async () => {
    if (!selected.length || !start || !end || submitting) return;
    if (end <= start) {
      Swal.fire({ title: t("common.error"), text: t("addEvent.endBeforeStart"), icon: "error", confirmButtonColor: "#9E2FD0" });
      return;
    }
    setSubmitting(true);
    try {
      const day = dayjs(initialStart);
      const [startH, startM] = start.split(":").map(Number);
      const [endH, endM] = end.split(":").map(Number);
      const startDateTime = day.hour(startH).minute(startM).second(0).millisecond(0);
      const endDateTime = day.hour(endH).minute(endM).second(0).millisecond(0);

      // Already have a class with this exact person — add this new time slot
      // to that SAME chat/room instead of creating a duplicate conversation.
      // (schedule-group/:roomId/extend isn't the right tool here: it clones
      // an EXISTING slot's time for a NEW member joining, it can't take a
      // different time for someone already in the class — a plain new
      // Schedule row pointed at the same roomId/groupName is what actually
      // models "another time slot, same class chat".)
      //
      // Applies to every current REAL member of that room, not just the one
      // person searched for here — the search was only ever needed to
      // identify *which* existing class this is; a class chat with a
      // student AND an invitado in it means both attend every session
      // scheduled for that room, the same way removing a member already
      // clears their rows for every session at once (see
      // ConversationsRepository.removeMember), not just one.
      if (existingLink) {
        const membersRes = await fetch(`${BACKEND_URL}/conversations/${existingLink.roomId}/members?userId=${teacherId}`, {
          headers: authHeaders(),
        });
        const members = membersRes.ok ? await membersRes.json() : [];
        const attendees = members.filter((m) => m.role === "user" || m.role === "invitado");
        const groupName = name.trim() || existingLink.groupName || undefined;

        const savedSchedules = await Promise.all(
          attendees.map(async (person) => {
            const addRes = await fetch(`${BACKEND_URL}/users/add-event`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify({
                studentId: person.id,
                teacherId,
                studentName: `${person.name} ${person.lastName}`.trim(),
                teacherName,
                roomId: existingLink.roomId,
                groupName,
                initialDateTime: startDateTime.toISOString(),
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                dayOfWeek: startDateTime.format("dddd"),
                recurrenceWeeks,
              }),
            });
            if (!addRes.ok) throw new Error((await addRes.json().catch(() => ({}))).message || "Failed to add the new time slot");
            return addRes.json();
          }),
        );

        socket?.emit("sendConversationMessage", {
          conversationId: existingLink.roomId,
          senderId: teacherId,
          username: teacherName,
          email: teacherEmail || "",
          avatarUrl: teacherAvatarUrl,
          message: t("newClassModal.autoMessageAdded", { when: startDateTime.format("dddd HH:mm") }),
        });

        onCreated?.(savedSchedules);
        onClose();
        return;
      }

      let conversationId;
      if (selected.length === 1) {
        const res = await fetch(`${BACKEND_URL}/conversations/dm`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ userId: teacherId, otherUserId: selected[0].id }),
        });
        const conv = await res.json();
        conversationId = conv.id;
        notifyNewConversation(conversationId, [teacherId, selected[0].id]);
      } else {
        const res = await fetch(`${BACKEND_URL}/conversations/group`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ createdBy: teacherId, name: name.trim() || undefined, memberIds: selected.map((p) => p.id) }),
        });
        const conv = await res.json();
        conversationId = conv.id;
        notifyNewConversation(conversationId, [teacherId, ...selected.map((p) => p.id)]);
      }

      const res = await fetch(`${BACKEND_URL}/users/schedule-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          teacherId,
          teacherName,
          students: selected.map((p) => ({ id: p.id, name: `${p.name} ${p.lastName}`.trim() })),
          conversationId,
          groupName: name.trim() || undefined,
          initialDateTime: startDateTime.toISOString(),
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          dayOfWeek: startDateTime.format("dddd"),
          recurrenceWeeks,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed to create class");
      const data = await res.json();

      // Unlike the "start from a chat" flow, this one creates a conversation
      // the teacher never actually opens — and a message-less DM/group is
      // deliberately hidden from everyone's chat list (see
      // ConversationsRepository.findUserConversations), so without this the
      // brand new class chat would be invisible until somebody messaged it
      // by chance. A real chat message (not just a system log line) also
      // means it shows a preview and an unread badge for everyone else.
      const when = startDateTime.format("dddd HH:mm");
      socket?.emit("sendConversationMessage", {
        conversationId,
        senderId: teacherId,
        username: teacherName,
        email: teacherEmail || "",
        avatarUrl: teacherAvatarUrl,
        message: t("newClassModal.autoMessage", { name: name.trim() || selected[0]?.name, when }),
      });

      onCreated?.(data.schedules || []);
      onClose();
    } catch (err) {
      Swal.fire({ title: t("common.error"), text: err.message, icon: "error", confirmButtonColor: "#9E2FD0" });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 99999 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0d0a1e] flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh", border: "1px solid rgba(158,47,208,0.30)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", zIndex: 100000 }}
      >
        <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)" }} />

        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
              <FiCalendar size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">{t("newClassModal.title")}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {initialStart ? dayjs(initialStart).format("dddd, MMMM D") : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex-shrink-0">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* People picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              {t("newClassModal.peopleLabel")}
            </label>
            {!!selected.length && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selected.map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-xs font-medium bg-[#9E2FD0]/10 text-[#9E2FD0] dark:bg-[#9E2FD0]/20"
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                      {getInitials(p.name, p.lastName)}
                    </span>
                    {p.name} {p.lastName}
                    <button type="button" onClick={() => removePerson(p.id)} className="hover:text-red-500">
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("newClassModal.searchPlaceholder")}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0]"
              />
            </div>
            {query.trim().length >= 2 && (
              <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.07]">
                {loading && <p className="text-xs text-gray-400 text-center py-3">{t("messagesExtra.searching")}</p>}
                {!loading && pickable.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">{t("messagesExtra.noResults")}</p>
                )}
                {pickable.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => addPerson(u)}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}>
                      {getInitials(u.name, u.lastName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{u.name} {u.lastName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                    </div>
                    <FiUserPlus size={13} className="text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
            {existingLink && (
              <p className="mt-2 text-[11px] text-[#26D9A1] flex items-center gap-1.5">
                <FiCalendar size={11} />
                {t("newClassModal.existingLinkNote")}
              </p>
            )}
          </div>

          {/* Class name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
              {t("newClassModal.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("newClassModal.namePlaceholder")}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-[#9E2FD0]/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#9E2FD0]"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.startTime")}</label>
              <TimeInput value={start} onChange={setStart} className="w-full px-4 py-2.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.endTime")}</label>
              <TimeInput value={end} onChange={setEnd} className="w-full px-4 py-2.5" />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">{t("addEvent.recurrence")}</label>
            <div className="flex gap-2">
              {[{ value: 1, label: t("addEvent.everyWeek") }, { value: 2, label: t("addEvent.everyTwoWeeks") }].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrenceWeeks(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    recurrenceWeeks === opt.value ? "text-white" : "text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                  }`}
                  style={recurrenceWeeks === opt.value ? { background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 flex-shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !selected.length || !start || !end}
            className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #F6B82E, #d4981a)", boxShadow: "0 4px 14px rgba(246,184,46,0.28)" }}
          >
            <FiClock size={14} /> {submitting ? t("messagesExtra.creating") : t("newClassModal.create")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NewClassModal;
