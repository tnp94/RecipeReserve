import { createSlice } from "@reduxjs/toolkit";

export const initialState = { showStapleReminder: true };

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setShowStapleReminder: (state, action) => {
      state.showStapleReminder = Boolean(action.payload);
    },
  },
});

export const { setShowStapleReminder } = settingsSlice.actions;

export const selectShowStapleReminder = (state) => state.settings.showStapleReminder;

export default settingsSlice.reducer;
