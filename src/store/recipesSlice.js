import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import { recipeList } from "../Recipes";

const recipesAdapter = createEntityAdapter();

const MENU_ADD_RECIPE = "menu/addRecipeToMenu";

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
      // A copy ("Save as a new recipe") starts with no planning history.
      delete recipe.lastPlannedAt;
      delete recipe.timesPlanned;
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
    // Forgets when and how often a recipe was planned (payload: recipe id), or every
    // recipe's history (resetAllPlanHistory). Menu entries are left alone.
    resetPlanHistory: (state, action) => {
      const recipe = state.entities[action.payload];
      if (!recipe) return;
      delete recipe.lastPlannedAt;
      delete recipe.timesPlanned;
    },
    resetAllPlanHistory: (state) => {
      for (const id of state.ids) {
        delete state.entities[id].lastPlannedAt;
        delete state.entities[id].timesPlanned;
      }
    },
    editRecipe: (state, action) => {
      const { id, changes } = action.payload;
      recipesAdapter.updateOne(state, { id, changes });
    },
  },
  extraReducers: (builder) => {
    // Matched by type string: importing menuSlice here would make an import cycle.
    // Optional fields (older recipes don't have them): lastPlannedAt (ms), timesPlanned.
    builder.addCase(MENU_ADD_RECIPE, (state, action) => {
      const { recipeId, plannedAt } = action.payload ?? {};
      const recipe = state.entities[recipeId];
      if (!recipe) return;
      if (Number.isFinite(plannedAt)) recipe.lastPlannedAt = plannedAt;
      recipe.timesPlanned = (Number(recipe.timesPlanned) || 0) + 1;
    });
  },
});

export const {
  addRecipe,
  deleteRecipe,
  loadRecipeList,
  editRecipe,
  toggleFavorite,
  resetPlanHistory,
  resetAllPlanHistory,
} = recipesSlice.actions;

export function isRecipeNameTaken(state, name, excludeId) {
  const wanted = nameKey(name);
  return state.recipes.ids.some((id) => id !== excludeId && nameKey(state.recipes.entities[id].name) === wanted);
}

export const { selectAll: selectAllRecipes, selectById: selectRecipeById } =
  recipesAdapter.getSelectors((state) => state.recipes);

export default recipesSlice.reducer;
