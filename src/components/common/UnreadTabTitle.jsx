import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectTotalUnread } from "../../redux/notificationsSlice";

const BASE_TITLE = "Lingolandias";

// Prefixes the browser tab title with the unread count — same idea as
// Gmail/Slack's tab badge, so a background tab still communicates "you have
// something new" without needing to be focused.
const UnreadTabTitle = () => {
  const totalUnread = useSelector(selectTotalUnread);

  useEffect(() => {
    document.title = totalUnread > 0 ? `(${totalUnread > 99 ? "99+" : totalUnread}) ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [totalUnread]);

  return null;
};

export default UnreadTabTitle;
