import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchUnreadMessages } from "../../redux/messageSlice";
import { socket } from "../../socket";
import useNotificationSound from "../../hooks/useNotificationSound";
import { activeRoomRef } from "../../state/activeRoom";
import {
  setConversationsSnapshot,
  incrementConversationUnread,
  clearConversationUnread,
  selectTotalUnread,
} from "../../redux/notificationsSlice";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Owns every socket listener behind the unread badges and the notification
// sound — mounted once at the App level (see App.jsx) instead of inside
// Dashboard, specifically so it keeps running on routes that don't render
// Dashboard's sidebar layout at all, like /classroom during a video call.
// Previously living inside Dashboard meant a message that arrived while
// someone was in a call produced no sound and no badge anywhere, since
// Dashboard (and therefore these listeners) simply wasn't mounted there.
const NotificationsListener = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Mounted at the Router level (see App.jsx) so it stays active on routes
  // Dashboard doesn't render (like /classroom) — but that also means it's
  // mounted on /login, before userInfo exists at all, unlike Dashboard which
  // only ever renders behind RequireAuth. Optional chaining is required here.
  const user = useSelector((state) => state.user.userInfo?.user);
  const mutedByConversation = useSelector((state) => state.notifications.mutedByConversation);
  // Read via a ref inside the socket effect below instead of listing the
  // (frequently-new-reference) object as a dependency — that would tear down
  // and re-subscribe every socket listener on every single conversations
  // fetch anywhere in the app, just to pick up mute changes that are rare.
  const mutedByConversationRef = useRef(mutedByConversation);
  mutedByConversationRef.current = mutedByConversation;
  const playSound = useNotificationSound();
  const soundEnabled = user?.settings?.notificationSound !== false;
  const totalUnread = useSelector(selectTotalUnread);

  useEffect(() => {
    if (user?.id) dispatch(fetchUnreadMessages(user.id));
  }, [user?.id, dispatch]);

  // Badging API — the little number on the taskbar/dock icon, the same spot
  // Skype/Zoom use for unread counts. Only meaningful once installed as a
  // PWA (browser tabs don't have an icon to badge), but it's harmless and a
  // no-op to call this from a normal browser tab too, so no need to gate it
  // on isInstalled.
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    if (totalUnread > 0) {
      navigator.setAppBadge(totalUnread).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [totalUnread]);

  // Single canonical fetch that seeds the shared notifications slice for the
  // whole session — every other update after this is a targeted
  // socket-driven increment/clear (see below), not another full re-fetch.
  const fetchConversationsSnapshot = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/conversations?userId=${user.id}&limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      // Never trust the server's unreadCount for whichever conversation is
      // actively open right now (Messages or a call's chat panel) — its
      // lastReadAt lags the debounced markConversationRead call.
      dispatch(setConversationsSnapshot(
        data.conversations.map((c) => (c.id === activeRoomRef.current ? { ...c, unreadCount: 0 } : c))
      ));
    } catch (_) {}
  };

  useEffect(() => { fetchConversationsSnapshot(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user?.id) return;

    socket.on("newUnreadGlobalMessage", () => {
      dispatch(fetchUnreadMessages(user.id));
    });
    socket.on("newUnreadSupportMessage", () => {
      dispatch(fetchUnreadMessages(user.id));
    });

    // Server only emits this to members other than the sender, so any event
    // received here is genuinely someone else's message. Increments the
    // shared counter directly instead of re-fetching — a re-fetch here is
    // exactly what used to race the debounced "mark as read" call and show a
    // stale unread badge for a conversation the user was actively looking at
    // (whether that's Messages or a call's chat panel).
    const handleNewConversationMessage = (data) => {
      const conversationId = data?.conversationId;
      if (!conversationId) return;
      const isOpenRightNow = conversationId === activeRoomRef.current;
      if (!isOpenRightNow) {
        dispatch(incrementConversationUnread(conversationId));
      }
      if (soundEnabled && !isOpenRightNow && !mutedByConversationRef.current[conversationId]) {
        playSound();
      }
    };
    // Confirms a read from ANY of the user's sessions (a different tab, a
    // read that just persisted after its 1.5s debounce, another device) —
    // without this, only whoever has that exact conversation's socket room
    // joined ever hears about the read.
    const handleConversationRead = (data) => {
      if (data?.userId === user.id && data?.conversationId) {
        dispatch(clearConversationUnread(data.conversationId));
      }
    };

    // Separate from handleNewConversationMessage above — a mention is worth
    // an in-app toast even for a conversation someone has muted, the same
    // reasoning as sendMentionPush skipping the messageNotifications/mute
    // gate server-side. Only while the tab's actually visible, same fix as
    // the userStatus flood: a backgrounded tab shouldn't dump a trickle of
    // "so-and-so mentioned you 10 minutes ago" toasts on refocus.
    const handleMentioned = (data) => {
      if (data?.conversationId === activeRoomRef.current) return;
      if (document.visibilityState !== "visible") return;
      // data.preview is the raw message text, which may contain
      // @[Name](userId) mention markup — collapse it to "@Name" for display.
      const preview = (data.preview || "").replace(/@\[([^\]]+)\]\([0-9a-f-]{36}\)/g, "@$1");
      toast(
        <div onClick={() => navigate("/messages", { state: { openConversationId: data.conversationId } })} style={{ cursor: "pointer" }}>
          <b>{data.senderName}</b> mentioned you
          <div style={{ fontSize: "12px", opacity: 0.75 }}>{preview}</div>
        </div>,
        { theme: "light" }
      );
    };

    socket.on("newConversationMessage", handleNewConversationMessage);
    socket.on("newConversation", fetchConversationsSnapshot);
    socket.on("conversationRead", handleConversationRead);
    socket.on("mentioned", handleMentioned);

    return () => {
      socket.off("newUnreadGlobalMessage");
      socket.off("newUnreadSupportMessage");
      socket.off("newConversationMessage", handleNewConversationMessage);
      socket.off("newConversation", fetchConversationsSnapshot);
      socket.off("conversationRead", handleConversationRead);
      socket.off("mentioned", handleMentioned);
    };
  }, [user?.id, dispatch, soundEnabled, playSound, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default NotificationsListener;
