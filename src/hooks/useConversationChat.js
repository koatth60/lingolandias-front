import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const dedupeById = (list) => {
  const seen = new Set();
  return list.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

// Same shape/behavior as useGlobalChat, but talks to the unified
// /conversations API + sendConversationMessage socket events instead of the
// legacy /chat + chat/globalChat pair — used for every conversation type now
// (dm, group, general, teacher, support) since Fase 1 migrated them all into
// one model.
const useConversationChat = (socket, conversationId, user) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/conversations/${conversationId}/messages`,
        { params: { userId: user?.id }, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setChatMessages(dedupeById(response.data));
      setHasMore(response.data.length >= 50);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    }
  }, [conversationId, user?.id]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !hasMore || !chatMessages.length) return;
    setLoadingMore(true);
    try {
      const token = localStorage.getItem("token");
      const oldest = chatMessages[0];
      const response = await axios.get(
        `${BACKEND_URL}/conversations/${conversationId}/messages`,
        { params: { userId: user?.id, before: oldest.id }, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setChatMessages((prev) => dedupeById([...response.data, ...prev]));
      setHasMore(response.data.length >= 50);
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, user?.id, chatMessages, loadingMore, hasMore]);

  // Runs on every conversationId change, including into a draft DM's `null`
  // (see ChatWindowComponent) — without this, switching from an open
  // conversation into a blank draft left the previous conversation's
  // messages rendered under the new person's name until the first message
  // was actually sent and a real fetch overwrote the stale state.
  useEffect(() => {
    setChatMessages([]);
    setHasMore(true);
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId || !user?.name) return;
    socket.emit("join", { username: user.name, room: conversationId });
    fetchMessages();

    const handleMessage = (data) => {
      if (data.conversationId !== conversationId) return;
      setChatMessages((prev) => {
        const idx = prev.findIndex(
          (m) =>
            m._pending &&
            m.senderId === data.senderId &&
            m.message === data.message &&
            Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 10000
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = data;
          return updated;
        }
        return [...prev, data];
      });
    };

    const handleEdited = ({ messageId, newMessage, editedAt }) => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, message: newMessage, editedAt } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleReactionUpdated = ({ conversationId: cid, messageId, reactions }) => {
      if (cid !== conversationId) return;
      setChatMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleChatError = ({ reason }) => {
      console.error("[conversation] Server rejected message:", reason);
      if (reason !== "rate_limited") {
        setChatMessages((prev) => prev.filter((m) => !m._pending));
      }
    };

    socket.on("conversationMessage", handleMessage);
    socket.on("conversationMessageEdited", handleEdited);
    socket.on("conversationMessageDeleted", handleDeleted);
    socket.on("messageReactionUpdated", handleReactionUpdated);
    socket.on("chatError", handleChatError);

    return () => {
      socket.off("conversationMessage", handleMessage);
      socket.off("conversationMessageEdited", handleEdited);
      socket.off("conversationMessageDeleted", handleDeleted);
      socket.off("messageReactionUpdated", handleReactionUpdated);
      socket.off("chatError", handleChatError);
    };
  }, [conversationId, socket, user?.name, fetchMessages]);

  // targetId overrides the hook's own conversationId — needed for a draft DM
  // that doesn't have a real conversation yet when the user hits send (see
  // ChatWindowComponent's handleSendMessage).
  const sendMessage = (message, replyTo, fileUrl, targetId) => {
    const id = targetId || conversationId;
    if (!id || !socket || !socket.connected || !user) return;
    const timestamp = new Date();
    const optimistic = {
      _pending: true,
      id: `pending-${Date.now()}`,
      conversationId: id,
      senderId: user.id,
      username: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      message,
      timestamp,
    };
    if (replyTo) optimistic.replyTo = replyTo;
    if (fileUrl) optimistic.fileUrl = fileUrl;
    setChatMessages((prev) => [...prev, optimistic]);

    socket.emit("sendConversationMessage", {
      conversationId: id,
      senderId: user.id,
      username: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      message,
      replyTo,
      fileUrl,
    });
  };

  const toggleReaction = (messageId, emoji) => {
    if (!conversationId || !socket || !socket.connected) return;
    socket.emit("toggleReaction", { conversationId, messageId, emoji, userName: user?.name });
  };

  return { chatMessages, setChatMessages, sendMessage, loadOlderMessages, hasMore, loadingMore, toggleReaction };
};

export default useConversationChat;
