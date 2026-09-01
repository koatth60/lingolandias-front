import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ChatListComponent from "../components/messages/ChatListComponent";
import ChatWindowComponent from "../components/messages/ChatWindowComponent";
import ProfileCard from "../components/messages/ProfileCard";
import NewGroupModal from "../components/messages/NewGroupModal";
import GroupMembersModal from "../components/messages/GroupMembersModal";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import { FiMessageSquare } from "react-icons/fi";
import { activeRoomRef } from "../state/activeRoom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getToken = () => {
  try {
    const s = JSON.parse(localStorage.getItem('state') || '{}');
    return s?.user?.userInfo?.token || '';
  } catch { return ''; }
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const LEGACY_NAME_KEYS = {
  general: { english: "roomData.generalEnglish", spanish: "roomData.generalSpanish", polish: "roomData.generalPolish" },
  teacher: { english: "roomData.teacherEnglish", spanish: "roomData.teacherSpanish", polish: "roomData.teacherPolish" },
};

const Messages = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.userInfo.user);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatList, setShowChatList] = useState(true);
  const [socket, setSocket] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState(null);

  // Shared with dashboard.jsx's notification-sound logic so a message never
  // dings for the conversation you're already looking at.
  useEffect(() => {
    activeRoomRef.current = selectedChat?.id || null;
    return () => { activeRoomRef.current = null; };
  }, [selectedChat?.id]);

  useEffect(() => {
    const socketInstance = io(BACKEND_URL, {
      auth: { token: getToken() },
    });
    socketInstance.on("connect", () => {
      socketInstance.emit("registerUser", { userId: user.id });
    });
    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getDisplayName = useCallback((c) => {
    if (c.type === "dm") return c.otherUser ? `${c.otherUser.name} ${c.otherUser.lastName}` : c.name;
    if (c.type === "support") return t("messagesExtra.chipSupport", "Support");
    const key = LEGACY_NAME_KEYS[c.type]?.[c.language];
    return key ? t(key) : c.name;
  }, [t]);

  const CONVERSATIONS_PAGE_SIZE = 20;
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const conversationsRef = useRef([]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // append=false (default) always reloads page 1 — used on mount and any time
  // something changes that could reorder the top of the list (new message,
  // new conversation). append=true is only for the explicit "load more" click.
  const fetchConversations = useCallback(async (append = false) => {
    if (!user?.id) return;
    try {
      const offset = append ? conversationsRef.current.length : 0;
      const res = await fetch(
        `${BACKEND_URL}/conversations?userId=${user.id}&limit=${CONVERSATIONS_PAGE_SIZE}&offset=${offset}`,
        { headers: authHeaders() }
      );
      if (!res.ok) return;
      const data = await res.json();
      const withNames = data.conversations.map((c) => ({ ...c, name: getDisplayName(c) }));
      setConversations((prev) => (append ? [...prev, ...withNames] : withNames));
      setHasMoreChats(data.hasMore);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user?.id, getDisplayName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMoreChats = async () => {
    setLoadingMoreChats(true);
    await fetchConversations(true);
    setLoadingMoreChats(false);
  };

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchConversations();
    socket.on("newConversationMessage", refresh);
    socket.on("newConversation", refresh);
    return () => {
      socket.off("newConversationMessage", refresh);
      socket.off("newConversation", refresh);
    };
  }, [socket, fetchConversations]);

  // A draft's local-only list entry never survives a switch to something
  // else — Teams-style: it's visible while you're looking at it, gone the
  // moment you look away without sending. fetchConversations() (see below)
  // wholesale-replaces this array whenever a message actually gets sent, so
  // there's nothing to reconcile on that path — this cleanup only matters
  // for the "never sent anything" case.
  const dropStaleDrafts = (list) => list.filter((c) => !c.isDraft);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowChatList(false);
    setConversations((prev) => {
      const cleaned = dropStaleDrafts(prev).map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c));
      return chat.isDraft ? [chat, ...cleaned] : cleaned;
    });
  };

  const handleBackClick = () => {
    setSelectedChat(null);
    setShowChatList(true);
    setConversations(dropStaleDrafts);
  };

  const notifyNewConversation = (conversationId, memberIds) => {
    socket?.emit("newConversationCreated", { conversationId, memberIds });
  };

  // Opens a chat with this person. If a real DM already exists (they're not
  // necessarily in the currently-loaded/paginated conversations list, so a
  // local check isn't reliable — e.g. clicking someone from a group's member
  // list you've never pinned/recently messaged), a quick read-only lookup
  // finds it and its full history opens directly, exactly like Teams. Only
  // when there's genuinely no prior conversation does this fall back to a
  // local draft — shown at the top of the chat list right away, but nothing
  // is saved server-side until an actual message is sent (see
  // resolveDraftConversation). Switching to another chat, closing this one,
  // or reloading the page all discard an unsent draft, since it never
  // existed anywhere but this component's own state.
  const startDmWith = async (person) => {
    setProfileUser(null);
    let existingId = null;
    try {
      const res = await fetch(
        `${BACKEND_URL}/conversations/dm/existing?userId=${user.id}&otherUserId=${person.id}`,
        { headers: authHeaders() }
      );
      if (res.ok) {
        const { conversation } = await res.json();
        existingId = conversation?.id || null;
      }
    } catch (err) {
      console.error("Error checking for an existing DM:", err);
    }
    handleChatSelect({
      // Deliberately NOT person.id when no real conversation exists yet.
      // Some legacy DMs were migrated with their conversation id set to one
      // of the participants' own userId, so reusing person.id here could
      // collide with a real (unrelated) conversation and leak it into this
      // draft window before resolveDraftConversation ever runs.
      id: existingId,
      type: "dm",
      name: `${person.name} ${person.lastName}`.trim(),
      avatarUrl: person.avatarUrl,
      otherUser: person,
      unreadCount: 0,
      isDraft: !existingId,
    });
  };

  // Called from ChatWindowComponent the moment the first message is actually
  // sent on a draft — creates (or finds) the real conversation, then hands
  // its id back so the message can go out under the right room.
  const resolveDraftConversation = async (otherUserId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/dm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: user.id, otherUserId }),
      });
      const conversation = await res.json();
      setSelectedChat((prev) =>
        prev && prev.otherUser?.id === otherUserId ? { ...prev, id: conversation.id, isDraft: false } : prev
      );
      notifyNewConversation(conversation.id, [user.id, otherUserId]);
      fetchConversations();
      return conversation.id;
    } catch (err) {
      console.error("Error starting conversation:", err);
      return null;
    }
  };

  // Deep link from the Schedule calendar's "message this person" icon —
  // open (or create) that DM automatically on arrival.
  useEffect(() => {
    const targetId = location.state?.openDmWithUserId;
    if (!targetId || !user?.id) return;
    startDmWith({ id: targetId, name: location.state?.openDmWithName || "", lastName: "" });
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state?.openDmWithUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateGroup = async ({ name, avatarUrl, memberIds }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/group`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ createdBy: user.id, name, avatarUrl, memberIds }),
      });
      const conversation = await res.json();
      setShowNewGroupModal(false);
      handleChatSelect({ id: conversation.id, type: "group", name, avatarUrl, unreadCount: 0 });
      notifyNewConversation(conversation.id, [user.id, ...memberIds]);
      fetchConversations();
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

  const handleViewProfile = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/users/${userId}/public-profile`, { headers: authHeaders() });
      if (!res.ok) return;
      setProfileUser(await res.json());
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleViewGroupMembers = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${selectedChat.id}/members?userId=${user.id}`, { headers: authHeaders() });
      if (!res.ok) return;
      setGroupMembers(await res.json());
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  };

  const handleAddMember = async (newUserId, shareHistory) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${selectedChat.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: newUserId, addedBy: user.id, shareHistory }),
      });
      const updatedConversation = await res.json();
      // A DM grows into a group the moment a third person joins.
      setSelectedChat((prev) => ({
        ...prev,
        type: updatedConversation.type,
        name: updatedConversation.name || prev.name,
        otherUser: updatedConversation.type === "group" ? null : prev.otherUser,
      }));
      notifyNewConversation(selectedChat.id, [newUserId]);
      fetchConversations();
      handleViewGroupMembers();
    } catch (err) {
      console.error("Error adding member:", err);
    }
  };

  const handleRenameChat = async (newName) => {
    if (!selectedChat) return;
    try {
      await fetch(`${BACKEND_URL}/conversations/${selectedChat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: newName }),
      });
      setSelectedChat((prev) => ({ ...prev, name: newName }));
      fetchConversations();
    } catch (err) {
      console.error("Error renaming chat:", err);
    }
  };

  const handleChangeAvatar = async (avatarUrl) => {
    if (!selectedChat) return;
    try {
      await fetch(`${BACKEND_URL}/conversations/${selectedChat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ avatarUrl }),
      });
      setSelectedChat((prev) => ({ ...prev, avatarUrl }));
      setConversations((prev) => prev.map((c) => (c.id === selectedChat.id ? { ...c, avatarUrl } : c)));
      // Other members only refetch their list on the next socket-driven
      // "newConversation" trigger (new message, add member, etc.) — reuse
      // that same signal here so an avatar-only change shows up live too.
      // groupMembers is already populated whenever this can be called, since
      // it's only reachable from inside the open GroupMembersModal.
      if (groupMembers?.length) {
        notifyNewConversation(selectedChat.id, groupMembers.map((m) => m.id));
      }
    } catch (err) {
      console.error("Error changing group avatar:", err);
    }
  };

  const handleTogglePin = async (chat) => {
    const nextPinned = !chat.pinned;
    setConversations((prev) => prev.map((c) => (c.id === chat.id ? { ...c, pinned: nextPinned } : c)));
    try {
      await fetch(`${BACKEND_URL}/conversations/${chat.id}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: user.id, pinned: nextPinned }),
      });
      fetchConversations();
    } catch (err) {
      console.error("Error toggling pin:", err);
    }
  };

  const handleToggleMute = async (chat) => {
    const nextMuted = !chat.muted;
    setConversations((prev) => prev.map((c) => (c.id === chat.id ? { ...c, muted: nextMuted } : c)));
    try {
      await fetch(`${BACKEND_URL}/conversations/${chat.id}/mute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ userId: user.id, muted: nextMuted }),
      });
      fetchConversations();
    } catch (err) {
      console.error("Error toggling mute:", err);
    }
  };

  const handleDeleteChat = async (chat) => {
    setConversations((prev) => prev.filter((c) => c.id !== chat.id));
    if (selectedChat?.id === chat.id) {
      setSelectedChat(null);
      setShowChatList(true);
    }
    try {
      await fetch(`${BACKEND_URL}/conversations/${chat.id}?userId=${user.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  // Distinct from handleDeleteChat above: this removes the group entirely
  // for every member, not just the requester's own view. Any member can do
  // this today — groups a teacher creates through the (not yet wired)
  // scheduling flow are excluded server-side via linkedToSchedule.
  const handleDeleteGroup = async (chat) => {
    const result = await Swal.fire({
      title: t("messagesExtra.deleteGroupTitle"),
      text: t("messagesExtra.deleteGroupWarning", { name: chat.name }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("messagesExtra.deleteGroupConfirm"),
      cancelButtonText: t("messagesExtra.cancel"),
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${BACKEND_URL}/conversations/${chat.id}/group?userId=${user.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Swal.fire({ title: t("common.error"), text: data.message || t("messagesExtra.deleteGroupFailed"), icon: "error", confirmButtonText: "Ok" });
        return;
      }
      const { memberIds } = await res.json();
      setConversations((prev) => prev.filter((c) => c.id !== chat.id));
      if (selectedChat?.id === chat.id) {
        setSelectedChat(null);
        setShowChatList(true);
      }
      socket?.emit("conversationDeleted", { conversationId: chat.id, memberIds });
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const chatListProps = {
    chats: conversations,
    onChatSelect: handleChatSelect,
    selectedChatId: selectedChat?.id,
    currentUserId: user.id,
    onStartChatWithUser: startDmWith,
    onNewGroup: () => setShowNewGroupModal(true),
    onTogglePin: handleTogglePin,
    onToggleMute: handleToggleMute,
    onDeleteChat: handleDeleteChat,
    onDeleteGroup: handleDeleteGroup,
    hasMoreChats,
    loadingMoreChats,
    onLoadMoreChats: loadMoreChats,
    isLoading: isLoadingConversations,
  };

  const chatWindowProps = selectedChat ? {
    username: user.name,
    email: user.email,
    userUrl: user.avatarUrl,
    room: selectedChat.id,
    studentName: selectedChat.name,
    chatType: selectedChat.type,
    otherUserId: selectedChat.otherUser?.id,
    isDraft: selectedChat.isDraft,
    onResolveDraft: () => resolveDraftConversation(selectedChat.otherUser.id),
    userId: user.id,
    socket,
    onBackClick: handleBackClick,
    onClose: () => { setSelectedChat(null); setConversations(dropStaleDrafts); },
    onViewProfile: handleViewProfile,
    onViewGroupMembers: handleViewGroupMembers,
  } : null;

  return (
    <div className="flex w-full relative h-screen">
      {/* Page background */}
      <div className="absolute inset-0 pointer-events-none dark:hidden" style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "600px", height: "600px", top: "-10%", right: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "400px", height: "400px", bottom: "5%", left: "10%" }} />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]" style={{ backgroundImage: "linear-gradient(rgba(158,47,208,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(158,47,208,0.8) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <Dashboard />
      <div className="w-full relative z-10 flex flex-col min-w-0">
        <Navbar header={t("messages.title")} />

        <section className="flex-grow min-h-0 p-3 sm:p-4 overflow-hidden">

          {/* ── Desktop: unified glass card ── */}
          <div
            className="hidden lg:flex h-full relative rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(158,47,208,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(158,47,208,0.08)",
            }}
          >
            {/* Light glass bg */}
            <div
              className="absolute inset-0 dark:hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            />
            {/* Dark glass bg */}
            <div
              className="absolute inset-0 hidden dark:block rounded-2xl"
              style={{ background: "rgba(13,10,30,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-[2px] z-20 bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

            {/* Inner flex row — starts below the 2px accent */}
            <div className="relative z-10 flex w-full h-full pt-[2px]">

              {/* ── ChatList sidebar ── */}
              <div className="w-[280px] flex-shrink-0 overflow-hidden">
                <ChatListComponent {...chatListProps} />
              </div>

              {/* ── Chat / empty area ── */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {selectedChat ? (
                  <ChatWindowComponent {...chatWindowProps} />
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
                    {/* Ambient glow */}
                    <div
                      className="absolute w-72 h-72 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(158,47,208,0.07), transparent 70%)" }}
                    />
                    {/* Icon */}
                    <div
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(158,47,208,0.12), rgba(38,217,161,0.06))",
                        border: "1px solid rgba(158,47,208,0.22)",
                        boxShadow: "0 4px 20px rgba(158,47,208,0.14)",
                      }}
                    >
                      <FiMessageSquare size={26} style={{ color: "#9E2FD0" }} />
                    </div>
                    {/* Text */}
                    <div className="text-center relative">
                      <p className="text-base font-extrabold login-gradient-text">{t("messages.emptyTitle")}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                        {t("messages.selectChat")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile ── */}
          <div className="lg:hidden h-full">
            {showChatList ? (
              <div
                className="h-full rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(158,47,208,0.15)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <ChatListComponent {...chatListProps} />
              </div>
            ) : (
              selectedChat && <ChatWindowComponent {...chatWindowProps} />
            )}
          </div>

        </section>
      </div>

      {profileUser && (
        <ProfileCard
          user={profileUser}
          isSelf={profileUser.id === user.id}
          onClose={() => setProfileUser(null)}
          onMessage={(u) => startDmWith(u)}
        />
      )}

      {showNewGroupModal && (
        <NewGroupModal
          currentUserId={user.id}
          onClose={() => setShowNewGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {groupMembers && (
        <GroupMembersModal
          chatType={selectedChat?.type}
          groupName={selectedChat?.name}
          groupAvatarUrl={selectedChat?.avatarUrl}
          members={groupMembers}
          currentUserId={user.id}
          onClose={() => setGroupMembers(null)}
          onViewProfile={(id) => { setGroupMembers(null); handleViewProfile(id); }}
          onRename={handleRenameChat}
          onChangeAvatar={handleChangeAvatar}
          onAddMember={handleAddMember}
        />
      )}
    </div>
  );
};

export default Messages;
