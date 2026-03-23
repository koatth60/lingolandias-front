import { useEffect, useRef, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../messages/chatWindow";
import CallChatWindow from "../messages/CallChatWindow";
import { useSelector } from "react-redux";
import useRecording from "../../hooks/useRecording";

const CHAT_ICON = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>'
)}`;

const RECORD_ICON = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5" fill="white" stroke="none"/></svg>'
)}`;

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || "jitsi.lingolandias.com";
const BACKEND_URL  = import.meta.env.VITE_BACKEND_URL;
const IS_MOBILE    = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

const JitsiClassRoom = () => {
  const location = useLocation();
  const { userName, roomId, chatRoomId, chatName, email, chatType } = location.state || {};
  const domain = JITSI_DOMAIN;

  const user = useSelector((state) => state.user.userInfo.user);

  const apiRef          = useRef(null);
  const showChatRef     = useRef(false);
  const sessionIdRef    = useRef(null);
  const sessionStartRef = useRef(null);
  const heartbeatRef    = useRef(null);

  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const {
    isRecording,
    isRecordingRef,
    recordingSeconds,
    formatTime,
    toggleRecording,
    stopRecording,
  } = useRecording({ userName, roomId, role: user.role, email, studentName: chatName });

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("displayName", userName);
    }
  }, [userName]);

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

  const handleCallEnd = () => {
    endSession();
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

  const closeChat = () => {
    showChatRef.current = false;
    setShowChat(false);
  };

  const TURN_SERVERS = [
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

  const options = {
    configOverwrite: {
      startWithAudioMuted: false,
      disableModeratorIndicator: true,
      // Disable E2EE entirely — prevents Olm/WebAssembly initialization errors
      e2ee: { enabled: false },
      // Suppress all logs forwarded to the parent window
      apiLogLevels: [],
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
      useStunTurn: true,
      p2p: {
        enabled: true,
        stunServers: TURN_SERVERS,
      },
      iceServers: TURN_SERVERS,
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    },
    userInfo: { displayName: userName },
  };

  return (
    <div
      className="meeting-full-height"
      style={{ display: "flex", flexDirection: "row", position: "relative" }}
    >
      {loading && (
        <section className="dots-container dark:bg-brand-dark">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </section>
      )}

      {/* Jitsi frame */}
      <div
        className="relative"
        style={{ flex: 1, display: loading ? "none" : "block" }}
      >
        <JitsiMeeting
          domain={domain}
          roomName={roomId}
          configOverwrite={options.configOverwrite}
          interfaceConfigOverwrite={options.interfaceConfigOverwrite}
          userInfo={options.userInfo}
          onApiReady={(externalApi) => {
            apiRef.current = externalApi;
            externalApi.executeCommand("displayName", userName);
            externalApi.addEventListener("videoConferenceLeft", handleCallEnd);

            externalApi.addEventListener("toolbarButtonClicked", ({ key }) => {
              if (key === "lingo-chat") {
                const next = !showChatRef.current;
                showChatRef.current = next;
                setShowChat(next);
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
          }}
          getIFrameRef={(containerDiv) => {
            containerDiv.style.height = "100%";
            containerDiv.style.width  = "100%";
            const iframe = containerDiv.querySelector("iframe");
            if (iframe) {
              iframe.allow =
                "camera *; microphone *; fullscreen *; display-capture *; screen-wake-lock *";
            }
          }}
        />

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
            {chatType === "group" || chatType === "teacher" || chatType === "general" ? (
              <CallChatWindow
                username={userName}
                email={email}
                room={chatRoomId || roomId}
                chatName={chatName}
                onClose={closeChat}
              />
            ) : (
              <ChatWindow
                username={userName}
                email={email}
                room={chatRoomId || roomId}
                studentName={chatName}
                height="100%"
                meeting={true}
                onBack={closeChat}
              />
            )}
            {/* Floating close pill — mobile only */}
            <button
              onClick={closeChat}
              className="lg:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold shadow-xl"
              style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
            >
              ✕ Close Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JitsiClassRoom;
