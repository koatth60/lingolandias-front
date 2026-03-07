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
import notificationSound from "../assets/sounds/notification.wav";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const useSocketManager = (room, username, email, onNewMessage) => {
  const [socket, setSocket] = useState(socketInstance);
  const [chatMessages, setChatMessages] = useState([]);
  const user = useSelector((state) => state.user.userInfo.user);
  const dispatch = useDispatch();
  const { readChat } = useChatWindow();
  const playSound = useNotificationSound(notificationSound);

  // Ref so the socket handler always reads the latest value without needing
  // to re-register the listener every time the setting changes.
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

      return () => {
        socket.off("normalChatDeleted");
        socket.off("normalChatEdited");
        socket.off("normalChatCleared");
        socket.off("chatMessagesRead");
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

      const handleChatMessage = (data) => {
        if (data.email !== email) {
          if (soundEnabledRef.current) playSound();
          onNewMessage?.();
        }
        readChat(room, email);
        setChatMessages((prevMessages) => [...prevMessages, data]);
      };

      socket.on("chat", handleChatMessage);

      return () => {
        socket.off("chat", handleChatMessage);
        socket.emit("leave", { room });
      };
    }
  }, [username, room, email, socket, fetchMessages, readChat, playSound]);

  return { socket, chatMessages, setChatMessages };
};

export default useSocketManager;