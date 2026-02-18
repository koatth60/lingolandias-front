import { useState } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { removeStudent } from "../../redux/userSlice";
import { FiUserMinus, FiCheckCircle } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const panelStyle = {
  border: "1px solid rgba(158,47,208,0.12)",
};

const UserRow = ({ person, selected, accentColor, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-all duration-150"
    style={
      selected
        ? { background: `${accentColor}14`, border: `1px solid ${accentColor}50` }
        : { background: "transparent", border: "1px solid transparent" }
    }
    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "rgba(158,47,208,0.06)"; }}
    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
  >
    {person.avatarUrl ? (
      <img src={person.avatarUrl} alt={`${person.name} ${person.lastName}`} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: selected ? `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)` : "linear-gradient(135deg, #9E2FD0, #7b22a8)" }}
      >
        {person.name.charAt(0)}{person.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{person.name} {person.lastName}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{person.email}</p>
    </div>
    {selected && <FiCheckCircle size={14} style={{ color: accentColor }} className="flex-shrink-0" />}
  </div>
);

const RemoveStudent = ({ teachers }) => {
  const dispatch = useDispatch();
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedStudent(null);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const removeStudents = () => {
    if (!selectedTeacher || !selectedStudent) return;

    Promise.all([
      fetch(`${BACKEND_URL}/users/removeStudentsFromTeacher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacher.id, studentIds: [selectedStudent] }),
      }),
      fetch(`${BACKEND_URL}/chat/delete-chats-by-student/${selectedStudent}`, { method: "DELETE" }),
    ])
      .then(async ([studentsResponse, chatResponse]) => {
        if (!studentsResponse.ok) {
          const errorText = await studentsResponse.text();
          throw new Error(`Failed to remove students: ${errorText || "An error occurred"}`);
        }
        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          throw new Error(`Failed to delete chats: ${errorText || "An error occurred"}`);
        }
        return Promise.all([studentsResponse.json(), chatResponse.json()]);
      })
      .then(([studentsData, chatData]) => {
        Swal.fire({ title: "Success!", text: "Student and their chats removed successfully.", icon: "success", confirmButtonText: "Ok" });
        console.log("Students removed:", studentsData.message);
        console.log(`Chats deleted: ${chatData.chatsDeleted}, Archived chats deleted: ${chatData.archivedChatsDeleted}`);
        if (selectedStudent) dispatch(removeStudent(selectedStudent));
        setSelectedStudent(null);
      })
      .catch((error) => {
        console.error("Error in removal process:", error);
        Swal.fire({ title: "Error!", text: error.message, icon: "error", confirmButtonText: "Ok" });
      });
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <FiUserMinus size={17} style={{ color: "#ef4444" }} />
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">Remove Student from Teacher</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── 1. Select Teacher ── */}
        <div className="relative rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #9E2FD0, transparent)" }} />
          <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
          <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#9E2FD0] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Select a Teacher</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {teachers.map((teacher) => (
                <UserRow
                  key={teacher.id}
                  person={teacher}
                  selected={selectedTeacher?.id === teacher.id}
                  accentColor="#9E2FD0"
                  onClick={() => handleTeacherSelect(teacher)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. Select Student ── */}
        <div className="relative rounded-2xl overflow-hidden" style={panelStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: "linear-gradient(90deg, #ef4444, transparent)" }} />
          <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(248,248,250,0.85)" }} />
          <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(13,10,30,0.55)" }} />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">Select Student to Remove</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {!selectedTeacher ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">Select a teacher first.</p>
              ) : !selectedTeacher.students || selectedTeacher.students.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">No students assigned to this teacher.</p>
              ) : (
                selectedTeacher.students.map((student) => (
                  <UserRow
                    key={student.id}
                    person={student}
                    selected={selectedStudent === student.id}
                    accentColor="#ef4444"
                    onClick={() => handleStudentSelect(student.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Remove Button ── */}
      <div className="flex justify-center mt-5">
        <button
          onClick={removeStudents}
          disabled={!selectedTeacher || !selectedStudent}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            boxShadow: "0 4px 20px rgba(239,68,68,0.28)",
          }}
        >
          <FiUserMinus size={15} />
          Remove Selected Student
        </button>
      </div>
    </section>
  );
};

export default RemoveStudent;
