import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  recipeID: 0,
  menu: {}
}
// console.log(initialState);

const menuSlice = createSlice({
  name: "menu",
  initialState: initialState,
  reducers: {
    clearMenu: (state) => {
      return initialState
    },
    addRecipeToMenu: (state, action) => {
      state.menu[state.recipeID] = action.payload;
      state.recipeID += 1
    },
    deleteRecipeFromMenu: (state, action) => {
      delete state.menu[action.payload]
    }
  }
})

export const { addRecipeToMenu, deleteRecipeFromMenu, clearMenu } = menuSlice.actions;

export default menuSlice.reducer;