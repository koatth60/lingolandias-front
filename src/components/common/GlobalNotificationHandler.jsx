import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useNotificationSound from "../../hooks/useNotificationSound";
import { activeRoomRef } from "../../state/activeRoom";

const GlobalNotificationHandler = () => {
  const user = useSelector((state) => state.user.userInfo?.user);
  const unreadCountsByRoom = useSelector(
    (state) => state.chat.unreadCountsByRoom
  );
  const studentUnreadCount = useSelector(
    (state) => state.chat.studentUnreadCount
  );
  const playSound = useNotificationSound();
  const prevTotalUnreadCount = useRef(0);

  const soundEnabled = user?.settings?.notificationSound !== false;

  useEffect(() => {
    let currentTotalUnreadCount = 0;
    if (user?.role === "teacher") {
      // Exclude the currently-open room — useSocketManager plays sound for it directly
      currentTotalUnreadCount = Object.entries(unreadCountsByRoom).reduce(
        (acc, [roomId, count]) => roomId === activeRoomRef.current ? acc : acc + count,
        0
      );
    } else {
      // Skip if chat is open — useSocketManager handles the sound directly
      if (activeRoomRef.current === null) {
        currentTotalUnreadCount = studentUnreadCount;
      }
    }

    if (currentTotalUnreadCount > prevTotalUnreadCount.current && soundEnabled) {
      playSound();
    }

    prevTotalUnreadCount.current = currentTotalUnreadCount;
  }, [unreadCountsByRoom, studentUnreadCount, user, playSound, soundEnabled]);

  return null;
};

export default GlobalNotificationHandler;