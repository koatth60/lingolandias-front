import { useState } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import RemoveStudentModal from "./RemoveStudentModal";
import AddEventModal from "./AddEventModal";
import { removeStudent, updateUserEvents } from "../../redux/userSlice";
import { FiUserPlus, FiUserMinus, FiCalendar, FiMail, FiChevronRight } from "react-icons/fi";

const TeacherPanel = ({ students, events, teacherId, teacherName }) => {
  const dispatch = useDispatch();
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

  const generateColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 75%, 60%)`;
    return color;
  };

  const handleRemoveStudent = async ({ events, removeAll }) => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    try {
      if (removeAll) {
        const [removeStudentResponse, chatResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/users/removeStudentsFromTeacher`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              teacherId: teacherId,
              studentIds: [selectedStudent.id],
            }),
          }),
          fetch(
            `${BACKEND_URL}/chat/delete-chats-by-student/${selectedStudent.id}`,
            {
              method: "DELETE",
            }
          ),
        ]);

        if (removeStudentResponse.ok && chatResponse.ok) {
          Swal.fire({
            title: "Success!",
            text: "Student and their chats removed successfully.",
            icon: "success",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#9E2FD0',
          }).then(() => {
           if (selectedStudent && selectedStudent.id) {
             dispatch(removeStudent(selectedStudent.id));
           }
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: "Error removing student or chats.",
            icon: "error",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#9E2FD0',
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
            title: "Success!",
            text: "Selected events removed successfully.",
            icon: "success",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#9E2FD0',
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
           }
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: "Error removing events.",
            icon: "error",
            background: '#1a1a2e',
            color: '#fff',
            confirmButtonColor: '#9E2FD0',
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An unexpected error occurred.",
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#9E2FD0',
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
          title: "Success!",
          text: "Event added successfully.",
          icon: "success",
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: '#9E2FD0',
        }).then(async (result) => {
         if (result.isConfirmed) {
           try {
             const newEvent = await response.json();
             const serializedEvent = {
               ...newEvent,
               start: new Date(newEvent.start).toISOString(),
               end: new Date(newEvent.end).toISOString(),
             };
             const updatedEvents = [...selectedStudent.events, serializedEvent].map(event => ({
               ...event,
               start: new Date(event.start).toISOString(),
               end: new Date(event.end).toISOString(),
             }));
             dispatch(updateUserEvents({ studentId: selectedStudent.id, updatedEvents }));
           } catch (error) {
             console.error("Failed to parse JSON, state will not be updated:", error);
           }
         }
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: "Error adding event.",
          icon: "error",
          background: '#1a1a2e',
          color: '#fff',
          confirmButtonColor: '#9E2FD0',
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "An unexpected error occurred.",
        icon: "error",
        background: '#1a1a2e',
        color: '#fff',
        confirmButtonColor: '#9E2FD0',
      });
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="relative rounded-2xl shadow-xl overflow-hidden mt-4 border border-gray-200 dark:border-[#9E2FD0]/20">
      {/* Fondo con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-[#0d0a1e] dark:via-[#1a1a2e] dark:to-[#110e28]" />
      
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute w-64 h-64 rounded-full bg-[#9E2FD0]/5 blur-3xl -top-32 -right-32" />
        <div className="absolute w-64 h-64 rounded-full bg-[#26D9A1]/5 blur-3xl -bottom-32 -left-32" />
      </div>

      {/* Línea de acento superior */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9E2FD0] via-[#F6B82E] to-[#26D9A1] opacity-50" />

      {/* Content */}
      <div className="relative z-10 p-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-[#9E2FD0] to-[#F6B82E] bg-clip-text text-transparent dark:text-white mb-6">
          Teacher Panel
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Students List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FiUserPlus className="text-[#9E2FD0]" size={16} />
              Students
            </h4>
            <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {students.map((student) => {
                const initials = getInitials(student.name, student.lastName);
                const avatarColor = generateColor(student.name);
                const isSelected = selectedStudent?.id === student.id;
                
                return (
                  <div
                    key={student.id}
                    className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#9E2FD0]/10 to-[#F6B82E]/10 border-2 border-[#9E2FD0]/30'
                        : 'bg-white/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-[#9E2FD0]/20'
                    }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center gap-3">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
                          alt={`${student.name} ${student.lastName}`}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#9E2FD0]/30"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {student.name} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <FiMail size={12} />
                          <span className="truncate">{student.email}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <FiChevronRight className="text-[#9E2FD0] animate-pulse" size={20} />
                      )}
                    </div>

                    {/* Student stats */}
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Events: <span className="font-semibold text-[#9E2FD0]">
                          {events.filter(e => e.studentId === student.id).length}
                        </span>
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Status: <span className="font-semibold text-[#26D9A1]">Active</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <FiCalendar className="text-[#F6B82E]" size={16} />
              Actions
            </h4>
            
            {selectedStudent ? (
              <div className="space-y-3">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full relative overflow-hidden group rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #26D9A1, #1fa07a)',
                    boxShadow: '0 4px 15px rgba(38,217,161,0.3)',
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="relative flex items-center gap-3">
                    <FiCalendar size={24} className="text-white" />
                    <div>
                      <p className="font-semibold text-white">Add Class</p>
                      <p className="text-sm text-white/80">Schedule a new class</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setIsRemoveModalOpen(true)}
                  className="w-full relative overflow-hidden group rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #F6B82E, #d49c1f)',
                    boxShadow: '0 4px 15px rgba(246,184,46,0.3)',
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="relative flex items-center gap-3">
                    <FiUserMinus size={24} className="text-white" />
                    <div>
                      <p className="font-semibold text-white">Remove Student/Class</p>
                      <p className="text-sm text-white/80">Manage student relationship</p>
                    </div>
                  </div>
                </button>

                {/* Selected student info */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-[#9E2FD0]/20">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: <span className="font-semibold text-[#9E2FD0]">
                      {selectedStudent.name} {selectedStudent.lastName}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Total events: {selectedStudent.events?.length || 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-[#9E2FD0]/20">
                <FiUserPlus size={40} className="text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a student to see available actions
                </p>
              </div>
            )}
          </div>
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