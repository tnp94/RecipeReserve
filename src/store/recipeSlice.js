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
    },
    deleteRecipe: (state, action) => {
      delete state[action.payload]
    }
  }
})

export const { addRecipe, deleteRecipe, loadRecipeList } = recipesSlice.actions;

export default recipesSlice.reducer;