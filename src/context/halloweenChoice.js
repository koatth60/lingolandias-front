// Per-account memory of what someone decided about the seasonal Halloween
// theme, so the invite and the "keep it?" follow-up each show at most once.
//   null       – never asked
//   "trying"   – tried it, hasn't answered the follow-up yet
//   "kept"     – keeps it for the rest of October
//   "declined" – said no (or went back); never ask again
export const choiceKey = (userId) => `ll-hw-choice-${userId}`;

export function readChoice(userId) {
  try {
    const v = localStorage.getItem(choiceKey(userId));
    return v === "trying" || v === "kept" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function writeChoice(userId, value) {
  try {
    localStorage.setItem(choiceKey(userId), value);
  } catch {
    // Private window / blocked storage — the prompt may reappear next visit.
  }
}

// Which dialog (if any) to open on sign-in.
export function nextPrompt({ seasonal, enabled, choice }) {
  if (!seasonal) return null;
  if (choice === "kept" || choice === "declined") return null;
  if (choice === "trying") return enabled ? "confirm" : "invite";
  // Never asked. Someone who already switched it on from Settings has answered.
  return enabled ? null : "invite";
}
