// Extracted from components/buttons/chatList.jsx's "Actions" dropdown, which
// used to live above the now-hidden 1:1 chat list on this page. Messages
// (the new Teams-style chat) replaces that chat list, but "Edit Calendar",
// "Group Class" and the teacher-meeting-room shortcuts aren't chat features
// at all — they belong here regardless of what happens to the old chat UI.
// Deliberately minimal chrome: this used to be a full header bar (icon +
// "Messages" label) copied from the old chat sidebar, which made no sense
// once there's no chat list under it — the calendar right below already has
// its own title, so this is just the dropdown, right-aligned.
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { FiEdit, FiUsers, FiVideo, FiXCircle } from "react-icons/fi";
import Dropdown from "./Dropdown";
import { meetingRooms } from "../../constants";

const ScheduleActionsBar = ({ user, handleJoinMeeting, setEditingEvent, editingEvent, loading }) => {
  const { t } = useTranslation();

  return (
    <div>
        <Dropdown
          buttonText={t("common.actions")}
          buttonClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-85"
          buttonStyle={{ background: "linear-gradient(135deg, #9E2FD0, #7b22a8)", boxShadow: "0 2px 8px rgba(158,47,208,0.35)" }}
        >
          {(user.role === "teacher" || user.role === "admin") && (
            <button
              onClick={() => {
                setEditingEvent((prev) => !prev);
                if (!editingEvent) {
                  Swal.fire({
                    title: t("chatList.editModeTitle"),
                    text: t("chatList.editModeText"),
                    icon: "info",
                    confirmButtonText: t("chatList.editModeConfirm"),
                    background: "#1a1a2e",
                    color: "#fff",
                    confirmButtonColor: "#9E2FD0",
                  });
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-[#9E2FD0] dark:text-[#c084fc] hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
              role="menuitem"
            >
              {editingEvent ? (
                <><FiXCircle className="mr-2" /> {t("chatList.cancelEdit")}</>
              ) : (
                <><FiEdit className="mr-2" /> {t("chatList.editCalendar")}</>
              )}
            </button>
          )}
          {(user.role === "teacher" || user.role === "user") && (
            <button
              onClick={() => handleJoinMeeting()}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
              role="menuitem"
            >
              <FiUsers className="mr-2" /> {t("chatList.groupClass")}
            </button>
          )}
          {!loading &&
            (user.role === "teacher" || user.role === "admin") &&
            Object.entries(meetingRooms).map(([lang, roomName]) => {
              const shouldRender =
                user.role === "admin" || (user.role === "teacher" && user.language.includes(lang));
              if (!shouldRender) return null;
              return (
                <button
                  key={lang}
                  onClick={() => handleJoinMeeting(roomName)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-[#9E2FD0]/5 dark:hover:bg-white/5 flex items-center"
                  role="menuitem"
                >
                  <FiVideo className="mr-2" /> {roomName}
                </button>
              );
            })}
        </Dropdown>
    </div>
  );
};

export default ScheduleActionsBar;
