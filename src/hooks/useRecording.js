import { useEffect, useRef, useState } from "react";

/**
 * Recording now uses Jitsi's own server-side recorder (Jibri) instead of the
 * client-side screen-capture hack below — Jibri joins the conference itself
 * and records the real composited audio/video of every participant, so
 * recording completeness no longer depends on the recorder's browser/OS or
 * which option they pick in a native screen-share dialog (that's exactly why
 * the old approach silently produced recordings with only the local mic and
 * no other participants whenever "tab audio" capture wasn't available/selected
 * — see OLD_IMPLEMENTATION at the bottom of this file, kept for reference).
 */
const useRecording = ({ apiRef }) => {
  const isRecordingRef = useRef(false); // ref so Jitsi event-listener closures always see the current value
  const timerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Jibri takes a couple of seconds to actually spin up/tear down — this fires
  // once the conference confirms recording is really on (or off), and also
  // fires with on:false + an error code if Jibri failed to start (e.g. busy,
  // or the caller wasn't a moderator).
  const handleRecordingStatusChanged = ({ on, error }) => {
    isRecordingRef.current = on;
    setIsRecording(on);
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (on) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
      if (error) console.error("Jibri recording error:", error);
    }
  };

  const startRecording = () => {
    apiRef.current?.executeCommand("startRecording", { mode: "file" });
  };

  const stopRecording = () => {
    apiRef.current?.executeCommand("stopRecording", "file");
  };

  const toggleRecording = () => {
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isRecordingRef,
    recordingSeconds,
    formatTime,
    toggleRecording,
    stopRecording,
    // JitsiClassRoom must wire this to the "recordingStatusChanged" Jitsi event
    handleRecordingStatusChanged,
  };
};

export default useRecording;

/* ============================================================================
 * OLD_IMPLEMENTATION — client-side screen-capture recording (kept for
 * reference / rollback only, not imported or used anywhere).
 *
 * Root cause of "you can hear the recorder but not other participants":
 * this depended on getDisplayMedia({audio:true}) picking up the other
 * participants' audio via "tab audio" capture. That only works if the
 * person recording selects the exact right option in the browser's native
 * screen-share picker (specifically "Chrome Tab", not "Window" or "Entire
 * Screen") — on macOS only "Chrome Tab" supports audio capture at all, and
 * Safari doesn't support it under any option. The code below never verified
 * displayStream.getAudioTracks().length before proceeding, so it silently
 * recorded mic-only audio whenever tab-audio capture failed.
 *
 * import { useUpload } from "../context/UploadContext";
 *
 * const useRecordingOld = ({ userName, roomId, role, email, studentName }) => {
 *   const { startUpload } = useUpload();
 *
 *   const isRecordingRef = useRef(false);
 *   const mediaRef       = useRef(null);
 *   const timerRef       = useRef(null);
 *
 *   const [isRecording,      setIsRecording]      = useState(false);
 *   const [recordingSeconds, setRecordingSeconds] = useState(0);
 *
 *   useEffect(() => {
 *     return () => cleanup(false);
 *   }, []);
 *
 *   const formatTime = (secs) => {
 *     const h = Math.floor(secs / 3600).toString().padStart(2, "0");
 *     const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
 *     const s = (secs % 60).toString().padStart(2, "0");
 *     return `${h}:${m}:${s}`;
 *   };
 *
 *   const cleanup = (shouldUpload = true) => {
 *     clearInterval(timerRef.current);
 *     timerRef.current = null;
 *
 *     if (mediaRef.current) {
 *       const { recorder, displayStream, micStream, audioContext } = mediaRef.current;
 *
 *       if (recorder && recorder.state !== "inactive") {
 *         if (shouldUpload) {
 *           recorder.stop();
 *         } else {
 *           recorder.ondataavailable = null;
 *           recorder.onstop = null;
 *           recorder.stop();
 *           displayStream?.getTracks().forEach((t) => t.stop());
 *           micStream?.getTracks().forEach((t) => t.stop());
 *           audioContext?.close();
 *         }
 *       }
 *       mediaRef.current = null;
 *     }
 *
 *     isRecordingRef.current = false;
 *     setIsRecording(false);
 *     setRecordingSeconds(0);
 *   };
 *
 *   const uploadRecording = (blob) => {
 *     const date         = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
 *     const teacherFirst = (userName || "Teacher").split(" ")[0];
 *     const studentFirst = (studentName || "").split(" ")[0];
 *     const filename =
 *       role === "admin"
 *         ? `Room_${roomId}_${date}.webm`
 *         : studentFirst
 *         ? `${teacherFirst}_${studentFirst}_${date}.webm`
 *         : `${teacherFirst}_${date}.webm`;
 *
 *     const formData = new FormData();
 *     formData.append("file", blob, filename);
 *     formData.append("teacherName", userName || "");
 *     formData.append("teacherEmail", email || "");
 *     formData.append("roomId", roomId || "");
 *     formData.append("role", role || "teacher");
 *
 *     startUpload(formData, filename);
 *   };
 *
 *   const startRecording = async () => {
 *     try {
 *       const displayStream = await navigator.mediaDevices.getDisplayMedia({
 *         video: { width: 1920, height: 1080, frameRate: 30 },
 *         audio: true,
 *       });
 *
 *       const micStream = await navigator.mediaDevices.getUserMedia({
 *         audio: {
 *           echoCancellation: true,
 *           noiseSuppression: true,
 *           autoGainControl: true,
 *         },
 *       });
 *
 *       const audioContext = new AudioContext();
 *       const destination  = audioContext.createMediaStreamDestination();
 *
 *       if (displayStream.getAudioTracks().length > 0) {
 *         const tabSource = audioContext.createMediaStreamSource(
 *           new MediaStream(displayStream.getAudioTracks())
 *         );
 *         tabSource.connect(destination);
 *       }
 *
 *       const micSource = audioContext.createMediaStreamSource(micStream);
 *       micSource.connect(destination);
 *
 *       const combined = new MediaStream([
 *         ...displayStream.getVideoTracks(),
 *         ...destination.stream.getAudioTracks(),
 *       ]);
 *
 *       const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
 *         ? "video/webm;codecs=vp9,opus"
 *         : "video/webm";
 *
 *       const chunks   = [];
 *       const recorder = new MediaRecorder(combined, { mimeType });
 *
 *       recorder.ondataavailable = (e) => {
 *         if (e.data.size > 0) chunks.push(e.data);
 *       };
 *
 *       recorder.onstop = () => {
 *         displayStream.getTracks().forEach((t) => t.stop());
 *         micStream.getTracks().forEach((t) => t.stop());
 *         audioContext.close();
 *         const blob = new Blob(chunks, { type: "video/webm" });
 *         uploadRecording(blob);
 *       };
 *
 *       displayStream.getVideoTracks()[0].onended = () => cleanup(true);
 *
 *       recorder.start(1000);
 *       mediaRef.current = { recorder, displayStream, micStream, audioContext };
 *
 *       setRecordingSeconds(0);
 *       timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
 *
 *       isRecordingRef.current = true;
 *       setIsRecording(true);
 *     } catch (err) {
 *       if (err.name === "NotAllowedError") return;
 *
 *       console.error("Failed to start recording:", err);
 *       Swal.fire({
 *         title: "Recording Error",
 *         text: "Could not start recording. Make sure you grant screen-share permission.",
 *         icon: "error",
 *         background: "#1a1a2e",
 *         color: "#fff",
 *         confirmButtonColor: "#9E2FD0",
 *       });
 *     }
 *   };
 *
 *   const stopRecording = () => cleanup(true);
 *
 *   const toggleRecording = () => {
 *     if (isRecordingRef.current) {
 *       stopRecording();
 *     } else {
 *       startRecording();
 *     }
 *   };
 *
 *   return {
 *     isRecording,
 *     isRecordingRef,
 *     recordingSeconds,
 *     formatTime,
 *     toggleRecording,
 *     stopRecording,
 *   };
 * };
 * ==========================================================================*/
