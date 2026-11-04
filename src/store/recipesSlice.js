import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { recipeList } from "../Recipes";

const recipesAdapter = createEntityAdapter();

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
      let name = recipe.name;
      let count = 0;
      const existingNames = new Set(state.ids.map((id) => state.entities[id].name));
      while (existingNames.has(name)) {
        count++;
        name = `${recipe.name} copy ${count}`;
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
  const wanted = String(name ?? "").trim().toLowerCase();
  return state.recipes.ids.some(
    (id) =>
      id !== excludeId &&
      String(state.recipes.entities[id].name ?? "").trim().toLowerCase() === wanted
  );
}

export const { selectAll: selectAllRecipes, selectById: selectRecipeById } =
  recipesAdapter.getSelectors((state) => state.recipes);

export default recipesSlice.reducer;
