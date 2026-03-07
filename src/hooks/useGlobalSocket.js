import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessagesForTeacher,
  fetchUnreadCountsForStudent,
} from "../redux/chatSlice";
import { socket } from "../socket";

const useGlobalSocket = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.userInfo?.user);

  useEffect(() => {
    if (user) {
      const handleConnect = () => {
        socket.emit('registerUser', { userId: user.id });
      };

      socket.connect();
      // If already connected (reconnect scenario), register immediately
      if (socket.connected) {
        socket.emit('registerUser', { userId: user.id });
      }

      socket.on('connect', handleConnect);

      const handleNewChat = () => {
        if (user.role === "teacher") {
          dispatch(fetchMessagesForTeacher());
        } else if (user.role === "user") {
          dispatch(fetchUnreadCountsForStudent());
        }
      };

      socket.on("newChat", handleNewChat);

      return () => {
        socket.off('connect', handleConnect);
        socket.off("newChat", handleNewChat);
      };
    } else if (socket.connected) {
      socket.disconnect();
    }
  }, [user, dispatch]);
};

export default useGlobalSocket;