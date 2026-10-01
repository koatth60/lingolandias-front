// Extracted from components/buttons/chatList.jsx's "Actions" dropdown, which
// used to live above the now-hidden 1:1 chat list on this page. Messages
// (the new Teams-style chat) replaces that chat list, but "Edit Calendar",
// "Group Class" and the teacher-meeting-room shortcuts aren't chat features
// at all — they belong here regardless of what happens to the old chat UI.
// Deliberately minimal chrome: this used to be a full header bar (icon +
// "Messages" label) copied from the old chat sidebar, which made no sense
// once there's no chat list under it — the calendar right below already has
// its own title, so this is just the dropdown, right-aligned.
import { useTranslation } from "react-i18next";
import { FiUsers, FiVideo } from "react-icons/fi";
import Dropdown from "./Dropdown";
import { meetingRooms } from "../../constants";

const ScheduleActionsBar = ({ user, handleJoinMeeting, loading }) => {
  const { t } = useTranslation();

  return (
    <div>
        <Dropdown
          buttonText={t("common.actions")}
          buttonClassName="ll-btn ll-btn-primary ll-btn-sm"
        >
          {(user.role === "teacher" || user.role === "user") && (
            <button
              onClick={() => handleJoinMeeting()}
              className="block w-full text-left px-4 py-2 text-sm text-ll-ink2 hover:bg-ll-hover flex items-center"
              role="menuitem"
            >
              <FiUsers className="mr-2" /> {t("chatList.groupClass")}
            </button>
          )}
          {!loading &&
            (user.role === "teacher" || user.role === "admin") &&
            Object.entries(meetingRooms).map(([lang, roomName]) => {
              // A teacher with no language set (accounts can exist without
              // one) used to crash this whole page — .includes() on null.
              const shouldRender =
                user.role === "admin" || (user.role === "teacher" && user.language?.includes(lang));
              if (!shouldRender) return null;
              return (
                <button
                  key={lang}
                  onClick={() => handleJoinMeeting(roomName)}
                  className="block w-full text-left px-4 py-2 text-sm text-ll-ink2 hover:bg-ll-hover flex items-center"
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
