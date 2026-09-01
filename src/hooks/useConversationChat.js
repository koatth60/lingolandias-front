import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
      setChatMessages(response.data);
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
      setChatMessages((prev) => [...response.data, ...prev]);
      setHasMore(response.data.length >= 50);
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, user?.id, chatMessages, loadingMore, hasMore]);

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

    const handleEdited = ({ messageId, newMessage }) => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, message: newMessage } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
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
    socket.on("chatError", handleChatError);

    return () => {
      socket.off("conversationMessage", handleMessage);
      socket.off("conversationMessageEdited", handleEdited);
      socket.off("conversationMessageDeleted", handleDeleted);
      socket.off("chatError", handleChatError);
    };
  }, [conversationId, socket, user?.name, fetchMessages]);

  const sendMessage = (message, replyTo, fileUrl) => {
    if (!conversationId || !socket || !socket.connected || !user) return;
    const timestamp = new Date();
    const optimistic = {
      _pending: true,
      id: `pending-${Date.now()}`,
      conversationId,
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
      conversationId,
      senderId: user.id,
      username: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      message,
      replyTo,
      fileUrl,
    });
  };

  return { chatMessages, setChatMessages, sendMessage, loadOlderMessages, hasMore, loadingMore };
};

export default useConversationChat;
