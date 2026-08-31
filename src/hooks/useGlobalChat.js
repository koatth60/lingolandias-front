import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const useGlobalChat = (socket, room, username, email, userUrl) => {
  const [chatMessages, setChatMessages] = useState([]);

  const fetchMessages = useCallback(async () => {
    if (!room || !email) return;
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/chat/global-chats/${room}`,
        {
          params: { email },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      setChatMessages(response.data.reverse());
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [room, email]);

  useEffect(() => {
    if (socket && room && username) {
      socket.emit('join', { username, room });
      fetchMessages();

      const handleGlobalChat = (data) => {
        setChatMessages((prev) => {
          // Replace optimistic pending message with server-confirmed one
          const idx = prev.findIndex(
            (m) =>
              m._pending &&
              m.email === data.email &&
              m.message === data.message &&
              Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 10000,
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          }
          return [...prev, data];
        });
      };

      const handleChatError = ({ reason }) => {
        console.error('[chat] Server rejected message:', reason);
        // Remove any unsent pending messages from state on error
        if (reason === 'not_authenticated' || reason === 'server_error') {
          setChatMessages((prev) => prev.filter((m) => !m._pending));
        }
      };

      socket.on('globalChat', handleGlobalChat);
      socket.on('chatError', handleChatError);

      return () => {
        socket.off('globalChat', handleGlobalChat);
        socket.off('chatError', handleChatError);
      };
    }
  }, [room, socket, username, fetchMessages]);

  const sendMessage = (message, replyTo) => {
    if (message && room && socket && socket.connected) {
      const timestamp = new Date();
      const optimistic = { _pending: true, username, room, email, message, timestamp };
      if (userUrl) optimistic.userUrl = userUrl;
      if (replyTo) optimistic.replyTo = replyTo;
      setChatMessages((prev) => [...prev, optimistic]);

      const payload = { username, room, email, message, timestamp };
      if (userUrl) payload.userUrl = userUrl;
      if (replyTo) payload.replyTo = replyTo;
      socket.emit('globalChat', payload);
    }
  };

  return { chatMessages, setChatMessages, sendMessage };
};

export default useGlobalChat;