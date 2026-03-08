import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import ChatListComponent from "../components/messages/ChatListComponent";
import ChatWindowComponent from "../components/messages/ChatWindowComponent";
import { io } from "socket.io-client";
import Dashboard from "./dashboard";
import Navbar from "../components/layout/navbar";
import { teacherChats, generalChats } from '../data/roomData';
import useMessagesSection from "../hooks/useMessagesSection";
import { FiMessageSquare } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Messages = () => {
  const { t } = useTranslation();
  const user = useSelector((state) => state.user.userInfo.user);
  const { unreadCounts } = useSelector((state) => state.messages);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatList, setShowChatList] = useState(true);
  const [newMessage, setNewMessage] = useState({});
  const [socket, setSocket] = useState(null);
  const { handleChatSelect, handleBackClick } = useMessagesSection(setNewMessage, setSelectedChat, setShowChatList);

  useEffect(() => {
    const socketInstance = io(`${BACKEND_URL}`);
    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('newUnreadGlobalMessage', (data) => {
        const { room } = data;
        setNewMessage((prev) => ({ ...prev, [room]: (prev[room] || 0) + 1 }));
      });
      return () => { socket.off('newUnreadGlobalMessage'); };
    }
  }, [socket]);

  const chats = [];

  if (user.role === "admin") {
    chats.push(generalChats.english, generalChats.spanish, generalChats.polish);
    chats.push(teacherChats.english, teacherChats.spanish, teacherChats.polish);
  }

  if (user.role === "teacher") {
    const normalizedLanguage = user.language ? user.language.toLowerCase() : "english";
    if (generalChats[normalizedLanguage]) chats.push(generalChats[normalizedLanguage]);
    if (teacherChats[normalizedLanguage]) chats.push(teacherChats[normalizedLanguage]);
    if (user.students && user.students.length > 0) {
      chats.push({ id: user.id, name: t("chatList.groupChat", { name: user.name }), online: "online", type: "group" });
    }
  }

  if (user.role === "user") {
    if (user.teacher) {
      chats.push({ id: user.teacher.id, name: t("chatList.groupChat", { name: user.teacher.name }), online: "online", type: "group" });
    }
    const normalizedLanguage = user.language ? user.language.toLowerCase() : "english";
    if (generalChats[normalizedLanguage]) chats.push(generalChats[normalizedLanguage]);
  }

  const userLanguage = user.role === 'admin' ? '' : (user.language ? user.language.charAt(0).toUpperCase() + user.language.slice(1) : '');
  const isAdmin = user.role === 'admin';

  const updatedChats = chats.map((chat) => {
    let roomKey = "";
    const chatLanguage = chat.language || chat.name.split(" - ")[1];
    if (chat.type === "general" && (isAdmin || chatLanguage === userLanguage)) {
      roomKey = `general${chatLanguage}Room`;
    } else if (chat.type === "teacher" && (isAdmin || chatLanguage === userLanguage)) {
      roomKey = `teachers${chatLanguage}Room`;
    } else if (chat.type === "group") {
      roomKey = `randomRoom`;
    }
    return {
      ...chat,
      name: chat.nameKey ? t(chat.nameKey) : chat.name,
      unreadCount: unreadCounts[roomKey] || 0,
    };
  });

  const chatListProps = { chats: updatedChats, onChatSelect: handleChatSelect, newMessage, setNewMessage, socket };
  const chatWindowProps = selectedChat ? {
    username: user.name,
    email: user.email,
    userUrl: user.avatarUrl,
    room: selectedChat.id,
    studentName: selectedChat.name,
    chatType: selectedChat.type,
    newMessage,
    userId: user.id,
    setNewMessage,
    socket,
    onBackClick: handleBackClick,
    onClose: () => setSelectedChat(null),
  } : null;

  return (
    <div className="flex w-full relative h-screen">
      {/* Page background */}
      <div className="absolute inset-0 pointer-events-none dark:hidden" style={{ background: "linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)" }} />
      <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: "linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)" }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)", width: "600px", height: "600px", top: "-10%", right: "-5%" }} />
        <div className="absolute rounded-full blur-3xl opacity-8" style={{ background: "radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)", width: "400px", height: "400px", bottom: "5%", left: "10%" }} />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]" style={{ backgroundImage: "linear-gradient(rgba(158,47,208,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(158,47,208,0.8) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <Dashboard />
      <div className="w-full relative z-10 flex flex-col min-w-0">
        <Navbar header={t("messages.title")} />

        <section className="flex-grow min-h-0 p-3 sm:p-4 overflow-hidden">

          {/* ── Desktop: unified glass card ── */}
          <div
            className="hidden lg:flex h-full relative rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(158,47,208,0.15)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(158,47,208,0.08)",
            }}
          >
            {/* Light glass bg */}
            <div
              className="absolute inset-0 dark:hidden rounded-2xl"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            />
            {/* Dark glass bg */}
            <div
              className="absolute inset-0 hidden dark:block rounded-2xl"
              style={{ background: "rgba(13,10,30,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
            />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-[2px] z-20 bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1]" />

            {/* Inner flex row — starts below the 2px accent */}
            <div className="relative z-10 flex w-full h-full pt-[2px]">

              {/* ── ChatList sidebar ── */}
              <div className="w-[280px] flex-shrink-0 overflow-hidden">
                <ChatListComponent {...chatListProps} />
              </div>

              {/* ── Chat / empty area ── */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {selectedChat ? (
                  <ChatWindowComponent {...chatWindowProps} />
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
                    {/* Ambient glow */}
                    <div
                      className="absolute w-72 h-72 rounded-full pointer-events-none"
                      style={{ background: "radial-gradient(circle, rgba(158,47,208,0.07), transparent 70%)" }}
                    />
                    {/* Icon */}
                    <div
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(158,47,208,0.12), rgba(38,217,161,0.06))",
                        border: "1px solid rgba(158,47,208,0.22)",
                        boxShadow: "0 4px 20px rgba(158,47,208,0.14)",
                      }}
                    >
                      <FiMessageSquare size={26} style={{ color: "#9E2FD0" }} />
                    </div>
                    {/* Text */}
                    <div className="text-center relative">
                      <p className="text-base font-extrabold login-gradient-text">{t("messages.emptyTitle")}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                        {t("messages.selectChat")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Mobile ── */}
          <div className="lg:hidden h-full">
            {showChatList ? (
              <div
                className="h-full rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(158,47,208,0.15)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
              >
                <ChatListComponent {...chatListProps} />
              </div>
            ) : (
              selectedChat && <ChatWindowComponent {...chatWindowProps} />
            )}
          </div>

        </section>
      </div>
    </div>
  );
};

export default Messages;
