import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Get the environment variable
// const LOCAL_HOST = "https://www.testing.srv570363.hstgr.cloud";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// Async action to log in a user
export const loginUser = createAsyncThunk("user/loginUser", async (data, { rejectWithValue }) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.token) {
      localStorage.setItem("token", result.token);
    }

    return result;
  } catch {
    // Network failure: server unreachable, SSL error, ISP blocking, etc.
    return rejectWithValue({ networkError: true });
  }
});

// Async action to update user information
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/users/updateuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Failed to update user information");
      }

      const updatedUser = await response.json();
      if (response.status === 204) {
        return {};
      }
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async action to upload avatar
export const uploadAvatar = createAsyncThunk(
  "user/uploadAvatar",
  async (formData, { rejectWithValue }) => {
 
    try {
      const response = await fetch(`${BACKEND_URL}/upload/file`, {
        // Use template literal here as well
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const result = await response.json();
      return result.user;
    } catch (error) {
      console.error("Upload avatar error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserSettings = createAsyncThunk(
  "user/updateUserSettings",
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        return rejectWithValue("Failed to update settings");
      }

      const updatedSettings = await response.json();
      return updatedSettings;
    } catch (error) {
      return rejectWithValue("Cannot connect to the server. Please check your connection.");
    }
  }
);

export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(passwordData),
      });

      const result = await response.json();

      if (!response.ok) {
        return rejectWithValue(result.message || "Failed to change password");
      }

      return result;
    } catch {
      return rejectWithValue("Cannot connect to the server. Please check your connection.");
    }
  }
);

// The main user slice
const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: null,
    status: "idle",
    error: null,
  },
  reducers: {
    updateUserStatus: (state, action) => {
      const { id, online } = action.payload;
      const user = state.userInfo.user;
      if (user.teacher) {
        if (user.teacher.id === id) {
          user.teacher.online = online;
        }
      } else if (user && user.students) {
        const studentIndex = user.students.findIndex(
          (student) => student.id === id
        );
        if (studentIndex !== -1) {
          user.students[studentIndex].online = online;
        }
      }
    },
    updateUserEvents: (state, action) => {
      const { studentId, updatedEvents } = action.payload;
      const student = state.userInfo.user.students.find(s => s.id === studentId);
      if (student) {
        student.events = updatedEvents;
      }
    },
    updateEvent: (state, action) => {
      const { studentId, eventId, updatedEvent } = action.payload;
      const student = state.userInfo.user.students.find(s => s.id === studentId);
      if (student) {
        const eventIndex = student.events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
          student.events[eventIndex] = { ...student.events[eventIndex], ...updatedEvent };
        }
      }
    },
    removeStudent: (state, action) => {
      const studentId = action.payload;
      if (state.userInfo && state.userInfo.user && state.userInfo.user.students) {
        state.userInfo.user.students = state.userInfo.user.students.filter(s => s.id !== studentId);
      }
    },
    // Keeps the teacher's own calendar in sync after schedule changes
    addTeacherSchedule: (state, action) => {
      if (!state.userInfo?.user) return;
      if (!Array.isArray(state.userInfo.user.teacherSchedules)) {
        state.userInfo.user.teacherSchedules = [];
      }
      const e = action.payload;
      // A row created from Messages (schedule a class / extend one) is both
      // dispatched locally right away AND echoed back over the scheduleUpdated
      // socket to the same acting teacher — skip the echo instead of showing
      // the same class twice.
      if (state.userInfo.user.teacherSchedules.some((s) => s.id === e.id)) return;
      state.userInfo.user.teacherSchedules.push({
        ...e,
        startTime: e.startTime || e.start,
        endTime: e.endTime || e.end,
        initialDateTime: e.initialDateTime || e.startTime || e.start,
      });
    },
    removeTeacherSchedules: (state, action) => {
      const ids = action.payload;
      if (state.userInfo?.user?.teacherSchedules) {
        state.userInfo.user.teacherSchedules = state.userInfo.user.teacherSchedules.filter(
          s => !ids.includes(s.id)
        );
      }
    },
    // Deleting a scheduled group's chat cascades to its Schedule rows
    // server-side, but the acting teacher's own Redux copy only gets told via
    // the scheduleUpdated socket, which only reaches them while the Schedule
    // page happens to be mounted — a delete triggered from Messages would
    // otherwise leave the deleted class showing as "busy" until next login.
    removeTeacherSchedulesByRoom: (state, action) => {
      const roomId = action.payload;
      if (state.userInfo?.user?.teacherSchedules) {
        state.userInfo.user.teacherSchedules = state.userInfo.user.teacherSchedules.filter(
          s => s.roomId !== roomId
        );
      }
    },
    updateTeacherSchedule: (state, action) => {
      if (!state.userInfo?.user) return;
      if (!Array.isArray(state.userInfo.user.teacherSchedules)) {
        state.userInfo.user.teacherSchedules = [];
      }
      const e = action.payload;
      const idx = state.userInfo.user.teacherSchedules.findIndex(s => s.id === e.id);
      const normalized = {
        ...e,
        startTime: e.startTime || e.start,
        endTime: e.endTime || e.end,
        initialDateTime: e.initialDateTime || e.startTime || e.start,
      };
      if (idx !== -1) {
        state.userInfo.user.teacherSchedules[idx] = { ...state.userInfo.user.teacherSchedules[idx], ...normalized };
      } else {
        // A co-teacher gaining access to a class arrives here as a 'modify'
        // broadcast for a row they've never seen before — upsert instead of
        // silently dropping it, so it shows up live instead of only after
        // their next Schedule-page visit.
        state.userInfo.user.teacherSchedules.push(normalized);
      }
    },
    // Replaces the student's full schedule list (used on reconnect/mount to apply missed changes)
    setStudentSchedules: (state, action) => {
      if (!state.userInfo?.user) return;
      state.userInfo.user.studentSchedules = action.payload;
    },
    // Teacher-side equivalent of setStudentSchedules above.
    setTeacherSchedules: (state, action) => {
      if (!state.userInfo?.user) return;
      state.userInfo.user.teacherSchedules = action.payload;
    },
    // Keeps the student's own calendar in sync after schedule changes pushed via socket
    addStudentSchedule: (state, action) => {
      if (!state.userInfo?.user) return;
      if (!Array.isArray(state.userInfo.user.studentSchedules)) {
        state.userInfo.user.studentSchedules = [];
      }
      const e = action.payload;
      state.userInfo.user.studentSchedules.push({
        ...e,
        startTime: e.startTime || e.start,
        endTime: e.endTime || e.end,
        initialDateTime: e.initialDateTime || e.startTime || e.start,
      });
    },
    removeStudentSchedules: (state, action) => {
      const ids = action.payload;
      if (state.userInfo?.user?.studentSchedules) {
        state.userInfo.user.studentSchedules = state.userInfo.user.studentSchedules.filter(
          s => !ids.includes(s.id)
        );
      }
    },
    updateStudentSchedule: (state, action) => {
      const e = action.payload;
      if (state.userInfo?.user?.studentSchedules) {
        const idx = state.userInfo.user.studentSchedules.findIndex(s => s.id === e.id);
        if (idx !== -1) {
          state.userInfo.user.studentSchedules[idx] = {
            ...state.userInfo.user.studentSchedules[idx],
            ...e,
            startTime: e.startTime || e.start,
            endTime: e.endTime || e.end,
          };
        }
      }
    },
    // Adds an assigned student + their schedules to the teacher's Redux state
    addStudentToTeacher: (state, action) => {
      if (!state.userInfo?.user) return;
      const { student, schedules } = action.payload;
      if (!Array.isArray(state.userInfo.user.students)) {
        state.userInfo.user.students = [];
      }
      if (!state.userInfo.user.students.find(s => s.id === student.id)) {
        state.userInfo.user.students.push(student);
      }
      if (!Array.isArray(state.userInfo.user.teacherSchedules)) {
        state.userInfo.user.teacherSchedules = [];
      }
      schedules.forEach(e => {
        state.userInfo.user.teacherSchedules.push({
          ...e,
          startTime: e.startTime || e.start,
          endTime: e.endTime || e.end,
          initialDateTime: e.initialDateTime || e.startTime || e.start,
        });
      });
    },
    // Sets (or clears) the teacher reference on a student's Redux state
    setStudentTeacher: (state, action) => {
      if (!state.userInfo?.user) return;
      state.userInfo.user.teacher = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      localStorage.removeItem("token");
      localStorage.removeItem("state");
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle login actions
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userInfo = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.networkError
          ? "Cannot connect to the server. Please check your connection."
          : (action.error.message || "Login failed");
      })

      // Handle update user actions
      .addCase(updateUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userInfo.user = {
          ...state.userInfo.user,
          ...action.meta.arg,
        };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      .addCase(uploadAvatar.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userInfo.user = {
          ...state.userInfo.user,
          ...action.payload, 
        };
      })

      .addCase(uploadAvatar.rejected, (state, action) => {
        console.error(
          "Avatar upload failed:",
          action.payload || action.error.message
        );
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      
      .addCase(updateUserSettings.pending, (state, action) => {
        state.status = "loading";
        // Optimistic update so the UI reflects the change immediately
        if (state.userInfo?.user) {
          state._previousSettings = state.userInfo.user.settings
            ? { ...state.userInfo.user.settings }
            : null;
          if (!state.userInfo.user.settings) {
            state.userInfo.user.settings = {};
          }
          state.userInfo.user.settings = {
            ...state.userInfo.user.settings,
            ...action.meta.arg,
          };
        }
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.status = "succeeded";
        delete state._previousSettings;
        if (!state.userInfo.user.settings) {
          state.userInfo.user.settings = {};
        }
        state.userInfo.user.settings = action.payload;
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
        // Revert the optimistic update
        if (state.userInfo?.user && "_previousSettings" in state) {
          state.userInfo.user.settings = state._previousSettings;
          delete state._previousSettings;
        }
      });
  },
});

export const {
  logout,
  updateUserStatus,
  updateUserEvents,
  removeStudent,
  updateEvent,
  addTeacherSchedule,
  removeTeacherSchedules,
  removeTeacherSchedulesByRoom,
  updateTeacherSchedule,
  setStudentSchedules,
  setTeacherSchedules,
  addStudentSchedule,
  removeStudentSchedules,
  updateStudentSchedule,
  addStudentToTeacher,
  setStudentTeacher,
} = userSlice.actions;

export default userSlice.reducer;
