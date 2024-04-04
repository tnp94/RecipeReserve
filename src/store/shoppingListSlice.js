import { createSlice } from "@reduxjs/toolkit";
import storage from "../Storage";

const initialState = []
// console.log(initialState);

const shoppingListSlice = createSlice({
  name: "shoppingList",
  initialState: initialState,
  reducers: {
    addItem: (state, action) => {
      state.push(action.payload)
    },
    deleteItem: (state, action) => {
      state.splice(action.payload, 1)
    }
  }
})

export const { addItem, deleteItem } = shoppingListSlice.actions;

export default shoppingListSlice.reducer;