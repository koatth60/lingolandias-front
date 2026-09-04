import { useEffect, useRef, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ChatWindow from "../messages/chatWindow";
import CallChatWindow from "../messages/CallChatWindow";
import { useSelector } from "react-redux";
import useRecording from "../../hooks/useRecording";
import { teacherChats, CALL_RING_TIMEOUT_MS } from "../../constants";
import { socket } from "../../socket";
import { selectUnreadForConversation } from "../../redux/notificationsSlice";

// lingo-chat: a genuine Jitsi customToolbarButtons entry — rendered natively
// INSIDE Jitsi's own toolbar, so it gets perfect spacing/centering for free
// (participates in Jitsi's own flex layout, recenters correctly when the
// chat panel opens/closes, exactly like microphone/camera/hangup do).
// Static icon, no badge baked in — confirmed by reading the deployed
// app.bundle.min.js directly that customToolbarButtons' icon is only
// re-readable live behind a feature gate (`ot()`) our self-hosted deployment
// doesn't pass; executeCommand("overwriteConfig", …) reaches Jitsi and is
// silently dropped for this specific key. The badge is a separate, tiny,
// click-through overlay drawn on top of this button from our own page (see
// the render below) — NOT a replacement button, so lingo-chat's own spacing
// and click handling stay 100% native.
const CHAT_ICON = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>'
)}`;

const RECORD_ICON = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="white" stroke="none"/></svg>'
)}`;

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || "jitsi.lingolandias.com";
const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL;
const IS_MOBILE    = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// Known-harmless internal Jitsi log lines that fire on every call regardless of outcome —
// excluded so they don't drown out real problems in the meeting-logs admin view.
// - "conference.destroyed": normal teardown message on every hangup, not a dropped call
// - "get STUN/TURN credentials" / "getting turn credentials failed": XMPP service-discovery
//   for TURN servers isn't configured on our XMPP server, but we already hardcode TURN_SERVERS
//   below, so ICE negotiation doesn't depend on this succeeding
const BENIGN_LOG_PATTERNS = [
  "conference.destroyed",
  "getting turn credentials failed",
  "get STUN/TURN credentials",
];

// Jitsi doesn't always fire the dedicated cameraError/micError events when the
// browser denies both audio+video at once — these are the raw internal log
// lines that actually show up in that case, so we watch for them too.
// NOTE: bare "NotAllowedError" used to be in this list and caused false
// positives — that string also shows up on every iOS session for things with
// nothing to do with camera/mic access (Screen Wake Lock API denied, remote
// audio blocked by autoplay policy, setSinkId needing a user gesture), which
// showed the "blocked" overlay on perfectly working sessions. Only match
// patterns that are specific to actual local track/device acquisition failing.
const MEDIA_DENIED_PATTERNS = [
  "gum.permission_denied",
  "Permission dismissed",
  "Failed to create local tracks",
];

// The 3 fixed "Teachers Meeting" rooms (see constants/index.js + schedule.jsx's
// handleJoinMeeting) can have several admins and teachers in the same call — in
// those specific rooms, recording should always end up controlled by one of these
// 3 admins, by priority, not whoever happens to join first.
const TEACHER_MEETING_ROOM_IDS = Object.values(teacherChats).map((c) => c.id);
const ADMIN_RECORDER_PRIORITY = ["Agati", "Anna", "Carlos"]; // lower index = higher priority

// Matches by first-name prefix — admin recorder displayNames get a "(Admin)" suffix
// appended below specifically so two people who happen to share a first name (there
// are two "Carlos" accounts — one admin, one teacher) can't be confused for this check.
const getRecorderPriority = (displayName) => {
  const idx = ADMIN_RECORDER_PRIORITY.findIndex(
    (name) => (displayName || "").startsWith(`${name} (Admin)`),
  );
  return idx === -1 ? Infinity : idx;
};

const JitsiClassRoom = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.user.userInfo.user);

  // A push notification's notificationclick can only open a URL (see
  // sw.js), not React Router state — so a call accepted that way lands
  // here with query params instead. Falls back to those only when there's
  // no real location.state at all (a genuine fresh navigation from the
  // notification, not e.g. a reload of an in-app join).
  const pushConversationId = searchParams.get("conversationId");
  const stateFromPush = !location.state && pushConversationId ? {
    roomId: pushConversationId,
    chatRoomId: pushConversationId,
    userName: user?.name,
    email: user?.email,
    chatName: searchParams.get("chatName") || undefined,
    chatType: searchParams.get("chatType") || "private",
    otherUserId: searchParams.get("callerId") || undefined,
  } : null;

  const { userName, roomId, chatRoomId, chatName, email, chatType, otherUserId, observer } = location.state || stateFromPush || {};
  // Drives the small click-through badge overlaid on top of lingo-chat's
  // native icon (see the render below) — the native icon itself is static.
  const chatUnreadCount = useSelector(selectUnreadForConversation(chatRoomId || roomId));
  const domain = JITSI_DOMAIN;
  const isTeacherMeetingRoom = TEACHER_MEETING_ROOM_IDS.includes(roomId);
  // Tag the 3 priority admins' displayName so other clients in the room can identify
  // them unambiguously (see getRecorderPriority above) — cosmetically it also just
  // shows everyone else in the meeting who the admins are.
  const displayNameForJitsi =
    isTeacherMeetingRoom && user?.role === "admin" && ADMIN_RECORDER_PRIORITY.includes(userName)
      ? `${userName} (Admin)`
      : userName;

  const apiRef          = useRef(null);
  const showChatRef     = useRef(false);
  const sessionIdRef    = useRef(null);
  const sessionStartRef = useRef(null);
  const heartbeatRef    = useRef(null);
  const loadTimeoutRef  = useRef(null);
  const joinTimeoutRef  = useRef(null);
  const localParticipantIdRef = useRef(null);
  const isLocalModeratorRef   = useRef(false);
  const callStartedNotifiedRef = useRef(false);
  const missedCallTimeoutRef   = useRef(null);

  // Auto-repair for legacy 1:1 classes: roomId here is the student's own
  // userId by convention, but that only had a real Conversation behind it if
  // the student had already used the old chat before the unified-messages
  // migration — otherwise every message sent in this class's chat was
  // silently rejected (not a real member of a conversation that never
  // existed), which looked like "I type and it just disappears." This makes
  // sure the conversation (and both members) exist before the chat is used,
  // without touching anything for classes that already work fine.
  useEffect(() => {
    if (!user?.id || !roomId || !otherUserId) return;
    if (chatType !== "private" && chatType !== "dm") return;
    // An admin joining to observe from the dashboard is never one of the two
    // real participants — forcing them into this conversation's membership
    // would corrupt the actual teacher/student DM.
    if (user.role === "admin") return;
    fetch(`${BACKEND_URL}/conversations/dm/ensure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: roomId, userId: user.id, otherUserId }),
    }).catch((err) => console.error("Error ensuring DM conversation exists:", err));
  }, [user?.id, roomId, otherUserId, chatType]);

  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  // The chat toggle in the toolbar above is one of Jitsi's own
  // customToolbarButtons — it renders INSIDE the Jitsi iframe, so there's no
  // way to overlay a live unread badge directly on it (cross-origin, not our
  // DOM). This toast is the substitute: a small "new message" pill rendered
  // by us, on our own page, that appears while the chat panel is closed and
  // opens it on click — same information a badge would give, without
  // depending on iframe internals we don't control.
  const [messageToast, setMessageToast] = useState(null);
  const messageToastTimeoutRef = useRef(null);

  // Server only emits this to members other than the sender — see
  // NotificationsListener, which handles the badge/sound for every OTHER
  // page. This is the call-page-specific piece: a toast for messages in
  // THIS call's own conversation, shown only while its chat panel is closed
  // (CallChatWindow's own activeRoomRef effect already covers "panel open").
  useEffect(() => {
    const room = chatRoomId || roomId;
    if (!room) return;
    const handleNewMessage = (data) => {
      if (data?.conversationId !== room || showChatRef.current) return;
      setMessageToast({ sender: data.sender, preview: data.preview });
      clearTimeout(messageToastTimeoutRef.current);
      messageToastTimeoutRef.current = setTimeout(() => setMessageToast(null), 6000);
    };
    socket.on("newConversationMessage", handleNewMessage);
    return () => {
      socket.off("newConversationMessage", handleNewMessage);
      clearTimeout(messageToastTimeoutRef.current);
    };
  }, [chatRoomId, roomId]);

  const openChatFromToast = () => {
    setMessageToast(null);
    clearTimeout(messageToastTimeoutRef.current);
    showChatRef.current = true;
    setShowChat(true);
  };

  const [loading,  setLoading]  = useState(true);
  const [loadStuck, setLoadStuck] = useState(false);
  const [mediaBlocked, setMediaBlocked] = useState(false);
  const [joinStuck, setJoinStuck] = useState(false);
  // Probe camera/mic access ourselves before Jitsi ever tries — if we join
  // with startWithAudioMuted/VideoMuted: false and the browser denies both
  // (incognito, device already in use elsewhere, etc.), Jitsi's own
  // getUserMedia call can fail hard enough to crash its bootstrap entirely
  // ("Something went wrong loading the meeting", not even our own error
  // overlay). Telling it up front to join muted avoids that path — users can
  // still enable camera/mic afterwards via Jitsi's own toolbar.
  const [mediaPreflight, setMediaPreflight] = useState(null);
  useEffect(() => {
    let cancelled = false;

    const probeWithGetUserMedia = () => {
      navigator.mediaDevices?.getUserMedia?.({ audio: true, video: true })
        .then((stream) => {
          stream.getTracks().forEach((t) => t.stop());
          if (!cancelled) setMediaPreflight({ audio: true, video: true });
        })
        .catch(() => {
          if (cancelled) return;
          // Audio and video permissions are granted/denied together in most
          // browsers, but check independently in case only one device is busy.
          navigator.mediaDevices?.getUserMedia?.({ audio: true })
            .then((s) => { s.getTracks().forEach((t) => t.stop()); if (!cancelled) setMediaPreflight((p) => ({ ...p, audio: true, video: false })); })
            .catch(() => { if (!cancelled) setMediaPreflight((p) => ({ ...p, audio: false, video: false })); });
        });
    };

    // Checking the Permissions API first (when supported) avoids opening a
    // real camera/mic stream just to close it again right before Jitsi opens
    // its own — that back-to-back open/close raced on some devices (camera
    // not released yet) and showed the "blocked" overlay even though access
    // was actually granted. Only fall back to a real getUserMedia probe when
    // the permission state is still undecided ('prompt') or the browser
    // doesn't support querying camera/microphone this way (older Safari).
    if (navigator.permissions?.query) {
      Promise.allSettled([
        navigator.permissions.query({ name: "camera" }),
        navigator.permissions.query({ name: "microphone" }),
      ])
        .then(([cam, mic]) => {
          if (cancelled) return;
          const camState = cam.status === "fulfilled" ? cam.value.state : "prompt";
          const micState = mic.status === "fulfilled" ? mic.value.state : "prompt";
          if (camState === "prompt" || micState === "prompt") {
            probeWithGetUserMedia();
            return;
          }
          setMediaPreflight({ audio: micState === "granted", video: camState === "granted" });
        })
        .catch(probeWithGetUserMedia);
    } else {
      probeWithGetUserMedia();
    }

    return () => { cancelled = true; };
  }, []);

  // 1:1 class chat used to run entirely on the old, pre-migration chats
  // table (see legacy ChatWindow below) — completely disconnected from the
  // unified conversation a student and teacher already share in Messages.
  // roomId here already follows the same convention Fase 1's migration used
  // for that conversation's id (the student's own userId), so it's reused
  // directly below instead of re-resolving it — an earlier version of this
  // fix called POST /conversations/dm with a separately-computed
  // otherUserId, which could land on a different (or brand-new) conversation
  // than the one roomId already points to, splitting history between the
  // Schedule-join and Messages-join entry points.

  const logEvent = (event, detail, level = "info") => {
    fetch(`${BACKEND_URL}/meeting-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        userId: user?.id,
        userName,
        email,
        role: user?.role,
        event,
        level,
        detail: typeof detail === "string" ? detail : JSON.stringify(detail || {}),
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  };
  const {
    isRecording,
    isRecordingRef,
    recordingSeconds,
    formatTime,
    toggleRecording,
    stopRecording,
    handleRecordingStatusChanged,
  } = useRecording({ apiRef });

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("displayName", displayNameForJitsi);
    }
  }, [displayNameForJitsi]);

  // Log the join attempt and flag it if the Jitsi iframe never becomes ready
  // (blank/black screen with no dots spinner — iframe failed to load or hung)
  useEffect(() => {
    logEvent("join_attempt", { domain, chatType, chatRoomId, role: user?.role });
    loadTimeoutRef.current = setTimeout(() => {
      logEvent("jitsi_load_timeout", { domain }, "error");
      setLoadStuck(true);
    }, 20000);
    return () => clearTimeout(loadTimeoutRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(joinTimeoutRef.current), []);

  useEffect(() => {
    if (!user) logEvent("user_missing_on_mount", { roomId }, "error");
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const endSession = () => {
    if (!sessionIdRef.current) return;
    const duration = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 60000)
      : 0;
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    clearInterval(heartbeatRef.current);
    fetch(`${BACKEND_URL}/class-sessions/end/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationMinutes: duration }),
    }).catch(() => {});
  };

  // Shared by the ring-timeout fallback and the immediate 'callDeclined'
  // signal below — re-checks participant count at fire time so it's a
  // no-op if someone joined in the meantime.
  const sendMissedCallMessage = (targetConversationId) => {
    if (apiRef.current && apiRef.current.getParticipantsInfo().length > 1) return;
    socket.emit("sendConversationMessage", {
      conversationId: targetConversationId,
      senderId: user.id,
      username: displayNameForJitsi,
      email: user.email,
      avatarUrl: user.avatarUrl,
      message: "Missed call",
      messageType: "missed_call",
    });
  };

  // 1:1 callee actively declining (see IncomingCallBanner) — log the missed
  // call right away instead of waiting out the full ring timeout. Only
  // fires for the person who actually placed this call (callStartedNotifiedRef
  // is only set true on that client) and only for the matching conversation.
  useEffect(() => {
    const handleCallDeclined = (data) => {
      const targetConversationId = chatRoomId || roomId;
      if (!callStartedNotifiedRef.current || data.conversationId !== targetConversationId) return;
      clearTimeout(missedCallTimeoutRef.current);
      sendMissedCallMessage(targetConversationId);
    };
    socket.on("callDeclined", handleCallDeclined);
    return () => socket.off("callDeclined", handleCallDeclined);
  }, [chatRoomId, roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCallEnd = () => {
    logEvent("conference_left");
    endSession();
    clearTimeout(missedCallTimeoutRef.current);
    if (isRecordingRef.current) stopRecording();
    navigate(user.role === "admin" ? "/home" : "/schedule");
  };

  // End session if tab is closed mid-class
  useEffect(() => {
    const onUnload = () => endSession();
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      endSession();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redux user can briefly be unset (stale/corrupted persisted state, race on reload).
  // Without this guard, `user.role` below throws and the whole page renders blank/black
  // with no error message — render a safe fallback and log it instead.
  if (!user) {
    return (
      <div className="meeting-full-height flex flex-col items-center justify-center gap-4 bg-black text-white">
        <p>Couldn't load your session. Please reload the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-full text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
        >
          Reload
        </button>
      </div>
    );
  }

  const closeChat = () => {
    showChatRef.current = false;
    setShowChat(false);
  };

  const toggleChat = () => {
    const next = !showChatRef.current;
    showChatRef.current = next;
    setShowChat(next);
    if (next) {
      setMessageToast(null);
      clearTimeout(messageToastTimeoutRef.current);
    }
  };

  const TURN_SERVERS = [
    // Port 443 TURNS — works through firewalls that block 3478/5349/10000
    {
      urls: "turns:turns.lingolandias.com:443",
      username: "sincelejana",
      credential: "asdkASDIORNVM345Fasdegf23",
    },
    { urls: `stun:${JITSI_DOMAIN}:3478` },
    {
      urls: `turn:${JITSI_DOMAIN}:3478`,
      username: "sincelejana",
      credential: "asdkASDIORNVM345Fasdegf23",
    },
    {
      urls: `turn:${JITSI_DOMAIN}:3478?transport=tcp`,
      username: "sincelejana",
      credential: "asdkASDIORNVM345Fasdegf23",
    },
    {
      urls: `turns:${JITSI_DOMAIN}:5349`,
      username: "sincelejana",
      credential: "asdkASDIORNVM345Fasdegf23",
    },
  ];

  // Only force both muted when our own preflight found BOTH audio and video
  // completely unavailable — that's the crash-prevention case this was built
  // for. Muting just one (e.g. video muted, audio not) makes Jitsi request
  // that single modality alone, and iOS WebKit (every browser on iOS, Chrome
  // included, runs on WebKit) has been observed to hard-deny that single-
  // modality getUserMedia call from inside our cross-origin iframe even when
  // the exact same device grants a combined audio+video request fine. So if
  // at least one modality worked in our own top-level probe, let Jitsi ask
  // for both together like it always did pre-preflight, and rely on its own
  // per-track fallback for whichever one is genuinely unavailable.
  const bothMediaUnavailable = mediaPreflight?.audio === false && mediaPreflight?.video === false;

  const options = {
    configOverwrite: {
      // An admin observing from the dashboard is here to watch, not
      // participate — always joins muted regardless of device availability.
      startWithAudioMuted: bothMediaUnavailable || observer,
      startWithVideoMuted: bothMediaUnavailable || observer,
      disableModeratorIndicator: true,
      // Disable DTX — prevents crackling at silence/speech transitions
      enableOpusDtx: false,
      // Mono at 64Kbps — stereo doubles bandwidth demand with no benefit for voice
      audioQuality: {
        stereo: false,
        opusMaxAverageBitrate: 64000,
      },
      // Disable E2EE entirely — prevents Olm/WebAssembly initialization errors
      e2ee: { enabled: false },
      // Forward warnings/errors to the parent window so we can log them (see "log" listener below)
      apiLogLevels: ["warn", "error"],
      logging: {
        defaultLogLevel: "warn",
        loggers: {
          "modules/RTC/TraceablePeerConnection.js": "warn",
          "modules/statistics/CallStats.js": "warn",
          "xmpp/StropheErrorHandler.js": "warn",
          "app/index.web.js": "warn",
        },
      },
      hideConferenceSubject: true,
      startWithTileView: true,
      customToolbarButtons: [
        { icon: CHAT_ICON, id: "lingo-chat", text: "Chat" },
        ...(user.role === "teacher" || user.role === "admin"
          ? [{ icon: RECORD_ICON, id: "lingo-record", text: "Record" }]
          : []),
      ],
      toolbarButtons: [
        "microphone",
        "camera",
        ...(!IS_MOBILE ? ["desktop"] : []),
        "tileview",
        "hangup",
      ],
      p2p: {
        enabled: true,
        stunServers: TURN_SERVERS,
      },
      iceServers: TURN_SERVERS,
      constraints: {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
        },
        video: {
          height: { ideal: 480, max: 720, min: 180 },
          width: { ideal: 854, max: 1280, min: 320 },
        },
      },
      // Screenshare — VP9 + high bitrate floor prevents adaptive encoder from blurring slides/text
      desktopSharingFrameRate: { min: 5, max: 30 },
      desktopSharingConstraints: {
        video: {
          height: { ideal: 1080, max: 1080 },
          width: { ideal: 1920, max: 1920 },
          frameRate: { ideal: 30, max: 30 },
        },
      },
      enableLayerSuspension: true,
      // Prefer VP9 but allow fallback — enforcing VP9 on clients without hardware decoding causes high CPU → audio dropouts
      videoQuality: {
        preferredCodec: "VP9",
        enforcePreferredCodec: false,
        maxBitratesVideo: {
          VP9: { low: 200000, standard: 700000, high: 2000000 },
          VP8: { low: 200000, standard: 700000, high: 2000000 },
          H264: { low: 200000, standard: 700000, high: 2000000 },
        },
      },
      // Disable simulcast for screenshare — simulcast layers fight over bitrate and blur the top layer
      screenshareSimulcast: false,
      screenshotInterval: 0,
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    },
    userInfo: { displayName: displayNameForJitsi },
  };

  return (
    <div
      className="meeting-full-height"
      style={{ display: "flex", flexDirection: "row", position: "relative" }}
    >
      {loading && (
        <section className="dots-container dark:bg-brand-dark" style={{ flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex" }}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
          {loadStuck && (
            <div style={{ textAlign: "center", color: "#fff" }}>
              <p style={{ marginBottom: "10px" }}>This is taking longer than usual to load.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full text-white text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
              >
                Reload
              </button>
            </div>
          )}
        </section>
      )}

      {mediaBlocked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6"
          style={{ background: "rgba(0,0,0,0.92)", zIndex: 50 }}
        >
          <p className="text-white text-base max-w-sm">
            Your browser blocked camera/microphone access, so the meeting can't display your video or audio.
            This can also happen if another app or tab is already using the camera/mic. You can still join
            and use chat without them, or allow access in your browser settings and reload.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMediaBlocked(false)}
              className="px-4 py-2 rounded-full text-white text-sm font-semibold border border-white/30 hover:bg-white/10 transition-colors"
            >
              Join without camera/mic
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {joinStuck && !mediaBlocked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6"
          style={{ background: "rgba(0,0,0,0.92)", zIndex: 50 }}
        >
          <p className="text-white text-base max-w-sm">
            The meeting loaded but never connected. This can happen if a permission prompt
            (camera/microphone) got stuck or was dismissed. Please reload the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-full text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
          >
            Reload
          </button>
        </div>
      )}

      {/* Jitsi frame */}
      <div
        className="relative"
        style={{ flex: 1, display: loading ? "none" : "block" }}
      >
        {mediaPreflight && (
        <JitsiMeeting
          domain={domain}
          roomName={roomId}
          configOverwrite={options.configOverwrite}
          interfaceConfigOverwrite={options.interfaceConfigOverwrite}
          userInfo={options.userInfo}
          onApiReady={(externalApi) => {
            clearTimeout(loadTimeoutRef.current);
            apiRef.current = externalApi;
            externalApi.executeCommand("displayName", displayNameForJitsi);

            // The iframe can load fine (api_ready) and then silently hang before actually
            // joining the conference — e.g. stuck on a permission prompt or ICE negotiation
            // with no JS error thrown, so nothing else would ever get logged for that session.
            joinTimeoutRef.current = setTimeout(() => {
              logEvent("stuck_before_join", {}, "error");
              setJoinStuck(true);
            }, 20000);

            externalApi.addEventListener("videoConferenceJoined", (e) => {
              clearTimeout(joinTimeoutRef.current);
              setJoinStuck(false);
              localParticipantIdRef.current = e.id;
              logEvent("conference_joined");

              // Ring the other side, Teams-style — but only for the first
              // person into an otherwise-empty room. If others are already
              // here, they already got rung (or joined directly), and
              // ringing again on every subsequent joiner would just spam
              // the group. Skipped for the big shared legacy rooms
              // (general/teacher/support) where there's no single "other
              // side" to ring. Wrapped in try/catch — getParticipantsInfo()
              // has been observed to throw if called in the same tick as
              // videoConferenceJoined, before Jitsi's own internal state
              // (large video, etc.) has finished settling.
              try {
                if (
                  !callStartedNotifiedRef.current &&
                  ["group", "dm", "private"].includes(chatType) &&
                  // An admin observing a class from the dashboard shouldn't
                  // ring the real teacher/student — they're just watching.
                  user?.role !== "admin"
                ) {
                  const others = externalApi.getParticipantsInfo();
                  logEvent("call_ring_check", { chatType, othersCount: others.length });
                  if (others.length <= 1) {
                    callStartedNotifiedRef.current = true;
                    const targetConversationId = chatRoomId || roomId;
                    logEvent("call_ring_emit", { targetConversationId, otherUserId });
                    socket.emit("callStarted", {
                      conversationId: targetConversationId,
                      callerId: user.id,
                      callerName: displayNameForJitsi,
                      chatName: chatName || userName,
                      chatType,
                      otherUserId,
                    });

                    // Nobody picked up within the same window the banner
                    // rings for on the other end — leave a "missed call"
                    // entry in the chat (with its own Join button) instead
                    // of the call just silently going nowhere. Re-checks
                    // participant count at fire time so it's a no-op if
                    // someone joined in the meantime. 1:1 only — a group
                    // call staying open for whoever joins later isn't a
                    // "missed" call the way a 1:1 is, and the ring/call
                    // itself already fired above regardless of chatType.
                    if (chatType !== "group") {
                      missedCallTimeoutRef.current = setTimeout(
                        () => sendMissedCallMessage(targetConversationId),
                        CALL_RING_TIMEOUT_MS
                      );
                    }
                  }
                }
              } catch (err) {
                logEvent("call_ring_check_failed", { error: err?.message }, "error");
              }
            });
            externalApi.addEventListener("videoConferenceLeft", handleCallEnd);
            externalApi.addEventListener("recordingStatusChanged", (e) => {
              handleRecordingStatusChanged(e);
              logEvent("recording_status_changed", e, e.error ? "error" : "info");
              // Dedicated, unambiguous marker of "who actually started this recording" —
              // the Jibri upload endpoint looks this up to credit non-1:1 (group/language
              // room) recordings to the right person instead of an anonymous "others" folder.
              if (e.on === true) logEvent("recording_started");
            });

            // Jitsi/XMPP grants "moderator" to whoever joins an empty room first — in a
            // private class that could be the student, and only a moderator can start a
            // Jibri recording. Since these rooms only ever contain the teacher + their
            // student(s), a non-teacher who ends up moderator immediately hands it to
            // whoever else is/joins the room so the teacher can always record.
            //
            // In the shared "Teachers Meeting" rooms (several admins + teachers at once),
            // the same join-order problem applies but the fix is different: whichever of
            // the 3 priority admins (see ADMIN_RECORDER_PRIORITY) is present should always
            // end up moderator, so recording is never left to chance/join order.
            const handOffModeratorIfNeeded = (targetId) => {
              if (!isLocalModeratorRef.current) return;
              if (!targetId || targetId === localParticipantIdRef.current) return;

              if (isTeacherMeetingRoom) {
                const myPriority = getRecorderPriority(displayNameForJitsi);
                const target = externalApi.getParticipantsInfo()
                  .find((p) => p.participantId === targetId);
                const targetPriority = target ? getRecorderPriority(target.displayName) : Infinity;
                if (targetPriority < myPriority) {
                  externalApi.executeCommand("grantModerator", targetId);
                }
                return;
              }

              if (user.role === "teacher" || user.role === "admin") return;
              externalApi.executeCommand("grantModerator", targetId);
            };
            externalApi.addEventListener("participantRoleChanged", (e) => {
              if (e.id !== localParticipantIdRef.current) return;
              isLocalModeratorRef.current = e.role === "moderator";
              if (isLocalModeratorRef.current) {
                externalApi.getParticipantsInfo()
                  .filter((p) => p.participantId !== localParticipantIdRef.current)
                  .forEach((p) => handOffModeratorIfNeeded(p.participantId));
              }
            });
            externalApi.addEventListener("participantJoined", (e) => handOffModeratorIfNeeded(e.id));

            // Camera/mic failures are the usual cause of a black tile — capture the reason
            externalApi.addEventListener("cameraError", (err) => {
              logEvent("camera_error", err, "error");
              setMediaBlocked(true);
            });
            externalApi.addEventListener("micError", (err) => {
              logEvent("mic_error", err, "error");
              setMediaBlocked(true);
            });

            // Internal Jitsi warnings/errors (ICE failures, media issues, etc.) — see apiLogLevels above
            externalApi.addEventListener("log", ({ logLevel, args }) => {
              if (logLevel !== "error" && logLevel !== "warn") return;
              const text = JSON.stringify(args);
              if (MEDIA_DENIED_PATTERNS.some((p) => text.includes(p))) setMediaBlocked(true);
              if (BENIGN_LOG_PATTERNS.some((p) => text.includes(p))) return;
              logEvent("jitsi_log", { logLevel, args }, logLevel);
            });

            externalApi.addEventListener("toolbarButtonClicked", ({ key }) => {
              logEvent("toolbar_button_clicked", { key, chatType, room: chatRoomId || roomId });
              if (key === "lingo-chat") {
                toggleChat();
              } else if (key === "lingo-record") {
                toggleRecording();
              }
            });

            // Track class session — teachers only
            if (user.role === "teacher") {
              sessionStartRef.current = Date.now();
              fetch(`${BACKEND_URL}/class-sessions/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  teacherId: user.id,
                  teacherName: `${user.name} ${user.lastName}`,
                  studentName: chatName || null,
                  roomId,
                }),
              })
                .then((r) => r.json())
                .then(({ sessionId }) => {
                  sessionIdRef.current = sessionId;
                  heartbeatRef.current = setInterval(() => {
                    if (sessionIdRef.current) {
                      fetch(`${BACKEND_URL}/class-sessions/heartbeat/${sessionIdRef.current}`, {
                        method: "POST",
                      }).catch(() => {});
                    }
                  }, 60000);
                })
                .catch(() => {});
            }

            setLoading(false);
            logEvent("api_ready");
          }}
          getIFrameRef={(containerDiv) => {
            containerDiv.style.height = "100%";
            containerDiv.style.width  = "100%";
            const iframe = containerDiv.querySelector("iframe");
            if (iframe) {
              // "autoplay" is required or iOS Safari blocks remote video/audio playback
              // inside the iframe, leaving a black tile with a manual play button.
              iframe.allow =
                "camera *; microphone *; fullscreen *; display-capture *; screen-wake-lock *; autoplay *";
            }
          }}
        />
        )}

        {/* Gradient bar — glows at the bottom when chat is open */}
        {user.role !== "admin" && (
          <div
            className="absolute bottom-0 left-0 w-full pointer-events-none z-10 transition-all duration-300"
            style={{
              height: showChat ? "3px" : "0px",
              background: "linear-gradient(90deg, #9E2FD0, #F6B82E, #26D9A1)",
            }}
          />
        )}

        {/* Recording indicator — pulsing red dot + elapsed time */}
        {isRecording && (
          <div
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none"
            style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(6px)" }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-mono font-semibold tracking-wide">
              {formatTime(recordingSeconds)}
            </span>
          </div>
        )}

        {/* New-message toast — substitutes for a badge on Jitsi's own chat
            toggle button, which renders inside its iframe and can't carry
            one. Only shown while the chat panel is closed. */}
        {messageToast && !showChat && (
          <button
            onClick={openChatFromToast}
            className="absolute top-4 right-4 z-20 flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl text-left transition-transform hover:scale-[1.02] active:scale-[0.98] chat-slide-in"
            style={{
              background: "linear-gradient(135deg, rgba(158,47,208,0.92), rgba(123,34,168,0.92))",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(158,47,208,0.4)",
              maxWidth: "280px",
            }}
          >
            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              💬
            </span>
            <span className="min-w-0">
              <span className="block text-white text-xs font-bold truncate">{messageToast.sender}</span>
              <span className="block text-white/80 text-[11px] truncate">{messageToast.preview}</span>
            </span>
          </button>
        )}

        {/* Unread badge for lingo-chat — a tiny, click-through dot drawn on
            top of the native button's corner, NOT a replacement for it.
            lingo-chat itself stays a real, natively-spaced Jitsi toolbar
            button (perfect layout, real click handling); this only adds the
            number Jitsi won't let us bake into that button's own icon live.
            `pointer-events: none` so it never steals the click — the real
            button underneath still opens the chat exactly as before.
            Position uses the same measured-off-the-real-toolbar math as the
            icon itself (see the historical note above): centered on this
            video-area container (which is what actually shrinks/recenters
            when the chat panel opens, not the full viewport), one icon pitch
            (~56px) right of center for teacher/admin (7 icons), one and a
            half pitches (~84px) for a student (6 icons, no record button) —
            nudged up and right from the icon's own center to land on its
            top-right corner. */}
        {user.role !== "admin" && !showChat && chatUnreadCount > 0 && (
          <span
            className="absolute z-20 pointer-events-none min-w-[19px] h-[19px] px-[4px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-black/50"
            style={{
              bottom: "38px",
              left: `calc(50% + ${(user.role === "teacher" ? 56 : 84) + 9}px)`,
              transform: "translateX(-50%)",
            }}
          >
            {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
          </span>
        )}

        {/* Upload status is now shown globally by UploadStatusBar in App.jsx */}
      </div>

      {/* Chat panel — slides in from the RIGHT */}
      <div
        className={`overflow-hidden flex-shrink-0 ${
          showChat
            ? "lg:relative absolute top-0 right-0 z-10 2xl:w-[350px] xl:w-[330px] w-full h-full"
            : "w-0"
        }`}
        style={{
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease 0.05s",
          opacity: showChat ? 1 : 0,
        }}
      >
        {showChat && (
          <div className="relative w-full h-full chat-slide-in">
            {/* Always the unified chat now — every chatType used to route
                here eventually needs the same shared history as Messages,
                and any entry point that forgets to set chatType (e.g. the
                admin "observe a class" join) was silently falling back to
                the legacy, disconnected ChatWindow below. That fallback was
                the actual source of the split-history reports: two people
                in the same call, one on each component, each writing to a
                different table. */}
            <CallChatWindow
              username={userName}
              email={email}
              userId={user?.id}
              userUrl={user?.avatarUrl}
              room={chatRoomId || roomId}
              chatName={chatName}
              onClose={closeChat}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default JitsiClassRoom;
