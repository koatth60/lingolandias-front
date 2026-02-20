import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import Dashboard from "../../sections/dashboard";
import Navbar from "../navbar";
import ChatWindow from "../chatWindow";
import MainChat from "../buttons/chatList";
import useFormattedEvents from "../../hooks/useFormattedEvents";
import useEventEdit from "../../hooks/useEventEdit";
import "react-big-calendar/lib/css/react-big-calendar.css";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import "react-perfect-scrollbar/dist/css/styles.css";
import CustomToolbar from "../customToolBar";
import {
  fetchMessagesForTeacher,
  fetchUnreadCountsForStudent,
} from "../../redux/chatSlice";
import { io } from "socket.io-client";
import { meetingRooms, teacherChats } from "../../constants";
import EditEventModal from "./EditEventModal";
import Dropdown from "./Dropdown";
import TeacherPanel from "./TeacherPanel";
import AdminMeetingRooms from "./AdminMeetingRooms";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Schedule = () => {
  const user = useSelector((state) => state.user.userInfo.user);
  const header = user.role === "admin" ? "Meeting Rooms" : "My Schedule";
  const isChatVisible =
    (user.role === "teacher" && user.students && user.students.length > 0) ||
    (user.role === "user" && user.teacher);
  const [teacherChat, setTeacherChat] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [chatRoom, setChatRoom] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const events = useFormattedEvents(user);

  const {
    eventDetails,
    handleEventEdit,
    handleEventDetailsChange,
    handleSubmitEvent,
    openModalFrom,
    setOpenModalFrom,
    handleSelectSlot,
  } = useEventEdit();

  useEffect(() => {
    if (user.role === "teacher") {
      setTeacherChat(user.students);
      setTeacherInfo(user.teacher);
      setChatRoom(user.id);
    } else if (user.role === "user") {
      setChatRoom(user.id);
    }

    if (events !== undefined) {
      setLoading(false);
    }
  }, [user, events]);

  useEffect(() => {
    let socket;

    if (user?.id) {
      socket = io(`${BACKEND_URL}`, {
        autoConnect: true,
        reconnection: true
      });

      const handleNewChat = () => {
        if (user.role === 'teacher') {
          dispatch(fetchMessagesForTeacher());
        } else if (user.role === 'user') {
          dispatch(fetchUnreadCountsForStudent());
        }
      };

      socket.on("newChat", handleNewChat);

      return () => {
        if (socket) {
          socket.off("newChat", handleNewChat);
          socket.disconnect();
        }
      };
    }
  }, [user, dispatch]);

  const localizer = dayjsLocalizer(dayjs);

  const CustomEvent = ({ event }) => (
    <div className="flex items-center justify-center text-center h-full text-[10px] sm:text-[13px] flex-wrap">
      <span>{event.title}</span>
    </div>
  );

  const handleEventClick = (event) => {
    if (editingEvent) {
      handleEventEdit(event);
      setIsModalOpen(true);
    } else {
      const roomId = event.studentId;
      const userName = user.name;
      const email = user.email;
      navigate("/classroom", {
        state: { roomId, userName, email, fromMeeting: false },
      });
    }
  };

  const handleJoinMeeting = (roomName = null) => {
    const userName = user.name;
    const email = user.email;
    let roomId = "";

    if (roomName) {
      if (roomName === meetingRooms.english) roomId = teacherChats.english.id;
      else if (roomName === meetingRooms.spanish) roomId = teacherChats.spanish.id;
      else if (roomName === meetingRooms.polish) roomId = teacherChats.polish.id;
    } else {
      if (user.role === "teacher") {
        roomId = user.id;
      } else if (user.role === "user") {
        roomId = user.teacher.id;
      }
    }

    navigate("/classroom", {
      state: { roomId, userName, email, fromMeeting: true },
    });
  };

  return (
    <div className="flex w-full relative min-h-screen">
      {/* Page background — light white / dark login gradient */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: 'linear-gradient(135deg, #f8f8fa 0%, #f2f2f6 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a1a2e 55%, #110e28 100%)' }}
      />
      {/* Ambient orbs on page level */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(158,47,208,0.6), transparent 70%)', width: '600px', height: '600px', top: '-10%', right: '-5%' }} />
        <div className="absolute rounded-full blur-3xl opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(38,217,161,0.4), transparent 70%)', width: '400px', height: '400px', bottom: '5%', left: '10%' }} />
      </div>
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.012] dark:opacity-[0.020]"
        style={{
          backgroundImage: `linear-gradient(rgba(158,47,208,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(158,47,208,0.8) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <Dashboard />

      <div className="w-full relative z-10 flex flex-col min-h-screen">
        <Navbar header={header} />

        <div
          className={`mt-4 flex flex-col xl:flex-row gap-4 px-4 pb-6 ${
            !isChatVisible && user.role !== "admin" ? "justify-center" : ""
          }`}
        >
          {user.role === "admin" ? (
            <AdminMeetingRooms onJoinMeeting={handleJoinMeeting} />
          ) : (
            <>
              {/* ── Calendar container ── */}
              <div className="lg:flex-grow">
                {events.length > 0 ? (
                  /* Glassmorphism calendar card */
                  <div
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                      border: '1px solid rgba(158,47,208,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(158,47,208,0.06)',
                    }}
                  >
                    {/* Light mode glass */}
                    <div
                      className="absolute inset-0 dark:hidden"
                      style={{
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      }}
                    />
                    {/* Dark mode glass */}
                    <div
                      className="absolute inset-0 hidden dark:block"
                      style={{
                        background: 'rgba(13,10,30,0.65)',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                      }}
                    />

                    {/* Content */}
                    <div className="relative z-10 h-[630px]">
                      <PerfectScrollbar
                        className={user?.settings?.darkMode ? "dark-scrollbar" : ""}
                      >
                        <Calendar
                          localizer={localizer}
                          events={events}
                          startAccessor="start"
                          endAccessor="end"
                          defaultView="week"
                          step={60}
                          timeslots={1}
                          onSelectEvent={handleEventClick}
                          eventPropGetter={(event) => ({
                            style: {
                              background: event.type === 'group'
                                ? 'linear-gradient(135deg, #26D9A1, #1fa07a)'
                                : 'linear-gradient(135deg, #9E2FD0, #7b22a8)',
                              color: 'white',
                              borderRadius: '8px',
                              border: 'none',
                              boxShadow: event.type === 'group'
                                ? '0 3px 10px rgba(38,217,161,0.35)'
                                : '0 3px 10px rgba(158,47,208,0.35)',
                              fontSize: '0.82em',
                              padding: '3px 8px',
                            },
                          })}
                          style={{ height: '100%', minHeight: '630px' }}
                          formats={{
                            eventTimeRangeFormat: () => "",
                            timeGutterFormat: 'HH:mm',
                          }}
                          components={{
                            event: CustomEvent,
                            toolbar: CustomToolbar,
                          }}
                        />
                      </PerfectScrollbar>
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div
                    className="relative rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                      height: '400px',
                      border: '1px solid rgba(158,47,208,0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="absolute inset-0 dark:hidden" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
                    <div className="absolute inset-0 hidden dark:block" style={{ background: 'rgba(13,10,30,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }} />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-60" />
                    <div className="relative z-10 text-center px-6">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(158,47,208,0.15), rgba(246,184,46,0.08))', border: '1px solid rgba(158,47,208,0.2)' }}
                      >
                        <span className="text-3xl">📅</span>
                      </div>
                      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                        {user.role === "teacher" ? "No students assigned yet" : "No teacher assigned yet"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        {user.role === "teacher"
                          ? "Contact an administrator to get students assigned to you."
                          : "Contact an administrator to get a teacher assigned to you."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Chat sidebar ── */}
              {isChatVisible && (
                <div className="w-full xl:w-[350px] flex-shrink-0">
                  {user.role === "teacher" ? (
                    <MainChat
                      user={user}
                      username={user.name}
                      teacherChat={teacherChat}
                      email={user.email}
                      handleJoinMeeting={handleJoinMeeting}
                      setEditingEvent={setEditingEvent}
                      editingEvent={editingEvent}
                      loading={loading}
                    />
                  ) : (
                    <ChatWindow
                      username={user.name}
                      room={chatRoom}
                      email={user.email}
                      peerInfo={user.teacher}
                      handleJoinMeeting={handleJoinMeeting}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Teacher panel */}
        {user.role === "teacher" && user.students && user.students.length > 0 && (
          <div className="px-4 pb-6">
            <TeacherPanel
              students={user.students}
              events={events}
              teacherId={user.id}
              teacherName={`${user.name} ${user.lastName}`}
            />
          </div>
        )}

        <EditEventModal
          isModalOpen={isModalOpen}
          localizer={localizer}
          handleEventClick={handleEventClick}
          handleSelectSlot={handleSelectSlot}
          openModalFrom={openModalFrom}
          handleSubmitEvent={handleSubmitEvent}
          eventDetails={eventDetails}
          handleEventDetailsChange={handleEventDetailsChange}
          setOpenModalFrom={setOpenModalFrom}
          setIsModalOpen={setIsModalOpen}
          setEditingEvent={setEditingEvent}
        />
      </div>
    </div>
  );
};

export default Schedule;
