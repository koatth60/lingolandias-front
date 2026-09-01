// src/data/joinClassHandler.js

export const handleJoinClass = ({
  user,
  classSession,
  navigate,
  editingEvent = false,
  handleEventEdit = () => {},
  setIsModalOpen = () => {},
}) => {
  if (editingEvent) {
    handleEventEdit(classSession);
    setIsModalOpen(true);
  } else {
    let roomId;
    let chatName;
    let otherUserId;
    if (classSession.roomId) {
      roomId = classSession.roomId;
    } else if (user.role === "user") {
      roomId = user.id;
    } else {
      const student = user.students?.find((s) => s.id === classSession.studentId);
      roomId = student ? student.id : classSession.studentId;
      chatName = student?.name;
    }
    otherUserId = user.role === "user" ? user.teacher?.id : classSession.studentId;
    const userName = user.name;
    const email = user.email;
    const params = { roomId, chatRoomId: roomId, otherUserId, userName, email, fromMeeting: false, chatName, chatType: "private" };
    navigate("/classroom", { state: params });
  }
};
