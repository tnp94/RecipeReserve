import { createSlice } from "@reduxjs/toolkit";
import { recipeList } from "../Recipes";

const initialState = recipeList
// console.log(initialState);

const recipesSlice = createSlice({
  name: "recipes",
  initialState: initialState,
  reducers: {
    loadRecipeList: (state) => {
      return recipeList
    },
    addRecipe: (state, action) => {
      var payload = {...action.payload}
      if (!state)
      {
        state = recipeList
      }
      var recipeName = payload.name
      var count = 0
      for (var index = Object.keys(state).findIndex((recipe) => recipe == recipeName); Object.keys(state).findIndex((recipe) => recipe == recipeName) >= 0; index++) {
        count += 1;
        recipeName = `${payload.name} copy ${count}`
      }
      payload.name = recipeName
      state[recipeName] = payload
      console.log(`Created recipe: ${recipeName}`);
    },
    deleteRecipe: (state, action) => {
      delete state[action.payload]
    },
    editRecipe: (state, action) => {
      var oldName = action.payload.recipeName;
      var recipe = action.payload.recipe;
      console.log("name", action.payload.recipeName);
      console.log("payload", action.payload);
      state[oldName] = recipe;

      // state[action.payload.recipeName] = action.payload.recipe
    }
  }
})

export const { addRecipe, deleteRecipe, loadRecipeList, editRecipe } = recipesSlice.actions;

export default recipesSlice.reducer;