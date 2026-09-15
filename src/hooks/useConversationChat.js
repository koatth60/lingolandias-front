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

// Talks to the unified /conversations API + sendConversationMessage socket
// events instead of the legacy /chat + chat/globalChat pair (that whole
// legacy stack — useGlobalChat, useSocketManager, the old chatWindow.jsx —
// was deleted once confirmed dead: nothing rendered it any more). Used for
// every conversation type now (dm, group, general, teacher, support) since
// Fase 1 migrated them all into one model.
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

  // Confirmed by an incoming echo, cleared here; if the echo never arrives
  // (dropped emit, or the socket disconnects right after sending), the timer
  // itself flips the placeholder to _failed so it never hangs as "sending…"
  // forever.
  const pendingTimersRef = useRef(new Map());
  const clearPendingTimer = (tempId) => {
    const timer = pendingTimersRef.current.get(tempId);
    if (timer) {
      clearTimeout(timer);
      pendingTimersRef.current.delete(tempId);
    }
  };

  useEffect(() => {
    if (!socket || !conversationId || !user?.name) return;
    socket.emit("join", { username: user.name, room: conversationId });
    fetchMessages();

    // A dropped wifi connection means any message the other side sent while
    // we were offline was broadcast into the void — the live socket event
    // for it never reaches us and nothing else re-syncs afterward. Refetch
    // on every reconnect (not just the initial mount) to close that gap.
    const handleReconnect = () => {
      socket.emit("join", { username: user.name, room: conversationId });
      fetchMessages();
    };
    socket.on("connect", handleReconnect);

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
          clearPendingTimer(prev[idx].id);
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

    const handleChatError = ({ reason, messageId, tempId }) => {
      console.error("[conversation] Server rejected message:", reason, messageId || tempId || "");
      if (reason === "rate_limited") return;
      // 'not_allowed' refers to an edit/delete of an existing message, not to
      // anything pending.
      if (reason === "not_allowed") return;

      // chatError is one shared event name on one shared socket — every
      // handler in the gateway emits it (join, registerUser, supportChat,
      // this hook's own sendConversationMessage…), so this listener can
      // receive a rejection that has nothing to do with a message this
      // conversation sent. tempId is how sendConversationMessage's own
      // rejections identify themselves: every one of its chatError emissions
      // now carries the tempId of the exact optimistic message that
      // triggered it. Without a match here, the error belongs to some other
      // handler and none of this conversation's pending messages should move
      // — that used to fail everything pending on ANY chatError, so one
      // rejected message (or even an unrelated join/support-chat failure)
      // marked every other in-flight message as failed too.
      if (!tempId) return;
      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.id !== tempId || !m._pending) return m;
          clearPendingTimer(m.id);
          return { ...m, _pending: false, _failed: true };
        })
      );
    };

    socket.on("conversationMessage", handleMessage);
    socket.on("conversationMessageEdited", handleEdited);
    socket.on("conversationMessageDeleted", handleDeleted);
    socket.on("messageReactionUpdated", handleReactionUpdated);
    socket.on("chatError", handleChatError);

    return () => {
      // The server no longer evicts a socket from every other room on join
      // (that was breaking live delivery whenever two chat views were open at
      // once), so each view has to announce its own exit.
      socket.emit("leave", { room: conversationId });
      socket.off("connect", handleReconnect);
      socket.off("conversationMessage", handleMessage);
      socket.off("conversationMessageEdited", handleEdited);
      socket.off("conversationMessageDeleted", handleDeleted);
      socket.off("messageReactionUpdated", handleReactionUpdated);
      socket.off("chatError", handleChatError);
      pendingTimersRef.current.forEach(clearTimeout);
      pendingTimersRef.current.clear();
    };
  }, [conversationId, socket, user?.name, fetchMessages]);

  // targetId overrides the hook's own conversationId — needed for a draft DM
  // that doesn't have a real conversation yet when the user hits send (see
  // ChatWindowComponent's handleSendMessage).
  const sendMessage = (message, replyTo, fileUrl, targetId) => {
    const id = targetId || conversationId;
    if (!id || !user) return;
    const timestamp = new Date();
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Sin conexión, el emit ni siquiera sale — antes esto no hacía nada
    // visible y el mensaje escrito simplemente desaparecía. Ahora se muestra
    // igual, ya marcado como fallido, para que quede claro y se pueda
    // reintentar apenas vuelva la conexión.
    const offline = !socket || !socket.connected;
    const optimistic = {
      _pending: !offline,
      _failed: offline,
      id: tempId,
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
    if (offline) return;

    socket.emit("sendConversationMessage", {
      conversationId: id,
      senderId: user.id,
      username: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      message,
      replyTo,
      fileUrl,
      // Echoed back on chatError so a rejection can fail just this message —
      // see handleChatError below.
      tempId,
    });

    // No delivery ack exists on this event — if the server echo never comes
    // back (e.g. the connection drops between emit and broadcast) this is
    // the only thing that keeps a message from sitting as "sending…" forever.
    const timer = setTimeout(() => {
      setChatMessages((prev) =>
        prev.map((m) => (m.id === tempId && m._pending ? { ...m, _pending: false, _failed: true } : m))
      );
      pendingTimersRef.current.delete(tempId);
    }, 10000);
    pendingTimersRef.current.set(tempId, timer);
  };

  // Re-sends a message that ended up _failed (offline at send time, no ack
  // within the timeout, or a server chatError) — drops the old placeholder
  // and runs it back through sendMessage for a fresh attempt.
  const retryMessage = (tempId) => {
    const target = chatMessages.find((m) => m.id === tempId);
    if (!target) return;
    clearPendingTimer(tempId);
    setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
    sendMessage(target.message, target.replyTo, target.fileUrl, target.conversationId);
  };

  const toggleReaction = (messageId, emoji) => {
    if (!conversationId || !socket || !socket.connected) return;
    socket.emit("toggleReaction", { conversationId, messageId, emoji, userName: user?.name });
  };

  return { chatMessages, setChatMessages, sendMessage, retryMessage, loadOlderMessages, hasMore, loadingMore, toggleReaction, isLoading };
};

export default useConversationChat;
