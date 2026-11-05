import { createSlice } from "@reduxjs/toolkit";
import { DEFAULT_THEME_NAME } from "../theme/themes/defaultName";
import { FINDER_SORT_FEWEST_MISSING, FINDER_SORT_MOST_USED } from "../domain/recipeFinder";

// themeName, hideMenuTip, hideGettingStarted and finderSort were added after v8 of the
// persisted state. Older saved settings don't have them, so the selectors fall back to
// the defaults (no migration needed).
export const initialState = {
  showStapleReminder: true,
  themeName: DEFAULT_THEME_NAME,
  hideMenuTip: false,
  hideGettingStarted: false,
  finderSort: FINDER_SORT_FEWEST_MISSING,
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
    setFinderSort: (state, action) => {
      if (action.payload === FINDER_SORT_FEWEST_MISSING || action.payload === FINDER_SORT_MOST_USED) {
        state.finderSort = action.payload;
      }
    },
  },
});

export const { setShowStapleReminder, setThemeName, setHideMenuTip, setHideGettingStarted, setFinderSort } = settingsSlice.actions;

export const selectShowStapleReminder = (state) => state.settings.showStapleReminder;
export const selectThemeName = (state) => state.settings?.themeName ?? DEFAULT_THEME_NAME;
export const selectHideMenuTip = (state) => Boolean(state.settings?.hideMenuTip);
export const selectHideGettingStarted = (state) => Boolean(state.settings?.hideGettingStarted);
export const selectFinderSort = (state) => state.settings?.finderSort ?? FINDER_SORT_FEWEST_MISSING;

export default settingsSlice.reducer;
