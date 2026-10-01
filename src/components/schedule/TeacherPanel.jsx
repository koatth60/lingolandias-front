import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import RemoveStudentModal from "./RemoveStudentModal";
import AddEventModal from "./AddEventModal";
import { removeStudent, updateUserEvents, addTeacherSchedule, removeTeacherSchedules } from "../../redux/userSlice";
import { addSchedule, removeSchedules } from "../../redux/schedulesSlice";
import { FiUserPlus, FiUserMinus, FiCalendar, FiMail, FiChevronRight } from "react-icons/fi";

const TeacherPanel = ({ students, events, teacherId, teacherName, embedded = false }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleStudentSelect = (student) => {
    const studentEvents = events.filter(
      (event) => event.studentId === student.id
    );
    setSelectedStudent({ ...student, events: studentEvents });
  };

  const getInitials = (name, lastName) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  };

  // Cycles through the palette's own tints instead of an arbitrary hsl hash —
  // keeps every avatar inside the same restrained system as the rest of the UI.
  const TINTS = ["bg-ll-violet-tint text-ll-violet-ink", "bg-ll-teal-tint text-ll-teal-ink", "bg-ll-gold-tint text-ll-gold-ink"];
  const tintFor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return TINTS[Math.abs(hash) % TINTS.length];
  };

  const handleRemoveStudent = async ({ events, removeAll }) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    try {
      if (removeAll) {
        // Unlinking the student, deleting their schedules, and deleting their chat
        // history all happen atomically in one backend transaction now — previously
        // this fired two separate requests in parallel, and a partial failure could
        // leave the student unlinked with their chat history still intact (or vice versa).
        const removeStudentResponse = await fetch(`${BACKEND_URL}/users/removeStudentsFromTeacher`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacherId: teacherId,
            studentIds: [selectedStudent.id],
          }),
        });

        if (removeStudentResponse.ok) {
          Swal.fire({
            title: t("common.success"),
            text: t("teacherPanel.removeStudentSuccess"),
            icon: "success",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: 'rgb(var(--ll-violet))',
          }).then(() => {
           if (selectedStudent && selectedStudent.id) {
             dispatch(removeStudent(selectedStudent.id));
             if (selectedStudent.events?.length > 0) {
               const ids = selectedStudent.events.map(e => e.id);
               dispatch(removeSchedules(ids));
               dispatch(removeTeacherSchedules(ids));
             }
           }
          });
        } else {
          Swal.fire({
            title: t("common.error"),
            text: t("teacherPanel.removeStudentError"),
            icon: "error",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: 'rgb(var(--ll-violet))',
          });
        }
      } else {
        const response = await fetch(`${BACKEND_URL}/users/removeEvents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventIds: events,
            teacherId: teacherId,
            studentId: selectedStudent.id,
          }),
        });

        if (response.ok) {
          Swal.fire({
            title: t("common.success"),
            text: t("teacherPanel.removeEventsSuccess"),
            icon: "success",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: 'rgb(var(--ll-violet))',
          }).then(() => {
           if (selectedStudent && selectedStudent.id) {
             const updatedEvents = selectedStudent.events
               .filter(event => !events.includes(event.id))
               .map(event => ({
                 ...event,
                 start: new Date(event.start).toISOString(),
                 end: new Date(event.end).toISOString(),
               }));
             dispatch(updateUserEvents({ studentId: selectedStudent.id, updatedEvents }));
             dispatch(removeSchedules(events));
             dispatch(removeTeacherSchedules(events));
           }
          });
        } else {
          Swal.fire({
            title: t("common.error"),
            text: t("teacherPanel.removeEventsError"),
            icon: "error",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: 'rgb(var(--ll-violet))',
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: t("common.error"),
        text: t("teacherPanel.unexpectedError"),
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: 'rgb(var(--ll-violet))',
      });
    }
    setIsRemoveModalOpen(false);
  };

  const handleAddEvent = async (eventDetails) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    try {
      const response = await fetch(`${BACKEND_URL}/users/add-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventDetails),
      });

      if (response.ok) {
        Swal.fire({
          title: t("common.success"),
          text: t("teacherPanel.addEventSuccess"),
          icon: "success",
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: 'rgb(var(--ll-violet))',
        }).then(async (result) => {
         if (result.isConfirmed) {
           try {
             const newEvent = await response.json();
             const serializedEvent = {
               ...newEvent,
               startTime: new Date(newEvent.startTime).toISOString(),
               endTime: new Date(newEvent.endTime).toISOString(),
               initialDateTime: new Date(newEvent.initialDateTime).toISOString(),
             };
             dispatch(addSchedule(serializedEvent));
             dispatch(addTeacherSchedule(serializedEvent));
           } catch (error) {
             console.error("Failed to parse JSON, state will not be updated:", error);
           }
         }
        });
      } else {
        Swal.fire({
          title: t("common.error"),
          text: t("teacherPanel.addEventError"),
          icon: "error",
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: 'rgb(var(--ll-violet))',
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: t("common.error"),
        text: t("teacherPanel.unexpectedError"),
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: 'rgb(var(--ll-violet))',
      });
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className={embedded ? "ll-fade-up mt-3" : "relative overflow-hidden mt-6"}>
      {!embedded && (<svg className="hw-only absolute right-0 bottom-0 w-[54px] h-[54px] z-[5] pointer-events-none opacity-70" style={{ stroke: 'rgb(var(--ll-ink-4))', fill: 'none', strokeWidth: .8, transform: 'rotate(180deg)' }} viewBox="0 0 54 54" aria-hidden="true"><path d="M0 0l54 54M0 0l26 54M0 0l54 24" /><path d="M0 14c8 0 14-2 14-14M0 28c16 0 26-6 28-28M0 42c24 0 38-10 42-42" /></svg>)}
      <h3 className={`text-[15px] font-semibold text-ll-ink mb-3 ${embedded ? "hidden" : ""}`}>
        {t("teacherPanel.title")}
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div>
          <h4 className="text-[13.5px] font-semibold text-ll-ink mb-2.5 flex items-center gap-2">
            {t("teacherPanel.students")} <span className="font-mono tabular text-[11.5px] font-normal text-ll-ink3 px-1.5 py-px rounded-[5px] bg-ll-hover">{students.length}</span>
          </h4>
          <div className="max-h-80 overflow-y-auto custom-scrollbar rounded-xl border border-ll-line divide-y divide-ll-line">
            {students.map((student) => {
              const initials = getInitials(student.name, student.lastName);
              const tint = tintFor(student.name);
              const isSelected = selectedStudent?.id === student.id;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? "bg-ll-violet-tint" : "hover:bg-ll-subtle"}`}
                  onClick={() => handleStudentSelect(student)}
                >
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt={`${student.name} ${student.lastName}`}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[12px] flex-shrink-0 ${tint}`}>
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium text-ll-ink truncate">
                      {student.name} {student.lastName}
                    </p>
                    <p className="text-[12px] text-ll-ink3 font-mono truncate">{student.email}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-3 text-[11.5px] text-ll-ink3">
                    <span className="font-mono tabular">{events.filter(e => e.studentId === student.id).length}</span>
                    <span className="ll-pill" style={{ background: 'rgb(var(--ll-teal-tint))', color: 'rgb(var(--ll-teal-ink))' }}>
                      <span className="ll-pill-dot" style={{ background: 'rgb(var(--ll-teal))' }} />
                      {t("teacherPanel.active")}
                    </span>
                    {isSelected && <FiChevronRight className="text-ll-violet-ink" size={16} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-[13.5px] font-semibold text-ll-ink mb-2.5">
            {t("teacherPanel.actions")}
          </h4>

          {selectedStudent ? (
            <div key={selectedStudent.id} className="ll-fade-up rounded-lg border border-ll-line divide-y divide-ll-line overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-ll-violet-tint">
                {selectedStudent.avatarUrl ? (
                  <img src={selectedStudent.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[12px] flex-shrink-0 ${tintFor(selectedStudent.name)}`}>
                    {getInitials(selectedStudent.name, selectedStudent.lastName)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-ll-ink truncate">{selectedStudent.name} {selectedStudent.lastName}</p>
                  <p className="text-[12px] text-ll-ink3">
                    {t("teacherPanel.totalEventsLabel")}: <span className="font-mono tabular text-ll-ink2">{events.filter(e => e.studentId === selectedStudent.id).length}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-ll-subtle"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-teal-tint text-ll-teal-ink">
                  <FiCalendar size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-ll-ink">{t("teacherPanel.addClass")}</p>
                  <p className="text-[12px] text-ll-ink3">{t("teacherPanel.addClassDesc")}</p>
                </div>
                <FiChevronRight className="text-ll-ink4 flex-shrink-0" size={16} />
              </button>

              <button
                onClick={() => setIsRemoveModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-ll-subtle"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-ll-gold-tint text-ll-gold-ink">
                  <FiUserMinus size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium text-ll-ink">{t("teacherPanel.removeClass")}</p>
                  <p className="text-[12px] text-ll-ink3">{t("teacherPanel.removeClassDesc")}</p>
                </div>
                <FiChevronRight className="text-ll-ink4 flex-shrink-0" size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[11.5rem] text-center p-6 rounded-lg border border-dashed border-ll-line2 bg-ll-subtle">
              <FiUserPlus size={28} className="hw-hide text-ll-ink4 mb-2.5" />
              <svg className="hw-only ll-bob w-[30px] h-[34px] mb-2.5" viewBox="0 0 40 46" aria-hidden="true"><path d="M20 2C10.5 2 4 9.5 4 19.5V42l4-3 4 3 4-3 4 3 4-3 4 3 4-3 4 3V19.5C36 9.5 29.5 2 20 2z" fill="rgba(246,242,255,.94)" /><ellipse cx="14.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="25.5" cy="19" rx="2.6" ry="3.6" fill="#140E1C" /><ellipse cx="20" cy="28" rx="2.4" ry="3" fill="#140E1C" /></svg>
              <p className="text-[13px] text-ll-ink3">
                {t("teacherPanel.selectStudent")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <RemoveStudentModal
        student={selectedStudent}
        teacher={selectedStudent?.teacher}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemoveStudent}
        isOpen={isRemoveModalOpen}
      />
      <AddEventModal
        student={selectedStudent}
        teacherId={teacherId}
        teacherName={teacherName}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddEvent}
        isOpen={isAddModalOpen}
      />
    </div>
  );
};

export default TeacherPanel;