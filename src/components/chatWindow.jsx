import { useRef, useLayoutEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import EmojiPicker from "emoji-picker-react";
import { BsEmojiSmile, BsPaperclip, BsThreeDots } from "react-icons/bs";
import { FiX, FiArrowLeft, FiMessageSquare, FiSend } from "react-icons/fi";
import useDeleteMessage from "../hooks/useDeleteMessage";
import useSocketManager from "../hooks/useSocketManager";
import useMessageHandler from "../hooks/useMessageHandler";
import useMessageFormatter from "../hooks/useMessageFormatter.jsx";
import useChatInput from "../hooks/useChatInput";
import useArchivedMessages from "../hooks/useArchivedMessages";
import MessageOptionsCard from "./messages/MessageOptionsCard";
import { openFilePreview } from "../redux/filePreviewSlice";
import Dropdown from "./schedule/Dropdown";

const ChatWindow = ({
  username,
  email,
  room,
  studentName,
  height,
  isChatOpen,
  setIsChatOpen,
  setShowChat,
  handleJoinMeeting,
  onBack,
}) => {
  const user = useSelector((state) => state.user.userInfo.user);
  const teacher = useSelector((state) => state.user.userInfo.user.teacher);
  const dispatch = useDispatch();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { socket, chatMessages, setChatMessages } = useSocketManager(
    room,
    username,
    email
  );
  const { allMessages, fetchArchivedMessages, hasMore } = useArchivedMessages(
    room,
    chatMessages
  );
  const {
    uploading,
    error,
    file,
    sendMessage,
    handleFileChange,
    uploadFile,
    clearFile,
  } = useMessageHandler(socket, room, username, email);

  const handleClearFile = () => {
    clearFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileClick = (fileUrl) => setSelectedFile(fileUrl);
  const handleCloseModal = () => setSelectedFile(null);
  const handleDownload = () => {
    if (selectedFile) {
      window.open(selectedFile, "_blank");
      handleCloseModal();
    }
  };
  const handlePreview = () => {
    if (selectedFile) {
      dispatch(openFilePreview(selectedFile));
      handleCloseModal();
    }
  };

  const { formatMessageWithLinks, formatTimestamp, renderFileMessage } =
    useMessageFormatter(handleFileClick);

  const {
    message,
    setMessage,
    showEmojiPicker,
    setShowEmojiPicker,
    handleInput,
    handleKeyDown,
    handleEmojiClick,
    resetTextarea,
  } = useChatInput((message, setMessage, resetTextarea) =>
    sendMessage(message, setMessage, resetTextarea)
  );

  const {
    handleDeleteNormalMessage,
    handleEditMessage,
    toggleOptionsMenu,
    openMessageId,
  } = useDeleteMessage(setChatMessages, socket, room);

  const isArchivedFetch = useRef(false);
  const prevScrollHeight = useRef(null);

  const handleLoadMore = async () => {
    if (scrollContainerRef.current) {
      prevScrollHeight.current = scrollContainerRef.current.scrollHeight;
    }
    isArchivedFetch.current = true;
    await fetchArchivedMessages();
  };

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    if (isArchivedFetch.current) {
      scrollContainer.scrollTop =
        scrollContainer.scrollHeight - prevScrollHeight.current;
      isArchivedFetch.current = false;
    } else {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [allMessages]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: height || "630px" }}
    >
      {/* ── Header ── */}
      <div className="relative flex-shrink-0">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-80 z-10" />

        {/* Light bg */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,255,0.95) 100%)",
          }}
        />
        {/* Dark bg */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(135deg, rgba(13,10,30,0.85) 0%, rgba(26,26,46,0.85) 100%)",
          }}
        />

        <div className="relative z-10 flex items-center px-4 py-3 border-b border-[#9E2FD0]/10 dark:border-[#9E2FD0]/20 mt-[2px] gap-3">
          {/* Back button — shown when coming from chat list (onBack) or isChatOpen */}
          {onBack && (
            <button
              onClick={onBack}
              className="flex-shrink-0 p-1.5 rounded-lg text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiArrowLeft size={16} />
            </button>
          )}
          {isChatOpen && !onBack && (
            <button
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                setShowChat(!setShowChat);
              }}
              className="flex-shrink-0 p-1.5 rounded-lg text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/10 transition-colors"
            >
              <FiArrowLeft size={16} />
            </button>
          )}

          {/* Icon badge */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
              boxShadow: "0 2px 8px rgba(158,47,208,0.35)",
            }}
          >
            <FiMessageSquare size={14} className="text-white" />
          </div>

          {/* Name + online dot */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-extrabold login-gradient-text truncate">
              {user.role === "user"
                ? teacher
                  ? teacher.name
                  : "No teacher yet"
                : studentName}
            </span>
            {user.role === "user" && teacher && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    teacher?.online === "online" ? "#26D9A1" : "#ef4444",
                }}
                title={teacher?.online === "online" ? "Online" : "Offline"}
              />
            )}
          </div>

          {/* Student dropdown */}
          {user.role === "user" && (
            <Dropdown>
              <button
                onClick={() => handleJoinMeeting()}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                role="menuitem"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a3.001 3.001 0 015.644 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Group Class
              </button>
            </Dropdown>
          )}
        </div>
      </div>

      {/* ── Message area ── */}
      <PerfectScrollbar
        containerRef={(ref) => (scrollContainerRef.current = ref)}
        className="flex-1 p-6 bg-slate-100 dark:bg-brand-dark"
      >
        {hasMore && (
          <div className="text-center">
            <button
              onClick={handleLoadMore}
              className="my-2 py-1 px-4 bg-white border border-gray-300 text-gray-600 text-sm rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            >
              Load more messages
            </button>
          </div>
        )}

        <ul className="space-y-4">
          {allMessages.map((msg, index) => {
            const showTimestamp =
              index === 0 ||
              new Date(msg.timestamp) -
                new Date(allMessages[index - 1].timestamp) >
                3 * 60 * 1000;
            const isSender = msg.email === email;
            const isFileMessage = msg.message.startsWith("http");

            return (
              <div key={index}>
                {showTimestamp && (
                  <div className="text-center text-gray-500 text-xs my-4">
                    {formatTimestamp(msg.timestamp)}
                  </div>
                )}
                <li
                  className={`flex items-end gap-3 ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`relative max-w-xs p-4 rounded-2xl shadow-md text-sm ${
                      isSender
                        ? "text-white rounded-br-none"
                        : "bg-white dark:bg-brand-dark-secondary text-gray-800 dark:text-white rounded-bl-none"
                    }`}
                    style={
                      isSender
                        ? {
                            background:
                              "linear-gradient(135deg, #9E2FD0, #7b22a8)",
                            boxShadow: "0 3px 12px rgba(158,47,208,0.35)",
                          }
                        : {}
                    }
                  >
                    {isSender && (
                      <div className="absolute top-1/2 -left-10 transform -translate-y-1/2">
                        <button
                          onClick={() => toggleOptionsMenu(msg.id)}
                          className="p-2 hover:bg-gray-200 rounded-full"
                        >
                          <BsThreeDots className="text-gray-500" />
                        </button>
                      </div>
                    )}
                    <div
                      style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
                    >
                      {isFileMessage
                        ? renderFileMessage(msg.message, isSender)
                        : formatMessageWithLinks(msg.message, isSender)}
                    </div>
                    {openMessageId === msg.id && (
                      <div className="absolute top-full mt-1 left-0 z-10">
                        <MessageOptionsCard
                          onEdit={() => handleEditMessage(msg)}
                          onDelete={() => handleDeleteNormalMessage(msg.id)}
                        />
                      </div>
                    )}
                  </div>
                </li>
              </div>
            );
          })}
        </ul>
      </PerfectScrollbar>

      {/* ── File preview modal ── */}
      {selectedFile && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-72">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              File Options
            </h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={handlePreview}
                className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Preview
              </button>
              <button
                onClick={handleDownload}
                className="py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Download
              </button>
              <button
                onClick={handleCloseModal}
                className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input area ── */}
      <div className="p-3 bg-transparent">
        {file && (
          <div className="p-3 mb-3 border rounded-lg bg-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 truncate">{file.name}</p>
              <button
                onClick={handleClearFile}
                className="text-red-500 hover:text-red-700"
              >
                <FiX />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ready to send.</p>
          </div>
        )}
        {uploading && (
          <p className="text-sm text-purple-600 mb-2">Uploading...</p>
        )}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="relative flex items-center">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="w-full p-3 pr-24 bg-gray-100 dark:bg-brand-dark border-none rounded-lg focus:outline-none text-gray-800 dark:text-white resize-none text-sm"
              disabled={!!file}
              style={{ maxHeight: "150px", overflowY: "auto" }}
              rows={1}
            />
            <div className="absolute bottom-1/2 right-4 transform translate-y-1/2 flex items-center gap-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-purple-600"
              >
                <BsEmojiSmile size={22} />
              </button>
              <label
                htmlFor="fileInput"
                className="text-gray-500 hover:text-purple-600 cursor-pointer"
              >
                <BsPaperclip size={22} />
              </label>
              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>
          <button
            onClick={
              file
                ? uploadFile
                : () => sendMessage(message, setMessage, resetTextarea)
            }
            className="ml-2 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #9E2FD0, #7b22a8)",
              boxShadow: "0 3px 12px rgba(158,47,208,0.4)",
            }}
            disabled={uploading || (!message.trim() && !file)}
          >
            <FiSend size={16} className="text-white" />
          </button>
        </div>
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-4 z-10">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
