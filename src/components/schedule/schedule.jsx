import HalloweenChatScene from "../common/HalloweenChatScene";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import Dashboard from "../../sections/dashboard";
import Navbar from "../layout/navbar";
import MobileClassList from "./MobileClassList";
import useFormattedEvents from "../../hooks/useFormattedEvents";
import { normalizeCalendarRange } from "../../utils/scheduleProjection";
import useEventEdit from "../../hooks/useEventEdit";
import "react-big-calendar/lib/css/react-big-calendar.css";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/pl";
import { useEffect, useState } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import CustomToolbar from "./customToolBar";
import ScheduleActionsBar from "./ScheduleActionsBar";
import {
  addStudentSchedule,
  removeStudentSchedules,
  updateStudentSchedule,
  setStudentSchedules,
  addStudentToTeacher,
  setStudentTeacher,
  removeStudent,
  removeTeacherSchedules,
  addTeacherSchedule,
  updateTeacherSchedule,
  setTeacherSchedules,
} from "../../redux/userSlice";
import { socket } from "../../socket";
import { meetingRooms, teacherChats } from "../../constants";
import EditEventTimeModal from "./EditEventTimeModal";
import EventParticipantsModal from "./EventParticipantsModal";
import EventActionsMenu from "./EventActionsMenu";
import Dropdown from "./Dropdown";
import TeacherPanel from "./TeacherPanel";
import AdminMeetingRooms from "./AdminMeetingRooms";
import NewClassModal from "./NewClassModal";
import { FiMessageSquare, FiUsers, FiChevronDown, FiCalendar } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Schedule = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector((state) => state.user.userInfo.user);
  const header = user.role === "admin" ? t("schedule.meetingRooms") : t("schedule.mySchedule");
  const isChatVisible =
    (user.role === "teacher" && user.students && user.students.length > 0) ||
    ((user.role === "user" || user.role === "invitado") && user.teacher);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [editTimeEvent, setEditTimeEvent] = useState(null);
  const [participantsEvent, setParticipantsEvent] = useState(null);
  const [teacherPanelOpen, setTeacherPanelOpen] = useState(false);
  const [newClassSlot, setNewClassSlot] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // One-shot deep link from Home's "Next Sessions" calendar icon — jump the
  // calendar to that session's week on arrival, mirroring the openDmWithUserId
  // pattern already used by messages.jsx for the "message this person" link.
  const [initialFocusDate] = useState(() =>
    location.state?.focusDate ? dayjs(location.state.focusDate) : null
  );
  useEffect(() => {
    if (location.state?.focusDate) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.focusDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tracks whatever the calendar is currently displaying — recurring classes are
  // projected only within this window (see useFormattedEvents/scheduleProjection),
  // updated live as the calendar is navigated instead of a fixed cutoff.
  const [calendarRange, setCalendarRange] = useState(() => {
    const base = initialFocusDate || dayjs();
    return {
      start: base.startOf("week").toDate(),
      end: base.add(6, "week").toDate(),
    };
  });
  const events = useFormattedEvents(user, calendarRange);

  const {
    eventDetails,
    handleEventEdit,
    handleEventDetailsChange,
    handleSubmitEvent,
    setSelectedDate,
  } = useEventEdit(undefined, () => setEditTimeEvent(null));

  // Opened from an event's "..." menu — jumps straight into editing THIS
  // occurrence's time, no page-level "Edit Calendar" toggle or mini-calendar
  // slot-click detour needed first.
  const openEditTime = (event) => {
    handleEventEdit(event);
    setSelectedDate(event.start);
    setEditTimeEvent(event);
  };

  const openParticipants = (event) => setParticipantsEvent(event);

  // Complementary to scheduling a class from a chat (Messages) — clicking an
  // empty slot on the teacher's own calendar goes straight to "who's coming
  // and at what time" since the time is already implied by the click.
  const handleSelectSlot = ({ start: slotStart, end: slotEnd }) => {
    if (user.role !== "teacher") return;
    setNewClassSlot({ start: slotStart, end: slotEnd });
  };

  useEffect(() => {
    if (user.role === "teacher") {
      setTeacherInfo(user.teacher);
    }

    if (events !== undefined) {
      setLoading(false);
    }
  }, [user, events]);

  // On mount: students fetch their full profile (teacher + schedules) so any
  // changes made while the tab was closed are applied immediately.
  useEffect(() => {
    if ((user.role === 'user' || user.role === 'invitado') && user.id) {
      const token = localStorage.getItem("token");
      fetch(`${BACKEND_URL}/users/student-profile/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch student profile');
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data.studentSchedules)) {
            dispatch(setStudentSchedules(data.studentSchedules));
          }
          dispatch(setStudentTeacher(data.teacher ?? null));
        })
        .catch((err) => console.error('Failed to refresh student profile:', err));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Teacher-side equivalent — a teacher's own teacherSchedules previously
  // never refetched on its own, only ever updated via live socket (which
  // only works while this page happens to be mounted) or their own local
  // optimistic dispatches right after their own scheduling actions. Anything
  // scheduled/renamed elsewhere while they weren't on this page stayed stale
  // until their next login.
  useEffect(() => {
    if (user.role === 'teacher' && user.id) {
      const token = localStorage.getItem("token");
      fetch(`${BACKEND_URL}/users/teacher-profile/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch teacher profile');
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data.teacherSchedules)) {
            dispatch(setTeacherSchedules(data.teacherSchedules));
          }
        })
        .catch((err) => console.error('Failed to refresh teacher profile:', err));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.id) {
      const handleScheduleUpdated = ({ studentId, teacherId, action, schedule, eventIds }) => {
        if ((user.role === 'user' || user.role === 'invitado') && user.id === studentId) {
          if (action === 'add') dispatch(addStudentSchedule(schedule));
          else if (action === 'remove') dispatch(removeStudentSchedules(eventIds));
          else if (action === 'modify') dispatch(updateStudentSchedule(schedule));
        } else if (
          user.role === 'teacher' &&
          (user.id === (schedule?.teacherId || teacherId) || schedule?.coTeacherIds?.includes(user.id))
        ) {
          // Covers class changes triggered from the Messages/group-chat side
          // (renamed, member added/removed) — those already work for every
          // other participant via socket, this keeps the teacher's own
          // calendar live too instead of only updating on next refresh.
          if (action === 'add') dispatch(addTeacherSchedule(schedule));
          else if (action === 'remove') dispatch(removeTeacherSchedules(eventIds));
          else if (action === 'modify') dispatch(updateTeacherSchedule(schedule));
        }
      };

      const handleStudentAssigned = ({ teacherId, studentId, schedules, student, teacher }) => {
        if (user.role === 'teacher' && user.id === teacherId) {
          dispatch(addStudentToTeacher({ student, schedules }));
        } else if ((user.role === 'user' || user.role === 'invitado') && user.id === studentId) {
          dispatch(setStudentTeacher(teacher));
          schedules.forEach(s => dispatch(addStudentSchedule(s)));
        }
      };

      const handleStudentRemoved = ({ teacherId, studentIds, deletedScheduleIds }) => {
        if (user.role === 'teacher' && user.id === teacherId) {
          studentIds.forEach(id => dispatch(removeStudent(id)));
          dispatch(removeTeacherSchedules(deletedScheduleIds));
        } else if ((user.role === 'user' || user.role === 'invitado') && studentIds.includes(user.id)) {
          dispatch(setStudentTeacher(null));
          dispatch(removeStudentSchedules(deletedScheduleIds));
        }
      };

      socket.on("scheduleUpdated", handleScheduleUpdated);
      socket.on("studentAssigned", handleStudentAssigned);
      socket.on("studentRemoved", handleStudentRemoved);

      return () => {
        socket.off("scheduleUpdated", handleScheduleUpdated);
        socket.off("studentAssigned", handleStudentAssigned);
        socket.off("studentRemoved", handleStudentRemoved);
      };
    }
  }, [user, dispatch]);

  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  const localizer = dayjsLocalizer(dayjs);

  const CustomEvent = ({ event }) => (
    <div className="group relative flex items-center justify-center text-center h-full w-full text-[10px] sm:text-[13px] flex-wrap gap-1">
      {event.isGroupClass && <FiUsers size={10} className="hw-hide flex-shrink-0" />}
      {event.isGroupClass ? (<svg className="hw-only flex-shrink-0" width="12" height="13" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2C10.5 2 4 9.5 4 19.5V42l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V19.5C36 9.5 29.5 2 20 2z" fill="rgba(246,242,255,.94)" /><ellipse cx="14.5" cy="19" rx="3" ry="4" fill="#140E1C" /><ellipse cx="25.5" cy="19" rx="3" ry="4" fill="#140E1C" /></svg>) : (<svg className="hw-only flex-shrink-0" width="13" height="12" viewBox="0 0 96 90" aria-hidden="true"><path d="M48 20c-1-7 2-12 7-15" stroke="#3CCB8F" strokeWidth="6" fill="none" strokeLinecap="round" /><ellipse cx="30" cy="53" rx="21" ry="30" fill="#C85E12" /><ellipse cx="66" cy="53" rx="21" ry="30" fill="#C85E12" /><ellipse cx="48" cy="53" rx="22" ry="33" fill="#F08A2C" /><path d="M28 47l8-12 8 12zM52 47l8-12 8 12z" fill="#FFE08A" /><path d="M24 64c8 9 40 9 48 0l-6 2-4-4-5 4-5-4-5 4-5-4-4 4z" fill="#FFE08A" /></svg>)}
      <span>{event.title}</span>
      {user.role === "teacher" && (
        <EventActionsMenu
          onEditTime={() => openEditTime(event)}
          onManageParticipants={() => openParticipants(event)}
        />
      )}
    </div>
  );

  // Wraps CustomToolbar so it can render the Actions dropdown (Group Class /
  // teacher-meeting shortcuts) right in its own toolbar row, next to the
  // Week/Day/Agenda switcher — react-big-calendar only passes a fixed prop
  // set to `toolbar`, so this closure is how extra props get in. Time/
  // participant editing used to live behind this dropdown's "Edit Calendar"
  // toggle — that's now the per-event "..." menu (see EventActionsMenu).
  const CustomToolbarWithActions = (toolbarProps) => (
    <CustomToolbar
      {...toolbarProps}
      actionsBar={
        user.role !== "admin" && (
          <ScheduleActionsBar
            user={user}
            handleJoinMeeting={handleJoinMeeting}
            loading={loading}
          />
        )
      }
    />
  );

  const handleEventClick = (event) => {
    const roomId = event.roomId || event.studentId;
    const userName = user.name;
    const email = user.email;

    // A class scheduled from a group chat has no single "other side" to
    // ring directly — roomId is the conversation id, and the ring falls
    // back to the room's existing conversation members (same convention
    // handleJoinMeeting already uses for the teacher's own multi-student room).
    if (event.isGroupClass) {
      navigate("/classroom", {
        state: { roomId, chatRoomId: roomId, userName, email, fromMeeting: false, chatName: event.title, chatType: "group" },
      });
      return;
    }

    const student = user.students?.find((s) => s.id === event.studentId);
    const chatName = student?.name;
    // otherUserId lets the incoming-call ring reach the other side
    // directly even if roomId doesn't correspond to a real conversations
    // row yet — same convention as joinClassHandler.js's shared flow.
    const otherUserId = (user.role === "user" || user.role === "invitado") ? user.teacher?.id : event.studentId;
    navigate("/classroom", {
      state: { roomId, chatRoomId: roomId, userName, email, fromMeeting: false, chatName, chatType: "private", otherUserId },
    });
  };

  const handleJoinMeeting = (roomName = null) => {
    const userName = user.name;
    const email = user.email;
    let roomId = "";
    let chatName = "";

    if (roomName) {
      if (roomName === meetingRooms.english) { roomId = teacherChats.english.id; chatName = teacherChats.english.name; }
      else if (roomName === meetingRooms.spanish) { roomId = teacherChats.spanish.id; chatName = teacherChats.spanish.name; }
      else if (roomName === meetingRooms.polish) { roomId = teacherChats.polish.id; chatName = teacherChats.polish.name; }
    } else {
      if (user.role === "teacher") { roomId = user.id; }
      else if (user.role === "user" || user.role === "invitado") { roomId = user.teacher.id; }
    }

    // Only the student side has one specific "other side" to ring directly —
    // a teacher's own room can have several different students join it, so
    // there's no single otherUserId to target there; the incoming-call ring
    // falls back to the room's existing conversation members in that case.
    const otherUserId = !roomName && (user.role === "user" || user.role === "invitado") ? user.teacher?.id : undefined;
    const params = { roomId, chatRoomId: roomId, userName, email, fromMeeting: true, chatName, chatType: roomName ? "teacher" : "group", otherUserId };

    navigate("/classroom", { state: params });
  };

  return (
    <div className="flex w-full relative min-h-screen bg-ll-canvas">
      <Dashboard />

      <div className="ll-shell w-full relative z-10 flex flex-col">
        <Navbar header={header} />

        <div
          className={`mt-3 sm:mt-4 flex flex-col xl:flex-row gap-4 px-3 sm:px-4 pb-6 flex-1 ${
            !isChatVisible && user.role !== "admin" ? "justify-center" : ""
          }`}
        >
          {user.role === "admin" ? (
            <AdminMeetingRooms onJoinMeeting={handleJoinMeeting} />
          ) : (
            <>
              {/* ── Calendar (desktop) / Class list (mobile) ── */}
              <div className="lg:flex-grow">
                {events.length > 0 || user.role === "teacher" ? (
                  <>
                    {/* Desktop: full calendar */}
                    <div className="ll-card relative overflow-hidden hidden lg:block">
                      <svg className="hw-only absolute left-0 top-0 w-[54px] h-[54px] z-[5] pointer-events-none opacity-70" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8 }} viewBox="0 0 54 54" aria-hidden="true"><path d="M0 0l54 54M0 0l26 54M0 0l54 24" /><path d="M0 14c8 0 14-2 14-14M0 28c16 0 26-6 28-28M0 42c24 0 38-10 42-42" /></svg>
                      <svg className="hw-only absolute right-3.5 bottom-0 w-[54px] h-[54px] z-[5] pointer-events-none opacity-70" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8, transform: 'rotate(180deg)' }} viewBox="0 0 54 54" aria-hidden="true"><path d="M0 0l54 54M0 0l26 54M0 0l54 24" /><path d="M0 14c8 0 14-2 14-14M0 28c16 0 26-6 28-28M0 42c24 0 38-10 42-42" /></svg>
                      <svg className="hw-only absolute left-[34%] top-1.5 w-[120px] h-[50px] z-[5] pointer-events-none" style={{ fill: 'rgb(var(--ll-ink-4))', opacity: .55 }} viewBox="0 0 170 70" aria-hidden="true">
                        <svg x="10" y="30" width="40" height="16" viewBox="0 0 40 16"><path className="ll-bob" d="M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3" /></svg>
                        <svg x="70" y="8" width="28" height="11" viewBox="0 0 40 16"><path className="ll-bob" d="M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3" /></svg>
                        <svg x="118" y="44" width="22" height="9" viewBox="0 0 40 16"><path className="ll-bob" d="M20 5.5c.8-1.6 1.6-2.3 2.2-2.3.2.9.1 1.6-.3 2.2 2.6-.4 5.9-2.3 8.4-5.4.3 2.6 2.9 4.9 9.7 5.2-3.4 1-5.9 3.5-6.4 7.6-1.7-1.9-4.4-2.4-6.2-1-1.3-1.9-3.6-2.8-5.3-1.3-.8-.6-1.5-.6-2.2 0-1.7-1.5-4-.6-5.3 1.3-1.8-1.4-4.5-.9-6.2 1C7.9 8.7 5.4 6.2 2 5.2 8.8 4.9 11.4 2.6 11.7 0c2.5 3.1 5.8 5 8.4 5.4-.4-.6-.5-1.3-.3-2.2.6 0 1.4.7 2.2 2.3" /></svg>
                      </svg>
                      <HalloweenChatScene calm gyBottom="bottom-0" fogBottom="bottom-0" gyHeight="h-24" />
                      <div className="hw-only absolute top-[104px] right-[3%] w-[72px] h-[72px] rounded-full z-[2] pointer-events-none opacity-55" style={{ background: 'radial-gradient(circle at 38% 35%,#FFF6E0 0%,#FFE3A8 42%,#F2C46A 78%,#D9A24A 100%)', boxShadow: '0 0 40px 8px rgba(245,196,81,.18),0 0 120px 30px rgba(240,138,44,.08)' }} aria-hidden="true">
                        <span className="absolute rounded-full" style={{ width: '20%', height: '20%', left: '52%', top: '23%', background: 'rgba(170,110,40,.22)' }} />
                        <span className="absolute rounded-full" style={{ width: '12%', height: '12%', left: '27%', top: '59%', background: 'rgba(170,110,40,.22)', boxShadow: '22px 5px 0 -3px rgba(170,110,40,.2)' }} />
                      </div>
                        <div className="relative z-[1] h-[630px]">
                        <PerfectScrollbar
                          className={user?.settings?.darkMode ? "dark-scrollbar" : ""}
                        >
                          <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            defaultDate={initialFocusDate ? initialFocusDate.toDate() : undefined}
                            defaultView="week"
                            step={60}
                            timeslots={1}
                            onSelectEvent={handleEventClick}
                            selectable={user.role === "teacher"}
                            onSelectSlot={handleSelectSlot}
                            onRangeChange={(range) => setCalendarRange(normalizeCalendarRange(range))}
                            eventPropGetter={(event) => ({
                              className: event.isGroupClass ? "rbc-event-group" : "rbc-event-solo",
                            })}
                            style={{ height: '100%', minHeight: '630px' }}
                            formats={{
                              eventTimeRangeFormat: () => "",
                              timeGutterFormat: 'HH:mm',
                            }}
                            components={{
                              event: CustomEvent,
                              toolbar: CustomToolbarWithActions,
                            }}
                          />
                        </PerfectScrollbar>
                      </div>
                    </div>

                    {/* Mobile: class list cards */}
                    <div className="lg:hidden ll-card overflow-hidden max-sm:!border-0 max-sm:!bg-transparent max-sm:!rounded-none">
                      <div className="p-4 max-sm:p-0">
                        <div className="flex items-center gap-2 mb-4 max-sm:px-1">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-violet-tint text-ll-violet-ink">
                            <FiMessageSquare size={14} />
                          </div>
                          <span className="text-[13.5px] font-semibold text-ll-ink">
                            {t("mobileSchedule.upcomingClasses")}
                          </span>
                        </div>
                        <MobileClassList
                          events={events}
                          onEventClick={handleEventClick}
                          onEditTime={openEditTime}
                          onManageParticipants={openParticipants}
                          user={user}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Empty state */
                  <div className="ll-card flex items-center justify-center" style={{ height: '400px' }}>
                    <div className="text-center px-6">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-ll-violet-tint text-ll-violet-ink">
                        <FiCalendar size={24} />
                      </div>
                      <h2 className="text-[16px] font-semibold text-ll-ink mb-1.5">
                        {user.role === "teacher" ? t("schedule.noStudents") : t("schedule.noTeacher")}
                      </h2>
                      <p className="text-[13.5px] text-ll-ink3 max-w-xs mx-auto">
                        {user.role === "teacher"
                          ? t("schedule.contactAdmin")
                          : t("schedule.contactAdminStudent")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Teacher panel */}
        {user.role === "teacher" && user.students && user.students.length > 0 && (
          <div className="px-3 sm:px-4 pb-6">
            {/* Desktop: show directly */}
            <div className="hidden lg:block">
              <TeacherPanel
                students={user.students}
                events={events}
                teacherId={user.id}
                teacherName={`${user.name} ${user.lastName}`}
              />
            </div>
            {/* Mobile: collapsible */}
            <div className="lg:hidden">
              <button
                onClick={() => setTeacherPanelOpen((p) => !p)}
                className="ll-card w-full flex items-center justify-between p-4 transition-colors hover:bg-ll-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-ll-violet-tint text-ll-violet-ink">
                    <FiUsers size={15} />
                  </div>
                  <span className="text-[13.5px] font-semibold text-ll-ink">
                    {t("teacherPanel.title")}
                  </span>
                  <span className="ll-pill bg-ll-violet-tint text-ll-violet-ink">
                    {user.students.length}
                  </span>
                </div>
                <FiChevronDown
                  size={18}
                  className={`text-ll-ink3 transition-transform duration-200 ${teacherPanelOpen ? "rotate-180" : ""}`}
                />
              </button>
              {teacherPanelOpen && (
                <TeacherPanel
                  embedded
                  students={user.students}
                  events={events}
                  teacherId={user.id}
                  teacherName={`${user.name} ${user.lastName}`}
                />
              )}
            </div>
          </div>
        )}

        {editTimeEvent && (
          <EditEventTimeModal
            eventTitle={editTimeEvent.title}
            eventDetails={eventDetails}
            handleEventDetailsChange={handleEventDetailsChange}
            handleSubmitEvent={handleSubmitEvent}
            onClose={() => setEditTimeEvent(null)}
          />
        )}

        {participantsEvent && (
          <EventParticipantsModal
            key={participantsEvent.roomId || participantsEvent.studentId}
            roomId={participantsEvent.roomId}
            studentId={participantsEvent.studentId}
            initialName={participantsEvent.title}
            isGroupClass={!!participantsEvent.isGroupClass}
            user={user}
            onClose={() => setParticipantsEvent(null)}
          />
        )}

        {newClassSlot && (
          <NewClassModal
            show
            teacherId={user.id}
            teacherName={`${user.name} ${user.lastName}`}
            teacherEmail={user.email}
            teacherAvatarUrl={user.avatarUrl}
            initialStart={newClassSlot.start}
            initialEnd={newClassSlot.end}
            onClose={() => setNewClassSlot(null)}
            onCreated={(schedules) => {
              schedules.forEach((s) => dispatch(addTeacherSchedule(s)));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Schedule;
