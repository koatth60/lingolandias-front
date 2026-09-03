import { useEffect, useRef, useState } from "react";
import { FiPlay, FiPause } from "react-icons/fi";

const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const BAR_COUNT = 32;
const FLAT_BARS = Array.from({ length: BAR_COUNT }, () => 0.35);

// One computation per URL, shared across every bubble showing the same
// voice note (re-renders, scrollback, etc.) instead of re-fetching/decoding
// each time.
const waveformCache = new Map();

const computeWaveform = (url) => {
  if (waveformCache.has(url)) return waveformCache.get(url);
  const promise = (async () => {
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const blockSize = Math.max(1, Math.floor(rawData.length / BAR_COUNT));
      const peaks = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        const start = i * blockSize;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) sum += Math.abs(rawData[start + j] || 0);
        peaks.push(sum / blockSize);
      }
      const max = Math.max(...peaks, 0.0001);
      ctx.close();
      return peaks.map((p) => Math.max(0.12, Math.min(1, p / max)));
    } catch {
      // CORS hiccup, a browser that blocks decode, whatever — fall back to
      // a flat bar pattern instead of an empty/broken player.
      return FLAT_BARS;
    }
  })();
  waveformCache.set(url, promise);
  return promise;
};

// `variant="voiceNote"` is the WhatsApp-style waveform pill for something
// actually recorded in the composer (see useVoiceRecorder) — no card, no
// filename, matches the bubble it's already sitting in. `variant="file"`
// (default) is the bordered card for a real audio FILE someone attached,
// keeping that visually distinct from a personal voice message.
const AudioPlayer = ({ src, variant = "file", isSender = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => { setIsPlaying(false); setCurrentTime(0); };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (variant !== "voiceNote") return;
    let cancelled = false;
    computeWaveform(src).then((peaks) => { if (!cancelled) setWaveform(peaks); });
    return () => { cancelled = true; };
  }, [variant, src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (variant === "voiceNote") {
    const bars = waveform || FLAT_BARS;
    const playedBars = Math.round((progress / 100) * BAR_COUNT);
    const playedColor = isSender ? "rgba(255,255,255,0.9)" : "#9E2FD0";
    const unplayedColor = isSender ? "rgba(255,255,255,0.32)" : "rgba(158,47,208,0.22)";
    return (
      <div className="flex items-center gap-2 min-w-[190px]">
        <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ background: isSender ? "rgba(255,255,255,0.22)" : "rgba(158,47,208,0.12)" }}
        >
          {isPlaying ? (
            <FiPause size={13} className={isSender ? "text-white" : "text-[#9E2FD0]"} />
          ) : (
            <FiPlay size={13} className={`ml-0.5 ${isSender ? "text-white" : "text-[#9E2FD0]"}`} />
          )}
        </button>
        <div onClick={handleSeek} className="flex-1 flex items-center gap-[2px] h-7 cursor-pointer">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-full pointer-events-none"
              style={{ height: `${Math.max(15, h * 100)}%`, minWidth: "2px", background: i < playedBars ? playedColor : unplayedColor }}
            />
          ))}
        </div>
        <span
          className="text-[10px] flex-shrink-0 tabular-nums"
          style={{ color: isSender ? "rgba(255,255,255,0.75)" : "#6b7280" }}
        >
          {formatTime(currentTime > 0 ? currentTime : duration)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white
                   transition-transform hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 6px rgba(158,47,208,0.35)" }}
      >
        {isPlaying ? <FiPause size={13} /> : <FiPlay size={13} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="relative h-1.5 rounded-full bg-[#9E2FD0]/15 dark:bg-white/10 cursor-pointer group"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full pointer-events-none"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #9E2FD0, #7b22a8)" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow
                       border border-[#9E2FD0]/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progress}% - 5px)` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
