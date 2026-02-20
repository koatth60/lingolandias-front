import { useEffect, useRef, useState } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "./chatWindow";
import CallChatWindow from "./messages/CallChatWindow";
import { useSelector } from "react-redux";

const CHAT_ICON = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>'
)}`;

const JitsiClassRoom = () => {
  const location = useLocation();
  const { userName, roomId, chatRoomId, chatName, email, fromMeeting, fromMessage } = location.state || {};
  const domain = "jitsi.srv570363.hstgr.cloud";

  const user = useSelector((state) => state.user.userInfo.user);

  const apiRef      = useRef(null);
  const showChatRef = useRef(false);

  const navigate = useNavigate();
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat,   setShowChat]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (apiRef.current) {
      apiRef.current.executeCommand("displayName", userName);
    }
  }, [userName]);

  const options = {
    configOverwrite: {
      startWithAudioMuted: false,
      disableModeratorIndicator: true,
      apiLogLevels: ["error"],
      logging: {
        defaultLogLevel: "error",
        loggers: {
          "modules/RTC/TraceablePeerConnection.js": "error",
          "modules/statistics/CallStats.js": "error",
        },
      },
      // Mobile screen sharing
      desktopSharingChromeDisabled: false,
      desktopSharingFirefoxDisabled: false,
      desktopSharingSources: ["screen", "window", "tab"],
      testing: {
        mobileDesktopSharingEnabled: true,
      },
      toolbarButtons: ["microphone", "camera", "desktop", "hangup"],
      customToolbarButtons: [
        { icon: CHAT_ICON, id: "lingo-chat", text: "Chat" },
      ],
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
    },
    userInfo: { displayName: userName },
  };

  const handleCallEnd = () => {
    navigate(user.role === "admin" ? "/home" : "/schedule");
    window.location.reload();
  };

  const handleIncomingMessage = (message) => {
    setChatMessages((prev) => [...prev, message]);
  };

  const sendMessageToJitsi = (message) => {
    if (apiRef.current) {
      apiRef.current.executeCommand("sendEndpointTextMessage", "", message);
    }
  };

  const closeChat = () => {
    showChatRef.current = false;
    setShowChat(false);
    setIsChatOpen(false);
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
            externalApi.addEventListener("incomingMessage", (message) => {
              handleIncomingMessage(message);
            });

            if (user.role !== "admin") {
              externalApi.addEventListener("toolbarButtonClicked", ({ key }) => {
                if (key !== "lingo-chat") return;
                const next = !showChatRef.current;
                showChatRef.current = next;
                setShowChat(next);
                setIsChatOpen(next);
              });
            }

            setLoading(false);
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width  = "100%";
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
            {(fromMeeting || fromMessage) ? (
              <CallChatWindow
                username={userName}
                email={email}
                room={fromMessage ? (chatRoomId || roomId) : roomId}
                chatName={fromMessage ? chatName : undefined}
                height="100dvh"
                externalMessages={chatMessages}
                onSendMessage={sendMessageToJitsi}
              />
            ) : (
              <ChatWindow
                username={userName}
                email={email}
                room={roomId}
                height="100dvh"
                meeting={true}
                isChatOpen={isChatOpen}
                setIsChatOpen={setIsChatOpen}
                setShowChat={setShowChat}
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
