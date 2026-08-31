import { useState } from "react";

const useDeleteConversationMessage = (setChatMessages, socket, conversationId) => {
  const [openMessageId, setOpenMessageId] = useState(null);

  const handleDeleteMessage = (messageId) => {
    setChatMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    socket.emit("deleteConversationMessage", { messageId, conversationId });
  };

  const toggleOptionsMenu = (id) => {
    setOpenMessageId((prevId) => (prevId === id ? null : id));
  };

  return { handleDeleteMessage, toggleOptionsMenu, openMessageId };
};

export default useDeleteConversationMessage;
