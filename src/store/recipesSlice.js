import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { recipeList } from "../Recipes";

const recipesAdapter = createEntityAdapter();

const nameKey = (name) => String(name ?? "").trim().toLowerCase();

export const initialState = recipesAdapter.setAll(
  recipesAdapter.getInitialState({ nextId: recipeList.length + 1 }),
  recipeList
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    loadRecipeList: (state) => {
      recipesAdapter.setAll(state, recipeList);
      state.nextId = recipeList.length + 1;
    },
    addRecipe: (state, action) => {
      const recipe = { ...action.payload };
      const base = String(recipe.name ?? "").trim();
      let name = base;
      let count = 0;
      // Same comparison as isRecipeNameTaken (trimmed, case-insensitive), so a recipe
      // added here can always be saved later with "Save changes".
      const existingNames = new Set(state.ids.map((id) => nameKey(state.entities[id].name)));
      while (existingNames.has(nameKey(name))) {
        count++;
        name = `${base} copy ${count}`;
      }
      recipe.name = name;
      recipe.id = state.nextId;
      state.nextId += 1;
      recipesAdapter.addOne(state, recipe);
    },
    deleteRecipe: (state, action) => {
      recipesAdapter.removeOne(state, action.payload);
    },
    toggleFavorite: (state, action) => {
      const recipe = state.entities[action.payload];
      if (recipe) recipe.favorite = !recipe.favorite;
    },
    editRecipe: (state, action) => {
      const { id, changes } = action.payload;
      recipesAdapter.updateOne(state, { id, changes });
    },
  },
});

export const { addRecipe, deleteRecipe, loadRecipeList, editRecipe, toggleFavorite } =
  recipesSlice.actions;

export function isRecipeNameTaken(state, name, excludeId) {
  const wanted = nameKey(name);
  return state.recipes.ids.some((id) => id !== excludeId && nameKey(state.recipes.entities[id].name) === wanted);
}

export const { selectAll: selectAllRecipes, selectById: selectRecipeById } =
  recipesAdapter.getSelectors((state) => state.recipes);

export default recipesSlice.reducer;
