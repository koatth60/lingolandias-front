import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { messageCache } from "../state/messageCache";

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
  const [isLoading, setIsLoading] = useState(false);
  const currentIdRef = useRef(conversationId);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const forId = conversationId;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/conversations/${conversationId}/messages`,
        { params: { userId: user?.id }, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const fresh = dedupeById(response.data);
      setChatMessages((prev) => {
        // Evita un re-render/parpadeo cuando el servidor devuelve exactamente
        // lo mismo que ya se estaba mostrando (típicamente desde caché) —
        // pero si hay un mensaje optimista sin confirmar, siempre se actualiza.
        if (!prev.some((m) => m._pending) && JSON.stringify(prev) === JSON.stringify(fresh)) return prev;
        return fresh;
      });
      setHasMore(response.data.length >= 50);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    } finally {
      // Solo el fetch de la conversación actualmente activa puede apagar el
      // loading — evita que una respuesta tardía de un chat que ya se
      // abandonó marque como "cargado" al chat nuevo que se está viendo.
      if (currentIdRef.current === forId) setIsLoading(false);
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
  // Shows the cached messages for this chat instantly (if we've visited it
  // already this session) instead of a blank/loading state — fetchMessages
  // below still always runs in the background to revalidate.
  useEffect(() => {
    currentIdRef.current = conversationId;
    const cached = messageCache.get(conversationId);
    if (cached) {
      setChatMessages(cached);
      setHasMore(true);
      setIsLoading(false);
      return;
    }
    setChatMessages([]);
    setHasMore(true);
    // Sin nada en memoria todavía no sabemos si el chat está realmente vacío
    // o solo no se ha cargado en esta sesión — isLoading distingue ambos
    // casos para no mostrar "no hay mensajes" mientras el primer fetch está
    // en vuelo.
    setIsLoading(!!conversationId);
    if (!conversationId) return;
    // Pestaña recién abierta (sin nada en memoria) — antes de que termine el
    // fetch de red de más abajo, intenta con lo que haya quedado guardado en
    // disco de una sesión anterior, para no mostrar spinner en frío en cada
    // reapertura del navegador.
    messageCache.getPersisted(user?.id, conversationId).then((persisted) => {
      if (currentIdRef.current !== conversationId) return; // ya cambió de chat
      if (persisted) {
        setChatMessages(persisted);
        setIsLoading(false);
      }
    });
  }, [conversationId, user?.id]);

  // Keeps the cache in sync with whatever's actually shown — covers fetches,
  // socket-driven edits/deletes/reactions, and the sender's own optimistic
  // send, all in one place instead of duplicating this in every handler.
  useEffect(() => {
    if (!conversationId) return;
    messageCache.set(conversationId, chatMessages, user?.id);
  }, [conversationId, chatMessages, user?.id]);

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

  return { chatMessages, setChatMessages, sendMessage, loadOlderMessages, hasMore, loadingMore, toggleReaction, isLoading };
};

export default useConversationChat;
