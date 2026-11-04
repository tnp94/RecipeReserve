import { createSlice, createSelector } from "@reduxjs/toolkit";
import { normalizeName } from "../domain/ingredientKey";

export const initialState = { staples: {} };

const pantrySlice = createSlice({
  name: "pantry",
  initialState,
  reducers: {
    addStaple: (state, action) => {
      const name = String(action.payload ?? "").trim();
      const nameKey = normalizeName(name);
      if (!nameKey) return;
      state.staples[nameKey] = { nameKey, name };
    },
    removeStaple: (state, action) => {
      delete state.staples[action.payload];
    },
  },
});

export const { addStaple, removeStaple } = pantrySlice.actions;

// Thunk: adds or removes based on current pantry state, so every listener
// (e.g. the shopping list's isStaple flags) sees an explicit add/remove.
export const toggleStaple = (name) => (dispatch, getState) => {
  const nameKey = normalizeName(name ?? "");
  if (!nameKey) return;
  if (getState().pantry.staples[nameKey]) dispatch(removeStaple(nameKey));
  else dispatch(addStaple(name));
};

const selectStaples = (state) => state.pantry.staples;

export const selectStaplesList = createSelector([selectStaples], (staples) =>
  Object.values(staples).sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
);

export const selectStapleKeys = createSelector(
  [selectStaples],
  (staples) => new Set(Object.keys(staples))
);

export function selectIsStaple(state, name) {
  return Boolean(state.pantry.staples[normalizeName(name ?? "")]);
}

export default pantrySlice.reducer;
