import {
  FiSmile, FiCalendar, FiMessageSquare, FiVideo,
  FiRadio, FiGrid, FiUserPlus, FiUser, FiSettings, FiHelpCircle,
} from "react-icons/fi";

const BUCKET = "https://lingolandias-academy.s3.eu-north-1.amazonaws.com/general-videos/course";

// Shared metadata for every video across both courses — id doubles as the
// i18n key under course.items.<id> and the S3 filename (<id>.mp4).
const SECTION_META = {
  welcome:    { icon: FiSmile },
  schedule:   { icon: FiCalendar },
  messages:   { icon: FiMessageSquare },
  recordings: { icon: FiVideo },
  support:    { icon: FiRadio },
  trello:     { icon: FiGrid },
  guests:     { icon: FiUserPlus },
  profile:    { icon: FiUser },
  settings:   { icon: FiSettings },
  "help-center": { icon: FiHelpCircle },
};

// Order mirrors the actual sidebar nav order for each role.
const TEACHER_IDS = ["welcome", "schedule", "messages", "recordings", "support", "trello", "guests", "profile", "settings", "help-center"];
const STUDENT_IDS = ["welcome", "schedule", "messages", "recordings", "profile", "settings", "help-center"];

const buildSections = (role, ids) => ids.map((id) => ({
  id,
  icon: SECTION_META[id].icon,
  url: `${BUCKET}/${role}/${id}.mp4`,
}));

export const COURSE_SECTIONS = {
  teacher: buildSections("teacher", TEACHER_IDS),
  student: buildSections("student", STUDENT_IDS),
};

// Every non-admin role maps onto one of the two courses above.
export const getCourseKeyForRole = (role) => (role === "teacher" ? "teacher" : "student");
