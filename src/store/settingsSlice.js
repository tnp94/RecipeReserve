import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_THEME_NAME } from "../theme/themes/defaultName";

// themeName, hideMenuTip and hideGettingStarted were added after v8 of the persisted
// state. Older saved settings don't have them, so the selectors fall back to the
// defaults (no migration needed).
export const initialState = {
  showStapleReminder: true,
  themeName: DEFAULT_THEME_NAME,
  hideMenuTip: false,
  hideGettingStarted: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setShowStapleReminder: (state, action) => {
      state.showStapleReminder = Boolean(action.payload);
    },
    setThemeName: (state, action) => {
      const name = String(action.payload ?? "").trim();
      if (name) state.themeName = name;
    },
    setHideMenuTip: (state, action) => {
      state.hideMenuTip = Boolean(action.payload);
    },
    setHideGettingStarted: (state, action) => {
      state.hideGettingStarted = Boolean(action.payload);
    },
  },
});

export const { setShowStapleReminder, setThemeName, setHideMenuTip, setHideGettingStarted } = settingsSlice.actions;

export const selectShowStapleReminder = (state) => state.settings.showStapleReminder;
export const selectThemeName = (state) => state.settings?.themeName ?? DEFAULT_THEME_NAME;
export const selectHideMenuTip = (state) => Boolean(state.settings?.hideMenuTip);
export const selectHideGettingStarted = (state) => Boolean(state.settings?.hideGettingStarted);

export default settingsSlice.reducer;
