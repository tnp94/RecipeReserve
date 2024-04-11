import { createSlice } from "@reduxjs/toolkit";

const initialState = []
// console.log(initialState);

const menuSlice = createSlice({
  name: "menu",
  initialState: initialState,
  reducers: {
    clearMenu: (state) => {
      return []
    },
    addRecipeToMenu: (state, action) => {
      state.push(action.payload)
    },
    deleteRecipeFromMenu: (state, action) => {
      state.splice(action.payload, 1)
    }
  }
})

export const { addRecipeToMenu, deleteRecipeFromMenu, clearMenu } = menuSlice.actions;

export default menuSlice.reducer;