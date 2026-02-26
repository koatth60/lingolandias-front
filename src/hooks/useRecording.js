import { useEffect, useRef, useState } from "react";
import { useUpload } from "../context/UploadContext";

/**
 * Handles class recording:
 *  - Captures the Jitsi tab (video + other participants' audio) via getDisplayMedia
 *  - Captures the teacher's own microphone via getUserMedia
 *  - Mixes both audio tracks with Web Audio API
 *  - Records with MediaRecorder (WebM/VP9)
 *  - Uploads the blob to /upload/recording → Google Drive
 */
const useRecording = ({ userName, roomId, role, email, studentName }) => {
  const { startUpload } = useUpload();

  const isRecordingRef = useRef(false); // ref so Jitsi event-listener closure always sees current value
  const mediaRef       = useRef(null);  // { recorder, displayStream, micStream, audioContext }
  const timerRef       = useRef(null);

  const [isRecording,      setIsRecording]      = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Clean up on unmount without uploading
  useEffect(() => {
    return () => cleanup(false);
  }, []);

  /* ── internal helpers ────────────────────────────────── */

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  /**
   * Stop all tracks and optionally trigger the upload.
   * @param {boolean} shouldUpload - true = stop recorder normally (fires onstop → upload)
   */
  const cleanup = (shouldUpload = true) => {
    clearInterval(timerRef.current);
    timerRef.current = null;

    if (mediaRef.current) {
      const { recorder, displayStream, micStream, audioContext } = mediaRef.current;

      if (recorder && recorder.state !== "inactive") {
        if (shouldUpload) {
          recorder.stop(); // onstop fires → blob is built → uploadRecording()
        } else {
          // Silence the callbacks so nothing is uploaded
          recorder.ondataavailable = null;
          recorder.onstop = null;
          recorder.stop();
          displayStream?.getTracks().forEach((t) => t.stop());
          micStream?.getTracks().forEach((t) => t.stop());
          audioContext?.close();
        }
      }
      mediaRef.current = null;
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const uploadRecording = (blob) => {
    const date         = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const teacherFirst = (userName || "Teacher").split(" ")[0];
    const studentFirst = (studentName || "").split(" ")[0];
    const filename =
      role === "admin"
        ? `Room_${roomId}_${date}.webm`
        : studentFirst
        ? `${teacherFirst}_${studentFirst}_${date}.webm`
        : `${teacherFirst}_${date}.webm`;

    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("teacherName", userName || "");
    formData.append("teacherEmail", email || "");
    formData.append("roomId", roomId || "");
    formData.append("role", role || "teacher");

    // Hand off to global context — survives component unmount & parallel uploads
    startUpload(formData, filename);
  };

  /* ── public API ──────────────────────────────────────── */

  const startRecording = async () => {
    try {
      // 1. Capture the Jitsi tab: video + other participants' mixed audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1920, height: 1080, frameRate: 30 },
        audio: true,
      });

      // 2. Capture the teacher's own microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Mix tab audio + mic audio into a single audio track
      const audioContext = new AudioContext();
      const destination  = audioContext.createMediaStreamDestination();

      if (displayStream.getAudioTracks().length > 0) {
        const tabSource = audioContext.createMediaStreamSource(
          new MediaStream(displayStream.getAudioTracks())
        );
        tabSource.connect(destination);
      }

      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      // 4. Combine video track + blended audio track
      const combined = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      // 5. Create the recorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const chunks   = [];
      const recorder = new MediaRecorder(combined, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        displayStream.getTracks().forEach((t) => t.stop());
        micStream.getTracks().forEach((t) => t.stop());
        audioContext.close();
        const blob = new Blob(chunks, { type: "video/webm" });
        uploadRecording(blob);
      };

      // If the teacher manually stops screen share from the browser's native bar
      displayStream.getVideoTracks()[0].onended = () => cleanup(true);

      recorder.start(1000); // collect a chunk every second
      mediaRef.current = { recorder, displayStream, micStream, audioContext };

      // 6. Start the elapsed-time counter
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);

      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (err) {
      if (err.name === "NotAllowedError") return; // user cancelled screen-share dialog

      console.error("Failed to start recording:", err);
      Swal.fire({
        title: "Recording Error",
        text: "Could not start recording. Make sure you grant screen-share permission.",
        icon: "error",
        background: "#1a1a2e",
        color: "#fff",
        confirmButtonColor: "#9E2FD0",
      });
    }
  };

  const stopRecording = () => cleanup(true);

  /**
   * Toggles recording — call this from the Jitsi toolbar button handler.
   * Uses isRecordingRef so it works correctly inside stale closures.
   */
  const toggleRecording = () => {
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isRecordingRef,   // expose ref for use inside Jitsi event-listener closures
    recordingSeconds,
    formatTime,
    toggleRecording,
    stopRecording,
  };
};

export default useRecording;
