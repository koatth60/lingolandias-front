// Caché en memoria de mensajes por conversación, compartido por
// useConversationChat.js — vive mientras la pestaña esté abierta (se pierde
// al recargar la página, eso es intencional, no persiste a disco). Da la
// sensación de "instantáneo" al reabrir un chat ya visitado en esta sesión,
// mientras la revalidación de fondo se encarga de traer cambios reales.
// LRU simple: al superar MAX_ENTRIES, se descarta el chat visitado hace
// más tiempo, para no crecer sin límite en sesiones largas.
const MAX_ENTRIES = 20;
const cache = new Map();

export const messageCache = {
  get(conversationId) {
    if (!conversationId) return undefined;
    const entry = cache.get(conversationId);
    if (!entry) return undefined;
    // Reinserta al final (más reciente) — hace del Map una LRU sencilla.
    cache.delete(conversationId);
    cache.set(conversationId, entry);
    return entry.messages;
  },

  set(conversationId, messages) {
    if (!conversationId) return;
    cache.delete(conversationId);
    cache.set(conversationId, { messages, fetchedAt: Date.now() });
    while (cache.size > MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
  },

  clear() {
    cache.clear();
  },
};
