import { createSlice } from "@reduxjs/toolkit";

const schedulesSlice = createSlice({
  name: "schedules",
  initialState: {
    allSchedules: [],
    allUsers: [],
    loaded: false,
  },
  reducers: {
    // Called once on AdminHomeDashboard mount — stores all raw data
    setSchedulesData: (state, action) => {
      state.allSchedules = action.payload.schedules;
      state.allUsers = action.payload.users;
      state.loaded = true;
    },
    // Called after a new class is added
    addSchedule: (state, action) => {
      const event = action.payload;
      // Normalize field names — API returns start/end, scheduleUtils needs startTime/endTime
      const normalized = {
        ...event,
        startTime: event.startTime || event.start,
        endTime: event.endTime || event.end,
      };
      state.allSchedules.push(normalized);
    },
    // Called after events are removed — payload is an array of eventIds
    removeSchedules: (state, action) => {
      const ids = action.payload;
      state.allSchedules = state.allSchedules.filter(
        (s) => !ids.includes(s.id)
      );
    },
    // Called after an event is modified
    updateScheduleEvent: (state, action) => {
      const event = action.payload;
      const normalized = {
        ...event,
        startTime: event.startTime || event.start,
        endTime: event.endTime || event.end,
      };
      const idx = state.allSchedules.findIndex((s) => s.id === normalized.id);
      if (idx !== -1) {
        state.allSchedules[idx] = {
          ...state.allSchedules[idx],
          ...normalized,
        };
      }
    },
  },
});

export const { setSchedulesData, addSchedule, removeSchedules, updateScheduleEvent } =
  schedulesSlice.actions;

export default schedulesSlice.reducer;
