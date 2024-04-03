import { createSlice } from "@reduxjs/toolkit";
import storage from "../Storage";
import { recipeList } from "../Recipes";

const initialState = recipeList
// console.log(initialState);

const recipeListSlice = createSlice({
  name: "recipeList",
  initialState: initialState,
  reducers: {
    loadRecipeList: (state, action) => {
      console.log("action:", action);
      state.recipeList = recipeList
      console.log("loaded");
    },
    addRecipe: (state, action) => {
      if (!state.recipeList)
      {
        state.recipeList = recipeList
      }
      state.recipeList.push(action.payload)
    },
    deleteRecipe: (state, action) => {
      console.log("state:", state)
      state.recipeList.splice(action.payload, 1)
    }
  }
})

export const { addRecipe, deleteRecipe, loadRecipeList } = recipeListSlice.actions;

export default recipeListSlice.reducer;