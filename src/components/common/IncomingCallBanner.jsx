import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiPhone, FiPhoneOff, FiUsers } from "react-icons/fi";
import { socket } from "../../socket";
import useRingtone from "../../hooks/useRingtone";
import { CALL_RING_TIMEOUT_MS } from "../../constants";

const getInitials = (name) => {
  const parts = (name || "").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

// Global, mounted once in App.jsx (inside <Router>) — Teams-style incoming
// call: rings (Web Audio, no file needed — see useRingtone) until Accept,
// Decline, or CALL_RING_TIMEOUT_MS passes. The server only ever sends this
// to whoever wasn't already in the room, so there's no "am I already in
// this call" check needed here.
const IncomingCallBanner = () => {
  const user = useSelector((state) => state.user.userInfo?.user);
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const { start, stop } = useRingtone();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const handleCallStarted = (data) => {
      if (data.callerId === user.id) return; // safety net, server already excludes the caller
      setIncomingCall(data);
      start();
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        stop();
        setIncomingCall(null);
      }, CALL_RING_TIMEOUT_MS);
    };
    socket.on("callStarted", handleCallStarted);
    return () => socket.off("callStarted", handleCallStarted);
  }, [user, start, stop]);

  const dismiss = () => {
    clearTimeout(timeoutRef.current);
    stop();
    setIncomingCall(null);
  };

  // 1:1 only — a group call has no single "the other side", other members
  // might still pick up, so declining there just quietly hides the banner
  // for this person instead of ending the ring for everyone else. Emitting
  // this is what lets the caller log "missed call" immediately instead of
  // sitting through the full ring timeout for a call that was actively
  // turned down.
  const decline = () => {
    if (incomingCall && incomingCall.chatType !== "group" && user) {
      socket.emit("callDeclined", {
        conversationId: incomingCall.conversationId,
        callerId: incomingCall.callerId,
        calleeId: user.id,
      });
    }
    dismiss();
  };

  const accept = () => {
    if (!incomingCall || !user) return;
    const call = incomingCall;
    dismiss();
    navigate("/classroom", {
      state: {
        roomId: call.conversationId,
        chatRoomId: call.conversationId,
        userName: user.name,
        email: user.email,
        chatName: call.chatName,
        chatType: call.chatType,
        otherUserId: call.callerId,
      },
    });
  };

  if (!incomingCall) return null;
  const isGroup = incomingCall.chatType === "group";

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-[92vw] max-w-sm px-2 sm:px-0">
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl"
        style={{
          backdropFilter: "blur(14px)",
          background: "rgba(13,10,30,0.94)",
          border: "1px solid rgba(158,47,208,0.4)",
          boxShadow: "0 8px 32px rgba(158,47,208,0.35)",
        }}
      >
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
          >
            {isGroup ? <FiUsers size={18} /> : getInitials(incomingCall.callerName)}
          </div>
          <span className="absolute inset-0 rounded-full border-2 border-[#9E2FD0] animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          {isGroup ? (
            <>
              <p className="text-white text-sm font-semibold truncate">{incomingCall.chatName}</p>
              <p className="text-gray-400 text-xs truncate">{incomingCall.callerName} is calling</p>
            </>
          ) : (
            <>
              <p className="text-white text-sm font-semibold truncate">{incomingCall.callerName}</p>
              <p className="text-gray-400 text-xs truncate">Incoming call</p>
            </>
          )}
        </div>
        <button
          onClick={decline}
          title="Decline"
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: "#ef4444" }}
        >
          <FiPhoneOff size={15} />
        </button>
        <button
          onClick={accept}
          title="Accept"
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
          style={{ background: "#26D9A1" }}
        >
          <FiPhone size={15} />
        </button>
      </div>
    </div>
  );
};

export default IncomingCallBanner;
