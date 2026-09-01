import { useCallback, useRef } from "react";

// Loops a classic two-pulse "ring... ring..." pattern until stop() is
// called — same Web Audio approach as useNotificationSound (no external
// audio file needed), just repeating and a bit more attention-grabbing
// since this represents an actual incoming call, not a passive message ping.
const useRingtone = () => {
  const ctxRef = useRef(null);
  const intervalRef = useRef(null);

  const playPulse = useCallback((ctx) => {
    const now = ctx.currentTime;
    [0, 0.28].forEach((offset) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.22);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.24);
    });
  }, []);

  const start = useCallback(() => {
    try {
      if (ctxRef.current) return; // already ringing
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const begin = () => {
        playPulse(ctx);
        intervalRef.current = setInterval(() => playPulse(ctx), 2000);
      };
      if (ctx.state === "suspended") ctx.resume().then(begin).catch(() => {});
      else begin();
    } catch (_) {
      // AudioContext not available — silent fallback, banner still shows
    }
  }, [playPulse]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
  }, []);

  return { start, stop };
};

export default useRingtone;
