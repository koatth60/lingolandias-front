import { useState, useEffect, useCallback, useRef } from "react";
import { socket as socketInstance } from "../socket";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMessagesForTeacher,
  fetchUnreadCountsForStudent,
} from "../redux/chatSlice";
import useChatWindow from "./useChatWindow";
import useNotificationSound from "./useNotificationSound";
import { activeRoomRef } from "../state/activeRoom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const useSocketManager = (room, username, email, onNewMessage) => {
  const [socket, setSocket] = useState(socketInstance);
  const [chatMessages, setChatMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const user = useSelector((state) => state.user.userInfo.user);
  const dispatch = useDispatch();
  const { readChat } = useChatWindow();
  const playSound = useNotificationSound();
  const soundEnabledRef = useRef(user?.settings?.notificationSound !== false);
  soundEnabledRef.current = user?.settings?.notificationSound !== false;

  const fetchMessages = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/chat/messages/${room}`, {
        params: { email },
      });
      setChatMessages(response.data.reverse());
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [room, email]);

  useEffect(() => {
    if (socket && room) {
      socket.on("normalChatDeleted", (data) => {
        setChatMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      });
      socket.on("normalChatEdited", ({ messageId, newMessage }) => {
        setChatMessages((prev) =>
          prev.map((msg) => msg.id === messageId ? { ...msg, message: newMessage } : msg)
        );
      });
      socket.on("normalChatCleared", () => {
        setChatMessages([]);
      });
      socket.on("chatMessagesRead", () => {
        setChatMessages((prev) =>
          prev.map((msg) => msg.email === email ? { ...msg, unread: false } : msg)
        );
      });
      socket.on("typing", ({ username: typingUsername }) => {
        setTypingUser(typingUsername);
      });
      socket.on("stopTyping", () => {
        setTypingUser(null);
      });

      return () => {
        socket.off("normalChatDeleted");
        socket.off("normalChatEdited");
        socket.off("normalChatCleared");
        socket.off("chatMessagesRead");
        socket.off("typing");
        socket.off("stopTyping");
      };
    }
  }, [socket, room, email]);

  useEffect(() => {
    if (username && room) {
      const initializeChat = async () => {
        await fetchMessages();
        await readChat(room, email);
        socket.emit("notifyRead", { room });
      };
      initializeChat();

      socket.emit("join", { username, room });
      activeRoomRef.current = room;

      const handleChatMessage = (data) => {
        if (data.email !== email) {
          onNewMessage?.();
          socket.emit("notifyRead", { room });
          if (soundEnabledRef.current) playSound();
        }
        readChat(room, email);
        setChatMessages((prevMessages) => [...prevMessages, data]);
      };

      socket.on("chat", handleChatMessage);

      return () => {
        activeRoomRef.current = null;
        socket.off("chat", handleChatMessage);
        socket.emit("leave", { room });
      };
    }
  }, [username, room, email, socket, fetchMessages, readChat]);

  return { socket, chatMessages, setChatMessages, typingUser };
};

export default useSocketManager;