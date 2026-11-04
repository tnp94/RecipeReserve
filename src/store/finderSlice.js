import { createSlice } from "@reduxjs/toolkit";
import { normalizeName } from "../domain/ingredientKey";

export const initialState = { ingredients: [], nextId: 1 };

const TAGS = [null, "expiring", "required"];

const finderSlice = createSlice({
  name: "finder",
  initialState,
  reducers: {
    addFinderIngredients: (state, action) => {
      const names = Array.isArray(action.payload) ? action.payload : [];
      const seen = new Set(state.ingredients.map((i) => normalizeName(i.name)));
      for (const raw of names) {
        const name = String(raw ?? "").trim();
        const key = normalizeName(name);
        if (!name || !key || seen.has(key)) continue;
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
  },
});

export const {
  addFinderIngredients,
  removeFinderIngredient,
  setFinderIngredientTag,
  clearFinderIngredients,
} = finderSlice.actions;

export const selectFinderIngredients = (state) => state.finder.ingredients;

export default finderSlice.reducer;
