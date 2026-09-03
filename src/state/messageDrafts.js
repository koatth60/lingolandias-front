// Per-conversation composer draft, persisted to localStorage so leaving a
// chat (switch conversation, close the tab, navigate elsewhere in the app)
// doesn't lose whatever was half-typed — same as WhatsApp Web.
const STORAGE_KEY = "lingo_message_drafts";

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

export const getDraft = (conversationId) => {
  if (!conversationId) return "";
  return readAll()[conversationId] || "";
};

export const setDraft = (conversationId, text) => {
  if (!conversationId) return;
  const all = readAll();
  if (text?.trim()) {
    all[conversationId] = text;
  } else {
    delete all[conversationId];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // storage full/unavailable — a lost draft isn't worth crashing over
  }
};
