import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { messageCache } from "../state/messageCache";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAGE_SIZE = 50;

const dedupeById = (list) => {
  const seen = new Set();
  return list.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

// The echo of our own message: matched by the tempId the server now sends
// back, falling back to text + a timestamp window for an older server. The
// window alone failed whenever the device clock was off by more than 10s:
// the message showed twice, once as "Not sent", and Retry sent a copy.
const isEchoOf = (local, echo) =>
  (echo.clientTempId && local.id === echo.clientTempId) ||
  (!echo.clientTempId &&
    local.senderId === echo.senderId &&
    local.message === echo.message &&
    Math.abs(new Date(local.timestamp) - new Date(echo.timestamp)) < 10000);

// Folds a fresh first page from the server into what is already shown.
// Replacing the list outright (as before) dropped two things on every
// reconnect: messages still "sending" or marked "Not sent · Retry", which
// vanished as if they had been delivered, and older pages the user had
// loaded with "load more".
export const mergeFreshPage = (prev, fresh) => {
  const oldest = fresh[0];
  const olderKept =
    fresh.length >= PAGE_SIZE && oldest
      ? prev.filter((m) => !m._pending && !m._failed && new Date(m.timestamp) < new Date(oldest.timestamp))
      : [];
  const unsent = prev.filter((m) => (m._pending || m._failed) && !fresh.some((f) => isEchoOf(m, f)));
  return { messages: dedupeById([...olderKept, ...fresh, ...unsent]), keptOlder: olderKept.length > 0 };
};

const initialStore = (conversationId) => {
  const cached = messageCache.get(conversationId);
  return cached?.length
    ? { id: conversationId, messages: cached, source: "cache" }
    : { id: conversationId, messages: [], source: "none" };
};

// Talks to the unified /conversations API + sendConversationMessage socket
// events. Used for every conversation type (dm, group, general, teacher).
const useConversationChat = (socket, conversationId, user) => {
  // Messages are stored together with the conversation they belong to. With
  // a bare array, a slow response for the chat you just left landed in the
  // chat you had switched to, and the cache-sync effect then saved the old
  // chat's messages under the new chat's id (memory and IndexedDB), so they
  // showed up there again on the next visit. `source` records where the list
  // came from; only real data is ever written to the cache.
  const [store, setStore] = useState(() => initialStore(conversationId));
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(() => !!conversationId && !messageCache.get(conversationId)?.length);
  const currentIdRef = useRef(conversationId);

  // On the first render after a switch the store still holds the previous
  // chat. Show this chat's cached messages (or nothing) instead of flashing
  // the old ones; the effect below then moves the store over.
  const chatMessages = useMemo(
    () => (store.id === conversationId ? store.messages : messageCache.get(conversationId) || []),
    [store, conversationId],
  );

  // Applies an update only if the store still belongs to `forId`.
  const updateFor = useCallback((forId, updater, source) => {
    setStore((prev) => {
      if (prev.id !== forId) return prev;
      const next = typeof updater === "function" ? updater(prev.messages) : updater;
      const nextSource = source || (prev.source === "none" ? "local" : prev.source);
      if (next === prev.messages && nextSource === prev.source) return prev;
      return { id: forId, messages: next, source: nextSource };
    });
  }, []);

  // Public setter (edits, deletes, reactions from components): always
  // targets the conversation that is open right now.
  const setChatMessages = useCallback(
    (updater) => updateFor(currentIdRef.current, updater),
    [updateFor],
  );

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const forId = conversationId;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/conversations/${conversationId}/messages`,
        { params: { userId: user?.id }, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (currentIdRef.current !== forId) return; // the user moved on
      const fresh = dedupeById(response.data);
      let keptOlder = false;
      updateFor(
        forId,
        (prev) => {
          const merged = mergeFreshPage(prev, fresh);
          keptOlder = merged.keptOlder;
          // Evita un re-render/parpadeo cuando el servidor devuelve exactamente
          // lo mismo que ya se estaba mostrando (típicamente desde caché).
          return JSON.stringify(prev) === JSON.stringify(merged.messages) ? prev : merged.messages;
        },
        "network",
      );
      if (!keptOlder) setHasMore(response.data.length >= PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    } finally {
      // Solo el fetch de la conversación actualmente activa puede apagar el
      // loading — evita que una respuesta tardía de un chat que ya se
      // abandonó marque como "cargado" al chat nuevo que se está viendo.
      if (currentIdRef.current === forId) setIsLoading(false);
    }
  }, [conversationId, user?.id, updateFor]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingMore || !hasMore || !chatMessages.length) return;
    const forId = conversationId;
    setLoadingMore(true);
    try {
      const token = localStorage.getItem("token");
      const oldest = chatMessages.find((m) => !m._pending && !m._failed) || chatMessages[0];
      const response = await axios.get(
        `${BACKEND_URL}/conversations/${conversationId}/messages`,
        { params: { userId: user?.id, before: oldest.id }, headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (currentIdRef.current !== forId) return;
      updateFor(forId, (prev) => dedupeById([...response.data, ...prev]));
      setHasMore(response.data.length >= PAGE_SIZE);
    } catch (error) {
      console.error("Error loading older messages:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, user?.id, chatMessages, loadingMore, hasMore, updateFor]);

  // Runs on every conversationId change, including into a draft DM's `null`
  // (see ChatWindowComponent). Shows the cached messages for this chat
  // instantly (if we've visited it already this session) instead of a
  // blank/loading state — fetchMessages below still always runs in the
  // background to revalidate.
  useEffect(() => {
    currentIdRef.current = conversationId;
    const cached = messageCache.get(conversationId);
    // An empty cached list used to count as a hit, which skipped IndexedDB
    // and showed "no messages" until the network answered.
    if (cached?.length) {
      setStore((prev) => (prev.id === conversationId ? prev : { id: conversationId, messages: cached, source: "cache" }));
      setHasMore(true);
      setIsLoading(false);
      return;
    }
    setStore((prev) => (prev.id === conversationId ? prev : { id: conversationId, messages: [], source: "none" }));
    setHasMore(true);
    // Sin nada en memoria todavía no sabemos si el chat está realmente vacío
    // o solo no se ha cargado en esta sesión — isLoading distingue ambos
    // casos para no mostrar "no hay mensajes" mientras el primer fetch está
    // en vuelo.
    setIsLoading(!!conversationId);
    if (!conversationId) return;
    // Pestaña recién abierta (sin nada en memoria) — antes de que termine el
    // fetch de red, intenta con lo que haya quedado guardado en disco de una
    // sesión anterior, para no mostrar spinner en frío en cada reapertura.
    messageCache.getPersisted(user?.id, conversationId).then((persisted) => {
      if (currentIdRef.current !== conversationId) return; // ya cambió de chat
      if (!persisted?.length) return;
      // Only fills an empty view: if the network (or a send) already put
      // real data here, the older disk copy must not overwrite it.
      setStore((prev) =>
        prev.id === conversationId && prev.source === "none"
          ? { id: conversationId, messages: persisted, source: "persisted" }
          : prev,
      );
      setIsLoading(false);
    });
  }, [conversationId, user?.id]);

  // Keeps the cache in sync with whatever's actually shown — covers fetches,
  // socket-driven edits/deletes/reactions, and the sender's own optimistic
  // send, all in one place. Never writes before real data exists, and never
  // under an id the messages don't belong to.
  useEffect(() => {
    if (!store.id || store.source === "none") return;
    messageCache.set(store.id, store.messages, user?.id);
  }, [store, user?.id]);

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
      // eslint-disable-next-line no-unused-vars
      const { clientTempId, ...message } = data;
      updateFor(conversationId, (prev) => {
        const idx = prev.findIndex((m) => (m._pending || m._failed) && isEchoOf(m, data));
        if (idx !== -1) {
          clearPendingTimer(prev[idx].id);
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const handleEdited = ({ messageId, newMessage, editedAt }) => {
      updateFor(conversationId, (prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, message: newMessage, editedAt } : m))
      );
    };

    const handleDeleted = ({ messageId }) => {
      updateFor(conversationId, (prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleReactionUpdated = ({ conversationId: cid, messageId, reactions }) => {
      if (cid !== conversationId) return;
      updateFor(conversationId, (prev) =>
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
      // handler in the gateway emits it, so this listener can receive a
      // rejection that has nothing to do with a message this conversation
      // sent. tempId is how sendConversationMessage's own rejections identify
      // themselves; without a match the error belongs to some other handler
      // and none of this conversation's pending messages should move.
      if (!tempId) return;
      updateFor(conversationId, (prev) =>
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

    const timers = pendingTimersRef.current;
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
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [conversationId, socket, user?.name, fetchMessages, updateFor]);

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
    const viewId = currentIdRef.current;
    updateFor(viewId, (prev) => [...prev, optimistic]);
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
      // Echoed back on chatError, and now on the broadcast itself, so the
      // placeholder is matched exactly — see isEchoOf and handleChatError.
      tempId,
    });

    // No delivery ack exists on this event — if the server echo never comes
    // back (e.g. the connection drops between emit and broadcast) this is
    // the only thing that keeps a message from sitting as "sending…" forever.
    const timer = setTimeout(() => {
      updateFor(viewId, (prev) =>
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
