import { useEffect, useRef, useState } from "react";

// Chrome/Edge/Firefox record webm/opus; Safari records mp4/aac. Named ".weba"
// (not ".webm") when staged/sent — see AUDIO_EXTS comment in
// ChatWindowComponent.jsx for why: ".webm" already means "video" there.
const PREFERRED_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || "";
};

const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeTypeRef = useRef("");

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Resolves with the recorded File, or null (cancelled / nothing captured).
  const finishRecording = (discard) =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      clearInterval(timerRef.current);
      setIsRecording(false);
      if (!recorder || recorder.state === "inactive") {
        stopStream();
        mediaRecorderRef.current = null;
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        stopStream();
        mediaRecorderRef.current = null;
        if (discard || chunksRef.current.length === 0) { resolve(null); return; }
        const type = (mimeTypeRef.current || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type });
        const file = new File([blob], `nota-de-voz-${Date.now()}.weba`, { type });
        resolve(file);
      };
      recorder.stop();
    });

  // Returns { ok: true } or { ok: false, reason } directly instead of only
  // updating `error` state — a caller reading `error` right after awaiting
  // this would see the pre-call value, not this call's result, since a
  // state update inside here isn't visible in the caller's closure yet.
  const startRecording = async () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("unavailable");
      return { ok: false, reason: "unavailable" };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      // The mic getting yanked mid-recording (device unplugged, OS/browser
      // revokes access, another app takes it exclusively) fires this on the
      // track — discard and reset instead of leaving isRecording stuck true
      // against a dead stream that will never produce more data.
      stream.getAudioTracks()[0]?.addEventListener("ended", () => {
        if (mediaRecorderRef.current?.state !== "inactive") finishRecording(true);
      });
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return { ok: true };
    } catch (err) {
      const reason = err?.name === "NotAllowedError" ? "permission_denied" : "unavailable";
      setError(reason);
      return { ok: false, reason };
    }
  };

  const stopRecording = () => finishRecording(false);
  const cancelRecording = () => finishRecording(true);

  // Safety net for whoever holds this hook unmounting (navigating away,
  // closing the chat) while still recording — releases the mic regardless
  // of whether the component remembered to call cancelRecording itself.
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopStream();
    };
  }, []);

  return { isRecording, seconds, error, startRecording, stopRecording, cancelRecording };
};

export default useVoiceRecorder;
