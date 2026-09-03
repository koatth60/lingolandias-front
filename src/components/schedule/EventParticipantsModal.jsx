import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import GroupMembersModal from "../messages/GroupMembersModal";
import ProfileCard from "../messages/ProfileCard";
import { addTeacherSchedule } from "../../redux/userSlice";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Reuses the exact same GroupMembersModal Messages already uses (add/remove/
// rename, all in one screen) from the Calendar's per-event "..." menu — same
// component, same endpoints, just scoped to this one class's room instead of
// whatever chat happens to be open in Messages. A legacy class that was never
// linked to a chat (no roomId yet) resolves/creates the teacher↔student DM
// first, same fallback EditEventModal's old add-person flow used.
const EventParticipantsModal = ({ roomId, studentId, initialName, isGroupClass, user, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [resolvedRoomId, setResolvedRoomId] = useState(roomId || null);
  const [conversation, setConversation] = useState({
    type: isGroupClass ? "group" : "dm",
    name: initialName || "",
    avatarUrl: null,
  });
  const [members, setMembers] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [pendingClassConfirm, setPendingClassConfirm] = useState(null);

  const fetchMembers = useCallback(async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${id}/members?userId=${user.id}`, { headers: authHeaders() });
      setMembers(res.ok ? await res.json() : []);
    } catch (err) {
      console.error("Error fetching class participants:", err);
      setMembers([]);
    }
  }, [user.id]);

  useEffect(() => {
    (async () => {
      let id = roomId;
      if (!id) {
        try {
          const dmRes = await fetch(`${BACKEND_URL}/conversations/dm`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ userId: user.id, otherUserId: studentId }),
          });
          const dm = await dmRes.json();
          if (dmRes.ok && dm?.id) id = dm.id;
        } catch (err) {
          console.error("Error resolving conversation for this class:", err);
        }
      }
      if (!id) {
        onClose();
        return;
      }
      setResolvedRoomId(id);
      fetchMembers(id);
    })();
    // Only ever needs to run once per mount — this modal is remounted fresh
    // (via React `key`) whenever a different event is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const promptScheduleForNewMember = async (person) => {
    // Admins aren't part of the teacher/student class model — never worth a
    // scheduling prompt. Guest teachers and students both go through this.
    if (person.role === "admin") return;
    try {
      const params = new URLSearchParams({ teacherId: user.id, otherUserId: person.id, conversationId: resolvedRoomId });
      const linkRes = await fetch(`${BACKEND_URL}/users/schedule-link?${params}`, { headers: authHeaders() });
      const link = linkRes.ok ? await linkRes.json() : { linked: false };
      if (!link.linked) return; // This room already has the schedule that got us here — should always be linked.
      setPendingClassConfirm({
        roomId: link.roomId,
        defaultGroupName: link.groupName || conversation.name || "",
        personId: person.id,
        personName: `${person.name} ${person.lastName}`.trim(),
      });
    } catch (err) {
      console.error("Error checking class link:", err);
    }
  };

  const handleAddMember = async (member, shareHistory) => {
    if (!resolvedRoomId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${resolvedRoomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: member.id, addedBy: user.id, shareHistory }),
      });
      const updatedConversation = await res.json().catch(() => null);
      if (updatedConversation) {
        setConversation((prev) => ({ ...prev, type: updatedConversation.type || prev.type, name: updatedConversation.name || prev.name }));
      }
      fetchMembers(resolvedRoomId);
      if (user.role === "teacher") await promptScheduleForNewMember(member);
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const handleConfirmAddToClass = async (chosenName) => {
    if (!pendingClassConfirm) return;
    const { roomId: extendRoomId, personId, personName } = pendingClassConfirm;
    try {
      const extendRes = await fetch(`${BACKEND_URL}/users/schedule-group/${extendRoomId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ teacherId: user.id, personId, personName, groupName: chosenName?.trim() || undefined }),
      });
      if (extendRes.ok) {
        const { schedules } = await extendRes.json().catch(() => ({ schedules: [] }));
        (schedules || []).forEach((s) => dispatch(addTeacherSchedule(s)));
        fetchMembers(resolvedRoomId);
      }
    } catch (err) {
      console.error("Error adding person to class:", err);
    } finally {
      setPendingClassConfirm(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!resolvedRoomId) return;
    const leavingSelf = userId === user.id;
    try {
      await fetch(`${BACKEND_URL}/conversations/${resolvedRoomId}/members/${userId}?requesterId=${user.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (leavingSelf) onClose();
      else fetchMembers(resolvedRoomId);
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleRenameChat = async (newName) => {
    if (!resolvedRoomId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${resolvedRoomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: newName, userId: user.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Swal.fire({ icon: "error", title: t("common.error"), text: data.message, confirmButtonText: "Ok" });
        return;
      }
      setConversation((prev) => ({ ...prev, name: newName }));
    } catch (err) {
      console.error("Error renaming class chat:", err);
    }
  };

  const handleChangeAvatar = async (avatarUrl) => {
    if (!resolvedRoomId) return;
    try {
      await fetch(`${BACKEND_URL}/conversations/${resolvedRoomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ avatarUrl }),
      });
      setConversation((prev) => ({ ...prev, avatarUrl }));
    } catch (err) {
      console.error("Error changing group avatar:", err);
    }
  };

  const handleViewProfile = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/${userId}/public-profile`, { headers: authHeaders() });
      if (!res.ok) return;
      setViewingProfile(await res.json());
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  if (viewingProfile) {
    return (
      <ProfileCard
        user={viewingProfile}
        isSelf={viewingProfile.id === user.id}
        onClose={() => setViewingProfile(null)}
        onMessage={() => setViewingProfile(null)}
      />
    );
  }

  if (members === null) return null; // still resolving the room / loading members

  return (
    <GroupMembersModal
      chatType={conversation.type}
      groupName={conversation.name}
      groupAvatarUrl={conversation.avatarUrl}
      members={members}
      currentUserId={user.id}
      currentUserRole={user.role}
      linkedToSchedule
      onClose={onClose}
      onViewProfile={handleViewProfile}
      onRename={handleRenameChat}
      onChangeAvatar={handleChangeAvatar}
      onAddMember={handleAddMember}
      onScheduleClass={() => {}}
      onRemoveMember={handleRemoveMember}
      pendingClassConfirm={pendingClassConfirm}
      onConfirmAddToClass={handleConfirmAddToClass}
      onCancelAddToClass={() => setPendingClassConfirm(null)}
    />
  );
};

export default EventParticipantsModal;
