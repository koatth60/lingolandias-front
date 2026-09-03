// Caché de la lista de chats (Messages), por usuario — a diferencia de
// messageCache.js (mensajes de una conversación, que sí puede crecer mucho),
// esto es una lista corta de resúmenes (nombre, avatar, último mensaje,
// no-leídos) así que localStorage síncrono alcanza de sobra, sin necesidad
// de IndexedDB. Se lee de forma síncrona en el useState inicial de
// messages.jsx para pintar la lista al instante en vez de mostrar "sin
// mensajes" mientras el fetch real está en camino — el mismo patrón
// stale-while-revalidate que ya usa el caché de mensajes.
const STORAGE_PREFIX = "lingolandias-conversation-list:";

export const conversationListCache = {
  get(userId) {
    if (!userId) return undefined;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + userId);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      // Cuota llena, modo privado, JSON corrupto — degrada a "sin caché".
      return undefined;
    }
  },

  set(userId, conversations) {
    if (!userId) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(conversations));
    } catch {}
  },

  clear(userId) {
    try {
      if (userId) {
        localStorage.removeItem(STORAGE_PREFIX + userId);
      } else {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(STORAGE_PREFIX))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch {}
  },
};
