// Caché de mensajes por conversación, usado por useConversationChat.js.
// Dos capas:
//   L1 — Map en memoria: instantáneo, vive mientras la pestaña esté abierta.
//   L2 — IndexedDB: persiste a disco, sobrevive cerrar/reabrir el navegador.
// Ambas alimentan el mismo patrón "stale-while-revalidate": se muestra lo
// cacheado al instante, y fetchMessages en useConversationChat siempre
// revalida contra el servidor de fondo — nunca se confía en el caché como
// fuente de verdad, solo como algo que mostrar mientras llega lo real.
//
// Las claves de L2 incluyen el userId: en un computador compartido, si el
// usuario A no cierra sesión correctamente y el usuario B entra después, los
// mensajes de A nunca deberían aparecer ni por un instante en la pantalla de
// B. logout() en navbar.jsx además borra el store entero como refuerzo.
const MAX_ENTRIES = 20; // L1 (memoria)
const MAX_PERSISTED = 50; // L2 (disco)
const DB_NAME = "lingolandias-chat-cache";
const STORE_NAME = "conversations";
const DB_VERSION = 1;

const cache = new Map();

let dbPromise = null;
const openDb = () => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("lastAccessed", "lastAccessed");
      }
    };
    req.onsuccess = () => resolve(req.result);
    // Cualquier fallo (modo privado con IndexedDB deshabilitado, cuota
    // llena, etc.) degrada silenciosamente a "sin caché de disco" — la app
    // sigue funcionando igual, solo sin el beneficio de sobrevivir un reload.
    req.onerror = () => resolve(null);
  });
  return dbPromise;
};

const keyFor = (userId, conversationId) => `${userId || "anon"}:${conversationId}`;

const evictOldestIfNeeded = (db) => {
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const countReq = store.count();
  countReq.onsuccess = () => {
    let excess = countReq.result - MAX_PERSISTED;
    if (excess <= 0) return;
    const cursorReq = store.index("lastAccessed").openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor || excess <= 0) return;
      cursor.delete();
      excess -= 1;
      cursor.continue();
    };
  };
};

export const messageCache = {
  // L1 síncrono — comportamiento sin cambios para quien ya lo usaba así.
  get(conversationId) {
    if (!conversationId) return undefined;
    const entry = cache.get(conversationId);
    if (!entry) return undefined;
    // Reinserta al final (más reciente) — hace del Map una LRU sencilla.
    cache.delete(conversationId);
    cache.set(conversationId, entry);
    return entry.messages;
  },

  set(conversationId, messages, userId) {
    if (!conversationId) return;
    cache.delete(conversationId);
    cache.set(conversationId, { messages, fetchedAt: Date.now() });
    while (cache.size > MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    // Persistencia a disco en segundo plano — nunca bloquea el hilo de UI ni
    // el flujo normal si IndexedDB falla o no está disponible.
    openDb().then((db) => {
      if (!db) return;
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({
        key: keyFor(userId, conversationId),
        messages,
        lastAccessed: Date.now(),
      });
      tx.oncomplete = () => evictOldestIfNeeded(db);
    });
  },

  // L2 asíncrono — respaldo para cuando la memoria ya se perdió
  // (recarga/cierre de pestaña) pero sí hay algo guardado en disco de una
  // sesión anterior. Devuelve undefined si nunca se guardó nada para esta
  // combinación de usuario+conversación.
  async getPersisted(userId, conversationId) {
    if (!conversationId) return undefined;
    const db = await openDb();
    if (!db) return undefined;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(keyFor(userId, conversationId));
      req.onsuccess = () => resolve(req.result?.messages);
      req.onerror = () => resolve(undefined);
    });
  },

  clear() {
    cache.clear();
    openDb().then((db) => {
      if (!db) return;
      db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear();
    });
  },
};
