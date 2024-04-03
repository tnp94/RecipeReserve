import { configureStore } from "@reduxjs/toolkit";
import recipeListReducer from './recipeListSlice'

export const store = configureStore({
  reducer: {
    recipeList: recipeListReducer
  },
})