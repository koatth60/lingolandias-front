import { useState } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { removeStudent } from "../../redux/userSlice";
import { FiUserMinus, FiCheckCircle } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UserRow = ({ person, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-2.5 py-2 rounded-[9px] cursor-pointer mb-1 transition-colors ${
      selected ? "bg-ll-violet-tint" : "hover:bg-ll-hover"
    }`}
  >
    {person.avatarUrl ? (
      <img src={person.avatarUrl} alt={`${person.name} ${person.lastName}`} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${selected ? "bg-ll-panel text-ll-violet-ink" : "bg-ll-hover text-ll-ink2"}`}>
        {person.name.charAt(0)}{person.lastName.charAt(0)}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[13.5px] font-medium text-ll-ink truncate">{person.name} {person.lastName}</p>
      <p className="text-[12px] text-ll-ink3 truncate">{person.email}</p>
    </div>
    {selected && <FiCheckCircle size={15} className="flex-shrink-0 text-ll-violet" />}
  </div>
);

const RemoveStudent = ({ teachers, onRefresh }) => {
  const { t } = useTranslation();
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

    // Unlinking the student, deleting their schedules, and deleting their chat
    // history all happen atomically in one backend transaction now — previously
    // this fired two separate requests in parallel, and a partial failure could
    // leave the student unlinked with their chat history still intact (or vice versa).
    fetch(`${BACKEND_URL}/users/removeStudentsFromTeacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: selectedTeacher.id, studentIds: [selectedStudent] }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "An error occurred");
        }
      })
      .then(() => {
        Swal.fire({ title: t("common.success"), text: t("admin.removeSuccess"), icon: "success", confirmButtonText: "Ok" });
        if (selectedStudent) dispatch(removeStudent(selectedStudent));
        setSelectedStudent(null);
        setSelectedTeacher(null);
        onRefresh?.();
      })
      .catch((error) => {
        console.error("Error in removal process:", error);
        Swal.fire({ title: t("common.error"), text: error.message, icon: "error", confirmButtonText: "Ok" });
      });
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[15px] font-semibold text-ll-ink">{t("admin.removeTitle")}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── 1. Select Teacher ── */}
        <div className="relative rounded-xl overflow-hidden border border-ll-line">
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-ll-hover text-ll-ink2 flex items-center justify-center font-mono text-[11px] flex-shrink-0">1</span>
              <h3 className="text-[13.5px] font-semibold text-ll-ink">{t("admin.selectTeacherLabel")}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {teachers.map((teacher) => (
                <UserRow
                  key={teacher.id}
                  person={teacher}
                  selected={selectedTeacher?.id === teacher.id}
                  onClick={() => handleTeacherSelect(teacher)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. Select Student ── */}
        <div className="relative rounded-xl overflow-hidden border border-ll-line">
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-ll-hover text-ll-ink2 flex items-center justify-center font-mono text-[11px] flex-shrink-0">2</span>
              <h3 className="text-[13.5px] font-semibold text-ll-ink">{t("admin.selectStudentToRemove")}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {!selectedTeacher ? (
                <p className="text-[12.5px] text-ll-ink3 text-center py-8">{t("admin.selectTeacherFirst")}</p>
              ) : !selectedTeacher.students || selectedTeacher.students.length === 0 ? (
                <p className="text-[12.5px] text-ll-ink3 text-center py-8">{t("admin.noStudentsTeacher")}</p>
              ) : (
                selectedTeacher.students.map((student) => (
                  <UserRow
                    key={student.id}
                    person={student}
                    selected={selectedStudent === student.id}
                    onClick={() => handleStudentSelect(student.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Remove Button ── */}
      <div className="flex justify-end mt-4">
        <button
          onClick={removeStudents}
          disabled={!selectedTeacher || !selectedStudent}
          className="ll-btn ll-btn-secondary !text-ll-danger disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiUserMinus size={15} />
          {t("admin.removeSelectedStudent")}
        </button>
      </div>
    </section>
  );
};

export default RemoveStudent;
