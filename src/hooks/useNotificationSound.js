import { useCallback } from 'react';

// Generates a soft professional "ding" using the Web Audio API.
// No external file needed — clean sine wave with gentle fade-out.
const useNotificationSound = () => {
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      // Soft descending tone: 880 Hz → 660 Hz (A5 → E5)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);

      // Low volume, quick fade-out
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.45);
      oscillator.onended = () => ctx.close();
    } catch (_) {
      // AudioContext not available — silent fallback
    }
  }, []);

  return playSound;
};

export default useNotificationSound;
