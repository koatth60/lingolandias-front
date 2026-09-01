// How long an incoming-call banner rings before it's treated as missed —
// shared between IncomingCallBanner.jsx (when to give up and hide it) and
// JitsiClassRoom.jsx (when to log a "missed call" message if still alone).
export const CALL_RING_TIMEOUT_MS = 30000;

export const meetingRooms = {
  english: "English Teachers Meeting",
  spanish: "Spanish Teachers Meeting",
  polish: "Polish Teachers Meeting",
};

export const teacherChats = {
  english: {
    id: "uuid-teacher-english",
    name: "Teachers Chat - English",
    type: "teacher",
  },
  spanish: {
    id: "uuid-teacher-spanish",
    name: "Teachers Chat - Spanish",
    type: "teacher",
  },
  polish: {
    id: "uuid-teacher-polish",
    name: "Teachers Chat - Polish",
    type: "teacher",
  },
};