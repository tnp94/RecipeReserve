import { createSlice } from "@reduxjs/toolkit";
import storage from "../Storage";
import { recipeList } from "../Recipes";

const initialState = recipeList
// console.log(initialState);

const recipeListSlice = createSlice({
  name: "recipeList",
  initialState: initialState,
  reducers: {
    loadRecipeList: (state) => {
      return recipeList
    },
    addRecipe: (state, action) => {
      if (!state)
      {
        state = recipeList
      }
      state.push(action.payload)
    },
    deleteRecipe: (state, action) => {
      console.log("state:", state)
      state.splice(action.payload, 1)
    }
  }
})

export const { addRecipe, deleteRecipe, loadRecipeList } = recipeListSlice.actions;

export default recipeListSlice.reducer;