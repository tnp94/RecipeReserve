import { createSlice } from "@reduxjs/toolkit";
import { normalizeName } from "../domain/ingredientKey";

export const initialState = { ingredients: [], recent: [], nextId: 1 };

const MAX_RECENT = 12;
const TAGS = [null, "expiring", "required"];

const finderSlice = createSlice({
  name: "finder",
  initialState,
  reducers: {
    // Payload: names[] or { names, remember }. `remember: false` (e.g. "Add pantry
    // staples") adds to the search without pushing everything into Recent.
    addFinderIngredients: (state, action) => {
      const p = action.payload;
      const names = Array.isArray(p) ? p : Array.isArray(p?.names) ? p.names : [];
      const remember = Array.isArray(p) ? true : p?.remember !== false;
      const seen = new Set(state.ingredients.map((i) => normalizeName(i.name)));
      for (const raw of names) {
        const name = String(raw ?? "").trim();
        const key = normalizeName(name);
        if (!name || !key) continue;
        if (remember) {
          const recent = (state.recent ?? []).filter((r) => normalizeName(r) !== key);
          recent.unshift(name);
          state.recent = recent.slice(0, MAX_RECENT);
        }
        if (seen.has(key)) continue;
        seen.add(key);
        state.ingredients.push({ id: `fi-${state.nextId}`, name, tag: null });
        state.nextId += 1;
      }
    },
    removeFinderIngredient: (state, action) => {
      state.ingredients = state.ingredients.filter((i) => i.id !== action.payload);
    },
    setFinderIngredientTag: (state, action) => {
      const { id, tag } = action.payload;
      if (!TAGS.includes(tag)) return;
      const item = state.ingredients.find((i) => i.id === id);
      if (item) item.tag = tag;
    },
    clearFinderIngredients: (state) => {
      state.ingredients = [];
    },
    clearRecentFinderIngredients: (state) => {
      state.recent = [];
    },
  },
});

export const {
  addFinderIngredients,
  removeFinderIngredient,
  setFinderIngredientTag,
  clearFinderIngredients,
  clearRecentFinderIngredients,
} = finderSlice.actions;

export const selectFinderIngredients = (state) => state.finder.ingredients;
export const selectRecentFinderIngredients = (state) => state.finder.recent ?? [];

export default finderSlice.reducer;
