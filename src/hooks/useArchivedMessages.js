import { useState, useEffect, useRef } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const useArchivedMessages = (room, chatMessages) => {
  const [archivedMessages, setArchivedMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const autoFetched = useRef(false);

  const fetchArchivedMessages = async () => {
    if (!hasMoreRef.current) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/chat/archived-messages/${room}?page=${pageRef.current}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch archived messages");
      }
      const data = await response.json();
      if (data.length > 0) {
        setArchivedMessages((prev) => [...data, ...prev]);
        pageRef.current += 1;
      } else {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching archived messages:", error);
    }
  };

  // Auto-load archived messages when active chat is empty.
  // Mark initialLoading=false only after the auto-fetch completes (or is skipped).
  useEffect(() => {
    if (!chatMessages) return;

    if (chatMessages.length === 0 && !autoFetched.current && hasMoreRef.current) {
      autoFetched.current = true;
      fetchArchivedMessages().finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [chatMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when room changes
  useEffect(() => {
    autoFetched.current = false;
    pageRef.current = 1;
    hasMoreRef.current = true;
    setArchivedMessages([]);
    setHasMore(true);
    setInitialLoading(true);
  }, [room]);

  useEffect(() => {
    if (chatMessages) {
      const combined = [...archivedMessages, ...chatMessages].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setAllMessages(combined);
    }
  }, [chatMessages, archivedMessages]);

  return { allMessages, fetchArchivedMessages, hasMore, initialLoading };
};

export default useArchivedMessages;
