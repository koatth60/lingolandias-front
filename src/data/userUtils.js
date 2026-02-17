export const filterUsers = (users) => {
  const teachers = users.filter(user => user.role === "teacher");
  const allStudents = users.filter(user => user.role === "user");
  
  // FIX: Check if teacher exists properly - exact same logic as original
  const unassignedStudents = users.filter(user => {
    if (user.role !== "user") return false;
    
    // Check if teacher is null, undefined, or an empty object
    const hasTeacher = user.teacher !== null && 
                      user.teacher !== undefined && 
                      !(Object.keys(user.teacher || {}).length === 0);
    
    return !hasTeacher;
  });
  
  return { teachers, allStudents, unassignedStudents };
};

export const debugUserData = (usersData) => {
  console.log("=== USER DATA DEBUG ===");
  console.log("Total users:", usersData.length);
  
  if (usersData.length > 0) {
    console.log("First user:", usersData[0]);
    console.log("First user has teacher field?", 'teacher' in usersData[0]);
    console.log("First user has teacherId field?", 'teacherId' in usersData[0]);
    console.log("First user teacher value:", usersData[0].teacher);
  }
  
  // FIX: Changed variable name
  const studentUsers = usersData.filter(u => u.role === "user");
  console.log("Total students:", studentUsers.length);
  
  if (studentUsers.length > 0) {
    console.log("Sample student:", studentUsers[0]);
    console.log("Sample student teacher:", studentUsers[0].teacher);
    console.log("Sample student teacherId:", studentUsers[0].teacherId);
    
    const studentsWithTeacher = studentUsers.filter(s => s.teacher);
    const studentsWithoutTeacher = studentUsers.filter(s => !s.teacher);
    console.log("Students WITH teacher:", studentsWithTeacher.length);
    console.log("Students WITHOUT teacher:", studentsWithoutTeacher.length);
    
    if (studentsWithTeacher.length > 0) {
      console.log("Example student WITH teacher:", {
        name: studentsWithTeacher[0].name,
        teacher: studentsWithTeacher[0].teacher
      });
    }
    if (studentsWithoutTeacher.length > 0) {
      console.log("Example student WITHOUT teacher:", {
        name: studentsWithoutTeacher[0].name,
        teacher: studentsWithoutTeacher[0].teacher
      });
    }
  }
};